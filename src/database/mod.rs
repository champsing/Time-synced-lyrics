pub mod artists;
pub mod migration;
pub mod songs;

use crate::error::ServerError;
use csv::ReaderBuilder;
use r2d2::Pool;
use r2d2_sqlite::SqliteConnectionManager;
use rusqlite::{Connection, backup::Backup};
use std::collections::HashMap;
use std::fs;
use std::panic::Location;
use std::path::Path;
use std::sync::Mutex;
use std::sync::OnceLock;
use std::sync::atomic::{AtomicU64, Ordering};
use tempfile::NamedTempFile;

// 建立全局靜態變數，類似 AUTH_CODE 的調用方式
pub static DB_POOL: OnceLock<Pool<SqliteConnectionManager>> = OnceLock::new();

// 用來追蹤目前使用中的連接
static CONN_ID_COUNTER: AtomicU64 = AtomicU64::new(0);
static ACTIVE_CONNECTIONS: OnceLock<Mutex<HashMap<u64, (&'static str, u32)>>> = OnceLock::new();

fn get_registry() -> &'static Mutex<HashMap<u64, (&'static str, u32)>> {
    ACTIVE_CONNECTIONS.get_or_init(|| Mutex::new(HashMap::new()))
}

/// 自定義的連接包裝，當它被 drop 時會從註冊表中移除
pub struct ConnGuard {
    pub conn: r2d2::PooledConnection<SqliteConnectionManager>,
    id: u64,
}

// 讓 ConnGuard 用起來跟原本的 Connection 一樣
impl std::ops::Deref for ConnGuard {
    type Target = r2d2::PooledConnection<SqliteConnectionManager>;
    fn deref(&self) -> &Self::Target {
        &self.conn
    }
}

impl std::ops::DerefMut for ConnGuard {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.conn
    }
}

impl Drop for ConnGuard {
    fn drop(&mut self) {
        // 當連接結束生命週期，從全局註冊表移除
        if let Ok(mut reg) = get_registry().lock() {
            reg.remove(&self.id);
        }
    }
}

#[track_caller] // 關鍵：捕捉呼叫此函數的位置
pub(crate) fn get_connection() -> Result<ConnGuard, ServerError> {
    let caller = Location::caller();
    let registry = get_registry();

    // 1. 先檢查有沒有人在佔用連接
    if let Ok(reg) = registry.lock() {
        if !reg.is_empty() {
            eprintln!("[DB_DEBUG] 發現未關閉的連接！");
            for (id, (file, line)) in reg.iter() {
                eprintln!("  - ID: {}, 位置: {}:{}", id, file, line);
            }
        }
    }

    // 2. 從池中拿新連接
    let pool_conn = DB_POOL
        .get()
        .ok_or_else(|| ServerError::Internal("Database pool not initialized".to_string()))?
        .get()
        .map_err(|e| ServerError::Internal(e.to_string()))?;

    // 3. 註冊這條連接
    let id = CONN_ID_COUNTER.fetch_add(1, Ordering::SeqCst);
    if let Ok(mut reg) = registry.lock() {
        reg.insert(id, (caller.file(), caller.line()));
    }

    Ok(ConnGuard {
        conn: pool_conn,
        id,
    })
}

pub fn init() -> Result<(), ServerError> {
    fs::create_dir_all("data/")?;
    fs::create_dir_all("/tmp/")?;

    const DATABASE: &str = "data/tsl.db";

    // 初始化連接池管理器
    let manager = SqliteConnectionManager::file(DATABASE).with_init(|c| {
        // 使用 pragma_update 代替 execute，這樣就不會因為有回傳值而報錯
        c.pragma_update(None, "busy_timeout", &"5000")?;
        c.pragma_update(None, "journal_mode", &"WAL")?;
        c.pragma_update(None, "synchronous", &"NORMAL")?; // 建議 WAL 模式搭配 NORMAL 效能更好
        Ok(())
    });

    let pool = Pool::builder()
        .max_size(10) // 最大同時連線數
        .build(manager)
        .map_err(|e| ServerError::Internal(e.to_string()))?;

    DB_POOL
        .set(pool)
        .map_err(|_| ServerError::Internal("Failed to set DB_POOL".to_string()))?;

    {
        // 執行遷移
        let mut conn = get_connection()?;
        let tran = conn.transaction()?;
        migration::run_migration(&tran)?;
        tran.commit()?;
    }

    // 放在 migration 之後，確保表結構已經建立
    load_csv_data()?;

    Ok(())
}

