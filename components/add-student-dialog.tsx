"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Camera,
  Check,
  ChevronDown,
  Info,
  Mail,
  MessageCircle,
  Phone,
  Search,
  ShieldAlert,
  Trash2,
  User,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// ─── Reference data ───────────────────────────────────────────────────────────

export const DUBAI_AREAS = [
  "Abu Hail", "Academic City", "Al Awir", "Al Bada'a", "Al Baraha",
  "Al Barari", "Al Barsha", "Al Barsha South", "Al Buteen", "Al Furjan",
  "Al Garhoud", "Al Hudaiba", "Al Jaddaf", "Al Jafiliya", "Al Karama",
  "Al Khawaneej", "Al Kifaf", "Al Mamzar", "Al Manara", "Al Mankhool",
  "Al Mina", "Al Mizhar", "Al Muraqqabat", "Al Muteena", "Al Nahda",
  "Al Quoz", "Al Qusais", "Al Rashidiya", "Al Rigga", "Al Safa",
  "Al Satwa", "Al Sufouh", "Al Twar", "Al Waha", "Al Warqa",
  "Al Wasl", "Arabian Ranches", "Arabian Ranches 2", "Arabian Ranches 3",
  "Arjan", "Barsha Heights (TECOM)", "Bluewaters Island", "Business Bay",
  "Cherrywoods", "City Walk", "Culture Village", "DAMAC Hills",
  "DAMAC Hills 2", "DAMAC Lagoons", "Deira",
  "DIFC (Dubai International Financial Centre)", "Discovery Gardens",
  "Downtown Dubai", "Dubai Creek Harbour", "Dubai Festival City",
  "Dubai Healthcare City", "Dubai Hills Estate",
  "Dubai Investment Park (DIP)", "Dubai Islands",
  "Dubai Land Residence Complex (DLRC)", "Dubai Marina",
  "Dubai Production City (IMPZ)", "Dubai Silicon Oasis (DSO)",
  "Dubai South", "Dubai Sports City", "Dubai Studio City", "Dubailand",
  "Emirates Hills", "Expo City", "Falcon City of Wonders",
  "Green Community", "Hor Al Anz", "International City",
  "Jebel Ali Village", "Jumeirah", "Jumeirah Beach Residence (JBR)",
  "Jumeirah Golf Estates", "Jumeirah Heights", "Jumeirah Islands",
  "Jumeirah Lake Towers (JLT)", "Jumeirah Park",
  "Jumeirah Village Circle (JVC)", "Jumeirah Village Triangle (JVT)",
  "Layan", "Liwan", "Majan", "Meydan City", "Mina Rashid", "Mirdif",
  "Motor City", "Mudon", "Muhaisnah", "Nad Al Sheba", "Oud Al Muteena",
  "Oud Metha", "Palm Jebel Ali", "Palm Jumeirah", "Pearl Jumeirah",
  "Port de La Mer", "Ras Al Khor", "Remraam", "Serena",
  "Sheikh Zayed Road", "Sobha Hartland", "The Gardens", "The Lakes",
  "The Meadows", "The Springs", "The Sustainable City", "The Valley",
  "The Views", "The Villa", "Town Square", "Umm Al Sheif", "Umm Hurair",
  "Umm Suqeim", "Wadi Al Safa", "Warsan", "World Islands", "Zabeel",
];

// 130+ UAE schools (Dubai, Abu Dhabi, Sharjah, Ras Al Khaimah).
const UAE_SCHOOLS = [
  // GEMS network
  "GEMS Wellington Academy — Al Khail",
  "GEMS Wellington Academy — Silicon Oasis",
  "GEMS Wellington International School",
  "GEMS Wellington Primary School",
  "GEMS World Academy",
  "GEMS Modern Academy",
  "GEMS FirstPoint School",
  "GEMS Founders School — Al Barsha",
  "GEMS Founders School — Mizhar",
  "GEMS Royal Dubai School",
  "GEMS Metropole School",
  "GEMS Metropole School — Al Waha",
  "GEMS Winchester School — Dubai",
  "GEMS Winchester School — Jebel Ali",
  "GEMS Winchester School — Oud Metha",
  "GEMS Jumeirah Primary School",
  "GEMS New Millennium School",
  "GEMS Our Own English High School",
  "GEMS Our Own Indian School",
  "GEMS Heritage Indian School",
  "GEMS Millennium School",
  "GEMS Modern Academy Abu Dhabi",
  "GEMS National School of Dubai",
  "GEMS United Indian School",
  "GEMS Westminster School — Dubai",
  "GEMS Westminster School — Ras Al Khaimah",
  "GEMS International School — Al Khail",
  "GEMS Dubai American Academy",
  "GEMS American Academy Abu Dhabi",
  "GEMS Cambridge International School — Sharjah",
  "GEMS Cambridge International Private School — Abu Dhabi",

  // British curriculum
  "Repton School Dubai",
  "Repton School Abu Dhabi",
  "Repton Al Barsha",
  "Cranleigh Abu Dhabi",
  "Cranleigh School",
  "Brighton College Dubai",
  "Brighton College Abu Dhabi",
  "Brighton College Al Ain",
  "Dubai British School — Jumeirah Park",
  "Dubai British School — Emirates Hills",
  "Dubai British Foundation",
  "Dubai English Speaking College",
  "Dubai English Speaking School",
  "Dubai College",
  "Jumeirah College",
  "JESS Arabian Ranches",
  "JESS Jumeirah",
  "Hartland International School",
  "Sunmarke School",
  "Safa British School",
  "Safa Community School",
  "Horizon English School",
  "Horizon International School",
  "Kings' School Al Barsha",
  "Kings' School Dubai",
  "Kings' School Nad Al Sheba",
  "Deira International School",
  "Deira Private School",
  "Dubai Heights Academy",
  "Dubai Gem Private School",
  "Formarke Hall Dubai",
  "Clarion School",
  "Victory Heights Primary School",
  "Nord Anglia International School Dubai",
  "Nord Anglia International School Abu Dhabi",
  "The English College Dubai",
  "The Aquila School",
  "The Arbor School",
  "The Wonder Years Nursery",
  "Regent International School",

  // IB curriculum
  "Dubai International Academy — Emirates Hills",
  "Dubai International Academy — Al Barsha",
  "Dwight School Dubai",
  "Uptown International School",
  "Uptown School — Mirdif",
  "Raffles World Academy",
  "Raffles International School",
  "Swiss International Scientific School Dubai",
  "Greenfield International School",
  "Universal American School",

  // American curriculum
  "American School of Dubai",
  "American Academy for Girls",
  "American Community School",
  "Dubai American Academy",
  "Collegiate American School",
  "American International School Abu Dhabi",
  "American Community School of Abu Dhabi",

  // Indian curriculum
  "The Indian High School — Dubai",
  "The Indian High School — Branch",
  "Delhi Private School — Dubai",
  "Delhi Private School — Sharjah",
  "JSS Private School",
  "JSS International School",
  "Modern High School International",
  "Indian Academy Dubai",
  "Our Own English High School",
  "Our Own Indian School",
  "Pakistan Education Academy",
  "Shining Star International School",
  "New Indian Model School",
  "The Kindergarten Starters",

  // French / German / Japanese / Others
  "Lycée Georges Pompidou",
  "Lycée Français International — Dubai",
  "German International School Dubai",
  "Japanese School Dubai",
  "Scholars International Academy",
  "International School of Arts and Sciences",
  "International School of Choueifat — Dubai",
  "International School of Choueifat — Abu Dhabi",
  "International School of Creative Science",
  "International Concept for Education",

  // Abu Dhabi
  "Aldar Academies — Al Yasmina Academy",
  "Aldar Academies — Al Bateen Academy",
  "Aldar Academies — Al Mamoura Academy",
  "Aldar Academies — Al Muna Primary Academy",
  "Aldar Academies — Pearl Academy",
  "Aldar Academies — West Yas Academy",
  "Raha International School",
  "Yasmina British Academy",
  "The British International School Abu Dhabi",
  "The Sheikh Zayed Private Academy",

  // Sharjah / RAK
  "Wesgreen International School",
  "Sharjah American International School",
  "Sharjah English School",
  "Victoria English School",
  "RAK Academy",
  "RAK English Speaking School",

  // Star / chain schools
  "Star International School — Mirdif",
  "Star International School — Umm Sheif",
  "Star International School — Al Twar",

  // Alternatives
  "Home Schooling",
  "Online School",
];

