export type StudentStatus = 'Active' | 'Withdrawn' | 'Graduated' | 'Alumni'
export type ChurnLevel = 'High' | 'Medium' | 'Low' | 'None'

export interface DbStudent {
  id: string
  tenant_id: string
  branch_id: string
  student_ref: string
  first_name: string
  last_name: string
  date_of_birth: string | null
  gender: string | null
  nationality: string | null
  year_group: string | null
  department_id: string | null
  school_id: string | null
  school_other: string | null
  curriculum: string | null
  status: StudentStatus
  enrolled_at: string | null
  withdrawn_at: string | null
  graduated_at: string | null
  alumni_at: string | null
  lead_id: string | null
  primary_guardian_id: string | null
  emergency_contact: string | null
  medical_notes: string | null
  has_send: boolean
  send_notes: string | null
  fee_exempt: boolean
  fee_exempt_reason: string | null
  churn_score: number | null
  churn_risk_level: string | null
  churn_updated_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface CreateStudentBody {
  first_name: string
  last_name: string
  year_group: string
  department_id?: string
  date_of_birth?: string
  gender?: string
  nationality?: string
  school_other?: string
  curriculum?: string
  medical_notes?: string
  has_send?: boolean
  send_notes?: string
  notes?: string
  primary_guardian_id?: string
}

export interface UpdateStudentBody extends Partial<CreateStudentBody> {
  status?: StudentStatus
  enrolled_at?: string
  withdrawn_at?: string
  fee_exempt?: boolean
  fee_exempt_reason?: string
}