pub fn backup_database() -> Result<Vec<u8>, ServerError> {
    let temp_file = NamedTempFile::new()?;
    let mut dst = Connection::open(temp_file.path())?;
    let src = get_connection()?;
    Backup::new(&src, &mut dst)?.run_to_completion(
        5,
        std::time::Duration::from_millis(250),
        None,
    )?;
    fs::read(temp_file.path()).map_err(ServerError::from)
}

pub fn load_csv_data() -> Result<(), ServerError> {
    let csv_dir = "data/csv";
    let path = Path::new(csv_dir);

    if !path.exists() {
        log::warn!("CSV directory {} not found, skipping data load.", csv_dir);
        return Ok(());
    }

    // 1. 取得連接並開啟事務
    let mut conn_guard = get_connection()?;
    let tx = conn_guard
        .transaction()
        .map_err(|e| ServerError::Internal(e.to_string()))?;

    for entry in fs::read_dir(path)? {
        let entry = entry?;
        let file_path = entry.path();

        if file_path.extension().and_then(|s| s.to_str()) == Some("csv") {
            let table_name = file_path
                .file_stem()
                .and_then(|s| s.to_str())
                .ok_or_else(|| ServerError::Internal("Invalid CSV filename".into()))?;

            log::info!("Importing {}...", table_name);

            let mut rdr = ReaderBuilder::new()
                .from_path(&file_path)
                .map_err(|e| ServerError::Internal(e.to_string()))?;

            let headers = rdr
                .headers()
                .map_err(|e| ServerError::Internal(e.to_string()))?
                .clone();

            let columns = headers.iter().collect::<Vec<_>>().join(", ");
            let placeholders = vec!["?"; headers.len()].join(", ");

            // 使用 tx.prepare 而不是 conn.prepare
            let sql = format!(
                "INSERT OR REPLACE INTO {} ({}) VALUES ({});",
                table_name, columns, placeholders
            );

            let mut stmt = tx
                .prepare(&sql)
                .map_err(|e| ServerError::Internal(e.to_string()))?;

            for result in rdr.records() {
                let record = result.map_err(|e| ServerError::Internal(e.to_string()))?;
                let params = rusqlite::params_from_iter(record.iter());
                stmt.execute(params)
                    .map_err(|e| ServerError::Internal(e.to_string()))?;
            }
            drop(stmt); // 釋放 statement 鎖定，以便後續操作
        }
    }

    // 2. 關鍵：顯式提交事務
    tx.commit()
        .map_err(|e| ServerError::Internal(e.to_string()))?;
    log::info!("All CSV data imported and committed successfully.");

    Ok(())
}

pub fn export_db_to_csv() -> Result<(), ServerError> {
    let conn = get_connection()?;
    let tables = ["artists", "songs"];

    for table in tables {
        let path = format!("data/csv/{}.csv", table);
        let mut wtr = csv::WriterBuilder::new()
            .from_path(&path)
            .map_err(|e| ServerError::Internal(e.to_string()))?;

        // 這裡改用具體的 SQL 查詢，確保順序與 CSV 標題一致
        let sql = format!("SELECT * FROM {}", table);
        let mut stmt = conn
            .prepare(&sql)
            .map_err(|e| ServerError::Internal(e.to_string()))?;

        // 寫入標題
        let headers = stmt.column_names();
        wtr.write_record(headers)
            .map_err(|e| ServerError::Internal(e.to_string()))?;

        // 讀取每一行並轉為字串
        let column_count = stmt.column_count();
        let mut rows = stmt
            .query([])
            .map_err(|e| ServerError::Internal(e.to_string()))?;

        while let Some(row) = rows
            .next()
            .map_err(|e| ServerError::Internal(e.to_string()))?
        {
            let mut record = Vec::new();
            for i in 0..column_count {
                // 利用 rusqlite 的 Value 型別彈性處理
                let val: rusqlite::types::Value = row
                    .get(i)
                    .map_err(|e| ServerError::Internal(e.to_string()))?;
                record.push(match val {
                    rusqlite::types::Value::Null => "".to_string(),
                    rusqlite::types::Value::Integer(n) => n.to_string(),
                    rusqlite::types::Value::Real(f) => f.to_string(),
                    rusqlite::types::Value::Text(s) => s,
                    rusqlite::types::Value::Blob(_) => "<BLOB>".to_string(),
                });
            }
            wtr.write_record(&record)
                .map_err(|e| ServerError::Internal(e.to_string()))?;
        }
        wtr.flush()
            .map_err(|e| ServerError::Internal(e.to_string()))?;
        println!("✅ 已將資料表 [{}] 匯出至 {}", table, path);
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_init() -> Result<(), ServerError> {
        let mut connection = Connection::open_in_memory()?;
        let transaction = connection.transaction()?;
        migration::run_migration(&transaction)?;
        transaction.commit()?;

        Ok(())
    }
}
