from pathlib import Path
import sqlite3
import json

SRC_DIR = Path(__file__).resolve().parent.parent
DB_PATH = Path(SRC_DIR, "db.sqlite3")


def convert_bytes_fields(data):
    """将字典中的 bytes 字段转换为字符串"""
    for key, value in data.items():
        if isinstance(value, bytes):
            try:
                # 尝试 UTF-8 解码
                data[key] = value.decode("utf-8")
            except UnicodeDecodeError:
                # 如果 UTF-8 失败，尝试其他编码或保留原始表示
                try:
                    data[key] = value.decode("shift_jis")  # 日文常用编码
                except:
                    data[key] = str(value)  # 最后手段：转为字符串表示
    return data


# def export_song_list():
#     try:
#         conn = sqlite3.connect(DB_PATH)
#         cursor = conn.cursor()

#         song_data = cursor.execute(
#             f"""
#             SELECT available, hidden, song_id, folder FROM songs;
#             """
#         )
#         fetched_song_data = cursor.fetchall()

#         if fetched_song_data:
#             # 获取列名
#             columns = [column[0] for column in cursor.description]
#             # 创建列名-值的字典
#             song_dict = dict(zip(columns, fetched_song_data))

#             # 转换 bytes 字段为字符串
#             song_dict = convert_bytes_fields(song_dict)

#             # 处理可能的 JSON 字符串字段
#             json_fields = ["credits", "versions"]
#             for field in json_fields:
#                 if field in song_dict and isinstance(song_dict[field], str):
#                     try:
#                         song_dict[field] = json.loads(song_dict[field])
#                     except json.JSONDecodeError:
#                         pass  # 保持原始字符串格式

#             # 转换为JSON并输出
#             return song_dict
#         else:
#             Exception({"error": "Song not found"})
#     except Exception as e:
#         print(f"错误处理: {str(e)}")
#     finally:
#         if conn:
#             conn.close()


def find_song_by_id(song_id: int):
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        song_data = cursor.execute(
            f"""
            SELECT * FROM songs WHERE song_id = ?;
            """,
            (song_id,),
        )
        fetched_song_data = cursor.fetchone()

        if fetched_song_data:
            # 获取列名
            columns = [column[0] for column in cursor.description]
            # 创建列名-值的字典
            song_dict = dict(zip(columns, fetched_song_data))

            # 转换 bytes 字段为字符串
            song_dict = convert_bytes_fields(song_dict)

            # 处理可能的 JSON 字符串字段
            json_fields = ["credits", "versions"]
            for field in json_fields:
                if field in song_dict and isinstance(song_dict[field], str):
                    try:
                        song_dict[field] = json.loads(song_dict[field])
                    except json.JSONDecodeError:
                        pass  # 保持原始字符串格式

            # 转换为JSON并输出
            return song_dict
        else:
            Exception({"error": "Song not found"})
    except Exception as e:
        print(f"错误处理: {str(e)}")
    finally:
        if conn:
            conn.close()
