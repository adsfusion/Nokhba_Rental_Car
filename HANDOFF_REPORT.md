# NOKHBA RENTAL — AGENT HANDOFF REPORT
**Date:** 2026-05-16 | **Phase:** Post-PDF Integration → Phase 6 (Mobile Signing Portal)

> This document is the **authoritative source of truth** for any AI agent continuing work on this project. Read it fully before writing a single line of code.

---

## 1. PROJECT OVERVIEW & TECH STACK

**Nokhba Rental** is a **multi-tenant B2B SaaS** platform for car rental agencies. Each agency (tenant) operates in an isolated data environment. The system manages clients, vehicle fleets, and full rental contract lifecycles — from creation through digital signature.

### Core Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | ^16.2.6 |
| Language | TypeScript | ~5.8.2 |
| Database & Auth | Supabase (PostgreSQL + RLS) | @supabase/supabase-js ^2.105.4 |
| Supabase SSR | @supabase/ssr | ^0.6.0 |
| Styling | Tailwind CSS v4 | ^4.1.14 |
| Animations | Motion (Framer Motion) | ^12.23.24 |
| Forms | React Hook Form + Zod | ^7.75.0 / ^4.4.3 |
| PDF Generation | jsPDF | ^4.2.1 |
| QR Codes | qrcode.react | ^4.2.0 |
| Signature Capture | react-signature-canvas | ^1.1.0-alpha.2 |
| Icons | lucide-react | ^0.546.0 |
| i18n | next-intl | ^4.0.0 |
| AI | @google/genai | ^1.29.0 |

### Key File Locations

```
src/
├── app/
│   ├── (dashboard)/           # Authenticated tenant dashboard routes
│   ├── sign/[contractId]/     # PUBLIC mobile signing portal (no auth required)
│   │   └── page.tsx           # ✅ COMPLETE — Server component, fetches contract
├── components/
│   ├── contracts/
│   │   ├── ContractWizard.tsx # ✅ COMPLETE — Multi-step contract creation wizard
│   │   ├── MobileSignaturePad.tsx # ✅ COMPLETE — Canvas signature capture
│   │   └── SignatureModal.tsx  # Admin-side signature modal
├── lib/
│   ├── actions/
│   │   ├── contracts.ts       # Authenticated Server Actions (addContract, etc.)
│   │   └── publicContracts.ts # PUBLIC Server Actions (getPublicContractDetails, submitContractSignature)
│   ├── supabase/
│   │   ├── admin.ts           # Service-role client — BYPASSES RLS
│   │   ├── client.ts          # Browser-side anon client
│   │   └── server.ts          # SSR session-aware client
│   ├── pdfGenerator.ts        # ✅ COMPLETE — Advanced coordinate-based jsPDF template
│   └── validations/
│       └── contract.ts        # Zod schema for ContractFormData
└── types/
    └── index.ts               # Shared TypeScript types (Vehicle, Client, etc.)
```

---

## 2. DATABASE SCHEMA & SECURITY (SUPABASE)

### ⚠️ CRITICAL: Row Level Security (RLS) is ACTIVE on ALL tables.

**RLS Policy Pattern:** All tenant-facing tables enforce `tenant_id = auth.uid()` (or equivalent). Any query executed by an anon or session client against a row whose `tenant_id` does not match the authenticated user will return **PostgreSQL error `42501: Insufficient Privilege`** — silently returning an empty array rather than throwing in some SDK versions.

**The Solution — Two Supabase Clients:**

| Client | File | Key | Use Case |
|---|---|---|---|
| **Admin (Service Role)** | `src/lib/supabase/admin.ts` | `SUPABASE_SERVICE_ROLE_KEY` | Bypasses RLS. Used in `publicContracts.ts` for the unauthenticated `/sign/` portal and any Server Action that needs to write without a user session. |
| **Session (SSR)** | `src/lib/supabase/server.ts` | Anon key + cookies | Used in authenticated dashboard routes. Reads/writes ONLY succeed when `tenant_id` matches the session. |

> **RULE:** Server Actions inside the authenticated dashboard MUST use the **session client** and inject the tenant's `tenant_id` from the session cookie into all INSERT operations. Never use the admin client for tenant-scoped operations unless you intend to bypass RLS deliberately (e.g., public portal).

### Key Tables

#### `clients`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `tenant_id` | uuid | FK → auth.users. RLS key. |
| `full_name` | text | |
| `phone` | text | |
| `address` | text | |
| `city` | text | Used as `clientBirthPlace` |
| `id_expiry_date` | text | Used as `clientBirthDate` in wizard |
| `driver_license_number` | text | |
| `driver_license_expiry` | text | |

