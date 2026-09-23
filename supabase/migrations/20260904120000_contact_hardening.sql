-- Contact form hardening: create base table if missing, add is_read tracking,
-- rate-limit table, grants, RLS, and policies — all idempotent.

-- ──────────────────────────────────────────────────────────────────────────
-- 0. Ensure has_role helper exists (safe on fresh databases).
--    The canonical definition lives in the earliest migration; if the
--    function is missing we create the minimal enum + table + function
--    that the project's admin policies depend on.
-- ──────────────────────────────────────────────────────────────────────────
DO $migration$
DECLARE
  _has_role boolean;
BEGIN
  -- Ensure the public.app_role enum exists BEFORE any cast/query references it.
  IF NOT EXISTS (
    SELECT 1 FROM pg_type
    WHERE typname = 'app_role' AND typnamespace = 'public'::regnamespace
  ) THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'editor');
  END IF;

  -- Check for the exact signature has_role(uuid, public.app_role), not any overload.
  -- (Runs after the enum exists so the regtype cast below resolves safely.)
  SELECT EXISTS (
    SELECT 1
    FROM pg_proc
    WHERE proname      = 'has_role'
      AND pronamespace = 'public'::regnamespace
      AND pronargs     = 2
      AND proargtypes[1] = 'uuid'::regtype
      AND proargtypes[2] = 'app_role'::regtype
  ) INTO _has_role;

  IF NOT _has_role THEN
    -- user_roles join table
    CREATE TABLE IF NOT EXISTS public.user_roles (
      id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      role       public.app_role NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (user_id, role)
    );
    GRANT SELECT ON public.user_roles TO authenticated;
    GRANT ALL   ON public.user_roles TO service_role;
    ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

    -- has_role SECURITY DEFINER helper (distinct $func$ tag avoids nesting conflict)
    CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
    RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
      SET search_path = public AS $func$
      SELECT EXISTS (
        SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
      );
    $func$;

    REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
    GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
  END IF;
END
$migration$;

-- 1. Create the base contact_messages table if it doesn't already exist.
--    Columns match the original migration and the TypeScript types.
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  email      text NOT NULL,
  phone      text,
  subject    text,
  message    text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Track read/unread status for admin inbox (idempotent).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'contact_messages'
      AND column_name  = 'is_read'
  ) THEN
    ALTER TABLE public.contact_messages
      ADD COLUMN is_read boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- 3. Ensure base grants exist (idempotent — only grant what's missing).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.role_table_grants
    WHERE table_schema = 'public' AND table_name = 'contact_messages'
      AND grantee = 'anon' AND privilege_type = 'INSERT'
  ) THEN
    GRANT INSERT ON public.contact_messages TO anon;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.role_table_grants
    WHERE table_schema = 'public' AND table_name = 'contact_messages'
      AND grantee = 'authenticated' AND privilege_type = 'INSERT'
  ) THEN
    GRANT INSERT ON public.contact_messages TO authenticated;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.role_table_grants
    WHERE table_schema = 'public' AND table_name = 'contact_messages'
      AND grantee = 'authenticated' AND privilege_type = 'SELECT'
  ) THEN
    GRANT SELECT ON public.contact_messages TO authenticated;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.role_table_grants
    WHERE table_schema = 'public' AND table_name = 'contact_messages'
      AND grantee = 'authenticated' AND privilege_type = 'DELETE'
  ) THEN
    GRANT DELETE ON public.contact_messages TO authenticated;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.role_table_grants
    WHERE table_schema = 'public' AND table_name = 'contact_messages'
      AND grantee = 'service_role' AND privilege_type = 'INSERT'
  ) THEN
    GRANT ALL ON public.contact_messages TO service_role;
  END IF;
END $$;

-- 4. Enable RLS (idempotent).
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- 5. Base policies (idempotent — CREATE POLICY IF NOT EXISTS on PG 9.5+,
--    but we use a DO block for broader compatibility).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'contact_messages'
      AND policyname = 'anyone can send a message'
  ) THEN
    CREATE POLICY "anyone can send a message"
      ON public.contact_messages
      FOR INSERT
      TO anon, authenticated
      WITH CHECK (
        char_length(message) BETWEEN 1 AND 4000
        AND char_length(name) BETWEEN 1 AND 120
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'contact_messages'
      AND policyname = 'admins read messages'
  ) THEN
    CREATE POLICY "admins read messages"
      ON public.contact_messages
      FOR SELECT
      TO authenticated
      USING (public.has_role(auth.uid(), 'admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'contact_messages'
      AND policyname = 'admins delete messages'
  ) THEN
    CREATE POLICY "admins delete messages"
      ON public.contact_messages
      FOR DELETE
      TO authenticated
      USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- ──────────────────────────────────────────────────────────────────────────
-- Rate-limit table
-- ──────────────────────────────────────────────────────────────────────────

-- 6. Simple server-side rate limit table (IP/email hash + timestamp).
CREATE TABLE IF NOT EXISTS public.contact_rate_limits (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash    text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 7. Grants for rate-limit table (idempotent).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.role_table_grants
    WHERE table_schema = 'public' AND table_name = 'contact_rate_limits'
      AND grantee = 'anon' AND privilege_type = 'INSERT'
  ) THEN
    GRANT INSERT ON public.contact_rate_limits TO anon;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.role_table_grants
    WHERE table_schema = 'public' AND table_name = 'contact_rate_limits'
      AND grantee = 'service_role' AND privilege_type = 'INSERT'
  ) THEN
    GRANT ALL ON public.contact_rate_limits TO service_role;
  END IF;
END $$;

-- 8. Enable RLS on rate-limit table.
ALTER TABLE public.contact_rate_limits ENABLE ROW LEVEL SECURITY;

-- 9. Rate-limit policies (idempotent).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'contact_rate_limits'
      AND policyname = 'anon can insert rate limits'
  ) THEN
    CREATE POLICY "anon can insert rate limits"
      ON public.contact_rate_limits
      FOR INSERT
      TO anon
      WITH CHECK (true);
  END IF;
END $$;

-- 10. Cleanup helper: delete rows older than 24 h.
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  DELETE FROM public.contact_rate_limits
  WHERE created_at < now() - interval '24 hours';
$$;
