use crate::{error::ServerError, webpage::auth, webpage::lyrics::r2};
use actix_web::{HttpRequest, HttpResponse, Responder, post, web};
use serde::Deserialize;

#[derive(Deserialize)]
pub struct UpdateLyricsRequest {
    pub song_id: i32,
    pub folder: String,
    pub version: String,
    pub lyrics: serde_json::Value,
}

/// POST /api/lyrics/update
/// Header: Authorization: Bearer <jwt>
#[post("/api/lyrics/update")]
pub async fn handler(
    req: HttpRequest,
    body: web::Json<UpdateLyricsRequest>,
) -> Result<impl Responder, ServerError> {
    auth::extract_bearer(&req)?;

    let body = body.into_inner();
    let content = serde_json::to_string_pretty(&body.lyrics)
        .map_err(|e| ServerError::Internal(e.to_string()))?
        .into_bytes();

    let key = r2::key(body.song_id, &body.folder, &body.version);
    r2::put(body.song_id, &body.folder, &body.version, content).await?;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "ok": true,
        "key": key,
    })))
}
