import { beginGoogleSignIn, completeRedirectSignIn, signOut } from "./session";

export async function signInWithGoogle(): Promise<void> {
  await beginGoogleSignIn();
}

export async function completeRedirect(): Promise<void> {
  await completeRedirectSignIn();
}

export async function signOutOfCognito(): Promise<void> {
  await signOut();
}
