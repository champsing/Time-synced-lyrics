use hmac::{Hmac, Mac};
use sha2::Sha256;
use std::convert::TryInto;
use std::sync::LazyLock;

pub fn get_system_uptime() -> f64 {
    std::fs::read_to_string("/proc/uptime")
        .ok()
        .and_then(|s| s.split_whitespace().next()?.parse::<f64>().ok())
        .unwrap_or(0.0)
}

static PRIVATE_KEY: LazyLock<[u8; 32]> = LazyLock::new(|| {
    // 建立一個閉包來處理共用的解析邏輯：去空白 -> Hex 解碼 -> 轉為 32 bytes 陣列
    let parse_key = |source: &str| -> Result<[u8; 32], String> {
        let bytes_vec =
            hex::decode(source.trim()).map_err(|e| format!("HEX-decode failed: {}", e))?;

        bytes_vec.try_into().map_err(|_| {
            "Incorrect PRIVATE_KEY length, must be a 32-byte (64 hex chars)".to_string()
        })
    };

    // 1. 優先嘗試從環境變數讀取 (HMAC_KEY)
    if let Ok(env_key) = std::env::var("HMAC_KEY") {
        return match parse_key(&env_key) {
            Ok(bytes) => {
                println!("[Auth] Successfully loaded PRIVATE_KEY from: environment variables");
                bytes
            }
            // 環境變數存在但內容無效時，直接 panic，避免錯誤配置被隱藏
            Err(e) => panic!("[FATAL] Invalid HMAC_KEY in environment variables: {}", e),
        };
    }

    // 2. 次要嘗試從檔案讀取
    let path = "data/hmac_private_key";
    let content_str = match std::fs::read_to_string(path) {
        Ok(content) => content,
        Err(e) => panic!(
            "[FATAL] No PRIVATE_KEY file configured or no environment variables specified! Path: {}, Err: {}",
            path, e
        ),
    };

    // 解析檔案內容
    match parse_key(&content_str) {
        Ok(bytes) => {
            println!(
                "[Auth] Successfully loaded PRIVATE_KEY from: File ({})",
                path
            );
            bytes
        }
        Err(e) => panic!("[FATAL] Failed to parse PRIVATE_KEY from file: {}", e),
    }
});

pub fn generate_signature(song_id: i32, available: bool) -> String {
    let message = format!("{}:{}", song_id, available);

    type HmacSha256 = Hmac<Sha256>;

    let mut mac =
        HmacSha256::new_from_slice(&*PRIVATE_KEY).expect("HMAC key initialization failed");

    mac.update(message.as_bytes());

    hex::encode(mac.finalize().into_bytes())
}

/// 針對日文編碼的解碼輔助 (對應 Python 版的邏輯)
pub fn decode_bytes_with_japanese(bytes: &[u8]) -> String {
    use encoding_rs::SHIFT_JIS;
    if let Ok(s) = std::str::from_utf8(bytes) {
        return s.to_string();
    }
    let (res, _, has_errors) = SHIFT_JIS.decode(bytes);
    if !has_errors {
        res.into_owned()
    } else {
        return format!("{:?}", bytes);
    }
}
