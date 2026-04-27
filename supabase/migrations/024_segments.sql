-- ============================================================
-- 024 — Segments (saved filter configurations)
-- ============================================================

-- Segments are stored filter presets — not materialised lists.
-- count is recomputed at query time; last_refreshed updated then.
CREATE TABLE segments (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid        NOT NULL REFERENCES tenants (id),
  -- staff member who created this segment
  created_by_id   uuid        REFERENCES staff (id),
  name            text        NOT NULL,
  scope           text        NOT NULL DEFAULT 'Personal',
  record_type     text        NOT NULL,
  filter_summary  text        NOT NULL DEFAULT '',
  filters         jsonb       NOT NULL DEFAULT '{}',
  -- cached member count; refreshed on demand
  member_count    integer     NOT NULL DEFAULT 0,
  last_refreshed  timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT segments_scope_check       CHECK (scope IN ('Org-Wide', 'Personal')),
  CONSTRAINT segments_record_type_check CHECK (record_type IN ('Students', 'Guardians', 'Leads', 'Staff'))
);

ALTER TABLE segments ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_segments_tenant ON segments (tenant_id);
CREATE INDEX idx_segments_scope  ON segments (tenant_id, scope);
