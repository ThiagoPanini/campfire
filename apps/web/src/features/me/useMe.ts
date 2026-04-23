import { useQuery } from "@tanstack/react-query";

import { BootstrapIdentityResponse } from "../../lib/api-types";
import { apiRequest } from "../../lib/http";
import { getSession } from "../auth/session";

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: async (): Promise<BootstrapIdentityResponse> => {
      const session = getSession();

      return apiRequest<BootstrapIdentityResponse>("/me", {
        accessToken: session?.accessToken ?? null,
      });
    },
    retry: false,
  });
}
