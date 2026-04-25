-- ============================================================
-- 011 — Sessions, register, makeups and attendance
-- ============================================================

-- All session types (regular, makeup, trial) live in a single table.
-- is_makeup = true for makeup sessions.
-- Trial sessions are plain rows referenced by trials.session_id.
-- Session rows for a full term are bulk-inserted by the route handler
-- at schedule confirmation — no recurrence model in the schema.
CREATE TABLE sessions (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             uuid        NOT NULL REFERENCES tenants  (id),
  branch_id             uuid        NOT NULL REFERENCES branches (id),
  subject_id            uuid        NOT NULL REFERENCES subjects (id),
  -- Nullable until a room is assigned
  room_id               uuid        REFERENCES rooms (id),
  -- Nullable until a teacher is assigned
  staff_id              uuid        REFERENCES staff (id),
  -- Nullable for one-off sessions outside a formal term
  term_id               uuid        REFERENCES terms (id),
  session_date          date        NOT NULL,
  start_time            time        NOT NULL,
  -- Validated against subject.session_duration_minutes at app layer
  end_time              time        NOT NULL,
  status                text        NOT NULL DEFAULT 'scheduled',
  is_makeup             boolean     NOT NULL DEFAULT false,
  cancellation_reason   text,
  -- Populated by the admin when overriding the term-boundary block
  admin_override_reason text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT sessions_status_check CHECK (status IN ('scheduled', 'completed', 'cancelled'))
);

-- Now that sessions exists, wire the FK that could not be declared in 010.
ALTER TABLE trials
  ADD CONSTRAINT trials_session_id_fkey
  FOREIGN KEY (session_id) REFERENCES sessions (id);

-- The session register (which enrolled students attend a given session).
-- Rows are bulk-inserted by the route handler at schedule confirmation
-- (when enrolment.status transitions to 'enrolled').
-- No DB trigger; no background job.
CREATE TABLE session_students (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid        NOT NULL REFERENCES tenants    (id),
  session_id   uuid        NOT NULL REFERENCES sessions   (id) ON DELETE CASCADE,
  student_id   uuid        NOT NULL REFERENCES students   (id),
  enrolment_id uuid        NOT NULL REFERENCES enrolments (id),
  created_at   timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT session_students_pair_key UNIQUE (session_id, student_id)
);

-- Tracks each individual makeup booking against a student's allowance.
CREATE TABLE makeup_sessions (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid        NOT NULL REFERENCES tenants           (id),
  makeup_allowance_id uuid        NOT NULL REFERENCES makeup_allowances (id),
  -- The session the student originally missed
  original_session_id uuid        NOT NULL REFERENCES sessions (id),
  -- The session booked as the makeup; nullable until a slot is selected
  makeup_session_id   uuid        REFERENCES sessions (id),
  status              text        NOT NULL DEFAULT 'pending',
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT makeup_sessions_status_check CHECK (
    status IN ('pending', 'booked', 'completed', 'cancelled')
  )
);

CREATE TABLE attendance_records (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid        NOT NULL REFERENCES tenants    (id),
  session_id   uuid        NOT NULL REFERENCES sessions   (id),
  student_id   uuid        NOT NULL REFERENCES students   (id),
  enrolment_id uuid        NOT NULL REFERENCES enrolments (id),
  status       text        NOT NULL,
  marked_by    uuid        REFERENCES staff (id),
  marked_at    timestamptz,
  notes        text,
  created_at   timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT attendance_records_pair_key    UNIQUE (session_id, student_id),
  CONSTRAINT attendance_records_status_check CHECK  (
    status IN ('present', 'absent', 'late', 'makeup')
  )
);

ALTER TABLE sessions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_students   ENABLE ROW LEVEL SECURITY;
ALTER TABLE makeup_sessions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_sessions_tenant_id              ON sessions (tenant_id);
CREATE INDEX idx_sessions_branch_id              ON sessions (branch_id);
CREATE INDEX idx_sessions_subject_id             ON sessions (subject_id);
CREATE INDEX idx_sessions_staff_id               ON sessions (staff_id);
CREATE INDEX idx_sessions_term_id                ON sessions (term_id);
CREATE INDEX idx_sessions_session_date           ON sessions (session_date);
CREATE INDEX idx_sessions_is_makeup              ON sessions (is_makeup) WHERE is_makeup = true;
CREATE INDEX idx_session_students_tenant_id      ON session_students (tenant_id);
CREATE INDEX idx_session_students_session_id     ON session_students (session_id);
CREATE INDEX idx_session_students_student_id     ON session_students (student_id);
CREATE INDEX idx_session_students_enrolment_id   ON session_students (enrolment_id);
CREATE INDEX idx_makeup_sessions_tenant_id       ON makeup_sessions (tenant_id);
CREATE INDEX idx_makeup_sessions_allowance_id    ON makeup_sessions (makeup_allowance_id);
CREATE INDEX idx_makeup_sessions_original        ON makeup_sessions (original_session_id);
CREATE INDEX idx_makeup_sessions_makeup          ON makeup_sessions (makeup_session_id);
CREATE INDEX idx_attendance_records_tenant_id    ON attendance_records (tenant_id);
CREATE INDEX idx_attendance_records_session_id   ON attendance_records (session_id);
CREATE INDEX idx_attendance_records_student_id   ON attendance_records (student_id);
CREATE INDEX idx_attendance_records_enrolment_id ON attendance_records (enrolment_id);
