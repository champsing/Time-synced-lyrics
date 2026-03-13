use crate::{database::get_connection, error::ServerError, utils::generate_signature};
use chrono::NaiveDate;
use rusqlite::{Row, Transaction, types::Type};
use sea_query::{Expr, IdenStatic, Query, SqliteQueryBuilder, enum_def};
use sea_query_rusqlite::RusqliteBinder;
use serde::{Deserialize, Serialize};
use serde_json::{Value, from_str, to_string};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[enum_def]
pub struct Song {
    pub song_id: i64,
    pub available: bool,
    pub hidden: Option<bool>,
    pub folder: String,
    pub art: String,
    pub artist: String,
    pub lyricist: String,
    pub title: String,
    pub subtitle: Option<String>,
    pub album: Value,
    pub versions: Value,
    pub is_duet: bool,
    pub furigana: Option<bool>,
    pub translation: Value,
    pub updated_at: NaiveDate,
    pub lang: String,
    pub credits: Value,
}

fn get_bool(row: &Row<'_>, col: &str) -> Result<bool, rusqlite::Error> {
    Ok(match row.get::<_, rusqlite::types::Value>(col)? {
        rusqlite::types::Value::Integer(n) => n != 0,
        rusqlite::types::Value::Text(s) => s == "1",
        _ => false,
    })
}

fn get_bool_option(row: &Row<'_>, col: &str) -> Result<Option<bool>, rusqlite::Error> {
    Ok(match row.get::<_, rusqlite::types::Value>(col)? {
        rusqlite::types::Value::Integer(1) => Some(true),
        rusqlite::types::Value::Integer(0) => Some(false),
        rusqlite::types::Value::Text(s) if s == "1" => Some(true),
        rusqlite::types::Value::Text(s) if s == "0" => Some(false),
        _ => None,
    })
}

fn get_string_option(row: &Row<'_>, col: &str) -> Result<Option<String>, rusqlite::Error> {
    Ok(match row.get::<_, rusqlite::types::Value>(col)? {
        rusqlite::types::Value::Text(s) if s != "NULL" => Some(s),
        _ => None,
    })
}

impl TryFrom<&Row<'_>> for Song {
    type Error = rusqlite::Error;

    fn try_from(row: &Row<'_>) -> Result<Self, Self::Error> {
        fn parse_json(s: &str) -> Value {
            from_str(s).unwrap_or(Value::Null)
        }

        fn get_json(row: &Row<'_>, col: &str) -> Result<Value, rusqlite::Error> {
            let s: Option<String> = row.get(col)?;
            Ok(s.as_deref()
                .filter(|s| !s.is_empty() && *s != "NULL")
                .map(parse_json)
                .unwrap_or(Value::Null))
        }

        let date_str: String = row.get(SongIden::UpdatedAt.as_str())?;
        let updated_at = NaiveDate::parse_from_str(&date_str, "%Y-%m-%d")
            .map_err(|e| rusqlite::Error::FromSqlConversionFailure(0, Type::Text, Box::new(e)))?;

        Ok(Self {
            song_id: row.get(SongIden::SongId.as_str())?,
            available: get_bool(row, SongIden::Available.as_str())?,
            hidden: get_bool_option(row, SongIden::Hidden.as_str())?,
            folder: row.get(SongIden::Folder.as_str())?,
            art: row.get(SongIden::Art.as_str())?,
            artist: row.get(SongIden::Artist.as_str())?,
            lyricist: row.get(SongIden::Lyricist.as_str())?,
            title: row.get(SongIden::Title.as_str())?,
            subtitle: get_string_option(row, SongIden::Subtitle.as_str())?,
            album: get_json(row, SongIden::Album.as_str())?,
            versions: get_json(row, SongIden::Versions.as_str())?,
            is_duet: get_bool(row, SongIden::IsDuet.as_str())?,
            furigana: get_bool_option(row, SongIden::Furigana.as_str())?,
            translation: get_json(row, SongIden::Translation.as_str())?,
            updated_at,
            lang: row.get(SongIden::Lang.as_str())?,
            credits: get_json(row, SongIden::Credits.as_str())?,
        })
    }
}

impl Song {
    /// 列表用：只取摘要欄位，附帶簽名
    pub fn list() -> Result<Vec<Value>, ServerError> {
        let conn = get_connection()?;

        let (query, values) =
            Song::select_all_columns(&mut Query::select()).build_rusqlite(SqliteQueryBuilder);

        let mut stmt = conn.prepare(&query)?;
        let songs = stmt
            .query_and_then(&*values.as_params(), |row| Song::try_from(row))?
            .collect::<Result<Vec<_>, _>>()?;

        Ok(songs.into_iter().map(|s| s.to_list_json()).collect())
    }

    /// 單首：取全部欄位，附帶簽名
    pub fn find_by_id(song_id: i64) -> Result<Option<Self>, ServerError> {
        let conn = get_connection()?;
        let tran = conn.unchecked_transaction()?;

        let (query, values) = Song::select_all_columns(&mut Query::select())
            .and_where(Expr::col(SongIden::SongId).eq(song_id))
            .build_rusqlite(SqliteQueryBuilder);

        let mut stmt = tran.prepare(&query)?;
        let song = stmt
            .query_and_then(&*values.as_params(), |row| Song::try_from(row))?
            .next();

        Ok(song.transpose()?)
    }

