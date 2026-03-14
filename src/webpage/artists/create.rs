use crate::{
    database::{self, artists::Artist},
    error::ServerError,
    webpage::auth,
};
use actix_web::{HttpRequest, HttpResponse, Responder, post, web};
use chrono::Local;
use serde::Deserialize;

#[derive(Deserialize)]
pub struct CreateArtistRequest {
    pub artist_id: i64,
    pub original_name: String,
    pub romaji_name: Option<String>,
}

/// POST /api/artists/create
/// Header: Authorization: Bearer <jwt>
#[post("/api/artists/create")]
pub async fn handler(
    req: HttpRequest,
    body: web::Json<CreateArtistRequest>,
) -> Result<impl Responder, ServerError> {
    auth::extract_bearer(&req)?;

    let body = body.into_inner();

    if body.original_name.trim().is_empty() {
        return Ok(HttpResponse::BadRequest().json(serde_json::json!({
            "message": "original_name is required"
        })));
    }

    let artist_id = body.artist_id;

    web::block(move || {
        // 檢查 artist_id 是否已存在
        let exists = Artist::find_by_ids(vec![body.artist_id])?;
        if !exists.is_empty() {
            return Err(ServerError::Internal(format!(
                "artist_id {} already exists",
                body.artist_id
            )));
        }

        let artist = Artist {
            artist_id: body.artist_id,
            original_name: body.original_name.trim().to_string(),
            romaji_name: body.romaji_name.as_deref().unwrap_or("").trim().to_string(),
            created_at: Local::now().date_naive(),
        };

        let mut conn = database::get_connection()?;
        let tran = conn.transaction()?;
        artist.insert(&tran)?;
        tran.commit()?;

        Ok::<_, ServerError>(())
    })
    .await
    .map_err(|e| ServerError::Internal(e.to_string()))??;

    Ok(HttpResponse::Created().json(serde_json::json!({
        "ok": true,
        "artist_id": artist_id,
    })))
}
