use crate::database::get_connection;
use crate::error::ServerError;
use crate::utils::decode_bytes_with_japanese;
use rusqlite::types::ValueRef;
use rusqlite::{Error as SqliteError, Row};
use serde_json::{Map, Value};
use std::collections::HashMap;

// 通用的 Row 轉 JSON 函數
fn row_to_json(row: &Row, column_names: &[String]) -> Result<Value, SqliteError> {
    let mut map = Map::new();
    for (i, name) in column_names.iter().enumerate() {
        let val = match row.get_ref_unwrap(i) {
            ValueRef::Null => Value::Null,
            ValueRef::Integer(n) => serde_json::json!(n),
            ValueRef::Real(f) => serde_json::json!(f),
            ValueRef::Text(t) => {
                let s = std::str::from_utf8(t).unwrap_or("").to_string();
                Value::String(s)
            }
            ValueRef::Blob(b) => Value::String(decode_bytes_with_japanese(b)),
        };
        map.insert(name.clone(), val);
    }
    Ok(Value::Object(map))
}

pub fn find_artists_by_ids(artist_ids: Vec<i64>) -> Result<HashMap<i64, Value>, ServerError> {
    if artist_ids.is_empty() {
        return Ok(HashMap::new());
    }

    let conn = get_connection()?;
    let placeholders = vec!["?"; artist_ids.len()].join(", ");
    let query = format!(
        "SELECT * FROM artists WHERE artist_id IN ({});",
        placeholders
    );
    let mut stmt = conn.prepare(&query)?;

    let column_names: Vec<String> = stmt
        .column_names()
        .into_iter()
        .map(|s| s.to_string())
        .collect();

    // 使用 params_from_iter 傳入參數
    let rows = stmt.query_map(rusqlite::params_from_iter(artist_ids), |row| {
        row_to_json(row, &column_names)
    })?;

    let mut result_map = HashMap::new();
    for row_res in rows {
        let artist_json = row_res?;
        if let Some(id) = artist_json.get("artist_id").and_then(|v| v.as_i64()) {
            result_map.insert(id, artist_json);
        }
    }

    Ok(result_map)
}

pub fn export_artists_list() -> Result<Vec<Value>, ServerError> {
    let conn = get_connection()?;
    let mut stmt = conn.prepare("SELECT * FROM artists;")?;

    let column_names: Vec<String> = stmt
        .column_names()
        .into_iter()
        .map(|s| s.to_string())
        .collect();

    let rows = stmt.query_map([], |row| row_to_json(row, &column_names))?;

    rows.collect::<Result<Vec<_>, _>>()
        .map_err(ServerError::from)
}
