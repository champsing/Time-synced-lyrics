import os
import hmac
import hashlib
import secrets
from django.conf import settings

def get_hmac_secret():
    """
    從 Django Settings 獲取密鑰，並確保其為 bytes 格式
    """
    # 1. 優先從 settings_prod.py 讀取的 DJANGO_SECRET 獲取
    django_key = getattr(settings, "SECRET_KEY", None)
    if django_key:
        return django_key.encode("utf-8")

    # 2. 備案：環境變數 (對應你的 Docker 設置)
    env_secret = os.environ.get("HMAC_SECRET_KEY")
    if env_secret:
        return env_secret.encode("utf-8")

    # 3. 最後手段：隨機生成
    return secrets.token_bytes(32)

# 在模組層級初始化一次，避免每次 generate 都讀取
_FINAL_KEY = get_hmac_secret()

def generate_signature(song_id, available):
    """
    產生 HMAC 簽名，確保 song_id 與 available 狀態未被竄改
    """
    # 統一轉換格式：例如 "123:1" 或 "123:0"
    message = f"{song_id}:{1 if available else 0}".encode("utf-8")
    return hmac.new(_FINAL_KEY, message, hashlib.sha256).hexdigest()