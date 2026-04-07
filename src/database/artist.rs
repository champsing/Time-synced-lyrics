use crate::{database::get_connection, error::ServerError};
use chrono::NaiveDate;
use rusqlite::{Row, Transaction, types::Type};
use sea_query::{Expr, IdenStatic, Query, SqliteQueryBuilder, enum_def};
use sea_query_rusqlite::RusqliteBinder;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[enum_def]
pub struct Artist {
    pub artist_id: i64,
    pub romaji_name: String,
    pub original_name: String,
    pub created_at: NaiveDate,
}

impl TryFrom<&Row<'_>> for Artist {
    type Error = rusqlite::Error;

    fn try_from(row: &Row<'_>) -> Result<Self, Self::Error> {
        let date_str: String = row.get(ArtistIden::CreatedAt.as_str())?;
        let created_at = NaiveDate::parse_from_str(&date_str, "%Y-%m-%d")
            .map_err(|e| rusqlite::Error::FromSqlConversionFailure(0, Type::Text, Box::new(e)))?;

        Ok(Self {
            artist_id: row.get(ArtistIden::ArtistId.as_str())?,
            romaji_name: row.get(ArtistIden::RomajiName.as_str())?,
            original_name: row.get(ArtistIden::OriginalName.as_str())?,
            created_at,
        })
    }
}

impl Artist {
    pub fn all() -> Result<Vec<Self>, ServerError> {
        let conn = get_connection()?;

        let (query, values) = Query::select()
            .columns([
                ArtistIden::ArtistId,
                ArtistIden::RomajiName,
                ArtistIden::OriginalName,
                ArtistIden::CreatedAt,
            ])
            .from(ArtistIden::Table)
            .build_rusqlite(SqliteQueryBuilder);

        let mut stmt = conn.prepare(&query)?;
        let artists = stmt
            .query_and_then(&*values.as_params(), |row| Artist::try_from(row))?
            .collect::<Result<Vec<_>, _>>()?;

        drop(stmt);
        Ok(artists)
    }

    pub fn find_by_ids(ids: Vec<i64>) -> Result<Vec<Self>, ServerError> {
        if ids.is_empty() {
            return Ok(vec![]);
        }

        let conn = get_connection()?;

        let (query, values) = Query::select()
            .columns([
                ArtistIden::ArtistId,
                ArtistIden::RomajiName,
                ArtistIden::OriginalName,
                ArtistIden::CreatedAt,
            ])
            .from(ArtistIden::Table)
            .and_where(Expr::col(ArtistIden::ArtistId).is_in(ids))
            .build_rusqlite(SqliteQueryBuilder);

        let mut stmt = conn.prepare(&query)?;

        let artists = stmt
            .query_and_then(&*values.as_params(), |row| Artist::try_from(row))?
            .collect::<Result<Vec<_>, _>>()?;

        drop(stmt);

        Ok(artists)
    }

    pub fn insert(&self, tran: &Transaction) -> Result<(), ServerError> {
        let (query, values) = Query::insert()
            .into_table(ArtistIden::Table)
            .columns([
                ArtistIden::ArtistId,
                ArtistIden::RomajiName,
                ArtistIden::OriginalName,
                ArtistIden::CreatedAt,
            ])
            .values([
                self.artist_id.into(),
                self.romaji_name.clone().into(),
                self.original_name.clone().into(),
                self.created_at.format("%Y-%m-%d").to_string().into(),
            ])?
            .build_rusqlite(SqliteQueryBuilder);

        tran.execute(&query, &*values.as_params())?;
        Ok(())
    }

    pub fn update(&self, tran: &Transaction) -> Result<usize, ServerError> {
        let (query, values) = Query::update()
            .table(ArtistIden::Table)
            .values([
                (ArtistIden::RomajiName, self.romaji_name.clone().into()),
                (ArtistIden::OriginalName, self.original_name.clone().into()),
            ])
            .and_where(Expr::col(ArtistIden::ArtistId).eq(self.artist_id))
            .build_rusqlite(SqliteQueryBuilder);

        let affected = tran.execute(&query, &*values.as_params())?;
        Ok(affected)
    }

    pub fn delete(&self, tran: &Transaction) -> Result<usize, ServerError> {
        let (query, values) = Query::delete()
            .from_table(ArtistIden::Table)
            .and_where(Expr::col(ArtistIden::ArtistId).eq(self.artist_id))
            .build_rusqlite(SqliteQueryBuilder);

        let affected = tran.execute(&query, &*values.as_params())?;
        Ok(affected)
    }
}
