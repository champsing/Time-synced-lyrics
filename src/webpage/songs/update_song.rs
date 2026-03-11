use crate::{
    database::{self, songs::Song},
    error::ServerError,
    webpage::auth,
};
use actix_web::{HttpRequest, HttpResponse, Responder, post, web};
use serde::Deserialize;

#[derive(Deserialize)]
pub struct UpdateSongRequest {
    pub song_id: i32,
    // 所有可選欄位，只更新有傳入的
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

/// POST /api/songs/song/update
/// Header: Authorization: Bearer <jwt>
#[post("/api/songs/update")]
pub async fn handler(
    req: HttpRequest,
    body: web::Json<UpdateSongRequest>,
) -> Result<impl Responder, ServerError> {
    auth::extract_bearer(&req)?;

    let req_data = body.into_inner();
    let song_id = req_data.song_id;

    web::block(move || {
        // 1. 先取出現有資料
        let mut song = database::songs::Song::find_by_id(song_id as i64)?
            .ok_or_else(|| ServerError::Internal("Song not found".into()))?;

        // 2. 只覆蓋有傳入的欄位
        // apply_updates 只是偽裝，為了讓編譯器閉嘴別抓 #[rustfmt::skip]
        #[rustfmt::skip]
        fn _apply_updates(req_data: UpdateSongRequest, song: &mut Song){
            // @prettier-ignore
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

        // updated_at 永遠更新成今天
        song.updated_at = chrono::Local::now().date_naive();

        // 3. 寫回資料庫
        let conn = database::get_connection()?;
        let tran = conn.unchecked_transaction()?;
        song.update(&tran)?;
        tran.commit()?;

        Ok::<_, ServerError>(())
    })
    .await
    .map_err(|e| ServerError::Internal(e.to_string()))??;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "ok": true,
        "song_id": song_id,
    })))
}
