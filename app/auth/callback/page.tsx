"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
      <div className="w-8 h-8 rounded-full border-2 border-[#F59E0B] border-t-transparent animate-spin" />
    </div>
  );
}

function AuthCallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";

  useEffect(() => {
    const supabase = createClient();
    const code = searchParams.get("code");

    if (code) {
      // PKCE flow — server exchanges code for session via cookie
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        router.replace(error ? "/login?error=auth_callback_error" : next);
      });
    } else {
      // Implicit flow — tokens arrive in the URL hash.
      // Must use setSession() explicitly so it OVERWRITES any existing session
      // (e.g. an admin who sent the invite may still be logged in).
      const params = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      const errorCode = params.get("error_code");

      if (errorCode || !accessToken || !refreshToken) {
        router.replace("/login?error=auth_callback_error");
        return;
      }

      // Recovery links always land on /reset-password regardless of next param
      const destination =
        params.get("type") === "recovery" ? "/reset-password" : next;

      supabase.auth
        .setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(({ error }) => {
          router.replace(error ? "/login?error=auth_callback_error" : destination);
        });
    }
  }, [next, router, searchParams]);

  return <Spinner />;
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <AuthCallbackHandler />
    </Suspense>
  );
}
