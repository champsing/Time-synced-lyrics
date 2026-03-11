use crate::{database, error::ServerError, webpage::auth};
use actix_web::{HttpRequest, HttpResponse, Responder, post, web};
use serde::Deserialize;

#[derive(Deserialize)]
pub struct UpdateSongRequest {
    pub song_id: i32,
    // 所有可選欄位，只更新有傳入的
    pub title: Option<String>,
    pub subtitle: Option<String>,
    pub artist: Option<String>,
    pub lyricist: Option<String>,
    pub lang: Option<String>,
    pub available: Option<bool>,
    pub hidden: Option<bool>,
    pub is_duet: Option<bool>,
    pub furigana: Option<bool>,
    pub folder: Option<String>,
    pub art: Option<String>,
    pub album: Option<serde_json::Value>,
    pub versions: Option<serde_json::Value>,
    pub translation: Option<serde_json::Value>,
    pub credits: Option<serde_json::Value>,
}

/// POST /api/admin/song
/// Header: Authorization: Bearer <jwt>
#[post("/api/admin/song")]
pub async fn handler(
    req: HttpRequest,
    body: web::Json<UpdateSongRequest>,
) -> Result<impl Responder, ServerError> {
    auth::extract_bearer(&req)?;

    let song_id = body.song_id;
    let req_data = body.into_inner();

    web::block(move || database::songs::update_song(req_data))
        .await
        .map_err(|e| ServerError::Internal(e.to_string()))??;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "ok": true,
        "song_id": song_id,
    })))
}
