use crate::error::ServerError;
use aws_sdk_s3::Client as S3Client;
use aws_sdk_s3::config::{Credentials, Region};
use std::sync::LazyLock;

// ── Env ───────────────────────────────────────────────────────────────────────
static R2_BUCKET: LazyLock<String> = LazyLock::new(|| {
    std::env::var("R2_BUCKET_NAME").expect("[FATAL] R2_BUCKET_NAME not configured")
});
static R2_ENDPOINT: LazyLock<String> =
    LazyLock::new(|| std::env::var("R2_ENDPOINT").expect("[FATAL] R2_ENDPOINT not configured"));
static R2_ACCESS_KEY: LazyLock<String> = LazyLock::new(|| {
    std::env::var("R2_ACCESS_KEY_ID").expect("[FATAL] R2_ACCESS_KEY_ID not configured")
});
static R2_SECRET_KEY: LazyLock<String> = LazyLock::new(|| {
    std::env::var("R2_SECRET_ACCESS_KEY").expect("[FATAL] R2_SECRET_ACCESS_KEY not configured")
});

// ── Client ────────────────────────────────────────────────────────────────────
fn build_client() -> S3Client {
    let creds = Credentials::new(
        R2_ACCESS_KEY.as_str(),
        R2_SECRET_KEY.as_str(),
        None,
        None,
        "r2",
    );
    let config = aws_sdk_s3::Config::builder()
        .behavior_version(aws_sdk_s3::config::BehaviorVersion::latest())
        .endpoint_url(R2_ENDPOINT.as_str())
        .region(Region::new("auto"))
        .credentials_provider(creds)
        .force_path_style(true)
        .build();
    S3Client::from_conf(config)
}

// ── Key ───────────────────────────────────────────────────────────────────────
pub fn key(song_id: i32, folder: &str, version: &str) -> String {
    format!("{}_{}/{}.json", song_id, folder, version)
}

// ── Operations ────────────────────────────────────────────────────────────────

/// 上傳任意內容到 R2
pub async fn put(
    song_id: i32,
    folder: &str,
    version: &str,
    content: Vec<u8>,
) -> Result<(), ServerError> {
    let client = build_client();
    client
        .put_object()
        .bucket(R2_BUCKET.as_str())
        .key(&key(song_id, folder, version))
        .content_type("application/json")
        .body(content.into())
        .send()
        .await
        .map_err(|e| ServerError::Internal(format!("R2 put failed: {}", e)))?;
    Ok(())
}

/// 上傳空陣列 `[]`（新建歌曲 / 新增 version 時使用）
pub async fn put_empty(song_id: i32, folder: &str, version: &str) -> Result<(), ServerError> {
    put(song_id, folder, version, b"[]".to_vec()).await
}

/// 刪除單一 version 的檔案
pub async fn delete(song_id: i32, folder: &str, version: &str) -> Result<(), ServerError> {
    let client = build_client();
    client
        .delete_object()
        .bucket(R2_BUCKET.as_str())
        .key(&key(song_id, folder, version))
        .send()
        .await
        .map_err(|e| ServerError::Internal(format!("R2 delete failed: {}", e)))?;
    Ok(())
}

/// 複製單一 version 的檔案到新路徑（folder 改名時使用）
pub async fn copy(
    song_id: i32,
    old_folder: &str,
    new_folder: &str,
    version: &str,
) -> Result<(), ServerError> {
    let client = build_client();
    let src = format!(
        "{}/{}",
        R2_BUCKET.as_str(),
        key(song_id, old_folder, version)
    );
    client
        .copy_object()
        .bucket(R2_BUCKET.as_str())
        .copy_source(&src)
        .key(&key(song_id, new_folder, version))
        .send()
        .await
        .map_err(|e| ServerError::Internal(format!("R2 copy failed: {}", e)))?;
    Ok(())
}

/// folder 改名：把所有 versions 從舊路徑複製到新路徑，再刪舊的
pub async fn rename_folder(
    song_id: i32,
    old_folder: &str,
    new_folder: &str,
    versions: &[String],
) -> Result<(), ServerError> {
    for v in versions {
        copy(song_id, old_folder, new_folder, v).await?;
        delete(song_id, old_folder, v).await?;
    }
    Ok(())
}

/// 同步 version 列表變化：新增的 put_empty，刪除的 delete
pub async fn sync_versions(
    song_id: i32,
    folder: &str,
    old_versions: &[String],
    new_versions: &[String],
) -> Result<(), ServerError> {
    // 新增的
    for v in new_versions {
        if !old_versions.contains(v) {
            put_empty(song_id, folder, v).await?;
        }
    }
    // 刪除的
    for v in old_versions {
        if !new_versions.contains(v) {
            delete(song_id, folder, v).await?;
        }
    }
    Ok(())
}
