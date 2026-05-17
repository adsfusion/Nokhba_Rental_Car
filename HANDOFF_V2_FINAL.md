# NOKHBA RENTAL — MASTER HANDOFF DOCUMENT V2
**Date:** 2026-05-16 | **Status:** Stable, localhost-only (no Vercel deploy yet)

---

## 1. PROJECT OVERVIEW

**Nokhba Rental** is a multi-tenant B2B SaaS platform for car rental agencies. Each agency (tenant)
manages its own vehicles, clients, and contracts with strict data isolation via Supabase RLS.

**Owner contact:** adfusiondev@gmail.com  
**Supabase project:** `xpevrbdfqgiynpyisgxm` (region: eu-west-1, name: Nokhba_Rental)  
**Live Vercel deployment:** https://project-b43gb.vercel.app (not yet final — awaiting Phase 8)

---

## 2. TECH STACK & ARCHITECTURE

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.2.6 (App Router, Turbopack) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 (`@theme` in `globals.css`) |
| Backend | Supabase (PostgreSQL 17, Auth, Storage, RLS) |
| Forms | React Hook Form + Zod |
| Animation | `motion/react` (Framer Motion v12) |
| PDF | `jspdf` v4.2.1 (client-side, lazy-imported) |
| Signature | `react-signature-canvas` |
| i18n | `next-intl` (FR/AR — wired but not fully activated) |
| Deployment | Vercel (new account, deploy NOT yet done) |

### App Router Structure

```
src/app/
├── (auth)/              login, register
├── (tenant)/            main dashboard (requires auth)
│   ├── layout.tsx       Server component; wraps with <SidebarProvider>
│   ├── dashboard/
│   ├── fleet/
│   ├── clients/
│   │   └── [id]/
│   │       ├── page.tsx          Client profile (partially built)
│   │       └── edit/page.tsx     ← NEW: full-page client edit form
│   ├── contracts/
│   │   ├── page.tsx              Contract list
│   │   ├── new/page.tsx          Contract wizard
│   │   └── [id]/
│   │       ├── page.tsx          ← Contract Hub (detail view)
│   │       └── edit/page.tsx     ← NEW: full-page contract edit + signature
│   └── settings/
├── (client)/            Mobile-facing public pages
│   ├── sign/[contractId]/   7-step wizard (docs + signature)
│   └── upload/[clientId]/   4-step doc upload portal
└── (saas-admin)/        Super admin (future)
```

---

## 3. DATABASE SCHEMA (Supabase PostgreSQL)

All tables have `tenant_id uuid` (FK → `tenants.id`) enforced by RLS. Every SELECT/INSERT/UPDATE/DELETE
is filtered to `auth.uid()`'s tenant automatically.

### `tenants`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| name | text | Agency name |
| subscription_plan_id | uuid | FK → subscription_plans |
| status | text | active / trial / suspended |

### `profiles`
Linked 1:1 to `auth.users`. Contains `tenant_id`, `full_name`, `role`.

### `vehicles`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| tenant_id | uuid | RLS |
| brand / model / year | text/int | e.g. BMW / X5 / 2024 |
| license_plate | text | unique per tenant |
| status | enum | available / rented / maintenance / inactive |
| mileage | integer | Updated on contract return |
| daily_rate / weekly_rate / monthly_rate | numeric | |
| fuel_type | enum | gasoline / diesel / electric / hybrid |
| transmission | enum | automatic / manual |
| images | jsonb | Array of storage paths |

### `clients`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| tenant_id | uuid | RLS |
| full_name | text | |
| phone | text | |
| address | text | |
| email | text | nullable |
| driver_license_number | text | |
| driver_license_expiry | text | date string |
| date_of_birth | text | nullable |
| place_of_birth | text | nullable |
| is_blacklisted | boolean | |
| notes | text | |

**Client documents** are stored in Supabase Storage (`client-documents` bucket), NOT in a DB table.  
Path format: `{tenantId}/{clientId}/{documentType}`  
Document types: `id_front`, `id_back`, `license_front`, `license_back`

