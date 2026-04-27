// Lead-related types, extracted from lib/mock-data.ts so journey dialogs
// can import them without depending on mock-data at all.

export type LeadStage =
  | "New"
  | "Contacted"
  | "Assessment Booked"
  | "Assessment Done"
  | "Trial Booked"
  | "Trial Done"
  | "Schedule Offered"
  | "Schedule Confirmed"
  | "Invoice Sent"
  | "Won"
  | "Lost";

export type LeadSource = "Website" | "Phone" | "Walk-in" | "Referral" | "Event";
export type PreferredWindow = "Morning" | "Afternoon" | "Evening" | "Any";

export interface Lead {
  id: string;
  ref: string;
  childName: string;
  yearGroup: string;
  department: string;
  subjects: string[];
  guardian: string;
  guardianPhone: string;
  source: LeadSource;
  stage: LeadStage;
  assignedTo: string;
  lastActivity: string;
  daysInStage: number;
  daysInPipeline: number;
  dnc: boolean;
  sibling: boolean;
  stageMessagePending: boolean;
  preferredDays?: string[];
  preferredWindow?: PreferredWindow;
  createdOn?: string;
  lostReason?: string;
  lostNotes?: string;
  reEngage?: boolean;
  reEngageAfter?: string;
  status?: 'active' | 'converted' | 'lost' | 'archived';
  convertedStudentId?: string;
  convertedOn?: string;
}
