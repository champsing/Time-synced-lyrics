use actix_web::{HttpResponse, Responder, get, web};

use crate::{error::ServerError, utils};

#[derive(serde::Deserialize)]
struct SongVerifyRequest {
    available: bool,
    song_id: i32,
    signature: String,
}

#[get("/api/verify/")]
pub async fn handler(request: web::Json<SongVerifyRequest>) -> Result<impl Responder, ServerError> {
    let expected = utils::generate_signature(request.song_id, request.available);

    if expected == request.signature {
        Ok(HttpResponse::Ok().json(serde_json::json!({ "valid": true })))
    } else {
        Ok(HttpResponse::Forbidden().json(serde_json::json!({
            "valid": false,
            "message": "Invalid signature",
        })))
    }
}
