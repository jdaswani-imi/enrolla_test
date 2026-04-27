-- ============================================================
-- 026 — Report jobs (async report generation queue)
-- ============================================================

CREATE TABLE report_jobs (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid        NOT NULL REFERENCES tenants (id),
  requested_by  uuid        REFERENCES staff (id),
  report_type   text        NOT NULL,
  params        jsonb       NOT NULL DEFAULT '{}',
  status        text        NOT NULL DEFAULT 'queued',
  -- Supabase Storage path; populated when generation is complete
  storage_path  text,
  error_message text,
  started_at    timestamptz,
  completed_at  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT report_jobs_type_check CHECK (
    report_type IN ('attendance', 'revenue', 'academic', 'staff-performance')
  ),
  CONSTRAINT report_jobs_status_check CHECK (
    status IN ('queued', 'running', 'complete', 'failed')
  )
);

ALTER TABLE report_jobs ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_report_jobs_tenant ON report_jobs (tenant_id);
CREATE INDEX idx_report_jobs_status ON report_jobs (tenant_id, status);
CREATE INDEX idx_report_jobs_created ON report_jobs (created_at DESC);
