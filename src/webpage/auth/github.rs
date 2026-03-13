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

static ALLOW_ORIGINS: LazyLock<Vec<String>> = LazyLock::new(|| {
    std::env::var("ALLOW_ORIGINS")
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
    ALLOW_ORIGINS
        .iter()
        .find(|allowed| candidate.starts_with(allowed.as_str()))
        .cloned()
}

/// GET /api/auth/github
/// 發起 GitHub OAuth 登入流程
///
/// 將發起請求的前端 Origin 進行 base64 編碼後放入 state 參數，
/// 以便 callback 時知道要重導回哪個前端（支援多來源白名單）。
/// 重導至 GitHub 授權頁面。
#[get("/api/auth/github")]
pub async fn login_handler(req: HttpRequest) -> impl Responder {
    // 記錄發起登入的來源
    let origin = extract_allowed_origin(&req)
        .unwrap_or_else(|| ALLOW_ORIGINS.first().cloned().unwrap_or_default());

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

/// GET /api/auth/callback
/// GitHub OAuth 授權完成後的回調端點
///
/// 流程：
///   1. 從 state 還原並驗證前端 Origin
///   2. 用 code 向 GitHub 換取 access_token
///   3. 用 access_token 取得使用者的 GitHub 帳號資訊
///   4. 簽發 JWT（issue_jwt 內部會驗 ALLOWED_GITHUB_ID 白名單）
///   5. 重導回前端，token 附在 query param：`/?token=<jwt>`
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
            ALLOW_ORIGINS
                .iter()
                .find(|allowed| candidate.starts_with(allowed.as_str()))
                .cloned()
        })
        .unwrap_or_else(|| ALLOW_ORIGINS.first().cloned().unwrap_or_default());

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
    let redirect = format!("{}/#token={}", origin, jwt);
    Ok(HttpResponse::Found()
        .insert_header(("Location", redirect))
        .finish())
}
