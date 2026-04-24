import { useQuery } from "@tanstack/react-query";

import { BootstrapIdentityResponse } from "../../lib/api-types";
import { apiRequest, HttpError } from "../../lib/http";
import { getSession, signOut } from "../auth/session";

export function useMe(enabled = true) {
  return useQuery({
    queryKey: ["me"],
    queryFn: async (): Promise<BootstrapIdentityResponse> => {
      const session = getSession();

      try {
        return await apiRequest<BootstrapIdentityResponse>("/me", {
          accessToken: session?.accessToken ?? null,
        });
      } catch (error) {
        if (error instanceof HttpError && error.status === 401) {
          await signOut();
        }
        throw error;
      }
    },
    enabled,
    retry: false,
  });
}
