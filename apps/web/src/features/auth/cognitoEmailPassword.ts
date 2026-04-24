import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserAttribute,
  CognitoUserPool,
  type ISignUpResult,
} from "amazon-cognito-identity-js";

import { authConfig } from "./config";
import { persistSessionFromTokens } from "./session";

function userPool(): CognitoUserPool {
  return new CognitoUserPool({
    UserPoolId: authConfig.userPoolId,
    ClientId: authConfig.clientId,
  });
}

function cognitoUser(email: string): CognitoUser {
  return new CognitoUser({
    Username: email.trim().toLowerCase(),
    Pool: userPool(),
  });
}

export function mapAuthError(error: unknown): string {
  const name = typeof error === "object" && error && "name" in error ? String(error.name) : "";
  if (name === "NotAuthorizedException") return "The email or password was not accepted.";
  if (name === "UserNotConfirmedException") return "Please verify your email before signing in.";
  if (name === "UsernameExistsException") return "An account already exists for that email.";
  if (name === "CodeMismatchException") return "That verification code was not accepted.";
  if (name === "ExpiredCodeException") return "That code has expired. Request a new one and try again.";
  return error instanceof Error ? error.message : "Authentication failed. Please try again.";
}

export async function signUpWithEmail(email: string, password: string): Promise<ISignUpResult> {
  return new Promise((resolve, reject) => {
    userPool().signUp(
      email.trim().toLowerCase(),
      password,
      [new CognitoUserAttribute({ Name: "email", Value: email.trim().toLowerCase() })],
      [],
      (error, result) => {
        if (error || !result) reject(error ?? new Error("Sign-up did not return a result."));
        else resolve(result);
      },
    );
  });
}

export async function confirmEmail(email: string, code: string): Promise<void> {
  return new Promise((resolve, reject) => {
    cognitoUser(email).confirmRegistration(code.trim(), true, (error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

export async function signInWithEmail(email: string, password: string): Promise<void> {
  const user = cognitoUser(email);
  const authDetails = new AuthenticationDetails({
    Username: email.trim().toLowerCase(),
    Password: password,
  });

  return new Promise((resolve, reject) => {
    user.authenticateUser(authDetails, {
      onSuccess: (session) => {
        persistSessionFromTokens({
          accessToken: session.getAccessToken().getJwtToken(),
          idToken: session.getIdToken().getJwtToken(),
          expiresAt: session.getAccessToken().getExpiration() * 1000,
        });
        resolve();
      },
      onFailure: reject,
      newPasswordRequired: () => reject(new Error("Please complete password setup before signing in.")),
    });
  });
}

export async function requestPasswordReset(email: string): Promise<void> {
  return new Promise((resolve, reject) => {
    cognitoUser(email).forgotPassword({
      onSuccess: () => resolve(),
      onFailure: reject,
      inputVerificationCode: () => resolve(),
    });
  });
}

export async function confirmPasswordReset(
  email: string,
  code: string,
  newPassword: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    cognitoUser(email).confirmPassword(code.trim(), newPassword, {
      onSuccess: () => resolve(),
      onFailure: reject,
    });
  });
}
