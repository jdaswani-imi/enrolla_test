"use client";

import { useState, type FormEvent, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { useRole } from "@/lib/role-context";
import { type Role } from "@/lib/role-config";
import { currentUser } from "@/lib/mock-data";

export default function LoginPage() {
  const router = useRouter();
  const { setRole } = useRole();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function handleSignIn(e?: FormEvent) {
    e?.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    // Reset to default role so prior demo role-switching doesn't persist across sign-ins
    setRole(currentUser.role as Role);
    router.push("/dashboard");
  }

  function handlePasswordKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      handleSignIn();
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-white">
      {/* Mobile-only top bar (collapses left panel) */}
      <div className="md:hidden h-12 w-full flex items-center px-5 bg-[#0F172A] border-b-4 border-[#F59E0B]">
        <span className="text-white font-bold text-lg tracking-tight">Enrolla</span>
      </div>

      {/* LEFT PANEL — desktop only */}
      <div className="hidden md:flex relative w-1/2 bg-[#0F172A] text-white overflow-hidden">
        {/* Subtle dot pattern background */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />
        {/* Soft amber glow */}
        <div
          aria-hidden
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(245,158,11,0.18) 0%, rgba(245,158,11,0) 70%)",
          }}
        />
        <div
          aria-hidden
          className="absolute -bottom-40 -right-20 w-[28rem] h-[28rem] rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(245,158,11,0.10) 0%, rgba(245,158,11,0) 70%)",
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 lg:p-16 w-full">
          <div className="flex items-center gap-2">
            <span className="text-white font-bold text-2xl tracking-tight">
              Enrolla
            </span>
          </div>

          <div className="max-w-lg">
            <h1 className="text-4xl lg:text-5xl font-bold leading-[1.15] tracking-tight text-white">
              The operating system for modern education centres.
            </h1>
            <p className="mt-5 text-base lg:text-lg text-slate-300 leading-relaxed">
              Improve ME Institute · Gold &amp; Diamond Park, Dubai
            </p>
          </div>

          <p className="text-xs text-slate-400 tracking-wide">
            Powered by Enrolla · v1.0
          </p>
        </div>

        {/* Amber accent bar on far right edge */}
        <div className="absolute top-0 right-0 h-full w-1 bg-[#F59E0B]" />
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 md:py-0">
        <div className="w-full max-w-[400px] mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-[#0F172A] tracking-tight">
              Welcome back
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Sign in to your Enrolla workspace
            </p>
          </div>

          <form onSubmit={handleSignIn} className="space-y-5">
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-sm font-medium text-[#0F172A]"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@improveme.ae"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={cn(
                  "h-11 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-sm text-[#0F172A] placeholder:text-slate-400",
                  "transition-colors outline-none",
                  "focus:border-[#F59E0B] focus:ring-4 focus:ring-[#F59E0B]/20"
                )}
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="text-sm font-medium text-[#0F172A]"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handlePasswordKeyDown}
                  className={cn(
                    "h-11 w-full rounded-lg border border-slate-200 bg-white pl-3.5 pr-11 text-sm text-[#0F172A] placeholder:text-slate-400",
                    "transition-colors outline-none",
                    "focus:border-[#F59E0B] focus:ring-4 focus:ring-[#F59E0B]/20"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className={cn(
                    "absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center h-7 w-7 rounded-md text-slate-500",
                    "hover:text-[#0F172A] hover:bg-slate-100 transition-colors cursor-pointer",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]/40"
                  )}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className={cn(
                "w-full h-11 rounded-lg bg-[#F59E0B] text-white font-semibold text-sm cursor-pointer",
                "transition-all duration-200 hover:bg-[#D97706] active:translate-y-px",
                "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F59E0B]/30",
                "disabled:opacity-60 disabled:cursor-not-allowed"
              )}
            >
              Sign in
            </button>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => toast.success("Password reset email sent.")}
                className="text-xs text-slate-500 hover:text-[#0F172A] transition-colors cursor-pointer"
              >
                Forgot password?
              </button>
            </div>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs text-slate-400 uppercase tracking-wider">
              or continue with
            </span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <button
            type="button"
            onClick={() => toast("SSO coming soon")}
            className={cn(
              "w-full h-11 rounded-lg border border-slate-200 bg-white text-sm font-medium text-[#0F172A] cursor-pointer",
              "inline-flex items-center justify-center gap-2.5",
              "transition-colors hover:bg-slate-50",
              "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F59E0B]/20"
            )}
          >
            <GoogleIcon className="h-4 w-4" />
            Sign in with Google
          </button>

          <p className="mt-8 text-center text-xs text-slate-400">
            Having trouble? Contact{" "}
            <a
              href="mailto:support@enrolla.app"
              className="text-slate-500 hover:text-[#0F172A] transition-colors"
            >
              support@enrolla.app
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.99.66-2.25 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.11A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.95l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.65l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}
