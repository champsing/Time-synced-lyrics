use rusqlite::{params, types::ValueRef};
use serde_json::{Map, Value, json};

use crate::{
    database::get_connection,
    error::ServerError,
    utils::{decode_bytes_with_japanese, generate_signature},
};

/// 高效地將單個 Row 轉為 JSON Object
fn row_to_json_generic(row: &rusqlite::Row) -> Result<Map<String, Value>, rusqlite::Error> {
    let mut map = Map::new();
    let column_names = row.as_ref().column_names();
    let json_fields = ["credits", "versions", "album", "translation"];

    for (i, name) in column_names.iter().enumerate() {
        let val = match row.get_ref_unwrap(i) {
            ValueRef::Null => Value::Null,
            ValueRef::Integer(n) => json!(n),
            ValueRef::Real(f) => json!(f),
            ValueRef::Text(t) => {
                let s = std::str::from_utf8(t).unwrap_or("");
                // 處理原本邏輯中的 "NULL" 或空字串
                if s == "NULL" || s.is_empty() {
                    Value::Null
                } else if json_fields.contains(name) {
                    serde_json::from_str(s).unwrap_or_else(|_| Value::String(s.to_string()))
                } else {
                    Value::String(s.to_string())
                }
            }
            ValueRef::Blob(b) => Value::String(decode_bytes_with_japanese(b)),
        };
        map.insert(name.to_string(), val);
    }
    Ok(map)
}

pub fn export_song_list() -> Result<Vec<Value>, ServerError> {
    let conn = get_connection()?;
    let mut stmt = conn.prepare(
        "SELECT available, hidden, song_id, title, art, album, artist, updated_at, lang FROM songs",
    )?;

    let song_iter = stmt.query_map([], |row| {
        let map = row_to_json_generic(row)?;
        Ok(Value::Object(map))
    })?;

    song_iter
        .collect::<Result<Vec<Value>, _>>()
        .map_err(|e| ServerError::Internal(e.to_string()))
}

pub fn find_song_by_id(song_id: i32) -> Result<Value, ServerError> {
    let conn = get_connection()?;
    let mut stmt = conn.prepare("SELECT * FROM songs WHERE song_id = ?")?;

    let mut song_map = stmt
        .query_row(params![song_id], |row| row_to_json_generic(row))
        .map_err(|_| ServerError::Internal("Song not found".into()))?;

    // --- 簽名邏輯 ---
    let id = song_map
        .get("song_id")
        .and_then(|v| v.as_i64())
        .unwrap_or(0) as i32;
    let avail = song_map
        .get("available")
        .and_then(|v| v.as_i64())
        .map(|n| n == 1)
        .unwrap_or(false);

    song_map.insert("signature".into(), json!(generate_signature(id, avail)));

    Ok(Value::Object(song_map))
}

use crate::webpage::admin::update_song::UpdateSongRequest;

pub fn update_song(req: UpdateSongRequest) -> Result<(), ServerError> {
    let conn = get_connection()?;

    // 動態建構 SET 子句
    let mut sets: Vec<String> = vec![];
    let mut params: Vec<Box<dyn rusqlite::ToSql>> = vec![];

    macro_rules! push_field {
        ($field:expr, $col:expr) => {
            if let Some(v) = $field {
                sets.push(format!("{} = ?", $col));
                params.push(Box::new(v));
            }
        };
        (json $field:expr, $col:expr) => {
            if let Some(v) = $field {
                let s =
                    serde_json::to_string(&v).map_err(|e| ServerError::Internal(e.to_string()))?;
                sets.push(format!("{} = ?", $col));
                params.push(Box::new(s));
            }
        };
    }

    push_field!(req.title, "title");
    push_field!(req.subtitle, "subtitle");
    push_field!(req.artist, "artist");
    push_field!(req.lyricist, "lyricist");
    push_field!(req.lang, "lang");
    push_field!(req.available.map(|b| b as i32), "available");
    push_field!(req.hidden.map(|b| b as i32), "hidden");
    push_field!(req.is_duet.map(|b| b as i32), "is_duet");
    push_field!(req.furigana.map(|b| b as i32), "furigana");
    push_field!(req.folder, "folder");
    push_field!(req.art, "art");
    push_field!(json req.album, "album");
    push_field!(json req.versions, "versions");
    push_field!(json req.translation, "translation");
    push_field!(json req.credits, "credits");

    // 永遠更新 updated_at
    sets.push("updated_at = CURRENT_DATE".to_string());

    if sets.is_empty() {
        return Ok(()); // 沒有欄位要更新
    }

    let sql = format!("UPDATE songs SET {} WHERE song_id = ?", sets.join(", "));
    params.push(Box::new(req.song_id));

    let refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|b| b.as_ref()).collect();
    conn.execute(&sql, refs.as_slice())?;

    Ok(())
}
