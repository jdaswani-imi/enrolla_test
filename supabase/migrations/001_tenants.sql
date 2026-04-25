-- ============================================================
-- 001 — Tenants and sequences
-- ============================================================

-- Root organisation record. One row per paying tenant.
CREATE TABLE tenants (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name           text        NOT NULL,
  -- URL-safe identifier used in API paths and webhook payloads
  slug           text        NOT NULL,
  -- Optional prefix prepended to invoice numbers (e.g. "INV-").
  -- NULL means the invoice number is the bare sequential integer.
  invoice_prefix text,
  status         text        NOT NULL DEFAULT 'trial',
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT tenants_slug_key     UNIQUE (slug),
  CONSTRAINT tenants_status_check CHECK  (status IN ('active', 'trial', 'suspended'))
);

-- Per-tenant monotonic counters for student numbers and invoice numbers.
-- Rows are only ever modified through the SECURITY DEFINER functions below —
-- never directly by application code or RLS-gated routes.
CREATE TABLE tenant_sequences (
  id               uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        uuid    NOT NULL,
  last_student_seq integer NOT NULL DEFAULT 0,
  last_invoice_seq integer NOT NULL DEFAULT 0,

  CONSTRAINT tenant_sequences_tenant_id_key  UNIQUE (tenant_id),
  CONSTRAINT tenant_sequences_tenant_id_fkey FOREIGN KEY (tenant_id)
    REFERENCES tenants (id)
);

-- ── RLS ──────────────────────────────────────────────────────
ALTER TABLE tenants          ENABLE ROW LEVEL SECURITY;
-- tenant_sequences: RLS enabled with no policies — blocks all direct
-- access from authenticated/anon roles. Only service_role (BYPASSRLS)
-- and the SECURITY DEFINER functions below may touch this table.
ALTER TABLE tenant_sequences ENABLE ROW LEVEL SECURITY;

-- ── Sequence helper functions ─────────────────────────────────

-- Returns the next student number for a tenant, incrementing atomically.
-- UPDATE … RETURNING provides implicit row-level locking; no advisory lock needed.
CREATE OR REPLACE FUNCTION public.next_student_number(p_tenant_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_seq integer;
BEGIN
  UPDATE tenant_sequences
     SET last_student_seq = last_student_seq + 1
   WHERE tenant_id = p_tenant_id
  RETURNING last_student_seq INTO v_seq;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'tenant_sequences row not found for tenant %', p_tenant_id;
  END IF;

  RETURN v_seq;
END;
$$;

-- Returns the next invoice sequential integer for a tenant.
CREATE OR REPLACE FUNCTION public.next_invoice_seq(p_tenant_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_seq integer;
BEGIN
  UPDATE tenant_sequences
     SET last_invoice_seq = last_invoice_seq + 1
   WHERE tenant_id = p_tenant_id
  RETURNING last_invoice_seq INTO v_seq;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'tenant_sequences row not found for tenant %', p_tenant_id;
  END IF;

  RETURN v_seq;
END;
$$;

-- ── Indexes ───────────────────────────────────────────────────
CREATE INDEX idx_tenant_sequences_tenant_id ON tenant_sequences (tenant_id);
