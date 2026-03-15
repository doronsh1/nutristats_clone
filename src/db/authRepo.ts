import { DEMO_EMAIL, DEMO_PASSWORD } from '../constants/auth';
import { getMeta, removeMeta, setMeta } from './metaRepo';

const SESSION_KEY = 'session_email';

export async function getSession() {
  return getMeta<string>(SESSION_KEY);
}

export async function login(email: string, password: string) {
  if (email.trim().toLowerCase() !== DEMO_EMAIL || password !== DEMO_PASSWORD) {
    return null;
  }

  await setMeta(SESSION_KEY, DEMO_EMAIL);
  return DEMO_EMAIL;
}

export async function logout() {
  await removeMeta(SESSION_KEY);
}
