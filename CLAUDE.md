# NOKHBA RENTAL - MASTER PROJECT CONTEXT & ROADMAP

## 1. PROJECT OVERVIEW
- **Project Name:** Nokhba Rental.
- **Type:** Multi-tenant B2B SaaS platform.
- **Target Audience:** Car rental agencies and fleet management companies.
- **Core Value Proposition:** A professional, scalable platform to manage vehicles, clients, contracts (with e-signatures and QR codes), and subscriptions with strict data isolation per agency.

## 2. TECH STACK
- **Framework:** Next.js 16 (App Router), React, TypeScript.
- **Styling:** Tailwind CSS v4 (using `@theme` configuration).
- **Backend/Database:** Supabase (PostgreSQL, Auth, Storage).
- **Forms & Validation:** React Hook Form + Zod.
- **Localization:** `next-intl` (Fully supporting French [LTR] and Arabic [RTL]).

## 3. DATABASE & MULTI-TENANCY ARCHITECTURE (SUPABASE)
- **Multi-tenancy:** Every core table includes a `tenant_id` column.
- **Security:** Strict Row Level Security (RLS) policies are enforced on ALL tables so tenants can only access their own data.
- **Tables (8 core):** `subscription_plans`, `tenants`, `profiles`, `vehicles`, `clients`, `contracts`, `tenant_payments`, `platform_settings`.
- **Storage Buckets (6):** `avatars`, `vehicles`, `documents`, `signatures`, `contracts`, `tenant-logos`.
- **Enforcement:** Subscriptions (e.g., maximum allowed vehicles) are enforced at the database level using PostgreSQL Triggers (e.g., `check_vehicle_limit()`).

## 4. STRICT DEVELOPMENT RULES (THE "CONSTITUTION")
1. **LOCALHOST ONLY:** Absolute restriction on deployments. Do NOT use `git push` and do NOT deploy to Vercel/GitHub until explicitly commanded in the final phase.
2. **SEPARATION OF CONCERNS:** Keep Server Actions (`lib/actions`), validations (`lib/validations`), and UI components strictly separated. No monolithic files.
3. **ERROR HANDLING:** Frontend MUST gracefully catch and display Supabase trigger errors (e.g., "Subscription limit reached" P0001 codes) using toasts or form errors.

## 5. UI/UX & DESIGN SYSTEM STRATEGY
- **Aesthetic:** Premium, minimalist B2B SaaS (Vercel/Stripe/Linear vibe). Clean backgrounds (`bg-surface-container-lowest`), sharp borders, and subtle colored shadows.
- **RTL/LTR Perfection:** Always use Tailwind logical properties (`ps-`, `me-`, `border-s`, `text-start`). Never use physical properties (`pl-`, `mr-`, `border-l`).

---

## 6. PROJECT ROADMAP & PHASES

### Phase 1: Project Setup & Architecture [x]
- [x] Initialize Next.js 16 (App Router), TypeScript, Tailwind CSS v4.
- [x] Configure Supabase backend (eu-west-1).
- [x] Setup 8 multi-tenant tables.
- [x] Apply strict RLS policies for data isolation.
- [x] Create `check_vehicle_limit()` trigger for subscription enforcement.
- [x] Setup 6 storage buckets.
- [x] Configure i18n (`next-intl`) for French (LTR) and Arabic (RTL).

### Phase 2: UI Shell & Responsive Layout [x]
- [x] Configure `globals.css` with `@theme` custom design tokens.
- [x] Build 100% responsive Sidebar and Header.
- [x] Implement Dark/Light mode persistence.
- [x] Build Dashboard layout with responsive grid and metrics.

### Phase 3: Auth UI & Fleet Management [x]
- [x] Integrate HTML/Tailwind design into Auth Login Page seamlessly with Server Actions.
- [x] Build responsive Fleet Data Table with horizontal scroll on mobile.
- [x] Build Add/Edit Vehicle forms.
- [x] Implement error catching for `check_vehicle_limit()` trigger.

### Phase 4: Client Management & CRM [x]
- [x] Convert Client UI to Next.js components and link to `clients` table.
- [x] Build Add/Edit Client workflow.
- [x] Implement search, filter, and CRM metric overviews.

### Phase 5: Contracts & PDF Generation [ ]
- [x] Build contract wizard Step 1: Select Client + Select Vehicle.
- [ ] Build contract wizard Step 2: Rental Terms form.
- [ ] Build contract wizard Step 3: Review & Sign.
- [ ] Integrate `jspdf` for printable PDF outputs.
- [ ] Generate dynamic QR code linked to the specific contract ID.

### Phase 6: Mobile Web Portal (Client-Facing) [ ]
- [ ] Build lightweight mobile-web page (accessed via QR scan).
- [ ] Integrate `react-signature-canvas` for e-signatures.
- [ ] Build ID/License photo upload flow linking directly to Supabase storage.
- [ ] Auto-attach signature and documents to the parent contract.

### Phase 7: Billing, WhatsApp & Super Admin [ ]
- [ ] Implement manual WhatsApp payment redirection flow.
- [ ] Build Super Admin dashboard to manage Tenants and dynamic `subscription_plans`.
- [ ] Enforce 24-hour trial logic and tenant blocking mechanisms.

### Phase 8: Final Polish & Local Verification [ ]
- [ ] Exhaustive testing of Dark/Light modes and RTL/LTR alignment.
- [ ] Final localhost security and bug sweep.

---

## 7. INFRASTRUCTURE DIRECTIVES (Phase 8 Pre-Deployment)
> These are preparation notes only. The STRICT LOCALHOST RULE is active until Phase 8 is 100% cleared.
- **GitHub:** Target repo name: `Nokhba_Rental`. No pushes until Phase 8.
- **Supabase:** Using the brand-new dedicated Supabase account. Zero crossover with old projects.
- **Vercel:** Brand-new Vercel account reserved for production.
- **SMTP/Email:** Abstracted behind `src/lib/email/send.ts`. Target provider: Resend. Deferred to Phase 8.
