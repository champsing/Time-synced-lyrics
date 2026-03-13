use crate::{
    database::{self, songs::Song},
    error::ServerError,
    webpage::auth,
};
use actix_web::{HttpRequest, HttpResponse, Responder, post, web};
use chrono::Local;
use serde::Deserialize;
use serde_json::Value;

#[derive(Deserialize)]
pub struct CreateSongRequest {
    pub song_id: i64,
    pub title: String,
    pub versions: Option<Value>,
}

/// POST /api/songs/create
/// Header: Authorization: Bearer <jwt>
/// 建立一首空白歌曲，只需要 song_id、title 和 versions
/// 其餘欄位皆用預設值，後續透過 /api/songs/update 補齊
#[post("/api/songs/create")]
pub async fn handler(
    req: HttpRequest,
    body: web::Json<CreateSongRequest>,
) -> Result<impl Responder, ServerError> {
    auth::extract_bearer(&req)?;

    let req = body.into_inner();
    let song_id = req.song_id;

    web::block(move || {
        // 檢查 song_id 是否已存在
        if Song::find_by_id(req.song_id)?.is_some() {
            return Err(ServerError::Internal(format!(
                "song_id {} already exists",
                req.song_id
            )));
        }

        let song = Song {
            song_id: req.song_id,
            title: req.title,
            versions: req.versions.unwrap_or_else(|| {
                serde_json::json!([
                    {"version": "original", "id": "", "default": true, "duration": "0:00"}
                ])
            }),
            // ── 其餘欄位全部預設值 ──────────────────────────────
            artist: String::new(),
            lyricist: String::new(),
            lang: String::new(),
            folder: String::new(),
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

        let mut conn = database::get_connection()?;
        let tran = conn.transaction()?;
        song.insert(&tran)?;
        tran.commit()?;

        Ok::<_, ServerError>(())
    })
    .await
    .map_err(|e| ServerError::Internal(e.to_string()))??;

    Ok(HttpResponse::Created().json(serde_json::json!({
        "ok": true,
        "song_id": song_id,
    })))
}
