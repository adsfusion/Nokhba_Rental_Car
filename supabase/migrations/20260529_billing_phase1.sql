-- =============================================================================
-- NOKHBA RENTAL — SaaS Billing Phase 1 Migration
-- Date: 2026-05-29
-- Description: Adds subscription lifecycle fields to support 24h trial logic,
--              multi-state subscription status, vehicle limits, and plan durations.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. SUBSCRIPTION STATUS ENUM
--    Defines all possible states for a tenant's subscription.
-- -----------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE subscription_status_enum AS ENUM (
    'trialing',   -- Active within the trial window
    'pending',    -- Trial expired / payment proof uploaded, awaiting admin review
    'active',     -- Payment approved, full dashboard access
    'expired',    -- Trial ended with no action taken
    'rejected'    -- Payment proof was rejected by admin
  );
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Type subscription_status_enum already exists, skipping.';
END $$;


-- -----------------------------------------------------------------------------
-- 2. TENANTS TABLE — Add subscription lifecycle columns
-- -----------------------------------------------------------------------------

-- 2a. Subscription status (defaults to 'trialing' for all new tenants)
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS subscription_status subscription_status_enum
    NOT NULL DEFAULT 'trialing'::subscription_status_enum;

-- 2b. Denormalised vehicle cap — set from the plan at creation/upgrade time.
--     Avoids a live join on every request from the vehicle guard.
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS max_vehicles_limit INTEGER
    NOT NULL DEFAULT 5;

-- Safety: ensure subscription_end_date column exists (was referenced in layout but
-- may not have been in an explicit prior migration)
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMPTZ;


-- -----------------------------------------------------------------------------
-- 3. SUBSCRIPTION_PLANS TABLE — Add duration_days
--    Drives the server-side computation of subscription_end_date.
--    Default 30 = standard monthly plan.
--    Trial plans must have this set to 1.
-- -----------------------------------------------------------------------------
ALTER TABLE subscription_plans
  ADD COLUMN IF NOT EXISTS duration_days INTEGER
    NOT NULL DEFAULT 30;


-- -----------------------------------------------------------------------------
-- 4. BACKFILL — Patch any existing tenants so they have coherent status values.
--    Tenants with no end date get status 'active' (manually provisioned).
--    Tenants whose end date is in the past get status 'expired'.
-- -----------------------------------------------------------------------------
UPDATE tenants
SET subscription_status = CASE
  WHEN subscription_end_date IS NULL          THEN 'active'::subscription_status_enum
  WHEN subscription_end_date < now()          THEN 'expired'::subscription_status_enum
  ELSE                                             'trialing'::subscription_status_enum
END
WHERE subscription_status = 'trialing'::subscription_status_enum;   -- only patch the default-filled rows
