// IMI subject catalogue for journey dialogs.

export type SubjectBand = "Primary" | "Lower Secondary" | "Upper Secondary" | "Enrichment";

export interface SubjectOption {
  name: string;
  band: SubjectBand;
  yearGroups?: string[]; // optional fine-grained filter within a band
}

const PRIMARY: SubjectOption[] = [
  { name: "Mathematics", band: "Primary" },
  { name: "English", band: "Primary" },
  { name: "Science", band: "Primary", yearGroups: ["Y4", "Y5", "Y6"] },
];

const LOWER_SECONDARY: SubjectOption[] = [
  "Mathematics",
  "English",
  "Science",
  "Biology",
  "Chemistry",
  "Physics",
  "History",
  "Geography",
  "French",
  "Arabic",
  "Computer Science",
].map((name) => ({ name, band: "Lower Secondary" as const }));

const UPPER_SECONDARY: SubjectOption[] = [
  "Mathematics",
  "English Language",
  "English Literature",
  "Biology",
  "Chemistry",
  "Physics",
  "History",
  "Geography",
  "Economics",
  "Business Studies",
  "Psychology",
  "Computer Science",
  "French",
  "Arabic",
  "Art & Design",
  "Further Mathematics",
].map((name) => ({ name, band: "Upper Secondary" as const }));

const ENRICHMENT: SubjectOption[] = [
  "CAT4 Preparation",
  "Educational Counselling",
  "AI Literacy",
  "Home Education Support",
].map((name) => ({ name, band: "Enrichment" as const }));

export const SUBJECTS: SubjectOption[] = [
  ...PRIMARY,
  ...LOWER_SECONDARY,
  ...UPPER_SECONDARY,
  ...ENRICHMENT,
];

function bandForYearGroup(yearGroup: string): SubjectBand {
  if (!yearGroup) return "Lower Secondary";
  if (yearGroup.startsWith("KG") || yearGroup.startsWith("FS")) return "Primary";
  const n = Number(yearGroup.replace("Y", ""));
  if (Number.isNaN(n)) return "Lower Secondary";
  if (n <= 6) return "Primary";
  if (n <= 9) return "Lower Secondary";
  return "Upper Secondary";
}

export function subjectsForYearGroup(yearGroup: string): SubjectOption[] {
  const band = bandForYearGroup(yearGroup);
  const inBand = SUBJECTS.filter((s) => {
    if (s.band === "Enrichment") return true;
    if (s.band !== band) return false;
    if (s.yearGroups && !s.yearGroups.includes(yearGroup)) return false;
    return true;
  });
  return inBand;
}

// Strip any leading year-group token (e.g. "Y7 Mathematics" → "Mathematics",
// "KG2 English" → "English"). Year groups are inferred from the lead and must
// never be shown as part of a subject display name.
export function stripYearGroupPrefix(raw: string): string {
  if (!raw) return "";
  return raw.replace(/^\s*(?:Y\s*\d+|KG\s*\d*|FS\s*\d*)\s+/i, "").trim();
}

// Map a free-text / legacy subject value (e.g. "Maths", "Y7 Maths") to the
// catalogue entry for the given year group, when possible.
export function normaliseSubject(raw: string, yearGroup: string): string {
  if (!raw) return "";
  const stripped = stripYearGroupPrefix(raw);
  const options = subjectsForYearGroup(yearGroup);
  const lower = stripped.toLowerCase();
  const direct = options.find((o) => o.name.toLowerCase() === lower);
  if (direct) return direct.name;
  if (lower === "maths") {
    const m = options.find((o) => o.name === "Mathematics");
    if (m) return m.name;
  }
  if (lower === "english") {
    const e = options.find((o) => o.name === "English" || o.name === "English Language");
    if (e) return e.name;
  }
  return stripped;
}
