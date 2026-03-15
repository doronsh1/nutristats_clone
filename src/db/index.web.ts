export type SqlParams = Array<string | number | null>;

export async function execute() {
  throw new Error('SQLite execute should not be called in web builds.');
}

export async function executeBatch() {
  throw new Error('SQLite executeBatch should not be called in web builds.');
}
