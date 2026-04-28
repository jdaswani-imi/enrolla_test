-- Re-add all FK constraints referencing staff(id) with ON DELETE SET NULL
-- so off-boarded staff records can be hard-deleted without blocking errors.

ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_staff_id_fkey;
ALTER TABLE sessions ADD CONSTRAINT sessions_staff_id_fkey
  FOREIGN KEY (staff_id) REFERENCES staff (id) ON DELETE SET NULL;

ALTER TABLE attendance_records DROP CONSTRAINT IF EXISTS attendance_records_marked_by_fkey;
ALTER TABLE attendance_records ADD CONSTRAINT attendance_records_marked_by_fkey
  FOREIGN KEY (marked_by) REFERENCES staff (id) ON DELETE SET NULL;

ALTER TABLE withdrawals DROP CONSTRAINT IF EXISTS withdrawals_requested_by_fkey;
ALTER TABLE withdrawals ADD CONSTRAINT withdrawals_requested_by_fkey
  FOREIGN KEY (requested_by) REFERENCES staff (id) ON DELETE SET NULL;

ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_recorded_by_fkey;
ALTER TABLE payments ADD CONSTRAINT payments_recorded_by_fkey
  FOREIGN KEY (recorded_by) REFERENCES staff (id) ON DELETE SET NULL;

ALTER TABLE concerns DROP CONSTRAINT IF EXISTS concerns_reported_by_fkey;
ALTER TABLE concerns ALTER COLUMN reported_by DROP NOT NULL;
ALTER TABLE concerns ADD CONSTRAINT concerns_reported_by_fkey
  FOREIGN KEY (reported_by) REFERENCES staff (id) ON DELETE SET NULL;

ALTER TABLE student_notes DROP CONSTRAINT IF EXISTS student_notes_author_id_fkey;
ALTER TABLE student_notes ADD CONSTRAINT student_notes_author_id_fkey
  FOREIGN KEY (author_id) REFERENCES staff (id) ON DELETE SET NULL;

ALTER TABLE session_feedback DROP CONSTRAINT IF EXISTS session_feedback_staff_id_fkey;
ALTER TABLE session_feedback ALTER COLUMN staff_id DROP NOT NULL;
ALTER TABLE session_feedback ADD CONSTRAINT session_feedback_staff_id_fkey
  FOREIGN KEY (staff_id) REFERENCES staff (id) ON DELETE SET NULL;

ALTER TABLE report_jobs DROP CONSTRAINT IF EXISTS report_jobs_requested_by_fkey;
ALTER TABLE report_jobs ADD CONSTRAINT report_jobs_requested_by_fkey
  FOREIGN KEY (requested_by) REFERENCES staff (id) ON DELETE SET NULL;

ALTER TABLE assignments DROP CONSTRAINT IF EXISTS assignments_teacher_id_fkey;
ALTER TABLE assignments ADD CONSTRAINT assignments_teacher_id_fkey
  FOREIGN KEY (teacher_id) REFERENCES staff (id) ON DELETE SET NULL;

ALTER TABLE class_groups DROP CONSTRAINT IF EXISTS class_groups_teacher_id_fkey;
ALTER TABLE class_groups ADD CONSTRAINT class_groups_teacher_id_fkey
  FOREIGN KEY (teacher_id) REFERENCES staff (id) ON DELETE SET NULL;

ALTER TABLE feedback_items DROP CONSTRAINT IF EXISTS feedback_items_teacher_id_fkey;
ALTER TABLE feedback_items ADD CONSTRAINT feedback_items_teacher_id_fkey
  FOREIGN KEY (teacher_id) REFERENCES staff (id) ON DELETE SET NULL;

ALTER TABLE inventory_items DROP CONSTRAINT IF EXISTS inventory_items_responsible_staff_id_fkey;
ALTER TABLE inventory_items ADD CONSTRAINT inventory_items_responsible_staff_id_fkey
  FOREIGN KEY (responsible_staff_id) REFERENCES staff (id) ON DELETE SET NULL;

ALTER TABLE reorder_alerts DROP CONSTRAINT IF EXISTS reorder_alerts_responsible_staff_id_fkey;
ALTER TABLE reorder_alerts ADD CONSTRAINT reorder_alerts_responsible_staff_id_fkey
  FOREIGN KEY (responsible_staff_id) REFERENCES staff (id) ON DELETE SET NULL;
