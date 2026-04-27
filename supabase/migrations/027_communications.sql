-- ============================================================
-- 027 — Communications (sent/scheduled messages and templates)
-- ============================================================

CREATE TABLE message_templates (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid        NOT NULL REFERENCES tenants (id),
  name        text        NOT NULL,
  subject     text,
  body        text        NOT NULL,
  channel     text        NOT NULL DEFAULT 'email',
  created_by  uuid        REFERENCES staff (id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT message_templates_channel_check CHECK (channel IN ('email', 'sms', 'whatsapp'))
);

-- message_log tracks every sent or scheduled outbound message.
-- recipient_id is polymorphic: student_id, guardian_id, staff_id etc.
CREATE TABLE message_log (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid        NOT NULL REFERENCES tenants (id),
  template_id     uuid        REFERENCES message_templates (id),
  sent_by         uuid        REFERENCES staff (id),
  channel         text        NOT NULL DEFAULT 'email',
  -- NULL = broadcast/segment send; populated for individual sends
  recipient_email text,
  recipient_name  text,
  subject         text,
  body            text        NOT NULL,
  status          text        NOT NULL DEFAULT 'queued',
  -- Resend message ID or provider reference
  provider_ref    text,
  segment_id      uuid        REFERENCES segments (id),
  error_message   text,
  scheduled_at    timestamptz,
  sent_at         timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT message_log_channel_check CHECK (channel IN ('email', 'sms', 'whatsapp')),
  CONSTRAINT message_log_status_check  CHECK (status IN ('queued', 'sent', 'delivered', 'failed', 'scheduled'))
);

ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_log       ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_message_templates_tenant ON message_templates (tenant_id);
CREATE INDEX idx_message_log_tenant       ON message_log       (tenant_id);
CREATE INDEX idx_message_log_status       ON message_log       (tenant_id, status);
CREATE INDEX idx_message_log_sent_at      ON message_log       (sent_at DESC);
