import { Platform } from 'react-native';
import { execute } from './index';
import { getWebMeta, removeWebMeta, setWebMeta } from './webStore';

export async function getMeta<T = string>(key: string): Promise<T | null> {
  if (Platform.OS === 'web') {
    return getWebMeta<T>(key);
  }

  const rows = (await execute('SELECT value FROM app_meta WHERE key = ? LIMIT 1;', [key])) as Array<{ value: string }>;
  if (!rows[0]) {
    return null;
  }
  return JSON.parse(rows[0].value) as T;
}

export async function setMeta<T>(key: string, value: T) {
  if (Platform.OS === 'web') {
    setWebMeta(key, value);
    return;
  }

  await execute(
    `INSERT INTO app_meta (key, value)
     VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value;`,
    [key, JSON.stringify(value)]
  );
}

export async function removeMeta(key: string) {
  if (Platform.OS === 'web') {
    removeWebMeta(key);
    return;
  }

  await execute('DELETE FROM app_meta WHERE key = ?;', [key]);
}
