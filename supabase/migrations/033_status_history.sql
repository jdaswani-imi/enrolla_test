-- ============================================================
-- 033 — Status / stage history (audit log for lead stage
--        and task status changes)
-- ============================================================

CREATE TABLE status_history (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type     TEXT        NOT NULL CHECK (entity_type IN ('lead', 'task')),
  entity_id       UUID        NOT NULL,
  changed_by      UUID        NOT NULL REFERENCES auth.users(id),
  changed_by_name TEXT        NOT NULL DEFAULT '',
  previous_status TEXT        NOT NULL,
  new_status      TEXT        NOT NULL,
  changed_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ON status_history (entity_type, entity_id, changed_at DESC);