const YEAR_GROUPS: { value: string; label: string }[] = [
  { value: "FS1", label: "FS1 / Nursery" },
  { value: "FS2", label: "FS2 / KG1" },
  { value: "Y1",  label: "Y1 / Grade K" },
  { value: "Y2",  label: "Y2 / Grade 1" },
  { value: "Y3",  label: "Y3 / Grade 2" },
  { value: "Y4",  label: "Y4 / Grade 3" },
  { value: "Y5",  label: "Y5 / Grade 4" },
  { value: "Y6",  label: "Y6 / Grade 5" },
  { value: "Y7",  label: "Y7 / Grade 6" },
  { value: "Y8",  label: "Y8 / Grade 7" },
  { value: "Y9",  label: "Y9 / Grade 8" },
  { value: "Y10", label: "Y10 / Grade 9" },
  { value: "Y11", label: "Y11 / Grade 10" },
  { value: "Y12", label: "Y12 / Grade 11" },
  { value: "Y13", label: "Y13 / Grade 12" },
];

const GENDER_OPTIONS = ["Male", "Female"];

// Common country dial codes shown first, then alphabetical.
type DialOption = { code: string; country: string; flag: string };

const COMMON_DIAL_CODES: DialOption[] = [
  { code: "+971", country: "United Arab Emirates", flag: "🇦🇪" },
  { code: "+44",  country: "United Kingdom",       flag: "🇬🇧" },
  { code: "+1",   country: "United States / Canada", flag: "🇺🇸" },
  { code: "+91",  country: "India",                flag: "🇮🇳" },
  { code: "+92",  country: "Pakistan",             flag: "🇵🇰" },
  { code: "+961", country: "Lebanon",              flag: "🇱🇧" },
  { code: "+20",  country: "Egypt",                flag: "🇪🇬" },
  { code: "+962", country: "Jordan",               flag: "🇯🇴" },
];

const OTHER_DIAL_CODES: DialOption[] = [
  { code: "+93",  country: "Afghanistan",     flag: "🇦🇫" },
  { code: "+355", country: "Albania",         flag: "🇦🇱" },
  { code: "+213", country: "Algeria",         flag: "🇩🇿" },
  { code: "+54",  country: "Argentina",       flag: "🇦🇷" },
  { code: "+374", country: "Armenia",         flag: "🇦🇲" },
  { code: "+61",  country: "Australia",       flag: "🇦🇺" },
  { code: "+43",  country: "Austria",         flag: "🇦🇹" },
  { code: "+994", country: "Azerbaijan",      flag: "🇦🇿" },
  { code: "+973", country: "Bahrain",         flag: "🇧🇭" },
  { code: "+880", country: "Bangladesh",      flag: "🇧🇩" },
  { code: "+375", country: "Belarus",         flag: "🇧🇾" },
  { code: "+32",  country: "Belgium",         flag: "🇧🇪" },
  { code: "+55",  country: "Brazil",          flag: "🇧🇷" },
  { code: "+359", country: "Bulgaria",        flag: "🇧🇬" },
  { code: "+855", country: "Cambodia",        flag: "🇰🇭" },
  { code: "+86",  country: "China",           flag: "🇨🇳" },
  { code: "+57",  country: "Colombia",        flag: "🇨🇴" },
  { code: "+385", country: "Croatia",         flag: "🇭🇷" },
  { code: "+357", country: "Cyprus",          flag: "🇨🇾" },
  { code: "+420", country: "Czech Republic",  flag: "🇨🇿" },
  { code: "+45",  country: "Denmark",         flag: "🇩🇰" },
  { code: "+593", country: "Ecuador",         flag: "🇪🇨" },
  { code: "+372", country: "Estonia",         flag: "🇪🇪" },
  { code: "+251", country: "Ethiopia",        flag: "🇪🇹" },
  { code: "+358", country: "Finland",         flag: "🇫🇮" },
  { code: "+33",  country: "France",          flag: "🇫🇷" },
  { code: "+995", country: "Georgia",         flag: "🇬🇪" },
  { code: "+49",  country: "Germany",         flag: "🇩🇪" },
  { code: "+233", country: "Ghana",           flag: "🇬🇭" },
  { code: "+30",  country: "Greece",          flag: "🇬🇷" },
  { code: "+852", country: "Hong Kong",       flag: "🇭🇰" },
  { code: "+36",  country: "Hungary",         flag: "🇭🇺" },
  { code: "+354", country: "Iceland",         flag: "🇮🇸" },
  { code: "+62",  country: "Indonesia",       flag: "🇮🇩" },
  { code: "+98",  country: "Iran",            flag: "🇮🇷" },
  { code: "+964", country: "Iraq",            flag: "🇮🇶" },
  { code: "+353", country: "Ireland",         flag: "🇮🇪" },
  { code: "+972", country: "Israel",          flag: "🇮🇱" },
  { code: "+39",  country: "Italy",           flag: "🇮🇹" },
  { code: "+81",  country: "Japan",           flag: "🇯🇵" },
  { code: "+254", country: "Kenya",           flag: "🇰🇪" },
  { code: "+965", country: "Kuwait",          flag: "🇰🇼" },
  { code: "+371", country: "Latvia",          flag: "🇱🇻" },
  { code: "+218", country: "Libya",           flag: "🇱🇾" },
  { code: "+370", country: "Lithuania",       flag: "🇱🇹" },
  { code: "+352", country: "Luxembourg",      flag: "🇱🇺" },
  { code: "+60",  country: "Malaysia",        flag: "🇲🇾" },
  { code: "+356", country: "Malta",           flag: "🇲🇹" },
  { code: "+230", country: "Mauritius",       flag: "🇲🇺" },
  { code: "+52",  country: "Mexico",          flag: "🇲🇽" },
  { code: "+212", country: "Morocco",         flag: "🇲🇦" },
  { code: "+95",  country: "Myanmar",         flag: "🇲🇲" },
  { code: "+977", country: "Nepal",           flag: "🇳🇵" },
  { code: "+31",  country: "Netherlands",     flag: "🇳🇱" },
  { code: "+64",  country: "New Zealand",     flag: "🇳🇿" },
  { code: "+234", country: "Nigeria",         flag: "🇳🇬" },
  { code: "+47",  country: "Norway",          flag: "🇳🇴" },
  { code: "+968", country: "Oman",            flag: "🇴🇲" },
  { code: "+507", country: "Panama",          flag: "🇵🇦" },
  { code: "+51",  country: "Peru",            flag: "🇵🇪" },
  { code: "+63",  country: "Philippines",     flag: "🇵🇭" },
  { code: "+48",  country: "Poland",          flag: "🇵🇱" },
  { code: "+351", country: "Portugal",        flag: "🇵🇹" },
  { code: "+974", country: "Qatar",           flag: "🇶🇦" },
  { code: "+40",  country: "Romania",         flag: "🇷🇴" },
  { code: "+7",   country: "Russia",          flag: "🇷🇺" },
  { code: "+966", country: "Saudi Arabia",    flag: "🇸🇦" },
  { code: "+221", country: "Senegal",         flag: "🇸🇳" },
  { code: "+381", country: "Serbia",          flag: "🇷🇸" },
  { code: "+65",  country: "Singapore",       flag: "🇸🇬" },
  { code: "+421", country: "Slovakia",        flag: "🇸🇰" },
  { code: "+386", country: "Slovenia",        flag: "🇸🇮" },
  { code: "+27",  country: "South Africa",    flag: "🇿🇦" },
  { code: "+82",  country: "South Korea",     flag: "🇰🇷" },
  { code: "+34",  country: "Spain",           flag: "🇪🇸" },
  { code: "+94",  country: "Sri Lanka",       flag: "🇱🇰" },
  { code: "+249", country: "Sudan",           flag: "🇸🇩" },
  { code: "+46",  country: "Sweden",          flag: "🇸🇪" },
  { code: "+41",  country: "Switzerland",     flag: "🇨🇭" },
  { code: "+963", country: "Syria",           flag: "🇸🇾" },
  { code: "+886", country: "Taiwan",          flag: "🇹🇼" },
  { code: "+255", country: "Tanzania",        flag: "🇹🇿" },
  { code: "+66",  country: "Thailand",        flag: "🇹🇭" },
  { code: "+216", country: "Tunisia",         flag: "🇹🇳" },
  { code: "+90",  country: "Turkey",          flag: "🇹🇷" },
  { code: "+256", country: "Uganda",          flag: "🇺🇬" },
  { code: "+380", country: "Ukraine",         flag: "🇺🇦" },
  { code: "+598", country: "Uruguay",         flag: "🇺🇾" },
  { code: "+58",  country: "Venezuela",       flag: "🇻🇪" },
  { code: "+84",  country: "Vietnam",         flag: "🇻🇳" },
  { code: "+967", country: "Yemen",           flag: "🇾🇪" },
  { code: "+260", country: "Zambia",          flag: "🇿🇲" },
  { code: "+263", country: "Zimbabwe",        flag: "🇿🇼" },
];