### `contracts` ← PRIMARY TABLE
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| tenant_id | uuid | RLS |
| contract_number | text | e.g. CTR-001001 |
| client_id | uuid | FK → clients |
| vehicle_id | uuid | FK → vehicles |
| start_date / end_date | date | |
| actual_return_date | date | nullable |
| total_days | integer | |
| daily_rate | numeric | |
| subtotal / total_amount | numeric | daily_rate × total_days |
| deposit_amount | numeric | nullable |
| discount / tax | numeric | nullable |
| status | enum | draft / pending_signature / signed / active / completed / cancelled |
| signature_url | text | Public URL from `signatures` storage bucket |
| signed_at | timestamptz | Set when signature submitted |
| qr_code_token | text | nullable (future) |
| pdf_url | text | nullable (future — server-generated PDF) |
| notes | text | Internal agency notes |
| extra_data | jsonb | Stores `vehicle_start_mileage` at contract creation |
| **return_mileage** | integer | ← NEW: odometer at return |
| **return_fuel_level** | text | ← NEW: Empty / 1/4 / 1/2 / 3/4 / Full |
| **return_notes** | text | ← NEW: damage / observations |
| **returned_at** | timestamptz | ← NEW: exact return timestamp |
| created_at / updated_at | timestamptz | |

**Status lifecycle:**  
`draft` → `pending_signature` → `signed` → `active` → `completed`  
(editing a signed contract resets to `pending_signature`, nulls `signature_url` + `signed_at`)

### Storage Buckets
| Bucket | Contents | Access |
|--------|----------|--------|
| `avatars` | User avatars | Private |
| `vehicles` | Vehicle photos | Private |
| `documents` | General docs | Private |
| `signatures` | Signature PNG files | **Public** (`getPublicUrl`) |
| `contracts` | Contract PDFs (future) | Private |
| `tenant-logos` | Agency logos | Private |
| `client-documents` | ID / License photos | Private (signed URLs, 3600s TTL) |

---

## 4. MOBILE WEB FLOW — 7-STEP WIZARD (`/sign/[contractId]`)

This is the client-facing page accessed via QR code or shared link. It lives in `(client)` group
(no auth required). The component is `src/components/contracts/MobileContractFlow.tsx`.

### Step Sequence
1. **Welcome** — Contract summary, client name, rental details
2. **Terms** — Scrollable rental agreement text, "I Agree" checkbox
3. **ID Front** — Camera / PDF upload for national ID front
4. **ID Back** — National ID back
5. **License Front** — Driver's license front
6. **License Back** — Driver's license back
7. **Signature** — `react-signature-canvas` pad, "Submit & Sign" → saves to Supabase

### Smart Skip Logic (implemented)
On mount, `checkClientDocumentsPublic(clientId)` is called. This uses the **Supabase admin client**
(bypasses RLS) to list files at `{tenantId}/{clientId}/`. If all 4 documents are found, the wizard
jumps directly to **Step 5 (Signature)**, skipping the upload steps.

```ts
// src/lib/actions/clientDocuments.ts
export async function checkClientDocumentsPublic(clientId: string): Promise<DocumentType[]>
```

A `Loader2` spinner shows during the check. The client sees no flash of upload steps.

### iOS Camera Fix
Do NOT use `capture="camera"` on `<input type="file" accept="image/*">`. It was removed because
it prevents iOS from offering the photo library — only opens camera. Without the attribute, iOS
shows "Take Photo or Choose File" natively. This is the correct behavior for both phone camera and
existing ID scans.

### 15 MB Supabase Upload Fix
`uploadClientDocumentPublic` enforces a 15 MB hard cap before sending to Supabase:
```ts
const MAX_BYTES = 15 * 1024 * 1024;
if (file.size > MAX_BYTES) throw new Error(`File is too large...`);
```
Supabase Storage default limit for free tier is 50 MB per file, but Supabase's server-side
validation for base64-encoded bodies can fail silently at ~6 MB in some client SDK versions.
The 15 MB pre-check prevents this.

