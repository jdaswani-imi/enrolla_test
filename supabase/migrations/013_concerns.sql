-- ============================================================
-- 013 — Concerns (incident and behaviour records)
-- ============================================================

-- A concern is an incident or behaviour report filed against a student.
-- subject_id and session_id are both optional: a concern can occur before,
-- after, or entirely outside a class context.
-- All staff roles within a tenant have full visibility of all concerns,
-- including safeguarding concerns — no additional RLS restriction applied.
CREATE TABLE concerns (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid        NOT NULL REFERENCES tenants  (id),
  student_id   uuid        NOT NULL REFERENCES students (id),
  reported_by  uuid        NOT NULL REFERENCES staff    (id),
  -- Optional: no CHECK constraint — a concern can exist without a linked subject
  subject_id   uuid        REFERENCES subjects  (id),
  -- Optional: a concern can exist without a linked session
  session_id   uuid        REFERENCES sessions  (id),
  concern_type text        NOT NULL,
  description  text        NOT NULL,
  -- NULL until severity is assessed
  severity     text,
  status       text        NOT NULL DEFAULT 'open',
  -- Populated when status moves to 'resolved'
  resolved_at  timestamptz,
  notes        text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT concerns_type_check CHECK (
    concern_type IN ('behaviour', 'academic', 'wellbeing', 'safeguarding', 'other')
  ),
  CONSTRAINT concerns_severity_check CHECK (
    severity IS NULL OR severity IN ('low', 'medium', 'high', 'critical')
  ),
  CONSTRAINT concerns_status_check CHECK (
    status IN ('open', 'in_progress', 'resolved', 'escalated')
  )
);

ALTER TABLE concerns ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_concerns_tenant_id   ON concerns (tenant_id);
CREATE INDEX idx_concerns_student_id  ON concerns (student_id);
CREATE INDEX idx_concerns_reported_by ON concerns (reported_by);
CREATE INDEX idx_concerns_session_id  ON concerns (session_id);
CREATE INDEX idx_concerns_status      ON concerns (status);
