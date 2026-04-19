"use client";

import { useState } from "react";
import {
  Bell,
  Camera,
  Key,
  Lock,
  Mail,
  MessageSquare,
  Monitor,
  Shield,
  Smartphone,
  User as UserIcon,
} from "lucide-react";

import { currentUser } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const PLACEHOLDER_AVATAR =
  "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400&h=400&fit=crop&crop=faces";

const initials = currentUser.name
  .split(" ")
  .map((n) => n[0])
  .join("")
  .slice(0, 2);

type Tab = "personal" | "security" | "notifications";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const [tab, setTab] = useState<Tab>("personal");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(currentUser.avatarUrl);
  const [toast, setToast] = useState("");

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  function handleUploadPhoto() {
    currentUser.avatarUrl = PLACEHOLDER_AVATAR;
    setAvatarUrl(PLACEHOLDER_AVATAR);
    showToast("Profile photo updated");
  }

  function handleRemovePhoto() {
    currentUser.avatarUrl = null;
    setAvatarUrl(null);
    showToast("Profile photo removed");
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your personal information, security, and notification preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column — Profile photo card */}
        <div className="lg:col-span-1">
          <ProfileCard
            avatarUrl={avatarUrl}
            onUpload={handleUploadPhoto}
            onRemove={handleRemovePhoto}
          />
        </div>

        {/* Right column — Tabs */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            {/* Tabs header */}
            <div className="border-b border-slate-200 flex">
              <TabButton active={tab === "personal"} onClick={() => setTab("personal")}>
                <UserIcon className="w-4 h-4" />
                Personal Details
              </TabButton>
              <TabButton active={tab === "security"} onClick={() => setTab("security")}>
                <Shield className="w-4 h-4" />
                Security
              </TabButton>
              <TabButton active={tab === "notifications"} onClick={() => setTab("notifications")}>
                <Bell className="w-4 h-4" />
                Notifications
              </TabButton>
            </div>

            {/* Tab content */}
            <div className="p-6">
              {tab === "personal" && <PersonalTab onSave={() => showToast("Profile updated")} />}
              {tab === "security" && <SecurityTab showToast={showToast} />}
              {tab === "notifications" && (
                <NotificationsTab onSave={() => showToast("Notification preferences saved")} />
              )}
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 bg-slate-800 text-white text-sm px-4 py-3 rounded-xl shadow-lg z-[300]">
          {toast}
        </div>
      )}
    </div>
  );
}

// ─── Profile Card ─────────────────────────────────────────────────────────────

function ProfileCard({
  avatarUrl,
  onUpload,
  onRemove,
}: {
  avatarUrl: string | null;
  onUpload: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <div className="flex flex-col items-center text-center">
        {/* Avatar */}
        <div className="relative">
          <div className="w-[120px] h-[120px] rounded-full bg-amber-500 flex items-center justify-center overflow-hidden ring-4 ring-amber-100">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={currentUser.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white font-bold text-4xl">{initials}</span>
            )}
          </div>
        </div>

        <button
          onClick={onUpload}
          className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors cursor-pointer"
        >
          <Camera className="w-4 h-4" />
          Upload Photo
        </button>

        {avatarUrl && (
          <button
            onClick={onRemove}
            className="mt-2 text-xs text-slate-500 hover:text-rose-600 hover:underline transition-colors cursor-pointer"
          >
            Remove Photo
          </button>
        )}

        <h2 className="mt-5 text-xl font-bold text-slate-900">{currentUser.name}</h2>

        <span className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200">
          {currentUser.role}
        </span>

        <div className="mt-4 pt-4 border-t border-slate-100 w-full space-y-2 text-left">
          <InfoRow label="Email" value="j.daswani@improvemeinstitute.com" />
          <InfoRow label="Member since" value="Mar 2024" />
          <InfoRow label="Last login" value="Today, 05:18 PM" />
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">{label}</p>
      <p className="text-sm text-slate-700 truncate">{value}</p>
    </div>
  );
}

// ─── Tab Button ───────────────────────────────────────────────────────────────

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors cursor-pointer border-b-2",
        active
          ? "text-amber-600 border-amber-500 bg-amber-50/40"
          : "text-slate-500 border-transparent hover:text-slate-800 hover:bg-slate-50"
      )}
    >
      {children}
    </button>
  );
}

// ─── Field helpers ────────────────────────────────────────────────────────────

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

function TextInput({
  defaultValue,
  disabled,
  type = "text",
}: {
  defaultValue?: string;
  disabled?: boolean;
  type?: string;
}) {
  return (
    <input
      type={type}
      defaultValue={defaultValue}
      disabled={disabled}
      className={cn(
        "w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors",
        disabled
          ? "bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed"
          : "bg-white border-slate-200 text-slate-800 focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
      )}
    />
  );
}

function LockInput({ value }: { value: string }) {
  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        disabled
        className="w-full px-3 py-2 pr-9 rounded-lg border bg-slate-50 border-slate-200 text-slate-500 text-sm cursor-not-allowed"
      />
      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
    </div>
  );
}

function Select({
  defaultValue,
  options,
  disabled,
}: {
  defaultValue?: string;
  options: string[];
  disabled?: boolean;
}) {
  return (
    <select
      defaultValue={defaultValue}
      disabled={disabled}
      className={cn(
        "w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors",
        disabled
          ? "bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed"
          : "bg-white border-slate-200 text-slate-800 focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
      )}
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

function PrimaryButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors cursor-pointer"
    >
      {label}
    </button>
  );
}

function OutlineButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-medium hover:bg-slate-50 transition-colors cursor-pointer"
    >
      {label}
    </button>
  );
}

