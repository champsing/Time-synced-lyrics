use crate::{error::ServerError, webpage::auth};
use actix_web::{HttpRequest, HttpResponse, Responder, post, web};
use aws_sdk_s3::Client as S3Client;
use aws_sdk_s3::config::{Credentials, Region};
use serde::Deserialize;
use std::sync::LazyLock;

static R2_BUCKET: LazyLock<String> =
    LazyLock::new(|| std::env::var("R2_BUCKET_NAME").expect("[FATAL] R2_BUCKET_NAME 未設定"));
static R2_ENDPOINT: LazyLock<String> = LazyLock::new(|| {
    std::env::var("R2_ENDPOINT").expect("[FATAL] R2_ENDPOINT 未設定")
    // 格式: https://<account_id>.r2.cloudflarestorage.com
});
static R2_ACCESS_KEY: LazyLock<String> =
    LazyLock::new(|| std::env::var("R2_ACCESS_KEY_ID").expect("[FATAL] R2_ACCESS_KEY_ID 未設定"));
static R2_SECRET_KEY: LazyLock<String> = LazyLock::new(|| {
    std::env::var("R2_SECRET_ACCESS_KEY").expect("[FATAL] R2_SECRET_ACCESS_KEY 未設定")
});

#[derive(Deserialize)]
pub struct UpdateLyricsRequest {
    pub song_id: i32,
    pub version_id: String, // 對應 versions[].id，例如 "original"
    pub lyrics: serde_json::Value,
}

fn build_r2_client() -> S3Client {
    let creds = Credentials::new(
        R2_ACCESS_KEY.as_str(),
        R2_SECRET_KEY.as_str(),
        None,
        None,
        "r2",
    );
    let config = aws_sdk_s3::Config::builder()
        .endpoint_url(R2_ENDPOINT.as_str())
        .region(Region::new("auto"))
        .credentials_provider(creds)
        .force_path_style(true)
        .build();
    S3Client::from_conf(config)
}

/// POST /api/admin/lyrics
/// Body: { song_id, version_id, lyrics }
/// Header: Authorization: Bearer <jwt>
#[post("/api/admin/lyrics")]
pub async fn handler(
    req: HttpRequest,
    body: web::Json<UpdateLyricsRequest>,
) -> Result<impl Responder, ServerError> {
    // 驗 JWT
    auth::extract_bearer(&req)?;

    let key = format!("lyrics/{}/{}.json", body.song_id, body.version_id);
    let content = serde_json::to_string_pretty(&body.lyrics)
        .map_err(|e| ServerError::Internal(e.to_string()))?;

    let client = build_r2_client();
    client
        .put_object()
        .bucket(R2_BUCKET.as_str())
        .key(&key)
        .content_type("application/json")
        .body(content.into_bytes().into())
        .send()
        .await
        .map_err(|e| ServerError::Internal(format!("R2 上傳失敗: {}", e)))?;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "ok": true,
        "key": key,
    })))
}
