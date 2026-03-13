use hmac::{Hmac, Mac};
use sha2::Sha256;
use std::convert::TryInto;
use std::fs;
use std::sync::LazyLock;

pub fn get_system_uptime() -> f64 {
    std::fs::read_to_string("/proc/uptime")
        .ok()
        .and_then(|s| s.split_whitespace().next()?.parse::<f64>().ok())
        .unwrap_or(0.0)
}

static PRIVATE_KEY: LazyLock<[u8; 32]> = LazyLock::new(|| {
    // 1. 優先嘗試從環境變數讀取 (HMAC_KEY)
    if let Ok(env_key) = std::env::var("HMAC_KEY") {
        let trimmed = env_key.trim();
        if let Ok(bytes_vec) = hex::decode(trimmed) {
            if let Ok(bytes) = bytes_vec.try_into() {
                println!("[Auth] Successfully loaded SECRET from: environment variables");
                return bytes;
            }
        }
    }

    // 2. 次要嘗試從檔案讀取
    let path = "data/hmac_private_key";
    match fs::read_to_string(path) {
        Ok(content_str) => {
            let trimmed = content_str.trim();
            match hex::decode(trimmed) {
                Ok(bytes_vec) => match bytes_vec.try_into() {
                    Ok(bytes) => {
                        println!("[Auth] Successfully loaded SECRET from: File ({})", path);
                        return bytes;
                    }
                    Err(_) => {
                        panic!("[FATAL] Incorrect SECRET length, must be a 32-byte (64 hex chars)")
                    }
                },
                Err(e) => panic!("[FATAL] Failed to HEX-decode SECRET file: {}", e),
            }
        }
        Err(e) => {
            // 如果讀不到代表部署配置出錯，直接停機最安全
            panic!(
                "[FATAL] No SECRET file configured or no environment variables specified! Path: {}, Err: {}",
                path, e
            );
        }
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
        format!("{:?}", bytes)
    }
}
