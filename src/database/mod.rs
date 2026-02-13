pub mod migration;

use crate::error::ServerError;
use r2d2::Pool;
use r2d2_sqlite::SqliteConnectionManager;
use rusqlite::{ Connection, backup::Backup };
use std::collections::HashMap;
use std::fs;
use std::panic::Location;
use std::sync::Mutex;
use std::sync::OnceLock;
use std::sync::atomic::{ AtomicU64, Ordering };
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
    let pool_conn = DB_POOL.get()
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

    const DATABASE: &str = "data/tsl.sqlite3";

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

    DB_POOL.set(pool).map_err(|_| ServerError::Internal("Failed to set DB_POOL".to_string()))?;

    // 執行遷移
    let mut conn = get_connection()?;
    let tran = conn.transaction()?;
    migration::run_migration(&tran)?;
    tran.commit()?;

    Ok(())
}

pub fn backup_database() -> Result<Vec<u8>, ServerError> {
    let temp_file = NamedTempFile::new()?;
    let mut dst = Connection::open(temp_file.path())?;
    let src = get_connection()?;
    Backup::new(&src, &mut dst)?.run_to_completion(5, std::time::Duration::from_millis(250), None)?;
    fs::read(temp_file.path()).map_err(ServerError::from)
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
