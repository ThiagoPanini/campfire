import { env } from "../../lib/env";

export const authConfig = {
  authority: env.authAuthority,
  userPoolId: env.authUserPoolId,
  clientId: env.authClientId,
  redirectUri: env.authRedirectUri,
  postLogoutRedirectUri: env.authPostLogoutRedirectUri,
  scope: env.authScope,
  responseType: env.authResponseType,
};