### Standalone Upload Portal (`/upload/[clientId]`)
A simpler 4-step wizard (docs only, no terms/signature). Component: `MobileUploadPortal.tsx`.
Uses the same `uploadClientDocumentPublic` server action. Used when the agency wants to collect
documents separately from signature (e.g. WhatsApp link sharing before arrival).

---

## 5. TENANT DASHBOARD UI — PAGES PARADIGM

### Architecture Decision: No Modals for Forms
**Previous approach (abandoned):** EditClientModal and EditContractModal were overlay modals.  
**Problem:** iOS Safari's fixed + flex + overflow-y-auto combination causes scroll lock bugs that
cannot be reliably fixed with CSS. Real-device testing on iPads confirmed the issue.

**New approach (implemented):** All edit forms are **dedicated full pages**:
- `Edit Client` → navigates to `/clients/{clientId}/edit`
- `Edit Contract` → navigates to `/contracts/{contractId}/edit`

**Benefits:**
- Native browser scroll — zero CSS hackery
- URL-addressable (shareable, back-button works)
- Clean separation of concerns
- Consistent with mobile UX expectations

### Remaining Modal Usage (acceptable)
Only two modals remain — both are **small, single-action** overlays that don't need scroll:
- `ProcessReturnModal` — 3 fields, bounded height, no scroll needed
- `SignLinkPopover` — QR code display, single action

These are safe because they don't contain tall forms.

### Sidebar Mobile Menu
**Problem (fixed):** `Sidebar.tsx` had internal `useState`. `Header.tsx` had an `onMobileMenuClick`
prop. The layout never connected them → hamburger was dead.

**Fix:** `SidebarContext.tsx` provides shared state via React context.
```
SidebarProvider (wraps tenant layout)
  ├── Sidebar → consumes useSidebar().open / .close
  └── Header → consumes useSidebar().toggle
```
The layout (`(tenant)/layout.tsx`) stays a **server component** (async, fetches profile). Only the
`SidebarProvider` is a client boundary.

---

## 6. CONTRACT HUB (`/contracts/[id]`)

The central detail page for each contract. Component: `src/components/contracts/ContractDetail.tsx`.

### Sections
1. **Header bar** — Contract number, status badge, "← Back", "Edit Contract" link
2. **Summary grid** — Client card, Vehicle card, Rental Period card, Financials card
3. **Signature panel**:
   - If signed: signature image (`<img src={signature_url}>`) + signed_at timestamp + "Download PDF"
   - If not signed: "Awaiting Signature" chip + "Send Signature Link" button → `SignLinkPopover`
4. **Client Documents** — 2×2 grid of the 4 document types (thumbnail + "View" link if uploaded,
   grey placeholder + "Not Uploaded" if missing). Signed URLs expire in 3600 seconds.
5. **Return Details** — Only shown when `status === 'completed' && returned_at != null`.
   Shows return mileage, fuel level, returned_at timestamp, return notes.

### PDF Download
Client-side jsPDF generation (lazy import `await import('jspdf')`). Builds a one-page PDF with:
contract header, client info, vehicle info, rental terms, financial summary, embedded signature image.
File saved as `contract-{contract_number}.pdf`. Only active when `signature_url` exists.

---

## 7. PROCESS RETURN FLOW

**Entry point:** "Process Return" button on the Contracts list (only visible when `status === 'active'`).

**Component:** `src/components/contracts/ProcessReturnModal.tsx`

**Fields collected:**
- Return Mileage (integer, required, min = `extra_data.vehicle_start_mileage`)
- Fuel Level (select: Empty / 1/4 / 1/2 / 3/4 / Full)
- Return Notes (textarea, optional)

**Server action:** `processContractReturn(contractId, vehicleId, data)` in `contracts.ts`:
- Updates contract: `status → completed`, `returned_at`, `return_mileage`, `return_fuel_level`, `return_notes`
- Updates vehicle: `status → available`, `mileage → return_mileage`
- Calls `revalidatePath('/contracts')`

