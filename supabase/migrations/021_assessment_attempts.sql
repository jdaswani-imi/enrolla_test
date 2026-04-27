-- ============================================================
-- 021 — Assessment attempts (student assessment scoring history)
-- ============================================================

CREATE TABLE assessment_attempts (
  id           uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid          NOT NULL REFERENCES tenants  (id),
  student_id   uuid          NOT NULL REFERENCES students (id),
  subject_id   uuid          REFERENCES subjects (id),
  session_id   uuid          REFERENCES sessions (id),
  -- Score out of 100; NULL if student was absent (no-show)
  score        numeric(5,2),
  -- true when the student did not show up; score stored as 0 in averages
  absent       boolean       NOT NULL DEFAULT false,
  grade        text,
  notes        text,
  assessed_at  timestamptz   NOT NULL DEFAULT now(),
  created_at   timestamptz   NOT NULL DEFAULT now(),
  updated_at   timestamptz   NOT NULL DEFAULT now()
);

ALTER TABLE assessment_attempts ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_assessment_attempts_tenant   ON assessment_attempts (tenant_id);
CREATE INDEX idx_assessment_attempts_student  ON assessment_attempts (student_id);
CREATE INDEX idx_assessment_attempts_subject  ON assessment_attempts (subject_id);
CREATE INDEX idx_assessment_attempts_session  ON assessment_attempts (session_id);
