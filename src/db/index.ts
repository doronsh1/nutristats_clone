import * as SQLite from 'expo-sqlite';

export type SqlParams = SQLite.SQLiteBindParams;

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function getDb() {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync('nutristat_clone.db');
  }
  return dbPromise;
}

function isQuery(sql: string) {
  const keyword = sql.trim().split(/\s+/)[0]?.toUpperCase();
  return keyword === 'SELECT' || keyword === 'WITH' || keyword === 'PRAGMA';
}

export async function execute(sql: string, params: SqlParams = []) {
  const db = await getDb();

  if (isQuery(sql)) {
    return db.getAllAsync(sql, params);
  }

  return db.runAsync(sql, params);
}

export async function executeBatch(statements: Array<{ sql: string; params?: SqlParams }>) {
  const db = await getDb();
  await db.execAsync('BEGIN');

  try {
    for (const statement of statements) {
      if (isQuery(statement.sql)) {
        await db.getAllAsync(statement.sql, statement.params ?? []);
      } else {
        await db.runAsync(statement.sql, statement.params ?? []);
      }
    }
    await db.execAsync('COMMIT');
  } catch (error) {
    await db.execAsync('ROLLBACK');
    throw error;
  }
}
