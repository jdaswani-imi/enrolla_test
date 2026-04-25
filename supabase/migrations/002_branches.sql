-- ============================================================
-- 002 — Branches
-- ============================================================

CREATE TABLE branches (
  id         uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid         NOT NULL REFERENCES tenants (id),
  name       text         NOT NULL,
  address    text,
  phone      text,
  email      text,
  -- VAT rate applied to invoice lines for sessions at this branch.
  -- Defaults to 5 % for UAE. Override per branch as required.
  vat_rate   numeric(5,2) NOT NULL DEFAULT 5.00,
  is_active  boolean      NOT NULL DEFAULT true,
  created_at timestamptz  NOT NULL DEFAULT now(),
  updated_at timestamptz  NOT NULL DEFAULT now()
);

ALTER TABLE branches ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_branches_tenant_id ON branches (tenant_id);
