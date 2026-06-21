"use client";

import { getAdminSession } from "@/lib/session";
import { useIsClient } from "./useIsClient";

export function useAdminSession() {
  const isClient = useIsClient();
  return isClient ? getAdminSession() : null;
}
