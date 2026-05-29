-- ============================================================
-- Phase 3: Payments & Admin Controls Migration
-- Date: 2026-05-29
-- ============================================================

-- ── 1. platform_payment_methods ─────────────────────────────
-- Stores bank accounts / crypto wallets the super admin adds
-- so tenants know where to send payment.
CREATE TABLE IF NOT EXISTS public.platform_payment_methods (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type            TEXT NOT NULL CHECK (type IN ('bank', 'crypto')),
  label           TEXT NOT NULL,            -- e.g. "CIH Bank", "USDT (TRC-20)"
  details         JSONB NOT NULL DEFAULT '{}'::JSONB,
  -- bank: { account_name, account_number, iban, swift, bank_name, branch }
  -- crypto: { network, wallet_address, currency }
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.platform_payment_methods ENABLE ROW LEVEL SECURITY;

-- Super admin can do everything
CREATE POLICY "super_admin_all_payment_methods"
  ON public.platform_payment_methods
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
    )
  );

-- Authenticated tenants can read active methods (so they know where to pay)
CREATE POLICY "tenants_read_active_payment_methods"
  ON public.platform_payment_methods
  FOR SELECT
  TO authenticated
  USING (is_active = TRUE);


-- ── 2. payment_proofs ────────────────────────────────────────
-- Stores payment proof submissions from tenants.
CREATE TABLE IF NOT EXISTS public.payment_proofs (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  subscription_plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  amount_paid          NUMERIC(10, 2) NOT NULL,
  currency             TEXT NOT NULL DEFAULT 'MAD',
  payment_method_id    UUID REFERENCES public.platform_payment_methods(id),
  proof_image_url      TEXT NOT NULL,           -- Supabase Storage URL
  notes                TEXT,                    -- Optional note from tenant
  status               TEXT NOT NULL DEFAULT 'pending'
                         CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason     TEXT,                    -- Set by admin on rejection
  reviewed_by          UUID REFERENCES public.profiles(id),
  reviewed_at          TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.payment_proofs ENABLE ROW LEVEL SECURITY;

-- Tenants can insert their own proofs and read their own proofs
CREATE POLICY "tenants_insert_own_proofs"
  ON public.payment_proofs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT profiles.tenant_id FROM public.profiles
      WHERE profiles.id = auth.uid()
    )
  );

CREATE POLICY "tenants_read_own_proofs"
  ON public.payment_proofs
  FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT profiles.tenant_id FROM public.profiles
      WHERE profiles.id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
    )
  );

-- Super admin can update (approve / reject)
CREATE POLICY "super_admin_update_proofs"
  ON public.payment_proofs
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
    )
  );


-- ── 3. Storage bucket for payment proofs ────────────────────
-- (Run this if the bucket doesn't already exist)
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', FALSE)
ON CONFLICT (id) DO NOTHING;

-- Policy: tenants can upload to their own folder
CREATE POLICY "tenant_upload_proof"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'payment-proofs'
    AND (storage.foldername(name))[1] IN (
      SELECT tenants.slug FROM public.tenants
      JOIN public.profiles ON profiles.tenant_id = tenants.id
      WHERE profiles.id = auth.uid()
    )
  );

-- Policy: super_admin can read all proofs; tenants can read their own
CREATE POLICY "read_proof_images"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'payment-proofs'
    AND (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
          AND profiles.role = 'super_admin'
      )
      OR (storage.foldername(name))[1] IN (
        SELECT tenants.slug FROM public.tenants
        JOIN public.profiles ON profiles.tenant_id = tenants.id
        WHERE profiles.id = auth.uid()
      )
    )
  );


-- ── 4. approve_payment_proof RPC ────────────────────────────
-- Atomic transaction: approve proof + activate tenant subscription
CREATE OR REPLACE FUNCTION public.approve_payment_proof(
  p_proof_id   UUID,
  p_admin_id   UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant_id            UUID;
  v_plan_id              UUID;
  v_duration_days        INTEGER;
  v_max_vehicles         INTEGER;
  v_current_end_date     TIMESTAMPTZ;
  v_new_end_date         TIMESTAMPTZ;
BEGIN
  -- 1. Load proof details
  SELECT tenant_id, subscription_plan_id
  INTO v_tenant_id, v_plan_id
  FROM public.payment_proofs
  WHERE id = p_proof_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment proof not found or already reviewed: %', p_proof_id;
  END IF;

  -- 2. Load plan details
  SELECT duration_days, max_vehicles
  INTO v_duration_days, v_max_vehicles
  FROM public.subscription_plans
  WHERE id = v_plan_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Subscription plan not found for proof: %', p_proof_id;
  END IF;

  -- 3. Calculate new end date (extend from today or from current end date, whichever is later)
  SELECT GREATEST(NOW(), subscription_end_date)
  INTO v_current_end_date
  FROM public.tenants
  WHERE id = v_tenant_id;

  v_new_end_date := COALESCE(v_current_end_date, NOW()) + (v_duration_days || ' days')::INTERVAL;

  -- 4. Mark proof as approved
  UPDATE public.payment_proofs
  SET
    status       = 'approved',
    reviewed_by  = p_admin_id,
    reviewed_at  = NOW(),
    updated_at   = NOW()
  WHERE id = p_proof_id;

  -- 5. Activate tenant subscription
  UPDATE public.tenants
  SET
    subscription_status    = 'active'::subscription_status_enum,
    subscription_plan_id   = v_plan_id,
    subscription_end_date  = v_new_end_date,
    max_vehicles_limit     = v_max_vehicles,
    updated_at             = NOW()
  WHERE id = v_tenant_id;

END;
$$;

-- Grant execute to authenticated users (RLS on the proof table ensures only super_admin can call meaningfully)
GRANT EXECUTE ON FUNCTION public.approve_payment_proof(UUID, UUID) TO authenticated;

-- ── 5. Updated_at trigger (reuse if exists) ──────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_payment_methods_updated_at
  BEFORE UPDATE ON public.platform_payment_methods
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_payment_proofs_updated_at
  BEFORE UPDATE ON public.payment_proofs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
