use crate::{database, error::ServerError};
use actix_web::{HttpResponse, Responder, get, web};

#[get("/api/songs/{song_id}")]
pub async fn handler(song_id: web::Path<i32>) -> Result<impl Responder, ServerError> {
    let id = song_id.into_inner();

    let song = web::block(move || match database::songs::Song::find_by_id(id as i64) {
        Ok(Some(song)) => Ok(song.to_full_json()),
        Ok(None) => Err(ServerError::Internal("Song not found".into())),
        Err(e) => Err(ServerError::Internal(e.to_string())),
    })
    .await
    .map_err(|e| ServerError::Internal(e.to_string()))??;

    Ok(HttpResponse::Ok().json(song))
}
