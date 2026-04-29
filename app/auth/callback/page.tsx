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

    // Supabase appends error params to the redirect_to URL when PKCE verify fails
    const queryError = searchParams.get("error");
    const queryErrorCode = searchParams.get("error_code");

    if (code) {
      // PKCE flow — server exchanges code for session via cookie
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        router.replace(error ? "/login?error=link_expired" : next);
      });
    } else if (queryError || queryErrorCode) {
      // Supabase redirected here with an error in the query string (e.g. token
      // already used, expired link). Show a clear message on the login page.
      router.replace("/login?error=link_expired");
    } else {
      // Implicit flow — tokens arrive in the URL hash.
      // Must use setSession() explicitly so it OVERWRITES any existing session
      // (e.g. an admin who sent the invite may still be logged in).
      const params = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      const hashError = params.get("error_code") ?? params.get("error");

      if (hashError || !accessToken || !refreshToken) {
        router.replace("/login?error=link_expired");
        return;
      }

      // Recovery links always land on /reset-password regardless of next param
      const destination =
        params.get("type") === "recovery" ? "/reset-password" : next;

      supabase.auth
        .setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(({ error }) => {
          router.replace(error ? "/login?error=link_expired" : destination);
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
