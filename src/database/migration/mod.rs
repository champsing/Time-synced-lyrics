use crate::error::ServerError;

const VERSION: u32 = 4;

pub fn run_migration(transaction: &rusqlite::Transaction) -> Result<(), ServerError> {
    let mut version =
        transaction.query_row("PRAGMA user_version;", (), |row| row.get::<_, u32>(0))?;

    if version == VERSION {
        log::info!("version is up to date, skip database migration.");
        return Ok(());
    }

    macro_rules! migrate {
        ($id:tt, $file:tt) => {
            if version + 1 == $id {
                log::info!(
                    "migrate database from version {} to version {}",
                    version,
                    version + 1
                );
                transaction.execute_batch(include_str!($file))?;
                version += 1;
            }
        };
    }

    migrate!(1, "001_create_songs_table.sql");
    migrate!(2, "002_fix_translation_field.sql");
    migrate!(3, "003_drop_id_column.sql");
    migrate!(4, "004_create_artists_table.sql");

    if version != VERSION {
        Err(format!(
            "fail to migrate database from version {} to version {}",
            version, VERSION
        )
        .into())
    } else {
        // PRAGMA does not support value binding
        transaction.execute(format!("PRAGMA user_version = {};", version).as_str(), ())?;
        Ok(())
    }
}
