use tsl_api::error::ServerError;
use tsl_api::webpage;

#[tokio::main]
async fn main() -> Result<(), ServerError> {
    env_logger::init();
    tsl_api::database::init()?;

    println!("======== server starting! ========");

    tokio::select! {
        res = webpage::run() => {
            if let Err(e) = res {
                log::error!("webpage failed: {:?}", e);
            }
        }
        _ = tokio::signal::ctrl_c() => {
            println!("\n======== shutting down! ========");
        }
    }

    Ok(())
}