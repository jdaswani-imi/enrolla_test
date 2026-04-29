"use client";

import { useState, useRef, useEffect } from "react";
import { useCurrentUser } from "@/lib/use-current-user";
import { useUserAvatar } from "@/lib/user-avatar-context";
import { createClient } from "@/lib/supabase/client";
import {
  Mail,
  Phone,
  Calendar,
  Clock,
  Pencil,
  Check,
  X,
  Monitor,
  Smartphone,
  Globe,
  FileText,
  UserCheck,
  Trash2,
  DollarSign,
  ClipboardList,
  MessageSquare,
  Camera,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

const DB_ROLE_TO_FRONTEND: Record<string, string> = {
  super_admin:   "Super Admin",
  admin_head:    "Admin Head",
  admin:         "Admin",
  academic_head: "Academic Head",
  hod:           "HOD",
  teacher:       "Teacher",
  ta:            "TA",
  hr_finance:    "HR/Finance",
};

const SESSIONS: { id: string; device: string; icon: typeof Monitor; activity: string; current: boolean }[] = [];

type ActivityModule = "People" | "Finance" | "Tasks" | "Academic" | "Staff" | "Comms";

const MODULE_BADGE: Record<ActivityModule, string> = {
  People:   "bg-blue-100 text-blue-700",
  Finance:  "bg-emerald-100 text-emerald-700",
  Tasks:    "bg-violet-100 text-violet-700",
  Academic: "bg-amber-100 text-amber-700",
  Staff:    "bg-indigo-100 text-indigo-700",
  Comms:    "bg-rose-100 text-rose-700",
};

const MODULE_ICON: Record<ActivityModule, typeof FileText> = {
  People:   UserCheck,
  Finance:  DollarSign,
  Tasks:    ClipboardList,
  Academic: FileText,
  Staff:    UserCheck,
  Comms:    MessageSquare,
};

const ACTIVITY_LOG: Array<{
  timestamp: string;
  action: string;
  module: ActivityModule;
}> = [];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  const parts = name.trim().split(" ");
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2",
        checked ? "bg-amber-500" : "bg-slate-300"
      )}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform",
          checked ? "translate-x-[18px]" : "translate-x-0.5"
        )}
      />
    </button>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[11px] font-semibold uppercase tracking-widest text-slate-500 mb-1.5">
      {children}
    </label>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-semibold text-slate-900 mb-3">{children}</h3>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type TabId = "account" | "preferences" | "activity";

