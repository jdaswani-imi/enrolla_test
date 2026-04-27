-- ============================================================
-- 023 — Session feedback (teacher post-session feedback on students)
-- ============================================================

CREATE TABLE session_feedback (
  id           uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid          NOT NULL REFERENCES tenants  (id),
  session_id   uuid          REFERENCES sessions (id),
  student_id   uuid          NOT NULL REFERENCES students (id),
  staff_id     uuid          NOT NULL REFERENCES staff    (id),
  subject_id   uuid          REFERENCES subjects (id),
  -- 1–5 rating
  score        integer       NOT NULL CHECK (score BETWEEN 1 AND 5),
  teacher_notes text         NOT NULL DEFAULT '',
  ai_summary   text,
  selectors    jsonb         NOT NULL DEFAULT '[]',
  status       text          NOT NULL DEFAULT 'Draft',
  rejected_reason text,
  session_date date          NOT NULL,
  created_at   timestamptz   NOT NULL DEFAULT now(),
  updated_at   timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT session_feedback_status_check CHECK (
    status IN ('Draft', 'Pending Approval', 'Approved', 'Sent', 'Rejected')
  )
);

ALTER TABLE session_feedback ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_session_feedback_tenant   ON session_feedback (tenant_id);
CREATE INDEX idx_session_feedback_student  ON session_feedback (student_id);
CREATE INDEX idx_session_feedback_staff    ON session_feedback (staff_id);
CREATE INDEX idx_session_feedback_session  ON session_feedback (session_id);
CREATE INDEX idx_session_feedback_status   ON session_feedback (status);
