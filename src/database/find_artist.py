# find_artist.py

from pathlib import Path
import sqlite3
from database.fing_song import convert_bytes_fields

SRC_DIR = Path(__file__).resolve().parent.parent
DB_PATH = Path(SRC_DIR, "db.sqlite3")


def find_artists_by_ids(artist_ids: list):
    """
    輸入 [1, 2, 3]，回傳以 ID 為鍵的字典
    """
    if not artist_ids: return {}
    try:
        conn = sqlite3.connect(DB_PATH) #
        cursor = conn.cursor()
        
        # 動態生成 SQL 佔位符
        placeholders = ', '.join(['?'] * len(artist_ids))
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
        if conn: conn.close()