const DIAL_CODES: DialOption[] = [
  ...COMMON_DIAL_CODES,
  ...[...OTHER_DIAL_CODES].sort((a, b) => a.country.localeCompare(b.country)),
];

export const NATIONALITIES = [
  "Afghan", "Albanian", "Algerian", "American", "Andorran", "Angolan",
  "Argentine", "Armenian", "Australian", "Austrian", "Azerbaijani",
  "Bahraini", "Bangladeshi", "Belarusian", "Belgian", "Beninese", "Bhutanese",
  "Bolivian", "Bosnian", "Botswanan", "Brazilian", "British", "Bruneian",
  "Bulgarian", "Burkinabé", "Burmese", "Burundian", "Cambodian", "Cameroonian",
  "Canadian", "Cape Verdean", "Central African", "Chadian", "Chilean",
  "Chinese", "Colombian", "Comoran", "Congolese", "Costa Rican", "Croatian",
  "Cuban", "Cypriot", "Czech", "Danish", "Djiboutian", "Dominican",
  "Dutch", "Ecuadorian", "Egyptian", "Emirati", "Equatorial Guinean",
  "Eritrean", "Estonian", "Ethiopian", "Fijian", "Filipino", "Finnish",
  "French", "Gabonese", "Gambian", "Georgian", "German", "Ghanaian",
  "Greek", "Grenadian", "Guatemalan", "Guinean", "Guyanese", "Haitian",
  "Honduran", "Hungarian", "Icelandic", "Indian", "Indonesian", "Iranian",
  "Iraqi", "Irish", "Israeli", "Italian", "Ivorian", "Jamaican", "Japanese",
  "Jordanian", "Kazakh", "Kenyan", "Kiribati", "Kosovan", "Kuwaiti",
  "Kyrgyz", "Lao", "Latvian", "Lebanese", "Liberian", "Libyan",
  "Liechtensteiner", "Lithuanian", "Luxembourger", "Macedonian", "Malagasy",
  "Malawian", "Malaysian", "Maldivian", "Malian", "Maltese", "Marshallese",
  "Mauritanian", "Mauritian", "Mexican", "Micronesian", "Moldovan",
  "Monégasque", "Mongolian", "Montenegrin", "Moroccan", "Mozambican",
  "Namibian", "Nauruan", "Nepali", "New Zealander", "Nicaraguan", "Nigerian",
  "Nigerien", "North Korean", "Norwegian", "Omani", "Pakistani", "Palauan",
  "Palestinian", "Panamanian", "Papua New Guinean", "Paraguayan", "Peruvian",
  "Polish", "Portuguese", "Qatari", "Romanian", "Russian", "Rwandan",
  "Saint Lucian", "Salvadoran", "Sammarinese", "Samoan", "São Toméan",
  "Saudi", "Scottish", "Senegalese", "Serbian", "Seychellois", "Sierra Leonean",
  "Singaporean", "Slovak", "Slovenian", "Solomon Islander", "Somali",
  "South African", "South Korean", "South Sudanese", "Spanish", "Sri Lankan",
  "Sudanese", "Surinamese", "Swazi", "Swedish", "Swiss", "Syrian", "Taiwanese",
  "Tajik", "Tanzanian", "Thai", "Timorese", "Togolese", "Tongan",
  "Trinidadian", "Tunisian", "Turkish", "Turkmen", "Tuvaluan", "Ugandan",
  "Ukrainian", "Uruguayan", "Uzbek", "Vanuatuan", "Vatican", "Venezuelan",
  "Vietnamese", "Welsh", "Yemeni", "Zambian", "Zimbabwean",
];

const RELATIONSHIP_OPTIONS = [
  "Mother", "Father", "Grandparent", "Uncle", "Aunt", "Legal Guardian", "Other",
];

const COMMS_CHANNELS = ["WhatsApp", "Email", "Phone", "SMS"] as const;
export type CommsChannel = (typeof COMMS_CHANNELS)[number];

export type Department = "Primary" | "Lower Secondary" | "Senior";

function departmentForYear(year: string): Department {
  if (["FS1", "FS2", "Y1", "Y2", "Y3", "Y4", "Y5", "Y6"].includes(year)) return "Primary";
  if (["Y7", "Y8", "Y9"].includes(year)) return "Lower Secondary";
  return "Senior";
}

function departmentBadgeClass(dept: Department | ""): string {
  if (dept === "Primary") return "bg-teal-50 border-teal-200 text-teal-700";
  if (dept === "Lower Secondary") return "bg-amber-50 border-amber-200 text-amber-800";
  if (dept === "Senior") return "bg-violet-50 border-violet-200 text-violet-700";
  return "bg-slate-50 border-slate-200 text-slate-400";
}

function yearGroupLabel(value: string): string {
  return YEAR_GROUPS.find((y) => y.value === value)?.label ?? value;
}

