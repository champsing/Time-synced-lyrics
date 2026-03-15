use crate::{
    database::{self, songs::Song},
    error::ServerError,
    webpage::{auth, lyrics::r2},
};
use actix_web::{HttpRequest, HttpResponse, Responder, post, web};
use serde::Deserialize;

#[derive(Deserialize)]
pub struct UpdateSongRequest {
    pub song_id: i32,
    pub title: Option<String>,
    pub subtitle: Option<String>,
    pub artist: Option<String>,
    pub lyricist: Option<String>,
    pub lang: Option<String>,
    pub available: Option<bool>,
    pub hidden: Option<bool>,
    pub is_duet: Option<bool>,
    pub furigana: Option<bool>,
    pub folder: Option<String>,
    pub art: Option<String>,
    pub album: Option<serde_json::Value>,
    pub versions: Option<serde_json::Value>,
    pub translation: Option<serde_json::Value>,
    pub credits: Option<serde_json::Value>,
}

// ── 從 versions JSON 解出 version 名稱列表 ────────────────────────────────────
fn extract_version_names(versions: &serde_json::Value) -> Vec<String> {
    versions
        .as_array()
        .unwrap_or(&vec![])
        .iter()
        .filter_map(|v| v.get("version")?.as_str().map(str::to_string))
        .collect()
}

/// POST /api/songs/update
/// Header: Authorization: Bearer <jwt>
#[post("/api/songs/update")]
pub async fn handler(
    req: HttpRequest,
    body: web::Json<UpdateSongRequest>,
) -> Result<impl Responder, ServerError> {
    auth::extract_bearer(&req)?;

    let req_data = body.into_inner();
    let song_id = req_data.song_id;

    // ── 取出現有資料（R2 操作需要舊值）────────────────────────────────────────
    let old_song = web::block(move || {
        database::songs::Song::find_by_id(song_id as i64)?
            .ok_or_else(|| ServerError::Internal("Song not found".into()))
    })
    .await
    .map_err(|e| ServerError::Internal(e.to_string()))??;

    let old_folder = old_song.folder.clone();
    let old_versions = extract_version_names(&old_song.versions);

    // ── 計算 R2 需要的新值 ────────────────────────────────────────────────────
    let new_folder = req_data
        .folder
        .clone()
        .unwrap_or_else(|| old_folder.clone());
    let new_versions = req_data
        .versions
        .as_ref()
        .map(extract_version_names)
        .unwrap_or_else(|| old_versions.clone());

    let folder_changed = new_folder != old_folder;
    let versions_changed = new_versions != old_versions;

    // ── 更新 SQLite ───────────────────────────────────────────────────────────
    web::block(move || {
        let mut song = old_song;

        #[rustfmt::skip]
        fn _apply_updates(req_data: UpdateSongRequest, song: &mut Song) {
            if let Some(v) = req_data.title       { song.title = v; }
            if let Some(v) = req_data.subtitle    { song.subtitle = Some(v); }
            if let Some(v) = req_data.artist      { song.artist = v; }
            if let Some(v) = req_data.lyricist    { song.lyricist = v; }
            if let Some(v) = req_data.lang        { song.lang = v; }
            if let Some(v) = req_data.available   { song.available = v; }
            if let Some(v) = req_data.hidden      { song.hidden = Some(v); }
            if let Some(v) = req_data.is_duet     { song.is_duet = v; }
            if let Some(v) = req_data.furigana    { song.furigana = Some(v); }
            if let Some(v) = req_data.folder      { song.folder = v; }
            if let Some(v) = req_data.art         { song.art = v; }
            if let Some(v) = req_data.album       { song.album = v; }
            if let Some(v) = req_data.versions    { song.versions = v; }
            if let Some(v) = req_data.translation { song.translation = v; }
            if let Some(v) = req_data.credits     { song.credits = v; }
        }
        _apply_updates(req_data, &mut song);

        song.updated_at = chrono::Local::now().date_naive();

        let mut conn = database::get_connection()?;
        let tran = conn.transaction()?;
        song.update(&tran)?;
        tran.commit()?;
        Ok::<_, ServerError>(())
    })
    .await
    .map_err(|e| ServerError::Internal(e.to_string()))??;

    // ── R2 同步（在 SQLite 成功後才動 R2）────────────────────────────────────
    if folder_changed {
        // folder 改名：把所有舊 versions 搬到新路徑
        // 情況 A+B：以新 versions 為準，舊路徑全部搬/刪
        let versions_to_copy: Vec<String> = old_versions
            .iter()
            .filter(|v| new_versions.contains(v))
            .cloned()
            .collect();

        // 先把舊路徑有、新路徑也要有的搬過去
        r2::rename_folder(song_id, &old_folder, &new_folder, &versions_to_copy).await?;

        // 新增的 version（舊路徑沒有）直接在新路徑建空檔
        for v in &new_versions {
            if !old_versions.contains(v) {
                r2::put_empty(song_id, &new_folder, v).await?;
            }
        }

        // 舊路徑有但新 versions 沒有的，rename_folder 已經沒 copy，但舊檔還在，刪掉
        for v in &old_versions {
            if !new_versions.contains(v) {
                r2::delete(song_id, &old_folder, v).await?;
            }
        }
    } else if versions_changed {
        // 情況 B：只有 versions 變化，folder 不變
        r2::sync_versions(song_id, &new_folder, &old_versions, &new_versions).await?;
    }

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "ok": true,
        "song_id": song_id,
    })))
}
