pub mod admin;
pub mod artists;
pub mod auth;
pub mod songs;
pub mod status;

use crate::error::ServerError;
use actix_cors::Cors;
use actix_web::{App, HttpServer};

pub async fn run() -> Result<(), ServerError> {
    HttpServer::new(|| {
        let cors = Cors::default()
            .allowed_origin("http://localhost:5200")
            .allowed_origin("https://timesl.online")
            .allowed_origin("https://www.timesl.online")
            .allowed_origin("https://edit.timesl.online")
            .allow_any_header()
            .allowed_methods(vec!["GET", "POST"]);

        App::new()
            .wrap(cors)
            .service(status::handler)
            .service(artists::artist::handler)
            .service(artists::list::handler)
            .service(songs::verify::handler)
            .service(songs::list::handler)
            .service(songs::song::handler)
            .service(auth::github::login_handler)
            .service(auth::github::callback_handler)
            .service(admin::update_lyrics::handler)
            .service(admin::update_song::handler)
    })
    .bind(("0.0.0.0", 8000))?
    .run()
    .await?;

    Ok(())
}
