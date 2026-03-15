use crate::{
    database::{self, songs::Song},
    error::ServerError,
    webpage::{auth, lyrics::r2},
};
use actix_web::{HttpRequest, HttpResponse, Responder, post, web};
use chrono::Local;
use serde::Deserialize;
use serde_json::Value;

#[derive(Deserialize)]
pub struct CreateSongRequest {
    pub song_id: i64,
    pub title: String,
    pub folder: String, // 必填，R2 key 的一部分
    pub versions: Option<Value>,
}

/// POST /api/songs/create
/// Header: Authorization: Bearer <jwt>
#[post("/api/songs/create")]
pub async fn handler(
    req: HttpRequest,
    body: web::Json<CreateSongRequest>,
) -> Result<impl Responder, ServerError> {
    auth::extract_bearer(&req)?;

    let req = body.into_inner();
    let song_id = req.song_id;

    // ── 防呆：folder 不可為空 ─────────────────────────────────────────────────
    if req.folder.trim().is_empty() {
        return Err(ServerError::Internal("folder is required".into()));
    }

    let default_versions = serde_json::json!([
        {"version": "original", "id": "", "default": true, "duration": "0:00"}
    ]);
    let versions_value = req.versions.clone().unwrap_or(default_versions.clone());

    // ── 解出 version 名稱列表 ─────────────────────────────────────────────────
    let version_names: Vec<String> = versions_value
        .as_array()
        .unwrap_or(&vec![])
        .iter()
        .filter_map(|v| v.get("version")?.as_str().map(str::to_string))
        .collect();

    let folder = req.folder.trim().to_string();
    let song = Song {
        song_id: req.song_id,
        title: req.title,
        folder: folder.clone(),
        versions: versions_value,
        artist: String::new(),
        lyricist: String::new(),
        lang: String::new(),
        art: String::new(),
        subtitle: None,
        available: false,
        hidden: None,
        is_duet: false,
        furigana: None,
        album: serde_json::json!({"album": "", "link": ""}),
        translation: serde_json::json!({"available": false}),
        credits: serde_json::json!([]),
        updated_at: Local::now().date_naive(),
    };

    // ── 寫入 SQLite ───────────────────────────────────────────────────────────
    web::block(move || {
        if Song::find_by_id(song.song_id)?.is_some() {
            return Err(ServerError::Internal(format!(
                "song_id {} already exists",
                song.song_id
            )));
        }
        let mut conn = database::get_connection()?;
        let tran = conn.transaction()?;
        song.insert(&tran)?;
        tran.commit()?;
        Ok::<_, ServerError>(())
    })
    .await
    .map_err(|e| ServerError::Internal(e.to_string()))??;

    // ── 為每個 version 在 R2 建立空檔案 ──────────────────────────────────────
    for version in &version_names {
        r2::put_empty(song_id as i32, &folder, version).await?;
    }

    Ok(HttpResponse::Created().json(serde_json::json!({
        "ok": true,
        "song_id": song_id,
    })))
}
