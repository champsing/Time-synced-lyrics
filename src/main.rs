use tsl_api::error::ServerError;
use tsl_api::{database, webpage};

#[tokio::main]
async fn main() -> Result<(), ServerError> {
    env_logger::init();
    database::init()?;

    println!("======== server starting! ========");

    tokio::select! {
        res = webpage::run() => {
            if let Err(e) = res {
                log::error!("webpage failed: {:?}", e);
            }
        }
        _ = tokio::signal::ctrl_c() => {
            database::export_db_to_csv()?;
            println!("\n======== shutting down! ========");
        }
    }

    Ok(())
}
