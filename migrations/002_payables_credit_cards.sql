-- Contas a pagar e compras parceladas no cartão.
-- Aplicar no branch production do projeto Neon financeiro.

CREATE TABLE IF NOT EXISTS public.credit_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  limit_amount numeric(14,2) NOT NULL DEFAULT 0 CHECK (limit_amount >= 0),
  closing_day smallint NOT NULL CHECK (closing_day BETWEEN 1 AND 31),
  due_day smallint NOT NULL CHECK (due_day BETWEEN 1 AND 31),
  color text NOT NULL DEFAULT '#6366F1',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  amount numeric(14,2) NOT NULL CHECK (amount > 0),
  category text NOT NULL DEFAULT 'Outros',
  due_date date NOT NULL,
  purchase_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
  paid_at timestamptz,
  payment_account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL,
  card_id uuid REFERENCES public.credit_cards(id) ON DELETE SET NULL,
  purchase_group uuid,
  installment_number smallint,
  installment_count smallint,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (installment_number IS NULL AND installment_count IS NULL)
    OR (installment_number BETWEEN 1 AND installment_count AND installment_count >= 1)
  )
);

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS source_payable_id uuid UNIQUE REFERENCES public.payables(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS credit_cards_user_idx ON public.credit_cards(user_id);
CREATE INDEX IF NOT EXISTS payables_user_due_idx ON public.payables(user_id, due_date);
CREATE INDEX IF NOT EXISTS payables_card_idx ON public.payables(card_id) WHERE card_id IS NOT NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.credit_cards, public.payables TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO authenticated;

ALTER TABLE public.credit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payables ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS credit_cards_owner ON public.credit_cards;
CREATE POLICY credit_cards_owner ON public.credit_cards
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = credit_cards.user_id
      AND lower(p.email) = lower(public.current_verified_email())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = credit_cards.user_id
      AND lower(p.email) = lower(public.current_verified_email())
  ));

DROP POLICY IF EXISTS payables_owner ON public.payables;
CREATE POLICY payables_owner ON public.payables
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = payables.user_id
      AND lower(p.email) = lower(public.current_verified_email())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = payables.user_id
      AND lower(p.email) = lower(public.current_verified_email())
  ));

DROP POLICY IF EXISTS transactions_payable_owner ON public.transactions;
CREATE POLICY transactions_payable_owner ON public.transactions
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = transactions.user_id
      AND lower(p.email) = lower(public.current_verified_email())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = transactions.user_id
      AND lower(p.email) = lower(public.current_verified_email())
  ));

