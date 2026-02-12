use hmac::{Hmac, Mac};
use sha2::Sha256;

pub fn get_system_uptime() -> f64 {
    std::fs::read_to_string("/proc/uptime")
        .ok()
        .and_then(|s| s.split_whitespace().next()?.parse::<f64>().ok())
        .unwrap_or(0.0)
}

pub fn generate_signature(song_id: i32, available: bool, secret: &str) -> String {
    let message = format!("{}:{}", song_id, if available { 1 } else { 0 });

    type HmacSha256 = Hmac<Sha256>;
    let mut mac = HmacSha256::new_from_slice(secret.as_bytes()).expect("HMAC 密鑰初始化失敗");
    mac.update(message.as_bytes());

    hex::encode(mac.finalize().into_bytes())
}
