'use client';

import { useEffect } from "react";
import apiClient from "@/lib/api/apiClient";

interface ApiAuthInitializerProps {
  token?: string | null;
}

export function ApiAuthInitializer({ token }: ApiAuthInitializerProps) {
  useEffect(() => {
    if (!token) {
      return;
    }
    apiClient.defaults.headers.common[
      "Authorization"
    ] = `Bearer ${token}`;
  }, [token]);

  return null;
}
