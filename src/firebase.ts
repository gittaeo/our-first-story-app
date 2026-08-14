import { initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { connectFunctionsEmulator, getFunctions, httpsCallable } from "firebase/functions";

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseEnabled =
  import.meta.env.VITE_USE_MOCK !== "true" && Boolean(config.apiKey);

const app = firebaseEnabled ? initializeApp(config) : null;
export const auth = app ? getAuth(app) : null;
const functions = app ? getFunctions(app) : null;

if (functions && import.meta.env.VITE_USE_EMULATORS === "true") {
  connectFunctionsEmulator(functions, "127.0.0.1", 5001);
}

export function observeAuth(callback: (user: User | null) => void) {
  if (!auth) {
    callback(null);
    return () => undefined;
  }
  return onAuthStateChanged(auth, callback);
}

export async function registerWithEmail(email: string, password: string) {
  if (!auth) throw new Error("Firebase 설정이 필요합니다.");
  return (await createUserWithEmailAndPassword(auth, email, password)).user;
}

export async function loginWithEmail(email: string, password: string) {
  if (!auth) throw new Error("Firebase 설정이 필요합니다.");
  return (await signInWithEmailAndPassword(auth, email, password)).user;
}

export async function logout() {
  if (auth) await signOut(auth);
}

async function call<TInput, TOutput>(name: string, input: TInput) {
  if (!functions) throw new Error("Firebase Functions 설정이 필요합니다.");
  const callable = httpsCallable<TInput, TOutput>(functions, name);
  return (await callable(input)).data;
}

export const createWorkspaceRemote = (input: {
  babyName: string;
  stage: "pregnant" | "born";
  date: string;
  displayName: string;
}) => call<typeof input, { workspaceId: string }>("createWorkspace", input);

export const createInviteRemote = (workspaceId: string) =>
  call<{ workspaceId: string }, { token: string; pin: string; expiresAt: string }>(
    "createInvite",
    { workspaceId },
  );

export const joinWorkspaceRemote = (input: {
  token: string;
  pin: string;
  displayName: string;
}) => call<typeof input, { workspaceId: string }>("joinWorkspace", input);
