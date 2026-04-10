import {
  getFirebaseSessionUser,
  isFirebaseConfigured,
  resetFirebasePassword,
  signInWithFirebase,
  signOutFromFirebase,
  signUpWithFirebase,
  subscribeToFirebaseSession,
} from '../services/firebase';

const TEST_BYPASS_PATHS = new Set([
  '/aa16fc25-5e07-476f-a8f5-7069cdbaca19',
  '/a16fc25-5e07-476f-a8f5-7069cdbaca19',
]);

// TEST_BYPASS_EMAIL and TEST_BYPASS_NAME are used to create a fake session for testing purposes when authentication is not configured. This allows developers to test the application without needing to set up Firebase authentication, while still simulating a logged-in user experience on specific paths and hosts.
const TEST_BYPASS_EMAIL = 'test@test.com';
const TEST_BYPASS_NAME = 'TestUser1';
const TEST_PASSWORD = 'testpassword123';
const TEST_BYPASS_HOSTS = new Set(['nutristats-clone.doron-sh.workers.dev', 'localhost', '127.0.0.1']);

export function getTestingBypassSession() {
  if (typeof window === 'undefined') {
    return null;
  }

  const normalizedPath = window.location.pathname.replace(/\/+$/, '') || '/';
  if (!TEST_BYPASS_HOSTS.has(window.location.hostname) || !TEST_BYPASS_PATHS.has(normalizedPath)) {
    return null;
  }

  return {
    email: TEST_BYPASS_EMAIL,
    name: TEST_BYPASS_NAME,
    path: normalizedPath,
  };
}

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
  const bypassSession = getTestingBypassSession();
  if (!isAuthConfigured()) {
    return bypassSession?.email ?? null;
  }

  const user = await getFirebaseSessionUser();
  return user?.email ?? bypassSession?.email ?? null;
}

export async function subscribeToSession(listener: (email: string | null) => void) {
  const bypassSession = getTestingBypassSession();
  if (!isAuthConfigured()) {
    listener(bypassSession?.email ?? null);
    return () => {};
  }

  return subscribeToFirebaseSession((user) => {
    listener(user?.email ?? bypassSession?.email ?? null);
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
