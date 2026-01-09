from pathlib import Path
import sqlite3
from database.fing_song import convert_bytes_fields


SRC_DIR = Path(__file__).resolve().parent.parent
DB_PATH = Path(SRC_DIR, "db.sqlite3")


def find_artist_by_id(artist_id: int):
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        fetched_artist_data = cursor.execute(
            f"""
            SELECT * FROM artists WHERE artist_id = ?;
            """,
            (artist_id,),
        ).fetchone()

        if fetched_artist_data:
            # 获取列名
            columns = [column[0] for column in cursor.description]
            # 创建列名-值的字典
            artist_dict = dict(zip(columns, fetched_artist_data))

            # 转换 bytes 字段为字符串
            artist_dict = convert_bytes_fields(artist_dict)

            # 转换为JSON并输出
            return artist_dict
        else:
            Exception({"error": "Artist not found"})
    except Exception as e:
        print(f"错误处理: {str(e)}")
    finally:
        if conn:
            conn.close()
