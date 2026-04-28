-- ============================================================
-- 031 — Role-aware RLS policies, JWT hook, and permissions table
-- ============================================================
--
-- Extends the tenant-isolation approach in 014 with granular
-- role-based write restrictions for the most sensitive tables.
--
-- Role values in staff.role (snake_case, matches PERMISSIONS matrix):
--   super_admin | admin_head | admin | academic_head | hod | teacher | ta | hr_finance
--
-- Strategy
-- ────────
-- SELECT: tenant isolation only — the app layer enforces read visibility.
-- INSERT/UPDATE/DELETE: tenant isolation + role check for sensitive tables.
--
-- current_staff_role() reads the 'user_role' claim from the JWT, which
-- is embedded at login by the custom_access_token_hook() below.

-- ── Helper: read current staff role from JWT ─────────────────

CREATE OR REPLACE FUNCTION public.current_staff_role()
RETURNS text
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT current_setting('request.jwt.claims', true)::jsonb ->> 'user_role'
$$;

-- ── JWT hook: embed role + tenant_id at login ─────────────────
-- After running this migration, register the hook in Supabase:
--   Dashboard → Authentication → Hooks → Custom Access Token
--   Function: public.custom_access_token_hook

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claims   jsonb;
  v_role   text;
  v_tenant uuid;
BEGIN
  SELECT s.role, s.tenant_id
    INTO v_role, v_tenant
    FROM public.staff s
   WHERE s.user_id = (event ->> 'user_id')::uuid;

  claims := event -> 'claims';

  IF v_role IS NOT NULL THEN
    claims := jsonb_set(claims, '{user_role}', to_jsonb(v_role));
  END IF;
  IF v_tenant IS NOT NULL THEN
    claims := jsonb_set(claims, '{tenant_id}', to_jsonb(v_tenant::text));
  END IF;

  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

-- Only the Supabase auth system may invoke the hook.
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;

-- ── Role group helpers ────────────────────────────────────────

-- Roles that may perform finance mutations (invoices, payments, credits).
CREATE OR REPLACE FUNCTION public.is_finance_role()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT public.current_staff_role() IN (
    'super_admin', 'admin_head', 'admin', 'hr_finance'
  )
$$;

-- Roles that may create/edit people records (students, guardians, leads).
CREATE OR REPLACE FUNCTION public.is_people_editor_role()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT public.current_staff_role() IN (
    'super_admin', 'admin_head', 'admin', 'academic_head', 'hod'
  )
$$;

-- Roles that may manage timetable sessions.
CREATE OR REPLACE FUNCTION public.is_timetable_editor_role()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT public.current_staff_role() IN (
    'super_admin', 'admin_head', 'admin', 'academic_head', 'hod'
  )
$$;

-- ── students: replace broad tenant_isolation with role-aware split ──

DROP POLICY IF EXISTS "tenant_isolation" ON students;

-- All authenticated tenant members may read students.
CREATE POLICY "students_select"
  ON students FOR SELECT
  USING (tenant_id = public.current_tenant_id());

-- INSERT: people-editor roles only.
CREATE POLICY "students_insert"
  ON students FOR INSERT
  WITH CHECK (
    tenant_id = public.current_tenant_id()
    AND public.is_people_editor_role()
  );

-- UPDATE: people-editor roles only.
CREATE POLICY "students_update"
  ON students FOR UPDATE
  USING      (tenant_id = public.current_tenant_id() AND public.is_people_editor_role())
  WITH CHECK (tenant_id = public.current_tenant_id() AND public.is_people_editor_role());

-- DELETE: Super Admin only.
CREATE POLICY "students_delete"
  ON students FOR DELETE
  USING (
    tenant_id = public.current_tenant_id()
    AND public.current_staff_role() = 'super_admin'
  );

-- ── guardians: restrict mutations ────────────────────────────

DROP POLICY IF EXISTS "tenant_isolation" ON guardians;

CREATE POLICY "guardians_select"
  ON guardians FOR SELECT
  USING (tenant_id = public.current_tenant_id());

-- Guardians may be created/edited by: Super Admin, Admin Head, Admin, HR/Finance.
CREATE POLICY "guardians_insert"
  ON guardians FOR INSERT
  WITH CHECK (
    tenant_id = public.current_tenant_id()
    AND public.current_staff_role() IN ('super_admin', 'admin_head', 'admin', 'hr_finance')
  );

CREATE POLICY "guardians_update"
  ON guardians FOR UPDATE
  USING      (tenant_id = public.current_tenant_id()
              AND public.current_staff_role() IN ('super_admin', 'admin_head', 'admin', 'hr_finance'))
  WITH CHECK (tenant_id = public.current_tenant_id()
              AND public.current_staff_role() IN ('super_admin', 'admin_head', 'admin', 'hr_finance'));

CREATE POLICY "guardians_delete"
  ON guardians FOR DELETE
  USING (
    tenant_id = public.current_tenant_id()
    AND public.current_staff_role() IN ('super_admin', 'admin_head')
  );

-- ── enrolments: restrict mutations ───────────────────────────

DROP POLICY IF EXISTS "tenant_isolation" ON enrolments;

CREATE POLICY "enrolments_select"
  ON enrolments FOR SELECT
  USING (tenant_id = public.current_tenant_id());

-- INSERT/UPDATE: Super Admin, Admin Head, Admin only.
CREATE POLICY "enrolments_insert"
  ON enrolments FOR INSERT
  WITH CHECK (
    tenant_id = public.current_tenant_id()
    AND public.current_staff_role() IN ('super_admin', 'admin_head', 'admin')
  );

