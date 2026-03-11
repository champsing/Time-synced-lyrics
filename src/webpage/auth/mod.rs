pub mod github;

pub mod me;

use crate::error::ServerError;
use jsonwebtoken::{DecodingKey, EncodingKey, Header, Validation, decode, encode};
use serde::{Deserialize, Serialize};
use std::sync::LazyLock;

static JWT_SECRET: LazyLock<String> =
    LazyLock::new(|| std::env::var("JWT_SECRET").expect("[FATAL] JWT_SECRET 環境變數未設定"));

/// 你的 GitHub User ID（登入後比對用）
static ALLOWED_GITHUB_ID: LazyLock<u64> = LazyLock::new(|| {
    std::env::var("ALLOWED_GITHUB_ID")
        .expect("[FATAL] ALLOWED_GITHUB_ID 環境變數未設定")
        .parse()
        .expect("[FATAL] ALLOWED_GITHUB_ID 必須是數字")
});

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String, // GitHub username
    pub uid: u64,    // GitHub user ID
    pub exp: usize,  // expiry timestamp
}

pub fn issue_jwt(github_id: u64, login: &str) -> Result<String, ServerError> {
    use std::time::{SystemTime, UNIX_EPOCH};
    let exp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs() as usize
        + 86400 * 7; // 7 天

    let claims = Claims {
        sub: login.to_string(),
        uid: github_id,
        exp,
    };

    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(JWT_SECRET.as_bytes()),
    )
    .map_err(ServerError::Jwt)
}

pub fn verify_jwt(token: &str) -> Result<Claims, ServerError> {
    let data = decode::<Claims>(
        token,
        &DecodingKey::from_secret(JWT_SECRET.as_bytes()),
        &Validation::default(),
    )?;

    if data.claims.uid != *ALLOWED_GITHUB_ID {
        return Err(ServerError::Internal("Forbidden: 非授權帳號".into()));
    }
    Ok(data.claims)
}

/// 從 Authorization: Bearer <token> header 中提取並驗證
pub fn extract_bearer(req: &actix_web::HttpRequest) -> Result<Claims, ServerError> {
    let header = req
        .headers()
        .get("Authorization")
        .and_then(|v| v.to_str().ok())
        .ok_or_else(|| ServerError::Internal("缺少 Authorization header".into()))?;

    let token = header
        .strip_prefix("Bearer ")
        .ok_or_else(|| ServerError::Internal("Authorization header 格式錯誤".into()))?;

    verify_jwt(token)
}
