use crate::{
    database::{self, song::Song},
    error::ServerError,
    webpage::{auth, lyrics::r2},
};
use actix_web::{HttpRequest, HttpResponse, Responder, post, web};
use serde::Deserialize;

#[derive(Deserialize)]
pub struct DeleteSongRequest {
    pub song_id: i32,
}

/// POST /api/songs/delete
/// Header: Authorization: Bearer <jwt>
#[post("/api/songs/delete")]
pub async fn handler(
    req: HttpRequest,
    body: web::Json<DeleteSongRequest>,
) -> Result<impl Responder, ServerError> {
    auth::extract_bearer(&req)?;

    let song_id = body.song_id;

    let song = web::block(move || {
        Song::find_by_id(song_id as i64)?
            .ok_or_else(|| ServerError::Internal("Song not found".into()))
    })
    .await
    .map_err(|e| ServerError::Internal(e.to_string()))??;

    let folder = song.folder.clone();
    let versions: Vec<String> = song
        .versions
        .as_array()
        .unwrap_or(&vec![])
        .iter()
        .filter_map(|v| v.get("version")?.as_str().map(str::to_string))
        .collect();

    web::block(move || {
        let mut conn = database::get_connection()?;
        let tran = conn.transaction()?;
        song.delete(&tran)?;
        tran.commit()?;
        Ok::<_, ServerError>(())
    })
    .await
    .map_err(|e| ServerError::Internal(e.to_string()))??;

    for v in &versions {
        r2::delete(song_id, &folder, v).await?;
    }

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "ok": true,
        "song_id": song_id,
    })))
}
