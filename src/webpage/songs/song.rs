use crate::{database, error::ServerError};
use actix_web::{HttpResponse, Responder, get, web};

// 1. 路徑參數使用 {song_id}
#[get("/api/songs/{song_id}")]
pub async fn handler(
    // 2. 使用 web::Path 提取參數，這會自動嘗試將字串轉為 i32
    song_id: web::Path<i32>,
) -> Result<impl Responder, ServerError> {
    // 提取內部的 i32
    let id = song_id.into_inner();

    // 3. 傳遞給 web::block 內部的函數
    let song = web::block(move || database::songs::find_song_by_id(id))
        .await
        .map_err(|e| ServerError::Internal(e.to_string()))??;

    Ok(HttpResponse::Ok().json(song))
}
