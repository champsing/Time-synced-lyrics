use hmac::{Hmac, Mac};
use rand::{self, Rng};
use sha2::Sha256;

use std::{fs, sync::LazyLock};

pub fn get_system_uptime() -> f64 {
    std::fs::read_to_string("/proc/uptime")
        .ok()
        .and_then(|s| s.split_whitespace().next()?.parse::<f64>().ok())
        .unwrap_or(0.0)
}

static PRIVATE_KEY: LazyLock<[u8; 32]> = LazyLock::new(|| {
    let path = "data/hmac_private_key";

    // 1. 嘗試讀取檔案並轉成字串（去除前後空白）
    if let Ok(content_str) = fs::read_to_string(path) {
        let trimmed = content_str.trim();

        // 2. 嘗試將 Hex 字串解析為 bytes
        // 註：這裡需要 hex crate (hex = "0.4")，若沒裝可用下面說明的替代方案
        if let Ok(bytes_vec) = hex::decode(trimmed) {
            if let Ok(bytes) = bytes_vec.try_into() {
                return bytes;
            }
        }
    }

    // 3. 找不到檔案、解析失敗、或長度不對：隨機生成
    let mut bytes = [0_u8; 32];
    rand::rng().fill_bytes(&mut bytes);

    // 將隨機生成的 key 寫回檔案，否則下次重啟伺服器 Token 會全部失效
    let _ = fs::write(path, hex::encode(bytes));

    bytes
});

pub fn generate_signature(song_id: i32, available: bool) -> String {
    let message = format!("{}:{}", song_id, if available { 1 } else { 0 });

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
