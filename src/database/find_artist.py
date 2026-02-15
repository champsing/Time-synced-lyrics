# find_artist.py

from pathlib import Path
import sqlite3
from database.fing_song import convert_bytes_fields

SRC_DIR = Path(__file__).resolve().parent.parent
DB_PATH = Path(SRC_DIR, "db.sqlite3")


def export_artist_list():
    """
    獲取資料庫中所有的 artist_id 及其對應的 original_name
    回傳格式: {id: "name", ...}
    """
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        # 只選取必要的欄位以優化效能
        query = "SELECT artist_id, original_name FROM artists;"
        cursor.execute(query)
        rows = cursor.fetchall()

        # 直接轉換成字典格式
        return {row[0]: row[1] for row in rows}

    except Exception as e:
        print(f"導出藝術家列表錯誤: {str(e)}")
        return {}
    finally:
        if "conn" in locals() and conn:
            conn.close()


def find_artists_by_ids(artist_ids: list):
    """
    輸入 [1, 2, 3]，回傳以 ID 為鍵的字典
    """
    if not artist_ids:
        return {}
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        # 動態生成 SQL 佔位符
        placeholders = ", ".join(["?"] * len(artist_ids))
        query = f"SELECT * FROM artists WHERE artist_id IN ({placeholders});"

        cursor.execute(query, artist_ids)
        rows = cursor.fetchall()
        columns = [column[0] for column in cursor.description]

        for row in rows:
            artist_dict = dict(zip(columns, row))
            artist_dict = convert_bytes_fields(artist_dict)

        return artist_dict
    except Exception as e:
        print(f"批次查詢錯誤: {str(e)}")
        return {}
    finally:
        if conn:
            conn.close()
