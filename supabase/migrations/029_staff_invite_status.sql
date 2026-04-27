-- ============================================================
-- 029 — Expand staff status enum to cover invite + suspension
-- ============================================================

ALTER TABLE staff DROP CONSTRAINT staff_status_check;

ALTER TABLE staff ADD CONSTRAINT staff_status_check CHECK (status IN (
  'active',
  'invited',
  'on_leave',
  'inactive',
  'suspended',
  'off_boarded'
));