// ─── Tab 1: Personal Details ──────────────────────────────────────────────────

function PersonalTab({ onSave }: { onSave: () => void }) {
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field label="First Name">
          <TextInput defaultValue="Jason" />
        </Field>
        <Field label="Last Name">
          <TextInput defaultValue="Daswani" />
        </Field>
        <Field label="Email" hint="Contact support to change">
          <LockInput value="j.daswani@improvemeinstitute.com" />
        </Field>
        <Field label="Phone Number">
          <TextInput defaultValue="+971 50 123 4567" />
        </Field>
        <Field label="WhatsApp Number">
          <TextInput defaultValue="+971 50 123 4567" />
        </Field>
        <Field label="Display Language">
          <Select defaultValue="English" options={["English"]} disabled />
        </Field>
        <Field label="Timezone" hint="Set by organisation settings">
          <LockInput value="UTC+4 · Gulf Standard Time" />
        </Field>
      </div>

      <div className="mt-6 pt-5 border-t border-slate-100 flex justify-end">
        <PrimaryButton label="Save Changes" onClick={onSave} />
      </div>
    </div>
  );
}

// ─── Tab 2: Security ──────────────────────────────────────────────────────────

function SecurityTab({ showToast }: { showToast: (msg: string) => void }) {
  return (
    <div className="space-y-8">
      {/* Change Password */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Key className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-800">Change Password</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Current Password">
            <TextInput type="password" />
          </Field>
          <div />
          <Field label="New Password">
            <TextInput type="password" />
          </Field>
          <Field label="Confirm New Password">
            <TextInput type="password" />
          </Field>
        </div>
        <div className="mt-4">
          <PrimaryButton
            label="Update Password"
            onClick={() => showToast("Password updated — coming soon")}
          />
        </div>
      </div>

      {/* 2FA */}
      <div className="pt-6 border-t border-slate-100">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-800">Two-Factor Authentication</h3>
        </div>
        <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-200 text-slate-600">
              Disabled
            </span>
            <p className="text-sm text-slate-600">
              Add an extra layer of security to your account.
            </p>
          </div>
          <OutlineButton
            label="Enable 2FA"
            onClick={() => showToast("2FA — coming soon")}
          />
        </div>
      </div>

      {/* Active Sessions */}
      <div className="pt-6 border-t border-slate-100">
        <div className="flex items-center gap-2 mb-4">
          <Monitor className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-800">Active Sessions</h3>
        </div>
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Device</th>
                <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Location</th>
                <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Last Active</th>
                <th className="text-right px-4 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="px-4 py-3 flex items-center gap-2 text-slate-700">
                  <Monitor className="w-4 h-4 text-slate-400" />
                  Chrome · Windows
                </td>
                <td className="px-4 py-3 text-slate-600">Dubai, UAE</td>
                <td className="px-4 py-3 text-slate-600">Now</td>
                <td className="px-4 py-3 text-right">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-green-100 text-green-700">
                    Current session
                  </span>
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 flex items-center gap-2 text-slate-700">
                  <Smartphone className="w-4 h-4 text-slate-400" />
                  Mobile · iOS
                </td>
                <td className="px-4 py-3 text-slate-600">Dubai, UAE</td>
                <td className="px-4 py-3 text-slate-600">2 days ago</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => showToast("Session revoked — coming soon")}
                    className="text-xs font-medium text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                  >
                    Revoke
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Tab 3: Notifications ─────────────────────────────────────────────────────

type PrefKey =
  | "email"
  | "whatsapp"
  | "newEnrolment"
  | "overdueInvoice"
  | "concerns"
  | "dailyDigest"
  | "weeklyReport";

const PREF_ITEMS: { key: PrefKey; label: string; desc: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "email",          label: "Email notifications",    desc: "Receive updates via email",                        icon: Mail },
  { key: "whatsapp",       label: "WhatsApp notifications", desc: "Receive updates via WhatsApp",                     icon: MessageSquare },
  { key: "newEnrolment",   label: "New enrolment alerts",   desc: "Get notified when a student enrols",               icon: Bell },
  { key: "overdueInvoice", label: "Overdue invoice alerts", desc: "Get notified when invoices become overdue",        icon: Bell },
  { key: "concerns",       label: "Concern escalations",    desc: "Get notified when a concern is escalated to you",  icon: Bell },
  { key: "dailyDigest",    label: "Daily digest",           desc: "A summary of activity at the end of each day",     icon: Bell },
  { key: "weeklyReport",   label: "Weekly report",          desc: "A performance summary every Monday morning",        icon: Bell },
];

function NotificationsTab({ onSave }: { onSave: () => void }) {
  const [prefs, setPrefs] = useState<Record<PrefKey, boolean>>({
    email: true,
    whatsapp: false,
    newEnrolment: true,
    overdueInvoice: true,
    concerns: true,
    dailyDigest: true,
    weeklyReport: true,
  });

  return (
    <div>
      <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg">
        {PREF_ITEMS.map(({ key, label, desc, icon: Icon }) => (
          <div key={key} className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-slate-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">{label}</p>
                <p className="text-xs text-slate-500">{desc}</p>
              </div>
            </div>
            <Toggle
              checked={prefs[key]}
              onChange={(v) => setPrefs((p) => ({ ...p, [key]: v }))}
            />
          </div>
        ))}
      </div>

      <div className="mt-6 pt-5 border-t border-slate-100 flex justify-end">
        <PrimaryButton label="Save Preferences" onClick={onSave} />
      </div>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer flex-shrink-0",
        checked ? "bg-amber-500" : "bg-slate-300"
      )}
    >
      <span
        className={cn(
          "inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-[18px]" : "translate-x-0.5"
        )}
      />
    </button>
  );
}
