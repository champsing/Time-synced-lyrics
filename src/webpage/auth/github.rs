use crate::{error::ServerError, webpage::auth};
use actix_web::{HttpRequest, HttpResponse, Responder, get, web};
use base64::{Engine, engine::general_purpose};
use serde::Deserialize;
use std::sync::LazyLock;

static GH_CLIENT_ID: LazyLock<String> =
    LazyLock::new(|| std::env::var("GITHUB_CLIENT_ID").expect("[FATAL] GITHUB_CLIENT_ID 未設定"));

static GH_CLIENT_SECRET: LazyLock<String> = LazyLock::new(|| {
    std::env::var("GITHUB_CLIENT_SECRET").expect("[FATAL] GITHUB_CLIENT_SECRET 未設定")
});

static ALLOWED_FRONTEND_ORIGIN: LazyLock<Vec<String>> = LazyLock::new(|| {
    std::env::var("ALLOWED_FRONTEND_ORIGIN")
        .unwrap_or_else(|_| "https://edit.timesl.online".to_string())
        .split(',')
        .map(|s| s.trim().to_string())
        .collect()
});

#[derive(Deserialize)]
pub struct CallbackQuery {
    code: String,
    state: Option<String>, // GitHub 帶回的 state
}

#[derive(Deserialize)]
struct GhTokenResponse {
    access_token: String,
}

#[derive(Deserialize)]
struct GhUser {
    id: u64,
    login: String,
}

fn extract_allowed_origin(req: &HttpRequest) -> Option<String> {
    // 依序嘗試 Origin → Referer header
    let candidate = req
        .headers()
        .get("Origin")
        .or_else(|| req.headers().get("Referer"))
        .and_then(|v| v.to_str().ok())?;

    // 比對白名單（Referer 可能帶 path，所以用 starts_with）
    ALLOWED_FRONTEND_ORIGIN
        .iter()
        .find(|allowed| candidate.starts_with(allowed.as_str()))
        .cloned()
}

#[get("/api/auth/github")]
pub async fn login_handler(req: HttpRequest) -> impl Responder {
    // 記錄發起登入的來源
    let origin = extract_allowed_origin(&req)
        .unwrap_or_else(|| ALLOWED_FRONTEND_ORIGIN.first().cloned().unwrap_or_default());

    // 將 origin base64 編碼後放入 state（GitHub 會原樣帶回 callback）
    let state = general_purpose::URL_SAFE_NO_PAD.encode(&origin);

    let url = format!(
        "https://github.com/login/oauth/authorize?client_id={}&scope=read:user&state={}",
        *GH_CLIENT_ID, state
    );
    HttpResponse::Found()
        .insert_header(("Location", url))
        .finish()
}

#[get("/api/auth/callback")]
pub async fn callback_handler(
    query: web::Query<CallbackQuery>,
) -> Result<impl Responder, ServerError> {
    // 從 state 還原 origin 並驗證
    let origin = query
        .state
        .as_deref()
        .and_then(|s| general_purpose::URL_SAFE_NO_PAD.decode(s).ok())
        .and_then(|b| String::from_utf8(b).ok())
        .and_then(|candidate| {
            ALLOWED_FRONTEND_ORIGIN
                .iter()
                .find(|allowed| candidate.starts_with(allowed.as_str()))
                .cloned()
        })
        .unwrap_or_else(|| ALLOWED_FRONTEND_ORIGIN.first().cloned().unwrap_or_default());

    let client = reqwest::Client::new();
    // 換 access token
    let token_res: GhTokenResponse = client
        .post("https://github.com/login/oauth/access_token")
        .header("Accept", "application/json")
        .json(&serde_json::json!({
            "client_id": *GH_CLIENT_ID,
            "client_secret": *GH_CLIENT_SECRET,
            "code": query.code,
        }))
        .send()
        .await
        .map_err(|e| ServerError::Internal(e.to_string()))?
        .json()
        .await
        .map_err(|e| ServerError::Internal(e.to_string()))?;

    // 取得使用者資訊
    let user: GhUser = client
        .get("https://api.github.com/user")
        .bearer_auth(&token_res.access_token)
        .header("User-Agent", "tsl-server")
        .send()
        .await
        .map_err(|e| ServerError::Internal(e.to_string()))?
        .json()
        .await
        .map_err(|e| ServerError::Internal(e.to_string()))?;

    // 簽發 JWT（內部會驗 ALLOWED_GITHUB_ID）
    let jwt = auth::issue_jwt(user.id, &user.login)?;

    // Redirect 回前端，附上 token（fragment，不會送到 server）
    let redirect = format!("{}/?token={}", origin, jwt);
    Ok(HttpResponse::Found()
        .insert_header(("Location", redirect))
        .finish())
}