#### `vehicles`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `tenant_id` | uuid | RLS key |
| `brand` | text | Maps to `vehicleMake` |
| `model` | text | |
| `year` | integer | |
| `license_plate` | text | |
| `mileage` | integer | |
| `daily_rate` | numeric | |
| `fuel_type` | text | |
| `status` | text | `'available'` → `'rented'` on contract creation |

#### `contracts`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key. Used in QR code URL. |
| `tenant_id` | uuid | RLS key |
| `client_id` | uuid | FK → clients |
| `vehicle_id` | uuid | FK → vehicles |
| `contract_number` | text | Sequential, auto-generated |
| `start_date` | text | |
| `end_date` | text | |
| `total_days` | integer | |
| `daily_rate` | numeric | |
| `subtotal` | numeric | |
| `total_amount` | numeric | |
| `deposit_amount` | numeric | |
| `status` | text | `'active'` → `'signed'` after mobile signing |
| `signature_url` | text | Public URL from Supabase Storage `signatures` bucket |
| `signed_at` | timestamptz | Set when client signs via mobile portal |

#### Supabase Storage
- **Bucket:** `signatures` — publicly readable
- **File naming:** `{contractId}_signature_{timestamp}.png`

---

## 3. MILESTONES ACHIEVED (WHAT IS WORKING PERFECTLY — DO NOT REGRESS)

### ✅ 3.1 Contract Wizard — Multi-Step UI
- **File:** `src/components/contracts/ContractWizard.tsx`
- 3-step wizard: **Selection → Terms → Review**
- Client and vehicle selection via interactive card pickers
- Zod schema validation enforced via `react-hook-form` with `zodResolver`
- **Critical:** Form submission is intercepted via `handleSubmit(onFormSubmit, onFormError)`. The `onFormError` callback fires a notification instead of letting native browser validation bubble up. This prevents ghost submissions.

### ✅ 3.2 Server Actions — Database Writes
- `addContract()` in `src/lib/actions/contracts.ts` — Inserts into `contracts` table with all required fields including `tenant_id` from session.
- `updateVehicle()` in `src/lib/actions/vehicles.ts` — Sets vehicle `status` to `'rented'` immediately after contract creation.
- Both actions use `revalidatePath()` which triggers Next.js cache revalidation.

### ✅ 3.3 Advanced PDF Generation
- **File:** `src/lib/pdfGenerator.ts`
- Exports `generateAdvancedPDF(data: any): jsPDF`
- A fully coordinate-based jsPDF template modeled after a professional French rental contract (Voiturelib style).
- All sections are drawn with precise `x, y` coordinates — not auto-layout. Do NOT attempt to add sections by appending text without understanding the coordinate grid.
- **Returns** the `jsPDF` instance — it does **not** call `doc.save()` internally.

### ✅ 3.4 Anti-Freeze PDF Download Mechanism
- **Location:** `downloadPDF()` function inside `ContractWizard.tsx` (lines ~187–239)
- **NEVER** call `doc.save()`. This crashes Next.js SSR environments.
- The correct pattern (already implemented):
  ```typescript
  const pdfBlob = doc.output('blob');
  const blobUrl = URL.createObjectURL(pdfBlob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = 'filename.pdf';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(blobUrl); // Memory cleanup
  ```

### ✅ 3.5 QR Code Generation
- After successful contract submission, the success screen renders a `<QRCodeCanvas>` pointing to `{window.location.origin}/sign/{newContract.id}`.
- This allows the agent to scan and sign from any mobile device.

### ✅ 3.6 Mobile Signing Portal — COMPLETE
- **Route:** `src/app/sign/[contractId]/page.tsx` — Server Component, publicly accessible (no auth).
- Fetches full contract + client + vehicle data via `getPublicContractDetails()` (uses **admin client** to bypass RLS).
- Handles `status === 'signed'` guard — shows an "Already Signed" screen if revisited.
- **Signature Component:** `src/components/contracts/MobileSignaturePad.tsx`
  - Uses `react-signature-canvas` for touch-native Canvas drawing.
  - On confirm: calls `submitContractSignature(contractId, dataURL)`.
  - `submitContractSignature()` in `publicContracts.ts`:
    1. Strips the `data:image/png;base64,` prefix
    2. Converts to `Buffer`
    3. Uploads to Supabase Storage `signatures` bucket
    4. Gets the public URL
    5. Updates `contracts` row: sets `signature_url`, `signed_at`, and `status: 'signed'`

