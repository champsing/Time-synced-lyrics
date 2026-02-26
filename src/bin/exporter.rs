use std::process;
use tsl_api::database;

fn main() {
    println!("--- TSL Database Exporter ---");

    // 1. 手動初始化連線池，但不執行 init() 裡的 load_csv_data
    // 這是為了確保我們只是要「讀出」資料，不要在啟動工具時被舊的 CSV 覆蓋回去
    if let Err(e) = setup_pool_only() {
        eprintln!("❌ 初始化資料庫連線池失敗: {:?}", e);
        process::exit(1);
    }

    // 2. 執行匯出
    println!("📦 正在將 SQLite 資料匯出至 CSV...");
    match database::export_db_to_csv() {
        Ok(_) => println!("\n✨ 匯出完成！你可以放心地提交 CSV 變動或重啟 Docker 了。"),
        Err(e) => {
            eprintln!("❌ 匯出過程中發生錯誤: {:?}", e);
            process::exit(1);
        }
    }
}

/// 仿照 database::init 但只建立連線池，不跑遷移也不跑匯入
fn setup_pool_only() -> Result<(), Box<dyn std::error::Error>> {
    use r2d2::Pool;
    use r2d2_sqlite::SqliteConnectionManager;

    let manager = SqliteConnectionManager::file("data/tsl.db");
    let pool = Pool::builder().max_size(1).build(manager)?;

    database::DB_POOL
        .set(pool)
        .map_err(|_| "無法設置 DB_POOL")?;
    Ok(())
}
