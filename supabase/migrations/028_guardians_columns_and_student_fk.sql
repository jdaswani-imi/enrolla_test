ALTER TABLE guardians
  ADD COLUMN IF NOT EXISTS preferred_channel text,
  ADD COLUMN IF NOT EXISTS media_opt_out boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS co_parent_id uuid REFERENCES guardians(id);

ALTER TABLE students
  ADD COLUMN IF NOT EXISTS primary_guardian_id uuid REFERENCES guardians(id);
