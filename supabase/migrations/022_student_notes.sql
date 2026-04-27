-- ============================================================
-- 022 — Student notes (teacher/admin notes on student progress)
-- ============================================================

CREATE TABLE student_notes (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid        NOT NULL REFERENCES tenants  (id),
  student_id uuid        NOT NULL REFERENCES students (id),
  author_id  uuid        REFERENCES staff (id),
  body       text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE student_notes ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_student_notes_tenant   ON student_notes (tenant_id);
CREATE INDEX idx_student_notes_student  ON student_notes (student_id);
CREATE INDEX idx_student_notes_author   ON student_notes (author_id);
