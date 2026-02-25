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
                println!("[Auth] 密鑰加載成功：來自環境變數");
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
                        println!("[Auth] 密鑰加載成功：來自檔案 ({})", path);
                        return bytes;
                    }
                    Err(_) => panic!("[FATAL] 密鑰長度不正確，必須為 32 bytes (64 個 hex 字元)"),
                },
                Err(e) => panic!("[FATAL] 密鑰檔案 Hex 解碼失敗: {}", e),
            }
        }
        Err(e) => {
            // 因為你保證一定會映射檔案，如果讀不到代表部署配置出錯，直接停機最安全
            panic!(
                "[FATAL] 找不到密鑰檔案且未設定環境變數！路徑: {}, 錯誤: {}",
                path, e
            );
        }
    }
});

pub fn generate_signature(song_id: i32, available: bool) -> String {
    let message = format!("{}:{}", song_id, available);

    type HmacSha256 = Hmac<Sha256>;

    let mut mac = HmacSha256::new_from_slice(&*PRIVATE_KEY).expect("HMAC 密鑰初始化失敗");

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
