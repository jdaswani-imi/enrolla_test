"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pwError, setPwError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setPwError("");
    if (!newPw) { setPwError("Please enter a new password"); return; }
    if (newPw.length < 8) { setPwError("Password must be at least 8 characters"); return; }
    if (newPw !== confirmPw) { setPwError("Passwords do not match"); return; }

    setSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPw });
    setSubmitting(false);

    if (error) {
      setPwError(error.message);
      return;
    }

    toast.success("Password updated — please sign in");
    router.replace("/login");
  }

  const inputClass = (hasError: boolean) =>
    cn(
      "h-11 w-full rounded-lg border bg-white pl-3.5 pr-11 text-sm text-[#0F172A] placeholder:text-slate-400",
      "transition-colors outline-none focus:ring-4",
      hasError
        ? "border-red-400 focus:border-red-400 focus:ring-red-400/20"
        : "border-slate-200 focus:border-[#F59E0B] focus:ring-[#F59E0B]/20"
    );

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-white">
      {/* Mobile top bar */}
      <div className="md:hidden h-12 w-full flex items-center px-5 bg-[#0F172A] border-b-4 border-[#F59E0B]">
        <span className="text-white font-bold text-lg tracking-tight">Enrolla</span>
      </div>

      {/* Left panel — desktop only */}
      <div className="hidden md:flex relative w-1/2 bg-[#0F172A] text-white overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />
        <div
          aria-hidden
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(245,158,11,0.18) 0%, rgba(245,158,11,0) 70%)" }}
        />

        <div className="relative z-10 flex flex-col justify-between p-12 lg:p-16 w-full">
          <span className="text-white font-bold text-2xl tracking-tight">Enrolla</span>

          <div className="max-w-sm space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#F59E0B]/15 border border-[#F59E0B]/30 flex items-center justify-center">
              <KeyRound className="w-6 h-6 text-[#F59E0B]" />
            </div>
            <h1 className="text-4xl font-bold leading-snug">
              Set a new<br />password.
            </h1>
            <p className="text-slate-400 leading-relaxed max-w-xs">
              Choose something strong. You can always update it again from your profile.
            </p>
          </div>

          <p className="text-xs text-slate-400 tracking-wide">Powered by Enrolla · v1.0</p>
        </div>

        <div className="absolute top-0 right-0 h-full w-1 bg-[#F59E0B]" />
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 md:py-0 bg-[#F8FAFC]">
        <div className="w-full max-w-[400px] mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-[#0F172A] tracking-tight">
              Reset password
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Enter and confirm your new password below.
            </p>
          </div>

          <div className="space-y-5">
            {/* New password */}
            <div className="space-y-1.5">
              <label htmlFor="newPw" className="text-sm font-medium text-[#0F172A]">
                New password
              </label>
              <div className="relative">
                <input
                  id="newPw"
                  type={showPw ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  value={newPw}
                  onChange={(e) => { setNewPw(e.target.value); setPwError(""); }}
                  className={inputClass(!!pwError && !newPw)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? "Hide password" : "Show password"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center h-7 w-7 rounded-md text-slate-400 hover:text-[#0F172A] hover:bg-slate-100 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]/40"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div className="space-y-1.5">
              <label htmlFor="confirmPw" className="text-sm font-medium text-[#0F172A]">
                Confirm password
              </label>
              <div className="relative">
                <input
                  id="confirmPw"
                  type={showConfirmPw ? "text" : "password"}
                  placeholder="Repeat your password"
                  value={confirmPw}
                  onChange={(e) => { setConfirmPw(e.target.value); setPwError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  className={inputClass(!!pwError)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPw((v) => !v)}
                  aria-label={showConfirmPw ? "Hide password" : "Show password"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center h-7 w-7 rounded-md text-slate-400 hover:text-[#0F172A] hover:bg-slate-100 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]/40"
                >
                  {showConfirmPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {pwError && (
                <p className="text-xs text-red-500 mt-1">{pwError}</p>
              )}
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className={cn(
                "w-full h-11 rounded-lg bg-[#F59E0B] text-white font-semibold text-sm cursor-pointer",
                "transition-all duration-200 hover:bg-[#D97706] active:translate-y-px",
                "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F59E0B]/30",
                "disabled:opacity-60 disabled:cursor-not-allowed"
              )}
            >
              {submitting ? "Updating…" : "Set new password"}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="text-xs text-slate-500 hover:text-[#0F172A] transition-colors cursor-pointer"
              >
                Back to sign in
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
