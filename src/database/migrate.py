import sqlite3
from typing import List


class SQLiteMigration:
    def __init__(self, db_path: str):
        """
        初始化 migration 系統

        Args:
            db_path: SQLite 資料庫文件路徑
        """
        self.db_path = db_path
        self.conn = sqlite3.connect(db_path)
        self._create_migrations_table()

    def _create_migrations_table(self):
        """創建 migrations 表用於追蹤已執行的 migrations"""
        cursor = self.conn.cursor()
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS migrations (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL UNIQUE,
                executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        )
        self.conn.commit()

    def get_executed_migrations(self) -> List[str]:
        """獲取已執行的 migrations 列表"""
        cursor = self.conn.cursor()
        cursor.execute("SELECT name FROM migrations ORDER BY id")
        return [row[0] for row in cursor.fetchall()]

    def execute_migration(self, name: str, sql: str):
        """執行單個 migration"""
        cursor = self.conn.cursor()

        try:
            # 執行 migration SQL
            cursor.executescript(sql)

            # 記錄已執行的 migration
            cursor.execute("INSERT INTO migrations (name) VALUES (?)", (name,))
            self.conn.commit()
            print(f"Migration '{name}' executed successfully")
        except Exception as e:
            self.conn.rollback()
            print(f"Error executing migration '{name}': {str(e)}")
            raise

    def run_migrations(self, migrations: List[str]):
        """
        執行所有未執行的 migrations
        """
        executed_migrations = set(self.get_executed_migrations())

        for migration in migrations:

            with open(
                f"src/database/migration/{migration}.sql", "r", encoding="UTF-8"
            ) as m:
                sql = "".join(m.readlines())

            if migration in executed_migrations:
                print(f"Migration '{migration}' already executed, skipping")
                continue

            print(f"Executing migration '{migration}'...")
            self.execute_migration(migration, sql)

    def close(self):
        """關閉資料庫連接"""
        self.conn.close()


# 使用範例
if __name__ == "__main__":
    # 定義所有 migrations (格式: "migration_name:SQL")
    all_migrations = [
        "001_create_songs_table",
        "002_fix_translation_field",
        "002_insert_songs",
        "003_make_one_day_available",
        "004_fix_one_day_credits",
        "005_drop_id_column",
        "006_add_vaundy_saikai",
        "007_make_saikai_translation_available",
        "008_add_knk_kekka_orai",
        "009_add_yutori_speed",
        "010_make_speed_translation_available",
        "011_make_kekka_orai_available",
        "012_add_kenshi_hikaru_jane_doe",
        "013_create_artists_table",
        "013_insert_artists",
        "014_update_artists_id",
        "015_add_vaundy_yobigoe",
        "016_drop_is_duet_column",
    ]

    # 初始化並執行 migrations
    migrator = SQLiteMigration("./src/db.sqlite3")
    try:
        migrator.run_migrations(all_migrations)
    finally:
        migrator.close()