export default function ProfilePage() {
  const currentUser = useCurrentUser();
  const { avatarUrl: photoUrl, setAvatarUrl: setPhotoUrl } = useUserAvatar();

  const [tab, setTab] = useState<TabId>("account");
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/profile/avatar", { method: "POST", body: fd });
    if (!res.ok) { toast.error("Photo upload failed"); return; }
    const { url } = await res.json();
    setPhotoUrl(url);
    toast.success("Profile photo updated");
  }

  async function handleRemovePhoto() {
    setPhotoUrl(null);
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avatar_url: null }),
    });
    toast.success("Profile photo removed");
  }

  // Editable account fields (seeded from API)
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail]             = useState("");
  const [phone, setPhone]             = useState("");
  const [role, setRole]               = useState("");

  // Snapshot for cancel/revert
  const serverRef = useRef({ displayName: "", email: "", phone: "" });

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        const name = [data.first_name, data.last_name].filter(Boolean).join(" ");
        const em   = data.email ?? "";
        const ph   = data.phone ?? "";
        const rl   = DB_ROLE_TO_FRONTEND[data.role] ?? data.role ?? "";
        setDisplayName(name);
        setEmail(em);
        setPhone(ph);
        setRole(rl);
        serverRef.current = { displayName: name, email: em, phone: ph };
      })
      .finally(() => setLoading(false));
  }, []);

  // Preferences
  const [emailNotifs, setEmailNotifs]   = useState(true);
  const [inAppNotifs, setInAppNotifs]   = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [layout, setLayout]             = useState<"Default" | "Compact" | "Detailed">("Default");

  // Password fields
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw]         = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  async function handleSaveProfile() {
    const nameParts  = displayName.trim().split(/\s+/);
    const first_name = nameParts[0] ?? "";
    const last_name  = nameParts.slice(1).join(" ");

    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ first_name, last_name, phone }),
    });

    if (res.ok) {
      const data = await res.json();
      const name = [data.first_name, data.last_name].filter(Boolean).join(" ") || displayName;
      setDisplayName(name);
      setEmail(data.email ?? email);
      setPhone(data.phone ?? phone);
      serverRef.current = { displayName: name, email: data.email ?? email, phone: data.phone ?? phone };
      setEditing(false);
      toast.success("Profile updated");
    } else {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error ?? "Failed to update profile");
    }
  }

  function handleCancelEdit() {
    setDisplayName(serverRef.current.displayName);
    setEmail(serverRef.current.email);
    setPhone(serverRef.current.phone);
    setEditing(false);
  }

  async function handleChangePassword() {
    if (!newPw) { toast.error("Enter a new password"); return; }
    if (newPw.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    if (newPw !== confirmPw) { toast.error("Passwords do not match"); return; }

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPw });

    if (error) { toast.error(error.message); return; }

    setCurrentPw("");
    setNewPw("");
    setConfirmPw("");
    toast.success("Password updated");
  }

  async function handleForgotPassword() {
    if (!email) { toast.error("No email address found for your account"); return; }
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) { toast.error(error.message); return; }
    toast.success(`A password reset link has been sent to ${email}`);
  }

  function handleRevokeSession(device: string) {
    toast.success(`Session revoked — ${device}`);
  }

  const tabs: Array<{ id: TabId; label: string }> = [
    { id: "account",     label: "Account" },
    { id: "preferences", label: "Preferences" },
    { id: "activity",    label: "Activity log" },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your account details, preferences, and recent activity.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        {/* ── Left sidebar ── */}
        <aside className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-fit">
          <div className="p-6 flex flex-col items-center text-center border-b border-slate-100">
            <div className="relative mb-4">
              <div className="w-24 h-24 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-3xl font-bold overflow-hidden">
                {photoUrl ? (
                  <img src={photoUrl} alt="Profile photo" className="w-full h-full object-cover" />
                ) : (
                  getInitials(displayName || currentUser.name)
                )}
              </div>
              <button
                type="button"
                aria-label="Upload profile photo"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center shadow-sm transition-colors cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </div>
            {photoUrl && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="text-xs text-slate-500 hover:text-red-500 transition-colors cursor-pointer -mt-2 mb-2"
              >
                Remove photo
              </button>
            )}
            <h2 className="text-lg font-bold text-slate-900 leading-tight">
              {displayName || currentUser.name}
            </h2>
            <span className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-white">
              {role || currentUser.role}
            </span>
          </div>

          <div className="p-6 space-y-3.5 text-sm">
            <div className="flex items-start gap-2.5">
              <Mail className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-0.5">Email</p>
                <p className="text-slate-700 break-all">{email || currentUser.email}</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Phone className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-0.5">Phone</p>
                <p className="text-slate-700">{phone}</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-0.5">Member since</p>
                <p className="text-slate-700">—</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-0.5">Last login</p>
                <p className="text-slate-700">—</p>
              </div>
            </div>
          </div>

          <div className="p-6 pt-0">
            <button
              type="button"
              onClick={() => {
                setTab("account");
                setEditing(true);
              }}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-amber-500 text-white hover:bg-amber-600 transition-colors cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit profile
            </button>
          </div>
        </aside>

        {/* ── Right panel ── */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Tab bar */}
          <div className="flex gap-0 border-b border-slate-200 px-6">
            {tabs.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={cn(
                  "px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors cursor-pointer",
                  tab === id
                    ? "border-amber-500 text-amber-600"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="p-6">
            {/* ── Account tab ── */}
            {tab === "account" && (
              <div className="space-y-8">
                {/* Profile details */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <SectionHeading>Profile details</SectionHeading>
                    {!editing ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditing(true)}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Edit
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                          <X className="w-3.5 h-3.5" />
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSaveProfile}
                          className="bg-amber-500 hover:bg-amber-600 text-white"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Save
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <FieldLabel>Display name</FieldLabel>
                      <Input
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        disabled={!editing}
                      />
                    </div>
                    <div>
                      <FieldLabel>Email</FieldLabel>
                      <div className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-700">
                        <span className="truncate flex-1">{email}</span>
                        <Tooltip>
                          <TooltipTrigger>
                            <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0 cursor-default" />
                          </TooltipTrigger>
                          <TooltipContent>
                            Email address cannot be changed
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                    <div>
                      <FieldLabel>Phone</FieldLabel>
                      <Input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        disabled={!editing}
                      />
                    </div>
                    <div>
                      <FieldLabel>Preferred language</FieldLabel>
                      <select
                        disabled={!editing}
                        className={cn(
                          "h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-700 outline-none transition-colors focus-visible:border-amber-400 focus-visible:ring-2 focus-visible:ring-amber-400/30",
                          !editing && "bg-slate-50 cursor-not-allowed text-slate-500"
                        )}
                        defaultValue="English"
                      >
                        <option>English</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-slate-200" />

                {/* Change password */}
                <form onSubmit={(e) => { e.preventDefault(); handleChangePassword(); }}>
                  <SectionHeading>Change password</SectionHeading>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <FieldLabel>Current password</FieldLabel>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        autoComplete="current-password"
                        value={currentPw}
                        onChange={(e) => setCurrentPw(e.target.value)}
                      />
                    </div>
                    <div>
                      <FieldLabel>New password</FieldLabel>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        autoComplete="new-password"
                        value={newPw}
                        onChange={(e) => setNewPw(e.target.value)}
                      />
                    </div>
                    <div>
                      <FieldLabel>Confirm password</FieldLabel>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        autoComplete="new-password"
                        value={confirmPw}
                        onChange={(e) => setConfirmPw(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-4">
                    <Button
                      type="submit"
                      size="sm"
                      className="bg-amber-500 hover:bg-amber-600 text-white"
                    >
                      Update password
                    </Button>
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-sm text-slate-500 hover:text-amber-600 transition-colors cursor-pointer"
                    >
                      Forgot your password?
                    </button>
                  </div>
                </form>

                <div className="h-px bg-slate-200" />

                {/* Sessions */}
                <div>
                  <SectionHeading>Active sessions</SectionHeading>
                  <div className="rounded-lg border border-slate-200 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                        <tr>
                          <th className="text-left px-4 py-2.5">Device</th>
                          <th className="text-left px-4 py-2.5">Activity</th>
                          <th className="text-right px-4 py-2.5">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {SESSIONS.map((s) => {
                          const Icon = s.icon;
                          return (
                            <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2.5">
                                  <Icon className="w-4 h-4 text-slate-400 shrink-0" />
                                  <span className="text-slate-800 font-medium">{s.device}</span>
                                  {s.current && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700 uppercase tracking-wide">
                                      Current
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-slate-600">
                                <div className="flex items-center gap-1.5">
                                  {s.current && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  )}
                                  {s.activity}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right">
                                {s.current ? (
                                  <span className="text-xs text-slate-400">—</span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleRevokeSession(s.device)}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    Revoke
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ── Preferences tab ── */}
            {tab === "preferences" && (
              <div className="space-y-8">
                {/* Notification prefs */}
                <div>
                  <SectionHeading>Notification preferences</SectionHeading>
                  <div className="rounded-lg border border-slate-200 divide-y divide-slate-100">
                    {[
                      { label: "Email notifications",  desc: "Account alerts, approvals, and digest emails.",        value: emailNotifs,  set: setEmailNotifs },
                      { label: "In-app notifications", desc: "Real-time alerts in the notification panel.",          value: inAppNotifs,  set: setInAppNotifs },
                      { label: "Weekly digest",        desc: "Summary of activity and pending items every Monday.",  value: weeklyDigest, set: setWeeklyDigest },
                    ].map((row) => (
                      <div key={row.label} className="flex items-center justify-between px-4 py-3">
                        <div className="min-w-0 pr-4">
                          <p className="text-sm font-medium text-slate-900">{row.label}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{row.desc}</p>
                        </div>
                        <Toggle checked={row.value} onChange={row.set} label={row.label} />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-slate-200" />

                {/* Dashboard layout */}
                <div>
                  <SectionHeading>Dashboard layout</SectionHeading>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {(["Default", "Compact", "Detailed"] as const).map((opt) => {
                      const active = layout === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setLayout(opt)}
                          className={cn(
                            "flex items-start gap-3 rounded-lg border px-4 py-3 text-left transition-colors cursor-pointer",
                            active
                              ? "border-amber-400 bg-amber-50/60 ring-1 ring-amber-400"
                              : "border-slate-200 bg-white hover:border-slate-300"
                          )}
                        >
                          <span
                            className={cn(
                              "mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center",
                              active ? "border-amber-500" : "border-slate-300"
                            )}
                          >
                            {active && <span className="w-2 h-2 rounded-full bg-amber-500" />}
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{opt}</p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {opt === "Default"  && "Balanced density — recommended for most users."}
                              {opt === "Compact"  && "Tighter spacing to fit more above the fold."}
                              {opt === "Detailed" && "Extra context and secondary metrics."}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="h-px bg-slate-200" />

                {/* Timezone */}
                <div>
                  <SectionHeading>Timezone</SectionHeading>
                  <div className="max-w-sm">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                      <select
                        className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-700 outline-none focus-visible:border-amber-400 focus-visible:ring-2 focus-visible:ring-amber-400/30"
                        defaultValue="Asia/Dubai (GMT+4)"
                      >
                        <option>Asia/Dubai (GMT+4)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Activity log tab ── */}
            {tab === "activity" && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <SectionHeading>Recent activity</SectionHeading>
                  <p className="text-xs text-slate-500">Last 10 actions</p>
                </div>
                <div className="rounded-lg border border-slate-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                      <tr>
                        <th className="text-left px-4 py-2.5 w-[180px]">Timestamp</th>
                        <th className="text-left px-4 py-2.5">Action</th>
                        <th className="text-left px-4 py-2.5 w-[140px]">Module</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {ACTIVITY_LOG.map((row, idx) => {
                        const Icon = MODULE_ICON[row.module];
                        return (
                          <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                            <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                              {row.timestamp}
                            </td>
                            <td className="px-4 py-3 text-slate-800">{row.action}</td>
                            <td className="px-4 py-3">
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                                  MODULE_BADGE[row.module]
                                )}
                              >
                                <Icon className="w-3 h-3" />
                                {row.module}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