**Note on `vehicle_start_mileage`:** Stored in `contract.extra_data.vehicle_start_mileage` at
contract creation (set in `ContractWizard.tsx`). Used as min validation in the return modal.
If `extra_data` is null (older contracts), the min defaults to 0.

---

## 8. SERVER ACTIONS REFERENCE

### `src/lib/actions/contracts.ts`
| Function | Description |
|----------|-------------|
| `getContracts()` | All contracts for current tenant (with clients+vehicles joined) |
| `getContractById(id)` | Single contract by ID |
| `getContractsByClientId(clientId)` | All contracts for a client |
| `addContract(data)` | Insert new contract, sets tenant_id |
| `updateContract(id, updates)` | Partial update, revalidates `/contracts` |
| `processContractReturn(contractId, vehicleId, data)` | Complete return + update vehicle |
| `getNextContractId()` | Generates CTR-XXXXXX sequence number |

### `src/lib/actions/clients.ts`
| Function | Description |
|----------|-------------|
| `getClients()` | All clients for tenant |
| `getClientById(id)` | Single client |
| `addClient(data)` | Insert client |
| `updateClient(id, updates)` | Partial update, revalidates `/clients` |

### `src/lib/actions/clientDocuments.ts`
| Function | Description |
|----------|-------------|
| `uploadClientDocument(clientId, type, formData)` | Upload (authenticated, tenant-scoped) |
| `getClientDocumentUrl(clientId, type)` | Signed URL (3600s), authenticated |
| `getClientDocumentUrls(clientId)` | All 4 types → `Partial<Record<DocumentType, string>>` |
| `deleteClientDocument(clientId, type)` | Delete from storage |
| `uploadClientDocumentPublic(clientId, type, formData)` | Upload via admin client (no auth) |
| `checkClientDocumentsPublic(clientId)` | Returns array of uploaded DocumentTypes (no auth) |

### `src/lib/actions/publicContracts.ts`
| Function | Description |
|----------|-------------|
| `submitContractSignature(contractId, base64DataUrl)` | Uploads PNG to `signatures` bucket, sets `signature_url`, `signed_at`, `status: 'signed'` |
| `getContractPublic(contractId)` | Fetches contract for mobile wizard (no auth, admin client) |

---

## 9. SUPABASE ADMIN CLIENT

**File:** `src/lib/supabase/admin.ts`  
**Usage:** Used ONLY for public-facing routes where no user session exists (mobile upload portal,
sign wizard). Bypasses RLS entirely — all queries run as service role.

**Pattern:** Always resolve `tenant_id` by joining through `clients` or `contracts` table:
```ts
const { data: client } = await admin.from('clients').select('tenant_id').eq('id', clientId).maybeSingle();
// Use client.tenant_id to scope the storage path — prevents cross-tenant writes
```

---

## 10. KEY COMPONENTS MAP

```
src/components/
├── layout/
│   ├── Sidebar.tsx              Nav sidebar with mobile drawer
│   ├── SidebarContext.tsx        Context: open/toggle/close state
│   ├── Header.tsx               Top bar, hamburger, notifications
│   └── NotificationProvider.tsx  Toast-style notification context
├── fleet/
│   └── FleetTable.tsx           Vehicle list + ReturnVehicleModal (fleet view)
├── clients/
│   ├── ClientTable.tsx          Client list with search/filter
│   ├── ClientProfile.tsx        Client profile view (partially built)
│   └── EditClientPage.tsx       ← NEW: full-page client edit form
├── contracts/
│   ├── ContractList.tsx         Main contracts table (row → Hub, buttons → pages)
│   ├── ContractDetail.tsx       Contract Hub page component
│   ├── EditContractPage.tsx     ← NEW: full-page contract edit + signature
│   ├── ContractWizard.tsx       New contract creation wizard
│   ├── ProcessReturnModal.tsx   Return inspection modal (mileage/fuel/notes)
│   ├── SignLinkPopover.tsx      QR + copy link popover for remote signature
│   └── MobileContractFlow.tsx  7-step public wizard (/sign/[id])
└── upload/
    └── MobileUploadPortal.tsx   4-step public doc upload (/upload/[id])
```

