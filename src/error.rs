use actix_web::ResponseError;
use derive_more::{Display, From};

#[derive(Debug, Display, From)]
pub enum ServerError {
    SystemTime(std::time::SystemTimeError),
    Io(std::io::Error),
    //    Jwt(jwt::Error),
    Json(serde_json::Error),
    Rusqlite(rusqlite::Error),
    //    SeaQuery(sea_query::error::Error),
    Internal(String),
}

impl ResponseError for ServerError {}
