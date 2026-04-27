-- ============================================================
-- 025 — Automation rules and execution logs
-- ============================================================

CREATE TABLE automation_rules (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid        NOT NULL REFERENCES tenants (id),
  name         text        NOT NULL,
  trigger_type text        NOT NULL,
  module       text        NOT NULL DEFAULT '',
  status       text        NOT NULL DEFAULT 'Disabled',
  locked       boolean     NOT NULL DEFAULT false,
  template_id  uuid,
  fire_count   integer     NOT NULL DEFAULT 0,
  last_fired   timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT automation_rules_trigger_check CHECK (
    trigger_type IN ('Status Change', 'Time-based', 'Threshold', 'Form Submission', 'Manual')
  ),
  CONSTRAINT automation_rules_status_check CHECK (
    status IN ('Enabled', 'Disabled', 'Locked')
  )
);

CREATE TABLE automation_logs (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid        NOT NULL REFERENCES tenants         (id),
  rule_id      uuid        NOT NULL REFERENCES automation_rules (id) ON DELETE CASCADE,
  fired_at     timestamptz NOT NULL DEFAULT now(),
  status       text        NOT NULL DEFAULT 'Success',
  recipients   integer     NOT NULL DEFAULT 0,
  duration_ms  integer,
  payload      jsonb       NOT NULL DEFAULT '{}',

  CONSTRAINT automation_logs_status_check CHECK (
    status IN ('Success', 'Failed', 'Skipped')
  )
);

ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_logs  ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_automation_rules_tenant ON automation_rules (tenant_id);
CREATE INDEX idx_automation_rules_status ON automation_rules (tenant_id, status);
CREATE INDEX idx_automation_logs_tenant  ON automation_logs  (tenant_id);
CREATE INDEX idx_automation_logs_rule    ON automation_logs  (rule_id);
CREATE INDEX idx_automation_logs_fired   ON automation_logs  (fired_at DESC);
