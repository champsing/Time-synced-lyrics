use std::thread;
use std::time::Duration;

use tsl_api::error::ServerError;
use tsl_api::webpage;

fn main() -> Result<(), ServerError> {
    env_logger::init();
    // tsl_api::database::init()?;

    println!("======== server starting! ========");

    let mut handles = vec![];

    handles.push(thread::spawn(|| {
        loop {
            let res = tokio::runtime::Builder::new_current_thread()
                .enable_all()
                .build()
                .map_err(|err| ServerError::from(err))
                .and_then(|rt| rt.block_on(async { webpage::run().await }));

            if let Some(err) = res.err() {
                log::error!("restarting, webpage failed: {:?}", err);
                thread::sleep(Duration::from_secs(60));
            }
        }
    }));

    for handle in handles {
        handle.join().unwrap();
    }

    Ok(())
}
