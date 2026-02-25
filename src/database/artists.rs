use crate::database::get_connection; // 取得你 mod.rs 定義的連接
use crate::error::ServerError;
use crate::utils::decode_bytes_with_japanese;
use rusqlite::params_from_iter;
use serde_json::{Map, Value};
use std::collections::HashMap; // 引用你移動後的位置

pub fn find_artists_by_ids(artist_ids: Vec<i64>) -> Result<HashMap<i64, Value>, ServerError> {
    // 1. 如果輸入是空的，直接回傳空字典，避免執行 SQL
    if artist_ids.is_empty() {
        return Ok(HashMap::new());
    }

    let conn = get_connection()?;

    // 2. 動態生成 SQL 佔位符 (e.g., ?, ?, ?)
    let placeholders = vec!["?"; artist_ids.len()].join(", ");
    let query = format!(
        "SELECT * FROM artists WHERE artist_id IN ({});",
        placeholders
    );

    let mut stmt = conn.prepare(&query)?;

    // 3. 獲取列名 (對應 Python 的 columns)
    let column_names: Vec<String> = stmt
        .column_names()
        .into_iter()
        .map(|s| s.to_string())
        .collect();

    // 4. 執行查詢並映射結果
    let rows = stmt.query_map(params_from_iter(artist_ids), |row| {
        let mut map = Map::new();
        for name in &column_names {
            // 嘗試讀取為字串，失敗則嘗試透過 utils 解碼 bytes
            let val = if let Ok(s) = row.get::<_, String>(name.as_str()) {
                Value::String(s)
            } else if let Ok(b) = row.get::<_, Vec<u8>>(name.as_str()) {
                Value::String(decode_bytes_with_japanese(&b))
            } else {
                Value::Null
            };
            map.insert(name.clone(), val);
        }
        Ok(Value::Object(map))
    })?;

    let mut result_map = HashMap::new();
    for row_res in rows {
        let artist_json = row_res?;
        // 取得 ID 作為 Key (假設欄位名稱是 artist_id)
        if let Some(id) = artist_json.get("artist_id").and_then(|v| v.as_i64()) {
            result_map.insert(id as i64, artist_json);
        }
    }

    Ok(result_map)
}