CREATE POLICY "enrolments_update"
  ON enrolments FOR UPDATE
  USING      (tenant_id = public.current_tenant_id()
              AND public.current_staff_role() IN ('super_admin', 'admin_head', 'admin'))
  WITH CHECK (tenant_id = public.current_tenant_id()
              AND public.current_staff_role() IN ('super_admin', 'admin_head', 'admin'));

CREATE POLICY "enrolments_delete"
  ON enrolments FOR DELETE
  USING (
    tenant_id = public.current_tenant_id()
    AND public.current_staff_role() IN ('super_admin', 'admin_head')
  );

-- ── invoices: finance roles for mutations ────────────────────

DROP POLICY IF EXISTS "tenant_isolation" ON invoices;

CREATE POLICY "invoices_select"
  ON invoices FOR SELECT
  USING (tenant_id = public.current_tenant_id());

CREATE POLICY "invoices_insert"
  ON invoices FOR INSERT
  WITH CHECK (
    tenant_id = public.current_tenant_id()
    AND public.is_finance_role()
  );

CREATE POLICY "invoices_update"
  ON invoices FOR UPDATE
  USING      (tenant_id = public.current_tenant_id() AND public.is_finance_role())
  WITH CHECK (tenant_id = public.current_tenant_id() AND public.is_finance_role());

-- Void/delete: Super Admin, Admin Head, HR/Finance.
CREATE POLICY "invoices_delete"
  ON invoices FOR DELETE
  USING (
    tenant_id = public.current_tenant_id()
    AND public.current_staff_role() IN ('super_admin', 'admin_head', 'hr_finance')
  );

-- ── payments: finance roles for mutations ────────────────────

DROP POLICY IF EXISTS "tenant_isolation" ON payments;

CREATE POLICY "payments_select"
  ON payments FOR SELECT
  USING (tenant_id = public.current_tenant_id());

CREATE POLICY "payments_insert"
  ON payments FOR INSERT
  WITH CHECK (
    tenant_id = public.current_tenant_id()
    AND public.is_finance_role()
  );

CREATE POLICY "payments_update"
  ON payments FOR UPDATE
  USING      (tenant_id = public.current_tenant_id() AND public.is_finance_role())
  WITH CHECK (tenant_id = public.current_tenant_id() AND public.is_finance_role());

-- ── credits: finance roles for mutations ─────────────────────

DROP POLICY IF EXISTS "tenant_isolation" ON credits;

CREATE POLICY "credits_select"
  ON credits FOR SELECT
  USING (tenant_id = public.current_tenant_id());

CREATE POLICY "credits_insert"
  ON credits FOR INSERT
  WITH CHECK (
    tenant_id = public.current_tenant_id()
    AND public.is_finance_role()
  );

CREATE POLICY "credits_update"
  ON credits FOR UPDATE
  USING      (tenant_id = public.current_tenant_id() AND public.is_finance_role())
  WITH CHECK (tenant_id = public.current_tenant_id() AND public.is_finance_role());

CREATE POLICY "credits_delete"
  ON credits FOR DELETE
  USING (
    tenant_id = public.current_tenant_id()
    AND public.current_staff_role() IN ('super_admin', 'admin_head', 'hr_finance')
  );

-- ── sessions (timetable): restrict create/cancel ──────────────

DROP POLICY IF EXISTS "tenant_isolation" ON sessions;

CREATE POLICY "sessions_select"
  ON sessions FOR SELECT
  USING (tenant_id = public.current_tenant_id());

CREATE POLICY "sessions_insert"
  ON sessions FOR INSERT
  WITH CHECK (
    tenant_id = public.current_tenant_id()
    AND public.is_timetable_editor_role()
  );

CREATE POLICY "sessions_update"
  ON sessions FOR UPDATE
  USING      (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY "sessions_delete"
  ON sessions FOR DELETE
  USING (
    tenant_id = public.current_tenant_id()
    AND public.is_timetable_editor_role()
  );

-- ── staff: guard role-field updates via trigger ───────────────
-- RLS cannot restrict individual columns, so we use a BEFORE UPDATE
-- trigger to prevent non-Super-Admin users from changing staff.role.

CREATE OR REPLACE FUNCTION public.staff_role_update_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role
     AND public.current_staff_role() <> 'super_admin'
  THEN
    RAISE EXCEPTION 'Only Super Admin may change a staff member''s role.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_staff_role_update_guard ON staff;
CREATE TRIGGER trg_staff_role_update_guard
  BEFORE UPDATE ON staff
  FOR EACH ROW
  EXECUTE FUNCTION public.staff_role_update_guard();

-- ── role_permissions: persistent overrides for the permissions matrix ──
-- Allows Super Admin to grant/revoke actions per role via Settings.
-- The app reads this table on login to override the default PERMISSIONS
-- matrix from lib/role-config.ts when custom overrides exist.

CREATE TABLE IF NOT EXISTS role_permissions (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid        NOT NULL REFERENCES tenants (id),
  role       text        NOT NULL,
  action     text        NOT NULL,
  granted    boolean     NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid        REFERENCES staff (id),

  CONSTRAINT role_permissions_role_check CHECK (role IN (
    'super_admin', 'admin_head', 'admin',
    'academic_head', 'hod', 'teacher', 'ta', 'hr_finance'
  )),
  UNIQUE (tenant_id, role, action)
);

ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_role_permissions_tenant ON role_permissions (tenant_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role   ON role_permissions (tenant_id, role);

-- Only Super Admin may read or manage the permissions matrix.
CREATE POLICY "role_permissions_super_admin_only"
  ON role_permissions FOR ALL
  USING (
    tenant_id = public.current_tenant_id()
    AND public.current_staff_role() = 'super_admin'
  )
  WITH CHECK (
    tenant_id = public.current_tenant_id()
    AND public.current_staff_role() = 'super_admin'
  );
