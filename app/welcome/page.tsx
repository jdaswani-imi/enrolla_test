"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Camera, ArrowRight, CheckCircle2, Eye, EyeOff, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserAvatar } from "@/lib/user-avatar-context";
import { useRole } from "@/lib/role-context";
import { type Role } from "@/lib/role-config";
import { createClient } from "@/lib/supabase/client";

const DB_ROLE_TO_DISPLAY: Record<string, string> = {
  super_admin:   "Super Admin",
  admin_head:    "Admin Head",
  admin:         "Admin",
  academic_head: "Academic Head",
  hod:           "HOD",
  teacher:       "Teacher",
  ta:            "TA",
  hr_finance:    "HR/Finance",
};

type Profile = {
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  avatar_url: string | null;
  profile_complete: boolean;
};

export default function WelcomePage() {
  const router = useRouter();
  const { setAvatarUrl } = useUserAvatar();
  const { setRole } = useRole();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pwError, setPwError] = useState("");

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data: Profile) => {
        if (data.profile_complete) {
          router.replace("/dashboard");
          return;
        }
        setProfile(data);
        setFirstName(data.first_name);
        setLastName(data.last_name);
        if (data.avatar_url) setAvatarPreview(data.avatar_url);
      })
      .catch(() => toast.error("Failed to load your profile"));
  }, [router]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function handleSubmit() {
    if (submitting || !profile) return;
    if (!firstName.trim()) {
      toast.error("Please enter your first name");
      return;
    }

    // Password validation
    setPwError("");
    if (!newPw) {
      setPwError("Please set a password");
      return;
    }
    if (newPw.length < 8) {
      setPwError("Password must be at least 8 characters");
      return;
    }
    if (newPw !== confirmPw) {
      setPwError("Passwords do not match");
      return;
    }

    setSubmitting(true);

    try {
      // Set password in Supabase Auth
      const supabase = createClient();
      const { error: pwErr } = await supabase.auth.updateUser({ password: newPw });
      if (pwErr) {
        setPwError(pwErr.message);
        setSubmitting(false);
        return;
      }

      let avatarUrl = profile.avatar_url ?? null;

      if (pendingFile) {
        const fd = new FormData();
        fd.append("file", pendingFile);
        const res = await fetch("/api/profile/avatar", { method: "POST", body: fd });
        if (res.ok) {
          const { url } = await res.json();
          avatarUrl = url;
        } else {
          toast.error("Avatar upload failed — you can add it later from your profile");
        }
      }

      const patchRes = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          avatar_url: avatarUrl,
          profile_complete: true,
        }),
      });

      if (!patchRes.ok) {
        const body = await patchRes.json().catch(() => ({}))
        if (patchRes.status === 401) {
          toast.error("Your session expired — please use the invite link again or ask an admin to resend it.")
        } else {
          toast.error(body.error ?? "Profile update failed. Please try again.")
        }
        setSubmitting(false)
        return
      }

      if (avatarUrl) setAvatarUrl(avatarUrl);

      try {
        const me = await fetch("/api/auth/me").then((r) => r.json());
        setRole(me.role as Role);
      } catch {}

      router.push("/dashboard");
    } catch (err) {
      console.error("Welcome submit error:", err)
      toast.error("Something went wrong. Please try again.")
      setSubmitting(false)
    }
  }

  const initials =
    (firstName?.[0] ?? "") + (lastName?.[0] ?? "") ||
    profile?.email?.[0]?.toUpperCase() ||
    "?";

  const roleDisplay = profile
    ? (DB_ROLE_TO_DISPLAY[profile.role] ?? profile.role)
    : "";

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-white">
      {/* Mobile top bar */}
      <div className="md:hidden h-12 w-full flex items-center px-5 bg-[#0F172A] border-b-4 border-[#F59E0B]">
        <span className="text-white font-bold text-lg tracking-tight">Enrolla</span>
      </div>

      {/* Left panel — desktop only */}
      <div className="hidden md:flex relative w-1/2 bg-[#0F172A] text-white overflow-hidden flex-col justify-between p-12">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#F59E0B]" />

        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-lg bg-[#F59E0B] flex items-center justify-center">
              <span className="text-[#0F172A] font-bold text-sm">E</span>
            </div>
            <span className="text-white font-bold text-xl tracking-tight">Enrolla</span>
          </div>
          <p className="text-slate-400 text-sm">IMI — Improve ME Institute</p>
        </div>

        <div className="space-y-5">
          <div className="inline-flex items-center gap-2 bg-[#F59E0B]/10 border border-[#F59E0B]/20 rounded-full px-4 py-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#F59E0B]" />
            <span className="text-[#F59E0B] text-sm font-medium">Invite accepted</span>
          </div>
          <h1 className="text-4xl font-bold leading-snug">
            Your workspace<br />is ready.
          </h1>
          <p className="text-slate-400 leading-relaxed max-w-xs">
            Set up your profile and you&apos;ll be managing classes, tracking progress,
            and collaborating with your team in minutes.
          </p>
        </div>

        <div className="flex gap-1.5">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={cn(
                "rounded-full",
                i === 0 ? "w-6 h-1.5 bg-[#F59E0B]" : "w-1.5 h-1.5 bg-slate-600"
              )}
            />
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-[#F8FAFC]">
        <div className="w-full max-w-sm space-y-8">

          {/* Avatar upload */}
          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="relative w-20 h-20 rounded-full cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B] focus-visible:ring-offset-2"
              aria-label="Upload profile photo"
            >
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Profile preview"
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-[#F59E0B]/15 border-2 border-dashed border-[#F59E0B]/40 flex items-center justify-center group-hover:bg-[#F59E0B]/20 transition-colors duration-150">
                  <span className="text-2xl font-bold text-[#F59E0B]">{initials}</span>
                </div>
              )}
              <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center">
                <Camera className="w-5 h-5 text-white" />
              </div>
            </button>
            <p className="text-xs text-slate-400">Click to upload a photo (optional)</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Greeting */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-slate-900">
              Welcome to IMI{firstName ? `, ${firstName}` : ""}!
            </h2>
            {roleDisplay && (
              <span className="inline-block bg-[#F59E0B]/10 text-amber-800 text-xs font-semibold px-3 py-1 rounded-full">
                {roleDisplay}
              </span>
            )}
          </div>

          {/* Name fields */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-500 text-center">
              Confirm your display name
            </p>
            <div className="flex gap-3">
              <div className="flex-1 space-y-1">
                <label htmlFor="firstName" className="text-xs text-slate-500 font-medium">
                  First name
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/50 focus:border-[#F59E0B] transition-colors duration-150"
                  placeholder="First"
                />
              </div>
              <div className="flex-1 space-y-1">
                <label htmlFor="lastName" className="text-xs text-slate-500 font-medium">
                  Last name
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/50 focus:border-[#F59E0B] transition-colors duration-150"
                  placeholder="Last"
                />
              </div>
            </div>
          </div>

          {/* Password */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-slate-200" />
              <p className="text-sm font-medium text-slate-500 whitespace-nowrap">
                Set your password
              </p>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            <div className="space-y-1">
              <label htmlFor="newPw" className="text-xs text-slate-500 font-medium flex items-center gap-1">
                <Lock className="w-3 h-3" />
                Password
              </label>
              <div className="relative">
                <input
                  id="newPw"
                  type={showPw ? "text" : "password"}
                  value={newPw}
                  onChange={(e) => { setNewPw(e.target.value); setPwError(""); }}
                  placeholder="Min. 8 characters"
                  className={cn(
                    "w-full px-3 py-2 pr-10 text-sm rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/50 focus:border-[#F59E0B] transition-colors duration-150",
                    pwError ? "border-red-400" : "border-slate-200"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="confirmPw" className="text-xs text-slate-500 font-medium flex items-center gap-1">
                <Lock className="w-3 h-3" />
                Confirm password
              </label>
              <div className="relative">
                <input
                  id="confirmPw"
                  type={showConfirmPw ? "text" : "password"}
                  value={confirmPw}
                  onChange={(e) => { setConfirmPw(e.target.value); setPwError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  placeholder="Repeat your password"
                  className={cn(
                    "w-full px-3 py-2 pr-10 text-sm rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/50 focus:border-[#F59E0B] transition-colors duration-150",
                    pwError ? "border-red-400" : "border-slate-200"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPw((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  aria-label={showConfirmPw ? "Hide password" : "Show password"}
                >
                  {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {pwError && (
                <p className="text-xs text-red-500 mt-1">{pwError}</p>
              )}
            </div>
          </div>

          {/* CTA */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-[#0F172A] font-semibold text-sm transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B] focus-visible:ring-offset-2"
          >
            {submitting ? "Setting up…" : "Get started"}
            {!submitting && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
