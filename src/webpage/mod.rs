pub mod artists;
pub mod auth;
pub mod songs;
pub mod status;

use crate::error::ServerError;
use actix_cors::Cors;
use actix_web::{App, HttpServer};

pub async fn run() -> Result<(), ServerError> {
    // 從 FRONTEND_ORIGIN 解析允許的來源清單（逗號分隔）
    let allowed_origins: Vec<String> = std::env::var("FRONTEND_ORIGIN")
        .unwrap_or_else(|_| "https://edit.timesl.online".to_string())
        .split(',')
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .collect();

    HttpServer::new(move || {
        let mut cors = Cors::default()
            .allow_any_header()
            .allowed_methods(vec!["GET", "POST", "OPTIONS"])
            .supports_credentials();

        for origin in &allowed_origins {
            cors = cors.allowed_origin(origin);
        }

        App::new()
            .wrap(cors)
            // Status
            .service(status::handler)
            // Artists
            .service(artists::artist::handler)
            .service(artists::list::handler)
            // Songs
            .service(songs::verify::handler)
            .service(songs::list::handler)
            .service(songs::song::handler)
            .service(songs::update_lyrics::handler)
            .service(songs::update_song::handler)
            // Auth
            .service(auth::github::login_handler)
            .service(auth::github::callback_handler)
            .service(auth::me::handler)
    })
    .bind(("0.0.0.0", 8000))?
    .run()
    .await?;

    Ok(())
}