function calcAge(dobIso: string): number | null {
  if (!dobIso) return null;
  const [y, m, d] = dobIso.split("-").map(Number);
  if (!y || !m || !d) return null;
  const birth = new Date(y, m - 1, d);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const md = today.getMonth() - birth.getMonth();
  if (md < 0 || (md === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function formatDobDisplay(dobIso: string): string {
  if (!dobIso) return "—";
  const [y, m, d] = dobIso.split("-");
  if (!y || !m || !d) return dobIso;
  return `${d}/${m}/${y}`;
}

function isKhdaYear(year: string): boolean {
  return year === "FS1" || year === "FS2";
}

// Title-case names. Capitalises the first letter of each word and after
// hyphens/apostrophes (e.g. "al-rashidi" → "Al-Rashidi", "o'neill" → "O'Neill").
function toTitleCase(input: string): string {
  return input
    .toLowerCase()
    .replace(/(^|[\s\-'’])(\p{L})/gu, (_m, sep: string, ch: string) => sep + ch.toUpperCase());
}

// UAE academic year runs Sep–Aug. Age is calculated as of 1 September of the
// current academic year. FS1=3, FS2=4, Y1=5 … Y13=17.
function suggestedYearGroup(dobIso: string, today: Date = new Date()): string {
  if (!dobIso) return "";
  const [y, m, d] = dobIso.split("-").map(Number);
  if (!y || !m || !d) return "";
  const birth = new Date(y, m - 1, d);
  if (Number.isNaN(birth.getTime())) return "";
  const yearStart =
    today.getMonth() >= 8
      ? new Date(today.getFullYear(), 8, 1)
      : new Date(today.getFullYear() - 1, 8, 1);
  let age = yearStart.getFullYear() - birth.getFullYear();
  const md = yearStart.getMonth() - birth.getMonth();
  if (md < 0 || (md === 0 && yearStart.getDate() < birth.getDate())) age--;
  const idx = age - 3;
  if (idx < 0 || idx >= YEAR_GROUPS.length) return "";
  return YEAR_GROUPS[idx].value;
}

// ─── Phone helpers ────────────────────────────────────────────────────────────

const UAE_VALID_PREFIXES = ["50", "55", "58"] as const;
const UAE_PHONE_ERROR =
  "Enter a valid UAE mobile number starting with 50, 55, or 58";
const GENERIC_PHONE_ERROR =
  "Enter a valid phone number (7–12 digits)";

// Returns the cleaned digits-only national number. Strips a single leading 0
// (common when users type the local trunk prefix). Does NOT format.
function cleanPhoneDigits(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  return digits.startsWith("0") ? digits.replace(/^0+/, "") : digits;
}

// Format a national number based on the dial code. UAE → "XX XXX XXXX",
// others → space every 3–4 digits for readability.
function formatNationalNumber(dialCode: string, raw: string): string {
  const digits = cleanPhoneDigits(raw);
  if (!digits) return "";
  if (dialCode === "+971") {
    const d = digits.slice(0, 9);
    if (d.length <= 2) return d;
    if (d.length <= 5) return `${d.slice(0, 2)} ${d.slice(2)}`;
    return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5)}`;
  }
  // Generic grouping: 3-3-3-3
  return digits.match(/.{1,3}/g)?.join(" ") ?? digits;
}

function validatePhone(dialCode: string, raw: string): string | null {
  const digits = cleanPhoneDigits(raw);
  if (!digits) return null; // emptiness handled by required-field check
  if (dialCode === "+971") {
    if (digits.length !== 9) return UAE_PHONE_ERROR;
    if (!UAE_VALID_PREFIXES.some((p) => digits.startsWith(p))) return UAE_PHONE_ERROR;
    return null;
  }
  if (digits.length < 7 || digits.length > 12) return GENERIC_PHONE_ERROR;
  return null;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GuardianData {
  firstName: string;
  lastName: string;
  relationship: string;
  nationality: string;
  dialCode: string;       // e.g. "+971"
  phone: string;          // local part, formatted (e.g. "50 558 6300")
  isWhatsApp: boolean;
  whatsAppDialCode?: string;
  whatsAppNumber?: string;
  email: string;
  homeArea: string;
  preferredChannel: CommsChannel;
}

export interface NewStudentData {
  firstName: string;
  lastName: string;
  preferredName: string;
  dob: string;
  age: number | null;
  gender: string;
  nationality: string;
  photoDataUrl: string | null;
  yearGroup: string;
  yearGroupLabel: string;
  department: Department;
  school: string;
  khdaFlag: boolean;
  primaryGuardian: GuardianData;
  secondaryGuardian?: GuardianData;
  internalNotes: string;
}

interface ExistingStudent {
  id: string;
  name: string;
}

// ─── Field primitives ─────────────────────────────────────────────────────────

const FIELD =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 disabled:bg-slate-50 disabled:text-slate-500";

const FIELD_ERROR =
  "border-red-300 focus:ring-red-300 focus:border-red-400";

function Label({
  children,
  required,
  htmlFor,
  hint,
}: {
  children: React.ReactNode;
  required?: boolean;
  htmlFor?: string;
  hint?: string;
}) {
  return (
    <label htmlFor={htmlFor} className="block mb-1.5">
      <span className="text-xs font-semibold text-slate-700">
        {children}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </span>
      {hint && <span className="ml-2 text-[11px] text-slate-400 font-normal">{hint}</span>}
    </label>
  );
}

function Switch({
  checked,
  onCheckedChange,
  disabled,
  id,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  disabled?: boolean;
  id?: string;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors cursor-pointer",
        checked ? "bg-amber-500" : "bg-slate-300",
        disabled && "opacity-50 cursor-not-allowed",
      )}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-4" : "translate-x-0.5",
        )}
      />
    </button>
  );
}

// ─── Searchable school select ─────────────────────────────────────────────────

function SchoolSelect({
  value,
  onChange,
  error,
  onAddOther,
  hasOther,
}: {
  value: string;
  onChange: (v: string) => void;
  error?: boolean;
  onAddOther: () => void;
  hasOther: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const q = query.trim().toLowerCase();
  const filtered = q ? UAE_SCHOOLS.filter((s) => s.toLowerCase().includes(q)) : UAE_SCHOOLS;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "w-full flex items-center justify-between rounded-lg border bg-white px-3 py-2 text-sm text-left focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 cursor-pointer",
          error ? "border-red-300" : "border-slate-300",
          !value && "text-slate-400",
        )}
      >
        <span className="truncate">{value || "Search or select school…"}</span>
        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type to filter schools…"
                className="w-full pl-7 pr-2 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400"
              />
            </div>
          </div>
          <ul className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-slate-400">No matches</li>
            ) : (
              filtered.map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(s);
                      setOpen(false);
                      setQuery("");
                    }}
                    className={cn(
                      "w-full text-left px-3 py-1.5 text-sm hover:bg-amber-50 cursor-pointer",
                      value === s && "bg-amber-50 text-amber-700 font-medium",
                    )}
                  >
                    {s}
                  </button>
                </li>
              ))
            )}
          </ul>
          <div className="border-t border-slate-100 bg-slate-50/60">
            <button
              type="button"
              onClick={() => {
                onAddOther();
                setOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 text-sm font-medium cursor-pointer transition-colors",
                hasOther ? "text-amber-700" : "text-slate-600 hover:text-amber-700 hover:bg-amber-50",
              )}
            >
              <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[10px] font-bold">
                +
              </span>
              {hasOther ? "Edit custom school name" : "Add other (free text)"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Step indicator ───────────────────────────────────────────────────────────

const STEP_TITLES = [
  "Student Identity",
  "Academic Placement",
  "Guardian Details",
  "Review & Confirm",
];

function StepCircles({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-2">
      {[1, 2, 3, 4].map((n, i) => {
        const done = n < step;
        const current = n === step;
        return (
          <div key={n} className="flex items-center gap-2 flex-1">
            <div
              className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors",
                done && "bg-amber-500 text-white",
                current && "bg-white text-amber-600 ring-2 ring-amber-500 ring-offset-2 ring-offset-white",
                !done && !current && "bg-slate-100 text-slate-400 border border-slate-200",
              )}
            >
              {done ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : n}
            </div>
            {i < 3 && (
              <div
                className={cn(
                  "h-0.5 flex-1 rounded transition-colors",
                  done ? "bg-amber-500" : "bg-slate-200",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Searchable nationality select ────────────────────────────────────────────

function NationalitySelect({
  value,
  onChange,
  error,
  id,
  placeholder = "Search nationality…",
}: {
  value: string;
  onChange: (v: string) => void;
  error?: boolean;
  id?: string;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const q = query.trim().toLowerCase();
  const filtered = q ? NATIONALITIES.filter((n) => n.toLowerCase().includes(q)) : NATIONALITIES;

  return (
    <div ref={ref} className="relative">
      <button
        id={id}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "w-full flex items-center justify-between rounded-lg border bg-white px-3 py-2 text-sm text-left focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 cursor-pointer",
          error ? "border-red-300" : "border-slate-300",
          !value && "text-slate-400",
        )}
      >
        <span className="truncate">{value || placeholder}</span>
        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type to filter nationalities…"
                className="w-full pl-7 pr-2 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400"
              />
            </div>
          </div>
          <ul className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-slate-400">No matches</li>
            ) : (
              filtered.map((n) => (
                <li key={n}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(n);
                      setOpen(false);
                      setQuery("");
                    }}
                    className={cn(
                      "w-full text-left px-3 py-1.5 text-sm hover:bg-amber-50 cursor-pointer",
                      value === n && "bg-amber-50 text-amber-700 font-medium",
                    )}
                  >
                    {n}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Country dial-code select ─────────────────────────────────────────────────

function CountryCodeSelect({
  value,
  onChange,
  compact = false,
}: {
  value: string;
  onChange: (v: string) => void;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected =
    DIAL_CODES.find((d) => d.code === value) ?? DIAL_CODES[0];

  const q = query.trim().toLowerCase();
  const filtered = q
    ? DIAL_CODES.filter(
        (d) =>
          d.country.toLowerCase().includes(q) ||
          d.code.includes(q.replace(/[^\d+]/g, "")),
      )
    : DIAL_CODES;

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Select country dialling code"
        className={cn(
          "flex items-center gap-1 pl-3 pr-2 py-2 text-sm font-medium text-slate-700 border-r border-slate-200 bg-slate-50 rounded-l-lg hover:bg-slate-100 cursor-pointer",
        )}
      >
        <span className="text-base leading-none">{selected.flag}</span>
        {!compact && <span className="text-xs">{selected.code}</span>}
        <ChevronDown className="w-3 h-3 text-slate-400" />
      </button>
      {open && (
        <div className="absolute left-0 z-50 mt-1 w-64 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search country or code…"
                className="w-full pl-7 pr-2 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400"
              />
            </div>
          </div>
          <ul className="max-h-60 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-slate-400">No matches</li>
            ) : (
              filtered.map((d, i) => {
                const isCommonBoundary =
                  !q && i === COMMON_DIAL_CODES.length;
                return (
                  <li
                    key={`${d.code}-${d.country}`}
                    className={cn(isCommonBoundary && "border-t border-slate-100 mt-1 pt-1")}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onChange(d.code);
                        setOpen(false);
                        setQuery("");
                      }}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-amber-50 cursor-pointer",
                        value === d.code && "bg-amber-50 text-amber-700 font-medium",
                      )}
                    >
                      <span className="text-base leading-none">{d.flag}</span>
                      <span className="flex-1 text-left truncate">{d.country}</span>
                      <span className="text-slate-500 text-xs">{d.code}</span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Phone input with dial-code picker + blur formatting ──────────────────────

function PhoneInput({
  id,
  dialCode,
  onDialCodeChange,
  value,
  onChange,
  placeholder = "50 123 4567",
  error,
}: {
  id?: string;
  dialCode: string;
  onDialCodeChange: (v: string) => void;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: boolean;
}) {
  const [localError, setLocalError] = useState<string | null>(null);

  function handleBlur() {
    const formatted = formatNationalNumber(dialCode, value);
    if (formatted !== value) onChange(formatted);
    setLocalError(validatePhone(dialCode, value));
  }

  function handleDialCodeChange(next: string) {
    onDialCodeChange(next);
    if (value) {
      const formatted = formatNationalNumber(next, value);
      if (formatted !== value) onChange(formatted);
      setLocalError(validatePhone(next, value));
    } else {
      setLocalError(null);
    }
  }

  const showError = Boolean(localError) || Boolean(error);

  return (
    <div>
      <div
        className={cn(
          "flex items-stretch rounded-lg border bg-white focus-within:ring-2 focus-within:ring-amber-400 focus-within:border-amber-400",
          showError ? "border-red-300" : "border-slate-300",
        )}
      >
        <CountryCodeSelect value={dialCode} onChange={handleDialCodeChange} />
        <input
          id={id}
          type="tel"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (localError) setLocalError(null);
          }}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 text-sm bg-transparent focus:outline-none min-w-0"
        />
      </div>
      {localError && (
        <p className="mt-1 flex items-start gap-1 text-[11px] text-red-600">
          <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
          {localError}
        </p>
      )}
    </div>
  );
}

// ─── Guardian form ────────────────────────────────────────────────────────────

function emptyGuardian(): GuardianData {
  return {
    firstName: "",
    lastName: "",
    relationship: "",
    nationality: "",
    dialCode: "+971",
    phone: "",
    isWhatsApp: true,
    whatsAppDialCode: "+971",
    whatsAppNumber: "",
    email: "",
    homeArea: "",
    preferredChannel: "WhatsApp",
  };
}

function GuardianForm({
  value,
  onChange,
  errors,
  idPrefix,
  role,
}: {
  value: GuardianData;
  onChange: (v: GuardianData) => void;
  errors: Record<string, string>;
  idPrefix: string;
  role: "primary" | "secondary";
}) {
  function patch(p: Partial<GuardianData>) {
    onChange({ ...value, ...p });
  }

  const firstNamePlaceholder = role === "primary" ? "e.g. Thomas" : "e.g. Alfred";
  const lastNamePlaceholder = role === "primary" ? "e.g. Wayne" : "e.g. Pennyworth";

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor={`${idPrefix}-fn`} required>First name</Label>
          <input
            id={`${idPrefix}-fn`}
            type="text"
            value={value.firstName}
            onChange={(e) => patch({ firstName: toTitleCase(e.target.value) })}
            placeholder={firstNamePlaceholder}
            className={cn(FIELD, errors[`${idPrefix}.firstName`] && FIELD_ERROR)}
          />
        </div>
        <div>
          <Label htmlFor={`${idPrefix}-ln`} required>Last name</Label>
          <input
            id={`${idPrefix}-ln`}
            type="text"
            value={value.lastName}
            onChange={(e) => patch({ lastName: toTitleCase(e.target.value) })}
            placeholder={lastNamePlaceholder}
            className={cn(FIELD, errors[`${idPrefix}.lastName`] && FIELD_ERROR)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor={`${idPrefix}-rel`} required>Relationship</Label>
          <select
            id={`${idPrefix}-rel`}
            value={value.relationship}
            onChange={(e) => patch({ relationship: e.target.value })}
            className={cn(FIELD, errors[`${idPrefix}.relationship`] && FIELD_ERROR)}
          >
            <option value="">Select…</option>
            {RELATIONSHIP_OPTIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor={`${idPrefix}-nat`} required>Nationality</Label>
          <NationalitySelect
            id={`${idPrefix}-nat`}
            value={value.nationality}
            onChange={(v) => patch({ nationality: v })}
            error={Boolean(errors[`${idPrefix}.nationality`])}
          />
        </div>
      </div>

      <div>
        <Label htmlFor={`${idPrefix}-phone`} required>Primary phone</Label>
        <PhoneInput
          id={`${idPrefix}-phone`}
          dialCode={value.dialCode || "+971"}
          onDialCodeChange={(v) => patch({ dialCode: v })}
          value={value.phone}
          onChange={(v) => patch({ phone: v })}
          error={Boolean(errors[`${idPrefix}.phone`])}
        />
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <label htmlFor={`${idPrefix}-wa`} className="flex items-center gap-2 cursor-pointer">
            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-xs font-semibold text-slate-700">
              Primary phone is a WhatsApp number
            </span>
          </label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">
              {value.isWhatsApp ? "Yes" : "No"}
            </span>
            <Switch
              id={`${idPrefix}-wa`}
              checked={value.isWhatsApp}
              onCheckedChange={(v) =>
                patch({ isWhatsApp: v, whatsAppNumber: v ? "" : value.whatsAppNumber })
              }
            />
          </div>
        </div>
        {!value.isWhatsApp && (
          <>
            <PhoneInput
              dialCode={value.whatsAppDialCode || value.dialCode || "+971"}
              onDialCodeChange={(v) => patch({ whatsAppDialCode: v })}
              value={value.whatsAppNumber ?? ""}
              onChange={(v) => patch({ whatsAppNumber: v })}
              placeholder="Separate WhatsApp number"
              error={Boolean(errors[`${idPrefix}.whatsAppNumber`])}
            />
            <p className="flex items-start gap-1.5 text-[11px] text-amber-700">
              <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
              Without a WhatsApp number, this guardian will only receive communications via
              their selected channel.
            </p>
          </>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor={`${idPrefix}-email`} required>Email</Label>
          <input
            id={`${idPrefix}-email`}
            type="email"
            value={value.email}
            onChange={(e) => patch({ email: e.target.value })}
            placeholder="e.g. parent@gmail.com"
            className={cn(FIELD, errors[`${idPrefix}.email`] && FIELD_ERROR)}
          />
        </div>
        <div>
          <Label htmlFor={`${idPrefix}-area`}>Home area / district</Label>
          <select
            id={`${idPrefix}-area`}
            value={value.homeArea}
            onChange={(e) => patch({ homeArea: e.target.value })}
            className={FIELD}
          >
            <option value="">Select…</option>
            {DUBAI_AREAS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
            <option value="Outside Dubai / Other">Outside Dubai / Other</option>
          </select>
        </div>
      </div>

      <div>
        <Label htmlFor={`${idPrefix}-ch`} required>Preferred comms channel</Label>
        <div className="grid grid-cols-4 gap-2">
          {COMMS_CHANNELS.map((c) => {
            const on = value.preferredChannel === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => patch({ preferredChannel: c })}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs font-semibold transition-colors cursor-pointer",
                  on
                    ? "border-amber-400 bg-amber-50 text-amber-800"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
                )}
              >
                {c === "WhatsApp" && <MessageCircle className="w-3 h-3" />}
                {c === "Email" && <Mail className="w-3 h-3" />}
                {c === "Phone" && <Phone className="w-3 h-3" />}
                {c === "SMS" && <MessageCircle className="w-3 h-3" />}
                {c}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Main dialog ──────────────────────────────────────────────────────────────

export function AddStudentDialog({
  open,
  onOpenChange,
  onCreated,
  existingStudents = [],
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: (data: NewStudentData) => void;
  existingStudents?: ExistingStudent[];
}) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [preferredName, setPreferredName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [nationality, setNationality] = useState("");
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);

  // Step 2. `yearGroupExplicit` holds only what the user manually picked; the
  // effective year group falls back to the DOB-derived suggestion so it stays
  // reactive as the DOB changes without needing an effect.
  const [yearGroupExplicit, setYearGroupExplicit] = useState("");
  const [school, setSchool] = useState("");
  const [customSchool, setCustomSchool] = useState("");
  const [showCustomSchool, setShowCustomSchool] = useState(false);

  const suggestedYg = useMemo(() => suggestedYearGroup(dob), [dob]);
  const yearGroup = yearGroupExplicit || suggestedYg;

  // Step 3
  const [primary, setPrimary] = useState<GuardianData>(emptyGuardian());
  const [hasSecondary, setHasSecondary] = useState(false);
  const [secondary, setSecondary] = useState<GuardianData>(emptyGuardian());
  const [internalNotes, setInternalNotes] = useState("");

  // Errors per step (set on Continue click).
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetAll = useCallback(() => {
    setStep(1);
    setFirstName("");
    setLastName("");
    setPreferredName("");
    setDob("");
    setGender("");
    setNationality("");
    setPhotoDataUrl(null);
    setYearGroupExplicit("");
    setSchool("");
    setCustomSchool("");
    setShowCustomSchool(false);
    setPrimary(emptyGuardian());
    setHasSecondary(false);
    setSecondary(emptyGuardian());
    setInternalNotes("");
    setErrors({});
  }, []);

  useEffect(() => {
    if (!open) resetAll();
  }, [open, resetAll]);

  const department = yearGroup ? departmentForYear(yearGroup) : "";
  const khdaFlag = isKhdaYear(yearGroup);
  const age = calcAge(dob);
  const effectiveSchool = showCustomSchool ? customSchool.trim() : school;

  // Duplicate detection: match on identical full name (case-insensitive).
  const duplicates = useMemo(() => {
    const full = `${firstName} ${lastName}`.trim().toLowerCase();
    if (!full) return [] as ExistingStudent[];
    return existingStudents.filter((s) => s.name.trim().toLowerCase() === full);
  }, [firstName, lastName, existingStudents]);

  // ── Validators ─────────────────────────────────────────────────────────────

  function validateStep1(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!firstName.trim()) e.firstName = "First name is required";
    if (!lastName.trim()) e.lastName = "Last name is required";
    if (!dob) e.dob = "Date of birth is required";
    else if (age !== null && age < 0) e.dob = "Date of birth cannot be in the future";
    else if (age !== null && age > 25) e.dob = "Please verify the date of birth";
    if (!gender) e.gender = "Gender is required";
    if (!nationality.trim()) e.nationality = "Nationality is required";
    return e;
  }

  function validateStep2(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!yearGroup) e.yearGroup = "Year group is required";
    if (!effectiveSchool) e.school = "School is required";
    if (showCustomSchool && !customSchool.trim()) e.school = "Custom school name is required";
    return e;
  }

  function validateGuardian(g: GuardianData, prefix: string, requireEmail: boolean) {
    const e: Record<string, string> = {};
    if (!g.firstName.trim()) e[`${prefix}.firstName`] = "Required";
    if (!g.lastName.trim()) e[`${prefix}.lastName`] = "Required";
    if (!g.relationship) e[`${prefix}.relationship`] = "Required";
    if (!g.nationality.trim()) e[`${prefix}.nationality`] = "Required";
    if (!g.phone.trim()) e[`${prefix}.phone`] = "Phone is required";
    else {
      const phoneError = validatePhone(g.dialCode || "+971", g.phone);
      if (phoneError) e[`${prefix}.phone`] = phoneError;
    }
    if (!g.isWhatsApp) {
      const waRaw = (g.whatsAppNumber ?? "").trim();
      if (!waRaw) e[`${prefix}.whatsAppNumber`] = "WhatsApp number is required when toggle is off";
      else {
        const waError = validatePhone(g.whatsAppDialCode || g.dialCode || "+971", waRaw);
        if (waError) e[`${prefix}.whatsAppNumber`] = waError;
      }
    }
    if (requireEmail && !g.email.trim()) e[`${prefix}.email`] = "Email is required";
    else if (g.email.trim() && !/^\S+@\S+\.\S+$/.test(g.email.trim()))
      e[`${prefix}.email`] = "Enter a valid email";
    return e;
  }

  function validateStep3(): Record<string, string> {
    const e = { ...validateGuardian(primary, "primary", true) };
    if (hasSecondary) Object.assign(e, validateGuardian(secondary, "secondary", false));
    return e;
  }

  const stepErrors = useMemo(
    () => Array.from(new Set(Object.values(errors).filter(Boolean))),
    [errors],
  );

  // ── Actions ────────────────────────────────────────────────────────────────

  function handleContinue() {
    let e: Record<string, string> = {};
    if (step === 1) e = validateStep1();
    else if (step === 2) e = validateStep2();
    else if (step === 3) e = validateStep3();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }
    setErrors({});
    setStep(((step + 1) as 1 | 2 | 3 | 4));
  }

  function handleBack() {
    setErrors({});
    if (step > 1) setStep(((step - 1) as 1 | 2 | 3 | 4));
  }

  function handleSave() {
    const s1 = validateStep1();
    const s2 = validateStep2();
    const s3 = validateStep3();
    const all = { ...s1, ...s2, ...s3 };
    if (Object.keys(all).length > 0) {
      setErrors(all);
      // Jump to the earliest step with errors.
      if (Object.keys(s1).length) setStep(1);
      else if (Object.keys(s2).length) setStep(2);
      else setStep(3);
      return;
    }
    const data: NewStudentData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      preferredName: preferredName.trim(),
      dob,
      age,
      gender,
      nationality: nationality.trim(),
      photoDataUrl,
      yearGroup,
      yearGroupLabel: yearGroupLabel(yearGroup),
      department: departmentForYear(yearGroup),
      school: effectiveSchool,
      khdaFlag,
      primaryGuardian: primary,
      secondaryGuardian: hasSecondary ? secondary : undefined,
      internalNotes: internalNotes.trim(),
    };
    onCreated(data);
    onOpenChange(false);
  }

  function handlePhotoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () =>
      setPhotoDataUrl(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[640px] max-w-[92vw]">
        <DialogHeader>
          <DialogTitle>Add Student</DialogTitle>
          <DialogDescription>
            Create a new student record with identity, academic placement, and guardian details.
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="px-6 pt-4 pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold text-slate-700">
              Step {step} of 4
              <span className="text-slate-400 font-normal">  ·  {STEP_TITLES[step - 1]}</span>
            </span>
          </div>
          <StepCircles step={step} />
          <div className="mt-3 h-1 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Error banner */}
        {stepErrors.length > 0 && step < 4 && (
          <div className="mx-6 mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5">
            <div className="flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-red-800 mb-0.5">
                  Please fix the following before continuing:
                </p>
                <ul className="text-xs text-red-700 list-disc pl-4 space-y-0.5">
                  {stepErrors.slice(0, 6).map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="px-6 py-5 space-y-4 max-h-[62vh] overflow-y-auto">
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="shrink-0">
                  <Label>Photo</Label>
                  <label
                    className={cn(
                      "w-20 h-20 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden cursor-pointer hover:border-amber-400 hover:bg-amber-50/40 transition-colors relative",
                      photoDataUrl && "border-solid border-amber-300",
                    )}
                  >
                    {photoDataUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photoDataUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-6 h-6 text-slate-400" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={handlePhotoChange}
                    />
                  </label>
                  {photoDataUrl && (
                    <button
                      type="button"
                      onClick={() => setPhotoDataUrl(null)}
                      className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-red-600 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      Remove
                    </button>
                  )}
                </div>

                <div className="flex-1 grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="fn" required>First name</Label>
                    <input
                      id="fn"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(toTitleCase(e.target.value))}
                      className={cn(FIELD, errors.firstName && FIELD_ERROR)}
                      placeholder="e.g. Bruce"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ln" required>Last name</Label>
                    <input
                      id="ln"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(toTitleCase(e.target.value))}
                      className={cn(FIELD, errors.lastName && FIELD_ERROR)}
                      placeholder="e.g. Wayne"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="pref" hint="Used in day-to-day communications">
                  Preferred name
                </Label>
                <input
                  id="pref"
                  type="text"
                  value={preferredName}
                  onChange={(e) => setPreferredName(toTitleCase(e.target.value))}
                  className={FIELD}
                  placeholder="e.g. Bruce"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="dob" required hint="DD/MM/YYYY">
                    Date of birth
                  </Label>
                  <div className="flex items-center gap-2">
                    <input
                      id="dob"
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className={cn(FIELD, errors.dob && FIELD_ERROR)}
                    />
                    {age !== null && age >= 0 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold whitespace-nowrap">
                        {age} yrs
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <Label htmlFor="gender" required>Gender</Label>
                  <select
                    id="gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className={cn(FIELD, errors.gender && FIELD_ERROR)}
                  >
                    <option value="">Select…</option>
                    {GENDER_OPTIONS.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="nat" required>Nationality</Label>
                <NationalitySelect
                  id="nat"
                  value={nationality}
                  onChange={setNationality}
                  error={Boolean(errors.nationality)}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="yg" required>Year group</Label>
                  <select
                    id="yg"
                    value={yearGroup}
                    onChange={(e) => setYearGroupExplicit(e.target.value)}
                    className={cn(FIELD, errors.yearGroup && FIELD_ERROR)}
                  >
                    <option value="">Select…</option>
                    {YEAR_GROUPS.map((y) => (
                      <option key={y.value} value={y.value}>{y.label}</option>
                    ))}
                  </select>
                  {suggestedYg && (
                    <p className="mt-1 text-[11px] text-slate-500">
                      Suggested based on date of birth — you can override this.
                    </p>
                  )}
                </div>
                <div>
                  <Label>Department</Label>
                  <div
                    className={cn(
                      "w-full rounded-lg border px-3 py-2 text-sm font-semibold flex items-center gap-1.5",
                      departmentBadgeClass(department),
                    )}
                  >
                    {department ? (
                      <>
                        <span
                          className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            department === "Primary" && "bg-teal-500",
                            department === "Lower Secondary" && "bg-amber-500",
                            department === "Senior" && "bg-violet-500",
                          )}
                        />
                        {department}
                        <span className="ml-auto text-[10px] font-medium opacity-70">
                          Auto-set
                        </span>
                      </>
                    ) : (
                      <span className="text-slate-400 font-normal">Auto-set from year group</span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <Label required>School name</Label>
                {!showCustomSchool ? (
                  <SchoolSelect
                    value={school}
                    onChange={(v) => {
                      setSchool(v);
                      setCustomSchool("");
                    }}
                    error={Boolean(errors.school)}
                    hasOther={false}
                    onAddOther={() => {
                      setShowCustomSchool(true);
                      setSchool("");
                    }}
                  />
                ) : (
                  <div className="flex items-stretch gap-2">
                    <input
                      autoFocus
                      type="text"
                      value={customSchool}
                      onChange={(e) => setCustomSchool(e.target.value)}
                      placeholder="Enter school name"
                      className={cn(FIELD, errors.school && FIELD_ERROR)}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setShowCustomSchool(false);
                        setCustomSchool("");
                      }}
                      className="shrink-0 px-2 rounded-lg border border-slate-300 bg-white text-slate-500 hover:bg-slate-50 cursor-pointer"
                      aria-label="Use school list"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <p className="mt-1 text-[11px] text-slate-400">
                  {UAE_SCHOOLS.length} UAE schools available. Includes Home Schooling and Online School.
                </p>
              </div>

              {khdaFlag && (
                <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-amber-800 mb-0.5">
                      KHDA compliance — guardian presence required
                    </p>
                    <p className="text-[11px] text-amber-700">
                      Under KHDA regulations, a guardian must be physically present for every
                      FS1 / FS2 session. This flag will be applied automatically to the student
                      record.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <p className="text-sm font-semibold text-slate-800">Primary guardian</p>
                </div>
                <GuardianForm
                  value={primary}
                  onChange={setPrimary}
                  errors={errors}
                  idPrefix="primary"
                  role="primary"
                />
              </div>

              <div className="border-t border-slate-200 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-slate-500" />
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        Co-parent / second guardian
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Add another guardian for this student (optional).
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">
                      {hasSecondary ? "On" : "Off"}
                    </span>
                    <Switch checked={hasSecondary} onCheckedChange={setHasSecondary} />
                  </div>
                </div>

                {hasSecondary && (
                  <GuardianForm
                    value={secondary}
                    onChange={setSecondary}
                    errors={errors}
                    idPrefix="secondary"
                    role="secondary"
                  />
                )}
              </div>

              <div className="border-t border-slate-200 pt-4">
                <Label htmlFor="notes" hint="Visible to staff only">
                  Internal notes
                </Label>
                <textarea
                  id="notes"
                  rows={3}
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="Any relevant context for this student…"
                  className={FIELD}
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              {duplicates.length > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-amber-800 mb-0.5">
                        Possible duplicate student
                      </p>
                      <p className="text-[11px] text-amber-700">
                        {duplicates.length === 1
                          ? `A student with the same name already exists: ${duplicates[0].name} (${duplicates[0].id}). Please verify before continuing.`
                          : `${duplicates.length} students with the same name already exist. Please verify before continuing.`}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <ReviewSection title="Identity">
                <SummaryLine label="Full name" value={`${firstName} ${lastName}`.trim()} />
                {preferredName && <SummaryLine label="Preferred name" value={preferredName} />}
                <SummaryLine
                  label="Date of birth"
                  value={`${formatDobDisplay(dob)}${age !== null ? ` · ${age} yrs` : ""}`}
                />
                <SummaryLine label="Gender" value={gender} />
                <SummaryLine label="Nationality" value={nationality} />
                {photoDataUrl && (
                  <div className="flex items-center justify-between text-sm pt-1">
                    <span className="text-slate-500 text-xs">Photo</span>
                    <span
                      className="w-8 h-8 rounded-full bg-slate-100 bg-cover bg-center"
                      style={{ backgroundImage: `url(${photoDataUrl})` }}
                    />
                  </div>
                )}
              </ReviewSection>

              <ReviewSection title="Academic">
                <SummaryLine label="Year group" value={yearGroupLabel(yearGroup)} />
                <SummaryLine
                  label="Department"
                  value={
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-xs font-semibold",
                        departmentBadgeClass(department),
                      )}
                    >
                      {department}
                    </span>
                  }
                />
                <SummaryLine label="School" value={effectiveSchool} />
                {khdaFlag && (
                  <SummaryLine
                    label="KHDA flag"
                    value={
                      <span className="inline-flex items-center gap-1 text-amber-800 text-xs font-semibold">
                        <AlertTriangle className="w-3 h-3" />
                        Active — guardian must be present
                      </span>
                    }
                  />
                )}
              </ReviewSection>

              <ReviewSection title="Primary guardian">
                <SummaryLine
                  label="Name"
                  value={`${primary.firstName} ${primary.lastName}`.trim()}
                />
                <SummaryLine label="Relationship" value={primary.relationship} />
                <SummaryLine label="Nationality" value={primary.nationality} />
                <SummaryLine
                  label="Phone"
                  value={`${primary.dialCode || "+971"} ${primary.phone}`.trim()}
                />
                <SummaryLine
                  label="WhatsApp"
                  value={
                    primary.isWhatsApp
                      ? "Same as primary phone"
                      : primary.whatsAppNumber
                        ? `${primary.whatsAppDialCode || primary.dialCode || "+971"} ${primary.whatsAppNumber}`
                        : "—"
                  }
                />
                <SummaryLine label="Email" value={primary.email} />
                {primary.homeArea && <SummaryLine label="Home area" value={primary.homeArea} />}
                <SummaryLine label="Preferred channel" value={primary.preferredChannel} />
              </ReviewSection>

              {hasSecondary && (
                <ReviewSection title="Co-parent / second guardian">
                  <SummaryLine
                    label="Name"
                    value={`${secondary.firstName} ${secondary.lastName}`.trim()}
                  />
                  <SummaryLine label="Relationship" value={secondary.relationship} />
                  <SummaryLine label="Nationality" value={secondary.nationality} />
                  <SummaryLine
                    label="Phone"
                    value={`${secondary.dialCode || "+971"} ${secondary.phone}`.trim()}
                  />
                  <SummaryLine
                    label="WhatsApp"
                    value={
                      secondary.isWhatsApp
                        ? "Same as primary phone"
                        : secondary.whatsAppNumber
                          ? `${secondary.whatsAppDialCode || secondary.dialCode || "+971"} ${secondary.whatsAppNumber}`
                          : "—"
                    }
                  />
                  {secondary.email && <SummaryLine label="Email" value={secondary.email} />}
                  {secondary.homeArea && <SummaryLine label="Home area" value={secondary.homeArea} />}
                  <SummaryLine label="Preferred channel" value={secondary.preferredChannel} />
                </ReviewSection>
              )}

              {internalNotes.trim() && (
                <ReviewSection title="Internal notes">
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{internalNotes.trim()}</p>
                </ReviewSection>
              )}

              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800">
                  A student ID (e.g. IMI-0021) will be assigned automatically on save. Enrolments
                  and subjects are added after the record is created.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 px-6 py-3 border-t border-slate-200 bg-slate-50/50">
          <div>
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            {step < 4 ? (
              <button
                type="button"
                onClick={handleContinue}
                className="rounded-lg bg-amber-500 px-4 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 transition-colors cursor-pointer"
                style={{ backgroundColor: "#F59E0B" }}
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSave}
                className="rounded-lg bg-amber-500 px-4 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 transition-colors cursor-pointer"
                style={{ backgroundColor: "#F59E0B" }}
              >
                Create Student Record
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Review primitives ────────────────────────────────────────────────────────

function ReviewSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3.5">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-2">
        {title}
      </p>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function SummaryLine({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="text-slate-500 text-xs">{label}</span>
      <span className="text-slate-800 font-medium text-right break-words min-w-0">
        {value || <span className="text-slate-400">—</span>}
      </span>
    </div>
  );
}