---

## 11. WHAT'S DONE vs. WHAT'S PENDING

### ✅ DONE (stable, tested)
- Full multi-tenant auth (Supabase Auth + RLS)
- Vehicle fleet management (CRUD, status, mileage)
- Client management (CRUD, search)
- Contract creation wizard (client + vehicle selection + terms)
- Contract list with status badges, row navigation to Hub
- **Contract Hub** (`/contracts/[id]`) — all 5 panels
- **Edit Contract page** (`/contracts/[id]/edit`) — form + signature capture
- **Edit Client page** (`/clients/[id]/edit`) — form + upload link
- **Process Return modal** — mileage, fuel, notes persisted to DB
- **Mobile 7-step wizard** — doc upload + signature + smart skip
- **Mobile 4-step upload portal** — standalone doc upload
- **Sidebar mobile menu** — hamburger wired via SidebarContext
- **iOS-safe modals** — backdrop-scrolls pattern, no scroll lock

### ⏳ PENDING (Phase 5–8)
- **jsPDF server-side** — current PDF is client-side; a server-rendered PDF with proper layout is needed for future
- **WhatsApp payment redirect** — Phase 7
- **Super Admin dashboard** — manage tenants, plans, billing
- **Subscription enforcement UI** — trial countdown, blocking
- **i18n activation** — next-intl is configured but strings are hardcoded in FR
- **Email notifications** — Resend integration (Phase 8)
- **Dashboard metrics** — real-time counts from DB
- **Contract PDF server generation** — store in `contracts` bucket, update `pdf_url`
- **Vercel production deploy** — Phase 8 only (new Vercel account reserved)

---

## 12. CRITICAL GOTCHAS FOR THE NEXT AGENT

1. **`terms_accepted` column does NOT exist** in the DB. `publicContracts.ts` tries to set it —
   this silently fails (Supabase ignores unknown columns in update). Remove or add the column before relying on it.

2. **Contract status after signing is `'signed'`, not `'active'`**. The "active" status is meant
   to be set manually or via a future workflow (e.g. when keys are handed over). Don't assume
   signing = active rental.

3. **`extra_data.vehicle_start_mileage`** is NOT automatically populated during contract creation
   (the wizard doesn't set it). It needs to be added to `ContractWizard.tsx` → `addContract()` call.

4. **Tailwind v4**: Uses `@theme` in `globals.css`, NOT a `tailwind.config.js` file. Custom colors
   like `bg-surface-container-lowest` are defined as CSS custom properties. Do NOT generate a config file.

5. **`motion/react`** is the correct package (not `framer-motion`). Import from `'motion/react'`.

6. **Server Actions with `'use server'`** cannot be called from other server action files using
   dynamic import. Use direct `createSupabaseServerClient()` calls within the same file.

7. **Supabase Storage `list(prefix)`** returns items where `.name` = the last path segment only,
   not the full path. For `list('tenantId/clientId')`, each item's `.name` = `'id_front'` etc.

8. **No `supabase/migrations/` directory** exists in this repo. All schema changes are applied
   directly via the Supabase MCP `apply_migration` tool. The Supabase project ID is `xpevrbdfqgiynpyisgxm`.

9. **`revalidatePath` is NOT recursive**. After updating a contract from `/contracts/[id]/edit`,
   call `revalidatePath('/contracts')` AND `revalidatePath('/contracts/' + id)` to refresh both
   the list and the hub page.

10. **`SidebarProvider` is a client component** wrapping server-rendered children in the layout.
    This is the standard Next.js pattern — server components can be passed as `children` to client
    providers without becoming client components themselves.
