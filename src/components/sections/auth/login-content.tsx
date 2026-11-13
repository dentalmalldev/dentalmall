"use client";

import { useEffect, useRef } from "react";
import { Box } from "@mui/material";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers";
import AuthPanel from "./auth-panel";

export function LoginContent({
  nextPath,
  initialTab = "authorization",
}: {
  nextPath: string;
  initialTab?: "authorization" | "register";
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const target = `/${locale}${nextPath}`;
  const initialCheckDone = useRef(false);

  // Already signed in when the page opened: nothing to do here. This runs once on
  // purpose. Sign-ins made on this page go through onSuccess, because Firebase
  // reports the new user before registration has saved the database row.
  useEffect(() => {
    if (loading || initialCheckDone.current) return;
    initialCheckDone.current = true;
    if (user) router.replace(target);
  }, [loading, router, target, user]);

  return (
    <Box sx={{ maxWidth: "540px", mx: "auto", pt: { xs: 2, md: 5 }, pb: { xs: "100px", md: 5 } }}>
      <AuthPanel initialTab={initialTab} onSuccess={() => router.replace(target)} />
    </Box>
  );
}
