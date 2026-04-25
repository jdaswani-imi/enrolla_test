-- ============================================================
-- 012 — Finance: invoices, credits, invoice lines and payments
-- ============================================================

-- One invoice per student; can span line items from multiple branches.
CREATE TABLE invoices (
  id             uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid          NOT NULL REFERENCES tenants  (id),
  student_id     uuid          NOT NULL REFERENCES students (id),
  -- Formatted at app layer as: COALESCE(tenants.invoice_prefix, '') || next_invoice_seq(tenant_id)
  invoice_number text          NOT NULL,
  status         text          NOT NULL DEFAULT 'draft',
  issue_date     date          NOT NULL,
  due_date       date          NOT NULL,
  subtotal       numeric(10,2) NOT NULL,
  vat_amount     numeric(10,2) NOT NULL,
  total          numeric(10,2) NOT NULL,
  -- Updated via service-role function only when a payment is recorded
  total_paid     numeric(10,2) NOT NULL DEFAULT 0,
  -- Updated via service-role function only; computed as total − total_paid
  amount_due     numeric(10,2) NOT NULL,
  notes          text,
  created_at     timestamptz   NOT NULL DEFAULT now(),
  updated_at     timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT invoices_status_check CHECK (
    status IN ('draft', 'issued', 'paid', 'partially_paid', 'overdue', 'cancelled')
  )
);

ALTER TABLE invoices
  ADD CONSTRAINT invoices_tenant_invoice_number_unique
    UNIQUE (tenant_id, invoice_number);

-- A credit must belong to a student OR a guardian — never neither.
-- student_id nullable  → guardian-level goodwill credit
-- guardian_id nullable → student-specific credit
CREATE TABLE credits (
  id                 uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          uuid          NOT NULL REFERENCES tenants   (id),
  student_id         uuid          REFERENCES students  (id),
  guardian_id        uuid          REFERENCES guardians (id),
  amount             numeric(10,2) NOT NULL,
  reason             text          NOT NULL,
  credit_type        text          NOT NULL,
  is_used            boolean       NOT NULL DEFAULT false,
  -- Set when this credit is applied to an invoice
  used_on_invoice_id uuid          REFERENCES invoices (id),
  created_at         timestamptz   NOT NULL DEFAULT now(),
  updated_at         timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT credits_owner_not_null CHECK (
    student_id IS NOT NULL OR guardian_id IS NOT NULL
  ),
  CONSTRAINT credits_type_check CHECK (
    credit_type IN ('goodwill', 'refund', 'adjustment')
  )
);

-- Invoice lines are immutable once created.
-- No UPDATE or DELETE RLS policies exist on this table (see 014_rls_policies.sql).
-- unit_price is snapshotted from subjects.price or packages.price at issue time.
-- vat_rate is snapshotted from branches.vat_rate of the subject's branch at issue time —
-- not the student's primary branch.
CREATE TABLE invoice_lines (
  id           uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid          NOT NULL REFERENCES tenants    (id),
  invoice_id   uuid          NOT NULL REFERENCES invoices   (id),
  -- Set for line_type = 'subject' lines
  enrolment_id uuid          REFERENCES enrolments (id),
  -- Set for line_type = 'package' lines
  package_id   uuid          REFERENCES packages   (id),
  -- Set for line_type = 'credit' lines
  credit_id    uuid          REFERENCES credits    (id),
  line_type    text          NOT NULL,
  description  text          NOT NULL,
  unit_price   numeric(10,2) NOT NULL,
  vat_rate     numeric(5,2)  NOT NULL,
  quantity     integer       NOT NULL DEFAULT 1,
  amount       numeric(10,2) NOT NULL,
  -- No updated_at: rows are immutable after insert
  created_at   timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT invoice_lines_type_check CHECK (
    line_type IN ('subject', 'package', 'credit', 'fee', 'discount')
  )
);

-- Payments are immutable once recorded.
CREATE TABLE payments (
  id             uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid          NOT NULL REFERENCES tenants  (id),
  invoice_id     uuid          NOT NULL REFERENCES invoices (id),
  -- Denormalised from invoice for payment-level reporting without a join
  student_id     uuid          NOT NULL REFERENCES students (id),
  amount         numeric(10,2) NOT NULL,
  payment_method text          NOT NULL,
  payment_date   date          NOT NULL,
  reference      text,
  notes          text,
  -- Nullable for automated or imported payment records
  recorded_by    uuid          REFERENCES staff (id),
  -- No updated_at: payments are immutable once created
  created_at     timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT payments_method_check CHECK (
    payment_method IN ('cash', 'card', 'bank_transfer', 'online')
  )
);

ALTER TABLE invoices      ENABLE ROW LEVEL SECURITY;
ALTER TABLE credits       ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments      ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_invoices_tenant_id        ON invoices (tenant_id);
CREATE INDEX idx_invoices_student_id       ON invoices (student_id);
CREATE INDEX idx_invoices_status           ON invoices (status);
CREATE INDEX idx_credits_tenant_id         ON credits (tenant_id);
CREATE INDEX idx_credits_student_id        ON credits (student_id);
CREATE INDEX idx_credits_guardian_id       ON credits (guardian_id);
CREATE INDEX idx_credits_used_on_invoice   ON credits (used_on_invoice_id);
CREATE INDEX idx_invoice_lines_tenant_id   ON invoice_lines (tenant_id);
CREATE INDEX idx_invoice_lines_invoice_id  ON invoice_lines (invoice_id);
CREATE INDEX idx_invoice_lines_enrolment   ON invoice_lines (enrolment_id);
CREATE INDEX idx_invoice_lines_credit_id   ON invoice_lines (credit_id);
CREATE INDEX idx_payments_tenant_id        ON payments (tenant_id);
CREATE INDEX idx_payments_invoice_id       ON payments (invoice_id);
CREATE INDEX idx_payments_student_id       ON payments (student_id);
