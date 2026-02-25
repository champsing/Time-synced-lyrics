use crate::{database, error::ServerError};
use actix_web::{HttpResponse, Responder, get, web};

#[get("/api/songs/list")]
pub async fn handler() -> Result<impl Responder, ServerError> {
    // 使用 web::block 將同步的 DB 查詢丟到 thread pool 執行
    let songs = web::block(|| database::songs::export_song_list())
        .await
        .map_err(|e| ServerError::Internal(e.to_string()))??; // 處理兩層 Result (block 錯誤 + DB 錯誤)

    Ok(HttpResponse::Ok().json(songs))
}
