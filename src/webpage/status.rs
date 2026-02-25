use actix_web::{HttpResponse, Responder, get, http::header};

use crate::{error::ServerError, utils};

#[get("/api/status")]
pub async fn handler() -> Result<impl Responder, ServerError> {
    Ok(HttpResponse::Ok()
        .insert_header((
            header::CACHE_CONTROL,
            "max-age=0, no-cache, no-store, must-revalidate",
        ))
        .json(serde_json::json!({
            "status": "operational".to_string(),
            "version": env!("CARGO_PKG_VERSION"),
            "uptime": utils::get_system_uptime(),
        })))
}
