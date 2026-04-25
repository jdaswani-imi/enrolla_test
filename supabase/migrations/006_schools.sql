-- ============================================================
-- 006 — Schools directory
-- ============================================================

-- Platform-level reference table shared across tenants.
--   tenant_id IS NULL  → platform default, visible to all tenants
--   tenant_id IS NOT NULL → tenant-added school; starts as 'pending_approval'
--                           until a platform admin sets status = 'active'
-- RLS SELECT policy: WHERE tenant_id IS NULL OR tenant_id = current_tenant_id()
CREATE TABLE schools (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid        REFERENCES tenants (id),
  name       text        NOT NULL,
  address    text,
  phone      text,
  status     text        NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT schools_status_check CHECK (status IN ('active', 'pending_approval'))
);

ALTER TABLE schools ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_schools_tenant_id ON schools (tenant_id);
