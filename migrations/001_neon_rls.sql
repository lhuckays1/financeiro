-- Access model for the Financeiro tables exposed through Neon Data API.
-- Applied to project blue-mountain-21430549 / branch production.

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.profiles, public.accounts, public.categories, public.transactions
  TO authenticated;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.current_verified_email()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT u.email
  FROM neon_auth."user" AS u
  WHERE u.id = auth.uid()
    AND u."emailVerified" IS TRUE
$$;

REVOKE ALL ON FUNCTION public.current_verified_email() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_verified_email() TO authenticated;

CREATE POLICY profile_owner ON public.profiles
  FOR ALL TO authenticated
  USING (lower(email) = lower(public.current_verified_email()))
  WITH CHECK (lower(email) = lower(public.current_verified_email()));

CREATE POLICY accounts_owner ON public.accounts
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = accounts.user_id
        AND lower(p.email) = lower(public.current_verified_email())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = accounts.user_id
        AND lower(p.email) = lower(public.current_verified_email())
    )
  );

CREATE POLICY categories_owner ON public.categories
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = categories.user_id
        AND lower(p.email) = lower(public.current_verified_email())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = categories.user_id
        AND lower(p.email) = lower(public.current_verified_email())
    )
  );

CREATE POLICY transactions_owner ON public.transactions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = transactions.user_id
        AND lower(p.email) = lower(public.current_verified_email())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = transactions.user_id
        AND lower(p.email) = lower(public.current_verified_email())
    )
  );

-- Neon Auth: require verified e-mail before an account can access imported data.
UPDATE neon_auth.project_config
SET email_and_password = email_and_password || jsonb_build_object(
  'requireEmailVerification', true,
  'sendVerificationEmailOnSignUp', true,
  'sendVerificationEmailOnSignIn', true,
  'emailVerificationMethod', 'otp',
  'autoSignInAfterVerification', true
),
updated_at = now();
