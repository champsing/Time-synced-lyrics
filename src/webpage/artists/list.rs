use crate::{database, error::ServerError};
use actix_web::{HttpResponse, Responder, get, web};

#[get("/api/artists/list")]
pub async fn handler() -> Result<impl Responder, ServerError> {
    // 3. 呼叫資料庫邏輯
    let artists_list = web::block(move || database::artists::export_artists_list())
        .await
        .map_err(|e| ServerError::Internal(e.to_string()))??;

    Ok(HttpResponse::Ok().json(artists_list))
}