    /// 新增：傳入 Song 結構，寫入資料庫
    pub fn insert(&self, tran: &Transaction) -> Result<(), ServerError> {
        let (query, values) = Query::insert()
            .into_table(SongIden::Table)
            .columns([
                SongIden::SongId,
                SongIden::Available,
                SongIden::Hidden,
                SongIden::Folder,
                SongIden::Art,
                SongIden::Artist,
                SongIden::Lyricist,
                SongIden::Title,
                SongIden::Subtitle,
                SongIden::Album,
                SongIden::Versions,
                SongIden::IsDuet,
                SongIden::Furigana,
                SongIden::Translation,
                SongIden::UpdatedAt,
                SongIden::Lang,
                SongIden::Credits,
            ])
            .values([
                self.song_id.into(),
                (self.available as i64).into(),
                self.hidden.map(|b| b as i64).into(),
                self.folder.clone().into(),
                self.art.clone().into(),
                self.artist.clone().into(),
                self.lyricist.clone().into(),
                self.title.clone().into(),
                self.subtitle.clone().into(),
                to_string(&self.album).unwrap_or_default().into(),
                to_string(&self.versions).unwrap_or_default().into(),
                (self.is_duet as i64).into(),
                self.furigana.map(|b| b as i64).into(),
                to_string(&self.translation).unwrap_or_default().into(),
                self.updated_at.format("%Y-%m-%d").to_string().into(),
                self.lang.clone().into(),
                to_string(&self.credits).unwrap_or_default().into(),
            ])?
            .build_rusqlite(SqliteQueryBuilder);

        tran.execute(&query, &*values.as_params())?;
        Ok(())
    }

    pub fn update(&self, tran: &Transaction) -> Result<usize, ServerError> {
        let (query, values) = Query::update()
            .table(SongIden::Table)
            .values([
                (SongIden::Available, (self.available as i64).into()),
                (SongIden::Hidden, self.hidden.map(|b| b as i64).into()),
                (SongIden::Folder, self.folder.clone().into()),
                (SongIden::Art, self.art.clone().into()),
                (SongIden::Artist, self.artist.clone().into()),
                (SongIden::Lyricist, self.lyricist.clone().into()),
                (SongIden::Title, self.title.clone().into()),
                (SongIden::Subtitle, self.subtitle.clone().into()),
                (
                    SongIden::Album,
                    to_string(&self.album).unwrap_or_default().into(),
                ),
                (
                    SongIden::Versions,
                    to_string(&self.versions).unwrap_or_default().into(),
                ),
                (SongIden::IsDuet, (self.is_duet as i64).into()),
                (SongIden::Furigana, self.furigana.map(|b| b as i64).into()),
                (
                    SongIden::Translation,
                    to_string(&self.translation).unwrap_or_default().into(),
                ),
                (
                    SongIden::UpdatedAt,
                    self.updated_at.format("%Y-%m-%d").to_string().into(),
                ),
                (SongIden::Lang, self.lang.clone().into()),
                (
                    SongIden::Credits,
                    to_string(&self.credits).unwrap_or_default().into(),
                ),
            ])
            .and_where(Expr::col(SongIden::SongId).eq(self.song_id))
            .build_rusqlite(SqliteQueryBuilder);

        let affected = tran.execute(&query, &*values.as_params())?;
        Ok(affected)
    }

    // 調出所有欄位
    pub fn select_all_columns(
        query: &mut sea_query::SelectStatement,
    ) -> &mut sea_query::SelectStatement {
        query
            .columns([
                SongIden::SongId,
                SongIden::Available,
                SongIden::Hidden,
                SongIden::Folder,
                SongIden::Art,
                SongIden::Artist,
                SongIden::Lyricist,
                SongIden::Title,
                SongIden::Subtitle,
                SongIden::Album,
                SongIden::Versions,
                SongIden::IsDuet,
                SongIden::Furigana,
                SongIden::Translation,
                SongIden::UpdatedAt,
                SongIden::Lang,
                SongIden::Credits,
            ])
            .from(SongIden::Table)
    }

    /// 序列化為列表摘要 JSON（附簽名）
    pub fn to_list_json(&self) -> Value {
        let signature = generate_signature(self.song_id as i32, self.available);
        serde_json::json!({
            "song_id": self.song_id,
            "available": self.available,
            "hidden": self.hidden,
            "title": self.title,
            "art": self.art,
            "album": self.album,
            "artist": self.artist,
            "updated_at": self.updated_at.format("%Y-%m-%d").to_string(),
            "lang": self.lang,
            "signature": signature,
        })
    }

    /// 序列化為完整 JSON（附簽名）
    pub fn to_full_json(&self) -> Value {
        let signature = generate_signature(self.song_id as i32, self.available);
        let mut val = serde_json::to_value(self).unwrap_or(Value::Null);
        if let Some(obj) = val.as_object_mut() {
            obj.insert("signature".into(), Value::String(signature));
            // updated_at 序列化為字串
            obj.insert(
                "updated_at".into(),
                Value::String(self.updated_at.format("%Y-%m-%d").to_string()),
            );
        }
        val
    }
}
