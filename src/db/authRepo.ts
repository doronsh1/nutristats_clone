import {
  getFirebaseSessionUser,
  isFirebaseConfigured,
  resetFirebasePassword,
  signInWithFirebase,
  signOutFromFirebase,
  signUpWithFirebase,
  subscribeToFirebaseSession,
} from '../services/firebase';

function mapAuthError(error: unknown) {
  if (!(error instanceof Error)) {
    return 'Authentication failed.';
  }

  if (error.message.includes('auth/invalid-credential')) {
    return 'Incorrect email or password.';
  }
  if (error.message.includes('auth/email-already-in-use')) {
    return 'That email is already in use.';
  }
  if (error.message.includes('auth/weak-password')) {
    return 'Use a stronger password.';
  }
  if (error.message.includes('auth/invalid-email')) {
    return 'Enter a valid email address.';
  }
  if (error.message.includes('auth/too-many-requests')) {
    return 'Too many attempts. Try again later.';
  }

  return error.message;
}

export function isAuthConfigured() {
  return isFirebaseConfigured();
}

export async function getSession() {
  if (!isAuthConfigured()) {
    return null;
  }

  const user = await getFirebaseSessionUser();
  return user?.email ?? null;
}

export async function subscribeToSession(listener: (email: string | null) => void) {
  if (!isAuthConfigured()) {
    listener(null);
    return () => {};
  }

  return subscribeToFirebaseSession((user) => {
    listener(user?.email ?? null);
  });
}

export async function login(email: string, password: string) {
  try {
    const user = await signInWithFirebase(email, password);
    return { email: user.email ?? null, error: null };
  } catch (error) {
    return { email: null, error: mapAuthError(error) };
  }
}

export async function createAccount(email: string, password: string) {
  try {
    const user = await signUpWithFirebase(email, password);
    return { email: user.email ?? null, error: null };
  } catch (error) {
    return { email: null, error: mapAuthError(error) };
  }
}

export async function requestPasswordReset(email: string) {
  try {
    await resetFirebasePassword(email);
    return { error: null };
  } catch (error) {
    return { error: mapAuthError(error) };
  }
}

export async function logout() {
  if (!isAuthConfigured()) {
    return;
  }

  await signOutFromFirebase();
}
