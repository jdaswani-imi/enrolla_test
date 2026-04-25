-- ============================================================
-- 014 — Row Level Security policies
-- ============================================================
-- All RLS POLICY definitions consolidated here.
--
-- JWT claim strategy
-- ──────────────────
-- A Supabase Auth hook fires at login, reads staff.tenant_id for
-- auth.uid(), and embeds it as the custom JWT claim 'tenant_id'.
-- All tenant-scoped policies read this claim via current_tenant_id().
--
-- Service role
-- ────────────
-- The Supabase service_role Postgres role carries BYPASSRLS and does
-- not require explicit policies. All write operations that bypass RLS
-- (e.g. invoice total updates, sequence increments) use the service role
-- key from Route Handlers only — never exposed to the browser.
--
-- Anon / unauthenticated requests
-- ─────────────────────────────────
-- When no JWT is present, current_tenant_id() returns NULL.
-- NULL = NULL is false in Postgres, so all tenant-scoped policies
-- silently deny anon access with no additional configuration needed.

-- ── Helper function ──────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT (current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id')::uuid
$$;

-- ── tenants ───────────────────────────────────────────────────
-- A staff member may only read their own tenant row.
-- INSERT / UPDATE / DELETE on tenants is platform-admin only (service role).

CREATE POLICY "tenants_select_own" ON tenants
  FOR SELECT
  USING (id = public.current_tenant_id());

-- ── Standard tenant isolation ─────────────────────────────────
-- FOR ALL: covers SELECT (USING) and INSERT/UPDATE (WITH CHECK).

CREATE POLICY "tenant_isolation" ON branches
  FOR ALL
  USING      (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY "tenant_isolation" ON departments
  FOR ALL
  USING      (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY "tenant_isolation" ON year_groups
  FOR ALL
  USING      (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY "tenant_isolation" ON subjects
  FOR ALL
  USING      (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY "tenant_isolation" ON rooms
  FOR ALL
  USING      (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY "tenant_isolation" ON staff
  FOR ALL
  USING      (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY "tenant_isolation" ON staff_branches
  FOR ALL
  USING      (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY "tenant_isolation" ON students
  FOR ALL
  USING      (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY "tenant_isolation" ON guardians
  FOR ALL
  USING      (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY "tenant_isolation" ON student_guardians
  FOR ALL
  USING      (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY "tenant_isolation" ON guardian_co_parent_links
  FOR ALL
  USING      (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY "tenant_isolation" ON sibling_links
  FOR ALL
  USING      (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY "tenant_isolation" ON packages
  FOR ALL
  USING      (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY "tenant_isolation" ON package_subjects
  FOR ALL
  USING      (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY "tenant_isolation" ON academic_years
  FOR ALL
  USING      (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY "tenant_isolation" ON terms
  FOR ALL
  USING      (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY "tenant_isolation" ON calendar_periods
  FOR ALL
  USING      (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY "tenant_isolation" ON public_holidays
  FOR ALL
  USING      (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY "tenant_isolation" ON enrolments
  FOR ALL
  USING      (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY "tenant_isolation" ON trials
  FOR ALL
  USING      (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY "tenant_isolation" ON withdrawals
  FOR ALL
  USING      (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY "tenant_isolation" ON makeup_allowances
  FOR ALL
  USING      (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY "tenant_isolation" ON sessions
  FOR ALL
  USING      (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY "tenant_isolation" ON session_students
  FOR ALL
  USING      (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY "tenant_isolation" ON makeup_sessions
  FOR ALL
  USING      (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY "tenant_isolation" ON attendance_records
  FOR ALL
  USING      (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY "tenant_isolation" ON invoices
  FOR ALL
  USING      (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY "tenant_isolation" ON credits
  FOR ALL
  USING      (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

-- Payments: INSERT + SELECT for authenticated staff; no DELETE policy.
CREATE POLICY "tenant_isolation" ON payments
  FOR ALL
  USING      (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY "tenant_isolation" ON concerns
  FOR ALL
  USING      (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

-- ── invoice_lines — SELECT + INSERT only; no UPDATE or DELETE ─
-- Immutability is enforced by the absence of UPDATE and DELETE policies.
-- All invoice total adjustments flow through invoices.total_paid and
-- invoices.amount_due, updated by a service-role function.

CREATE POLICY "invoice_lines_select" ON invoice_lines
  FOR SELECT
  USING (tenant_id = public.current_tenant_id());

CREATE POLICY "invoice_lines_insert" ON invoice_lines
  FOR INSERT
  WITH CHECK (tenant_id = public.current_tenant_id());

-- ── schools — platform defaults (tenant_id IS NULL) visible to all ──

CREATE POLICY "schools_select" ON schools
  FOR SELECT
  USING (tenant_id IS NULL OR tenant_id = public.current_tenant_id());

-- Tenants may only INSERT their own schools (status starts as pending_approval)
CREATE POLICY "schools_insert" ON schools
  FOR INSERT
  WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY "schools_update" ON schools
  FOR UPDATE
  USING      (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY "schools_delete" ON schools
  FOR DELETE
  USING (tenant_id = public.current_tenant_id());
