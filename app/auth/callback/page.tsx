"use client";

// NOTE: This page is shadowed by app/auth/callback/route.ts which handles all
// GET requests to /auth/callback (PKCE code exchange, error passthrough, and
// redirect to /auth/hash-callback for implicit/hash flows).
// This file is kept only as a safety fallback — it should never be rendered
// in normal operation.

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthCallbackPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/login?error=link_expired");
  }, [router]);
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
      <div className="w-8 h-8 rounded-full border-2 border-[#F59E0B] border-t-transparent animate-spin" />
    </div>
  );
}
