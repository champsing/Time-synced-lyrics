use crate::database::get_connection;
use crate::error::ServerError;
use crate::utils::{decode_bytes_with_japanese, generate_signature};
use rusqlite::params;
use serde_json::{Value, json};

fn parse_dynamic_field(field_name: &str, row: &rusqlite::Row) -> Value {
    // 1. 先嘗試讀取為 Option<String>，這可以同時處理「真正的數據」和「真正的 NULL」
    if let Ok(opt_s) = row.get::<_, Option<String>>(field_name) {
        match opt_s {
            Some(s) => {
                // 額外檢查：如果資料庫裡存的是字串 "NULL" 或空字串，將其視為 JSON null
                if s == "NULL" || s == "" {
                    return Value::Null;
                }

                // 處理 JSON 欄位
                let json_fields = ["credits", "versions", "album", "translation"];
                if json_fields.contains(&field_name) {
                    return serde_json::from_str(&s).unwrap_or_else(|_| Value::String(s));
                }
                return Value::String(s);
            }
            None => {
                return Value::Null;
            } // 資料庫裡是真正的 NULL
        }
    }

    // 2. 嘗試讀取為 i32 (針對 Integer 欄位)
    if let Ok(n) = row.get::<_, i32>(field_name) {
        return json!(n);
    }

    // 3. 嘗試讀取為 Blob (針對 Bytes 欄位)
    if let Ok(bytes) = row.get::<_, Vec<u8>>(field_name) {
        return Value::String(decode_bytes_with_japanese(&bytes));
    }

    Value::Null
}

/// 1. 導出歌曲列表 (export_song_list)
pub fn export_song_list() -> Result<Vec<Value>, ServerError> {
    let conn = get_connection()?;
    let mut stmt = conn.prepare(
        "SELECT available, hidden, song_id, title, art, album, artist, updated_at, lang FROM songs",
    )?;

    let song_iter = stmt.query_map([], |row| {
        let mut map = serde_json::Map::new();
        // 這裡手動對應你 Python 的 zip(columns, song_data) 邏輯
        map.insert("available".into(), json!(row.get::<_, i32>("available")?));
        map.insert("hidden".into(), parse_dynamic_field("hidden", row)); // 使用動態解析
        map.insert("song_id".into(), json!(row.get::<_, i32>("song_id")?));
        map.insert("title".into(), parse_dynamic_field("title", row));
        map.insert("art".into(), parse_dynamic_field("art", row));
        map.insert("album".into(), parse_dynamic_field("album", row));
        map.insert("artist".into(), parse_dynamic_field("artist", row));
        map.insert("updated_at".into(), parse_dynamic_field("updated_at", row));
        map.insert("lang".into(), parse_dynamic_field("lang", row));

        Ok(Value::Object(map))
    })?;

    let mut list = Vec::new();
    for song in song_iter {
        list.push(song.map_err(|e| ServerError::Internal(e.to_string()))?);
    }

    Ok(list)
}

/// 2. 根據 ID 查找歌曲 (find_song_by_id)
pub fn find_song_by_id(song_id: i32) -> Result<Value, ServerError> {
    let conn = get_connection()?;
    let mut stmt = conn.prepare("SELECT * FROM songs WHERE song_id = ?")?;

    let song_dict = stmt
        .query_row(params![song_id], |row| {
            let mut map = serde_json::Map::new();

            // 獲取所有欄位名稱 (模擬 Python 的 cursor.description)
            let column_names: Vec<String> = row
                .as_ref()
                .column_names()
                .iter()
                .map(|s| s.to_string())
                .collect();

            for name in column_names {
                map.insert(name.clone(), parse_dynamic_field(&name, row));
            }

            Ok(map)
        })
        .map_err(|_| ServerError::Internal("Song not found".into()))?;

    let mut song_json = Value::Object(song_dict);

    // --- 新增簽名邏輯 ---
    if let Some(obj) = song_json.as_object_mut() {
        let id = obj.get("song_id").and_then(|v| v.as_i64()).unwrap_or(0) as i32;
        let avail = obj
            .get("available")
            .and_then(|v| v.as_i64())
            .map(|n| n == 1) // 如果是 1 則為 true，其餘為 false
            .unwrap_or(false); // 若欄位不存在則默認 false

        // 呼叫你的簽名函數 (這裡假設你有定義)
        obj.insert("signature".into(), json!(generate_signature(id, avail)));
    }

    Ok(song_json)
}
