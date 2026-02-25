use crate::{database, error::ServerError};
use actix_web::{HttpResponse, Responder, get, web};

#[get("/api/songs/{song_id}")]
pub async fn handler(song_id: web::Path<i32>) -> Result<impl Responder, ServerError> {
    let id = song_id.into_inner();

    let song = web::block(move || database::songs::find_song_by_id(id))
        .await
        .map_err(|e| ServerError::Internal(e.to_string()))??;

    Ok(HttpResponse::Ok().json(song))
}
