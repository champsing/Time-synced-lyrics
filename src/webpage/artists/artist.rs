use crate::{ database, error::ServerError };
use actix_web::{ HttpResponse, Responder, get, web };
use std::collections::HashMap;

#[get("/api/artists")]
pub async fn handler(
    // 使用 HashMap 接收所有的 Query Parameters
    query: web::Query<HashMap<String, String>>
) -> Result<impl Responder, ServerError> {
    // 1. 嘗試從 ?ids=... 或 ?id=... 取得字串
    let raw_id = query
        .get("ids")
        .or_else(|| query.get("id")) // 如果 ids 不存在，就找 id
        .map(|s| s.as_str())
        .unwrap_or("");

    if raw_id.is_empty() {
        return Ok(HttpResponse::Ok().json(serde_json::json!({})));
    }

    // 2. 解析邏輯：支援 "1" 也支援 "1,2,3"
    let ids_list: Vec<i64> = raw_id
        .split(',')
        .filter_map(|x| x.trim().parse::<i64>().ok())
        .collect();

    if ids_list.is_empty() {
        return Ok(
            HttpResponse::BadRequest().json(serde_json::json!({"error": "Invalid ID format"}))
        );
    }

    // 3. 呼叫資料庫邏輯
    let artists_data = web
        ::block(move || database::artists::find_artists_by_ids(ids_list)).await
        .map_err(|e| ServerError::Internal(e.to_string()))??;

    Ok(HttpResponse::Ok().json(artists_data))
}
