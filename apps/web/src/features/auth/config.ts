import { env } from "../../lib/env";

export const authConfig = {
  authority: env.authAuthority,
  clientId: env.authClientId,
  redirectUri: env.authRedirectUri,
  postLogoutRedirectUri: env.authPostLogoutRedirectUri,
  scope: env.authScope,
  responseType: env.authResponseType,
};
