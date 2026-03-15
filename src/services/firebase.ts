import { initializeApp, getApp, getApps } from 'firebase/app';
import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const requiredKeys = Object.entries(firebaseConfig);

let persistenceReady: Promise<void> | null = null;

export function isFirebaseConfigured() {
  return requiredKeys.every(([, value]) => Boolean(value));
}

export function getMissingFirebaseKeys() {
  return requiredKeys.filter(([, value]) => !value).map(([key]) => key);
}

function getFirebaseApp() {
  if (!isFirebaseConfigured()) {
    throw new Error(`Missing Firebase config: ${getMissingFirebaseKeys().join(', ')}`);
  }

  return getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
}

export async function getFirebaseAuth() {
  const auth = getAuth(getFirebaseApp());

  if (!persistenceReady) {
    persistenceReady = setPersistence(auth, browserLocalPersistence).catch(() => {});
  }

  await persistenceReady;
  return auth;
}

export async function signInWithFirebase(email: string, password: string) {
  const auth = await getFirebaseAuth();
  const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
  return credential.user;
}

export async function signUpWithFirebase(email: string, password: string) {
  const auth = await getFirebaseAuth();
  const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
  return credential.user;
}

export async function resetFirebasePassword(email: string) {
  const auth = await getFirebaseAuth();
  await sendPasswordResetEmail(auth, email.trim());
}

export async function signOutFromFirebase() {
  const auth = await getFirebaseAuth();
  await signOut(auth);
}

export async function getFirebaseSessionUser() {
  const auth = await getFirebaseAuth();
  return auth.currentUser;
}

export async function subscribeToFirebaseSession(listener: (user: User | null) => void) {
  const auth = await getFirebaseAuth();
  return onAuthStateChanged(auth, listener);
}
