/**
 * Shared display formatters for the Enrolla portal.
 * All formatting rules are applied at the render layer — never in the database.
 *
 * Rules enforced:
 *   NAMES       → Title Case
 *   DATES       → DD MMM YYYY  |  DOB: DD MMM YYYY (Age N)
 *   GENDER      → Capitalised first letter
 *   PHONE       → +971 XX XXX XXXX  (UAE); "—" when blank
 *   STUDENT ID  → #0004  (zero-padded 4 digits, # prefix)
 *   YEAR GROUP  → "Year N" with capital Y
 *   DEPARTMENT  → Title Case
 *   CURRENCY    → AED X,XXX  (thousands separator; no trailing .00)
 *   EMPTY/NULL  → em dash (—)
 *   COUNTS      → "0" — never blank
 */

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

// ─── Names ────────────────────────────────────────────────────────────────────

/** Convert any string to Title Case. Returns "—" for blank input. */
export function toTitleCase(input: string | null | undefined): string {
  if (!input || !input.trim()) return "—";
  return input.trim().replace(/\S+/g, (word) =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  );
}

/**
 * Build a display name from separate first/last parts.
 * Returns "—" only when both parts are empty.
 */
export function formatFullName(
  firstName: string | null | undefined,
  lastName: string | null | undefined
): string {
  const full = `${firstName ?? ""} ${lastName ?? ""}`.trim();
  return full ? toTitleCase(full) : "—";
}

// ─── Dates ────────────────────────────────────────────────────────────────────

/** Compute age in whole years from a YYYY-MM-DD string. */
export function computeAge(dob: string): number {
  if (!dob) return 0;
  const parts = dob.split("-").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return 0;
  const [y, m, d] = parts;
  const today = new Date();
  let age = today.getFullYear() - y;
  const monthDiff = today.getMonth() + 1 - m;
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < d)) age--;
  return age;
}

/** Format a YYYY-MM-DD date-of-birth as "DD MMM YYYY (Age N)". */
export function formatDob(dob: string | null | undefined): string {
  if (!dob || !dob.trim()) return "—";
  const parts = dob.split("-").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return "—";
  const [y, m, d] = parts;
  if (m < 1 || m > 12) return "—";
  return `${d} ${MONTHS[m - 1]} ${y} (Age ${computeAge(dob)})`;
}

/** Format a YYYY-MM-DD string as "DD MMM YYYY". */
export function formatDate(iso: string | null | undefined): string {
  if (!iso || !iso.trim()) return "—";
  const parts = iso.split("-").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return "—";
  const [y, m, d] = parts;
  if (m < 1 || m > 12) return "—";
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

/**
 * Format a YYYY-MM-DD string as a short weekday label: "Wed 3 Apr".
 * Used in timetable / session lists.
 */
export function formatDateShort(iso: string | null | undefined): string {
  if (!iso || !iso.trim()) return "—";
  const parts = iso.split("-").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return "—";
  const [y, m, d] = parts;
  if (m < 1 || m > 12) return "—";
  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
  const date = new Date(y, m - 1, d);
  return `${DAYS[date.getDay()]} ${d} ${MONTHS[m - 1]}`;
}

// ─── Gender ───────────────────────────────────────────────────────────────────

/** Capitalise first letter of gender string. Returns "—" when blank. */
export function formatGender(gender: string | null | undefined): string {
  if (!gender || !gender.trim()) return "—";
  const g = gender.trim();
  return g.charAt(0).toUpperCase() + g.slice(1);
}

// ─── Phone ────────────────────────────────────────────────────────────────────

/**
 * Format a phone number for display.
 *
 * UAE numbers (9 local digits or with +971 / 00971 prefix) become
 * "+971 XX XXX XXXX". All other values are returned as-is unless blank,
 * in which case "—" is returned.
 */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone || !phone.trim()) return "—";
  const raw = phone.trim();
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "—";

  // Already formatted correctly
  if (/^\+971\s\d{2}\s\d{3}\s\d{4}$/.test(raw)) return raw;

  // UAE with +971 / 00971 prefix → 12 digits total
  if ((digits.startsWith("971")) && digits.length === 12) {
    const local = digits.slice(3);
    return `+971 ${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5)}`;
  }

  // Local UAE with leading 0 → 10 digits
  if (digits.startsWith("0") && digits.length === 10) {
    const local = digits.slice(1);
    return `+971 ${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5)}`;
  }

  // Local UAE without leading 0 → 9 digits (e.g. 501234567)
  if (digits.length === 9 && !digits.startsWith("0") && !digits.startsWith("9")) {
    return `+971 ${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
  }

  return raw;
}

// ─── Student ID ───────────────────────────────────────────────────────────────

/**
 * Format a student reference number as "#0004".
 * Accepts numeric or string refs (e.g. 4, "4", "#0004", "STU-0004").
 */
export function formatStudentRef(ref: string | number | null | undefined): string {
  if (ref === null || ref === undefined || ref === "") return "—";
  const str = String(ref).replace(/[^\d]/g, "");
  if (!str) return String(ref); // non-numeric — return as-is
  const n = parseInt(str, 10);
  return isNaN(n) ? String(ref) : `#${String(n).padStart(4, "0")}`;
}

// ─── Year Group ───────────────────────────────────────────────────────────────

/**
 * Normalise year-group codes to "Year N" or "KGN" display format.
 *   "Y8"    → "Year 8"
 *   "year 6"→ "Year 6"
 *   "KG1"   → "KG1"
 */
export function formatYearGroup(yg: string | null | undefined): string {
  if (!yg || !yg.trim()) return "—";
  const s = yg.trim();
  if (/^KG\d+$/i.test(s)) return s.toUpperCase();
  if (/^Y(\d+)$/i.test(s)) return `Year ${s.replace(/^Y/i, "")}`;
  if (/^Year\s+\d+$/i.test(s)) return `Year ${s.replace(/^year\s+/i, "")}`;
  return s;
}

// ─── Department ───────────────────────────────────────────────────────────────

/** Capitalise first letter of a department name. */
export function formatDepartment(dept: string | null | undefined): string {
  if (!dept || !dept.trim()) return "—";
  const d = dept.trim();
  return d.charAt(0).toUpperCase() + d.slice(1);
}

// ─── Currency ─────────────────────────────────────────────────────────────────

/**
 * Format a numeric AED amount as "AED X,XXX".
 * Uses a thousands separator. Decimals only shown when non-zero.
 * Returns "—" for null/undefined and "AED 0" for zero.
 */
export function formatAed(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "—";
  const n = typeof amount === "number" ? amount : Number(amount);
  if (!Number.isFinite(n)) return "—";
  if (n === 0) return "AED 0";
  const hasDecimals = n % 1 !== 0;
  return `AED ${n.toLocaleString("en-US", {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

// ─── Generic value helpers ────────────────────────────────────────────────────

/**
 * Return the value as-is, or "—" when it is null / undefined / empty string /
 * the literal strings "N/A", "null", or "undefined".
 */
export function displayValue(value: string | null | undefined): string {
  if (value === null || value === undefined) return "—";
  const s = String(value).trim();
  if (s === "" || s === "N/A" || s === "null" || s === "undefined") return "—";
  return s;
}

/** Format an integer count, always returning "0" instead of blank. */
export function formatCount(n: number | null | undefined): string {
  if (n === null || n === undefined || isNaN(Number(n))) return "0";
  return String(Math.floor(Number(n)));
}