---

## 4. CRUCIAL ARCHITECTURAL NUANCES — DO NOT BREAK THESE

### 4.1 The Data Freezing Pattern (`frozenClient` / `frozenVehicle`)

**Problem:** When `addContract()` server action completes, Next.js calls `revalidatePath()`. This triggers a re-fetch of `vehicles`, and the newly `'rented'` vehicle is filtered out (it's no longer `'available'`). The parent `vehicles` prop array now no longer contains the vehicle the user just selected. This causes the success screen's PDF download to fail silently because `frozenVehicle` would be `undefined`.

**Solution (already implemented):**
```typescript
// Inside onFormSubmit — BEFORE the async server action:
setFrozenClient(clients.find(c => c.id === selectedClientId));
setFrozenVehicle(vehicles.find(v => v.id === selectedVehicleId));

// Then call the server action...
const newContract = await addContract({...});
```

The frozen refs are stored in React state and are **immune to revalidation**. The `downloadPDF()` function reads from `frozenClient` and `frozenVehicle`, never from the live `clients`/`vehicles` props.

**⚠️ Do NOT refactor this into a single `useEffect` or move the freeze AFTER the `await`. The freeze must happen synchronously BEFORE the `await addContract()` call.**

### 4.2 Button Type Safety — Preventing Ghost Form Submissions

All action buttons inside the success screen and wizard (Download PDF, Done, etc.) use:
```tsx
<button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); doAction(); }}>
```

**Why:** These buttons exist inside a `<form>` element (the wizard form). Without `type="button"`, clicking them triggers a native form submit, which fires the Zod validation flow, which in the success screen context has no effect — but the `doc.output('blob')` call may happen mid-transition when React state is being torn down, causing memory errors or silent crashes.

**⚠️ NEVER remove `type="button"` from action buttons inside the wizard form. NEVER remove `e.preventDefault()`.**

### 4.3 jsPDF Coordinate Grid — pdfGenerator.ts

The PDF template uses a strict `(x, y)` mm coordinate system on an A4 page (210mm × 297mm). The layout is:
- **Left column:** x = 10–100 (tenant/client/rental info)
- **Right column:** x = 105–200 (owner/vehicle/insurance info)
- **Full-width sections:** x = 10, w = 190 (vehicle state, clauses, return section)

Do not add text fields using `doc.text()` without knowing the exact coordinates. Overlapping text will silently corrupt the visual layout.

---

## 5. NEXT IMMEDIATE PHASE — CURRENT STATUS

### Phase 6: Mobile Signing Portal — ✅ COMPLETE

The mobile signing portal at `/sign/[contractId]` is **fully implemented and functional**:

- **Server Page** (`src/app/sign/[contractId]/page.tsx`): Fetches contract, handles signed guard, renders summary card with vehicle/dates/total.
- **Client Component** (`src/components/contracts/MobileSignaturePad.tsx`): Canvas-based signature capture with clear/confirm actions, pending state, and success state.
- **Server Action** (`src/lib/actions/publicContracts.ts`): Uploads signature PNG to Supabase Storage `signatures` bucket, updates contract record with `signature_url`, `signed_at`, and `status: 'signed'`.

### What to Build Next (Phase 7 Suggestions)

1. **Contract Detail / Print View** — A `/contracts/[id]` admin page showing the full contract with the embedded signature image and a re-download PDF button.
2. **Dashboard Analytics** — Charts showing active contracts, revenue per month, fleet utilization rate.
3. **Client Portal Improvements** — Allow the client to download the signed PDF directly from the `/sign/` page after signing.
4. **Notifications / Email** — Send the client a confirmation email with PDF attachment after signing (consider Resend or Supabase Edge Functions + nodemailer).
5. **Vehicle Return Flow** — A workflow for marking a contract as `'completed'`, logging return mileage, and releasing the vehicle back to `'available'`.

---

## 6. ENVIRONMENT VARIABLES

Required in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY   # Server-only. NEVER expose to client.
```

> The `SUPABASE_SERVICE_ROLE_KEY` is used **exclusively** in `src/lib/supabase/admin.ts` via `createSupabaseAdminClient()`. This client is server-only and bypasses all RLS. Guard it accordingly.

---

## 7. RUNNING THE PROJECT

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

The dev server runs on `http://localhost:3000`.

---

*End of Handoff Report. All sections above reflect the verified codebase state as of 2026-05-16.*
