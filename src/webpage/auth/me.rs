use crate::{error::ServerError, webpage::auth};
use actix_web::{HttpRequest, HttpResponse, Responder, get};

/// GET /api/auth/me
/// Header: Authorization: Bearer <jwt>
/// 回傳目前登入的用戶資訊，未登入或 token 無效回 401
#[get("/api/auth/me")]
pub async fn handler(req: HttpRequest) -> Result<impl Responder, ServerError> {
    let claims = auth::extract_bearer(&req)?;
    Ok(HttpResponse::Ok().json(serde_json::json!({
        "login": claims.sub,
        "id":    claims.uid,
    })))
}
