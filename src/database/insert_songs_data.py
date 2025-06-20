import os
import json
import sqlite3
from pathlib import Path

# 配置路径
SRC_DIR = Path(__file__).resolve().parent.parent
SONGS_DIR = Path(SRC_DIR, "songs")
DB_PATH = Path(SRC_DIR, "db.sqlite3")


def import_song_files():
    """导入所有歌曲JSON文件到数据库"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    processed = 0
    skipped = 0
    errors = []

    for filename in os.listdir(SONGS_DIR):
        if not filename.endswith(".json"):
            continue

        try:
            filepath = os.path.join(SONGS_DIR, filename)
            with open(filepath, "r", encoding="utf-8") as f:
                data = json.load(f)

            # 检查歌曲是否已存在
            cursor.execute("SELECT 1 FROM songs WHERE song_id = ?", (data["song_id"],))
            if cursor.fetchone():
                print(
                    f"跳过已存在歌曲: {data['song_id']} - {data.get('title', '未知标题')}"
                )
                skipped += 1
                continue

            # 准备插入数据
            translation = data.get("translation", {})

            cursor.execute(
                """
            INSERT INTO songs (
                song_id, available, folder, art, artist, lyricist,
                title, subtitle, album, versions, is_duet, translation, 
                updated_at, lang,
                credits
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
                (
                    data["song_id"],
                    int(data["available"]),
                    data["folder"],
                    data.get("art"),
                    data["artist"],
                    data["lyricist"],
                    data["title"],
                    data.get("subtitle"),
                    json.dumps(data.get("album"), ensure_ascii=False),
                    json.dumps(data["versions"]),
                    int(data.get("is_duet", False)),
                    json.dumps(data.get("translation"), ensure_ascii=False),
                    data["updated_at"],
                    data["lang"],
                    json.dumps(data["credits"], ensure_ascii=False),
                ),
            )

            processed += 1
            print(f"已导入: {data['song_id']} - {data['title']}")

        except Exception as e:
            errors.append(f"{filename}: {str(e)}")
            print(f"错误处理 {filename}: {str(e)}")

    conn.commit()
    conn.close()

    # 打印摘要
    print("\n导入完成!")
    print(f"处理文件: {processed + skipped + len(errors)}")
    print(f"成功导入: {processed}")
    print(f"跳过重复: {skipped}")
    print(f"错误文件: {len(errors)}")

    if errors:
        print("\n错误详情:")
        for error in errors:
            print(f"  - {error}")


if __name__ == "__main__":
    # 确保目录存在
    os.makedirs(os.path.dirname(SRC_DIR), exist_ok=True)
    os.makedirs(SONGS_DIR, exist_ok=True)

    print("=" * 50)
    print(f"歌曲目录: {SONGS_DIR}")
    print(f"数据库路径: {DB_PATH}")
    print("=" * 50 + "\n")

    import_song_files()
