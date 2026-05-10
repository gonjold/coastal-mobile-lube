# COASTAL FEATURE INVENTORY

Generated: 2026-05-10T01:48:39Z
Branch: chore/audit-phase-1
Source SHA: f19fcadffdaedfad8fba30c5bb117c2620cdcd13
Scope: Pure inventory of `~/coastal-mobile-lube` at the source SHA above. No editorial commentary.

## 0. Bucket legend

- `admin` — operational admin tooling on /admin/*
- `field` — field-worker tooling on /field/* or /tech/*
- `cms` — admin surfaces that manage public-facing content
- `public` — marketing routes visible to logged-out customers
- `auth` — login/logout pages
- `internal` — webhook receivers and similar
- `both` — genuinely shared

## 1. Pages matrix

| Route | File | Bucket | Capability | Backing data | Notes |
|---|---|---|---|---|---|
| /admin | src/app/admin/page.tsx | admin | Admin dashboard (today's bookings, open invoices, errored invoices, recent lists). | Firestore: bookings live (onSnapshot, filter !isTest); invoices live (onSnapshot, filter !deleted && !isTest). Links to /admin/schedule, /admin/invoicing, /admin/invoices. | Filters out `isTest:true`, `deleted:true`. |
| /admin/bookings | src/app/admin/bookings/page.tsx | admin | Bookings table (search/sort, status edit, mark-dead, optimistic patch). | Firestore: bookings live. API: PATCH /api/admin/bookings/[id]. | Status enum: `new, new-lead, pending, confirmed, in-progress, completed, invoiced, cancelled, dead`. |
| /admin/customers | src/app/admin/customers/page.tsx | admin | Customers table merged from `customers` + bookings; inline edit. | Firestore: bookings live (filter customerDeleted, isTest); customers live. API: PATCH /api/admin/customers/[id]. Helper: `getOrCreateCustomerId`. | `customerDeleted` tombstone gates booking reads; canonical id materialized via getOrCreateCustomerId. |
| /admin/integrations | src/app/admin/integrations/page.tsx | admin | QuickBooks connect/disconnect status; Clover Commerce Sync instructions (no live integration). | Firestore: settings/quickbooks (getDoc, deleteDoc). External: hardcoded link to cloud function `qbOAuthStart` (us-east1-coastal-mobile-lube). | Disconnect = deleteDoc; Clover section is informational only. |
| /admin/invoices | src/app/admin/invoices/page.tsx | admin | Invoices table with QBO error fix dialog; inline edit; deletion. | Firestore: invoices live (filter !deleted && !isTest). API: PATCH /api/admin/invoices/[id]. Component: FixInvoiceDialog. | FixInvoiceDialog targets `qboFinalizeStatus === "error"` rows. |
| /admin/invoicing | src/app/admin/invoicing/page.tsx | admin | Full invoicing flow: create, edit, send (email/QBO), mark paid, print, soft-delete. | Firestore: invoices live; bookings live; settings/quickbooks (getDoc); bookings/[id] (getDoc on bookingId nav). Writes: invoices addDoc/updateDoc; bookings updateDoc on link. Cloud functions: sendInvoiceEmail, sendInvoiceWithQBPayment (us-east1-coastal-mobile-lube). | Soft-delete writes `deleted:true, deletedAt, deletedBy`. QBO-authoritative totals: `qbTotalAmount/qbTaxAmount/qbSubtotal`. FDACS Phase B/C fields on Invoice (vehicleInfo, photos, customerSignatureUrl, source:"tech_completion"|"manual"). |
| /admin/schedule | src/app/admin/schedule/page.tsx | admin | Schedule (calendar + table) with status/division filters, drag/drop, mark dead, mark scheduled, send cancellation. | Firestore: bookings live; updateDoc; deleteDoc. Cloud function: sendCancellationEmail (us-east1-coastal-mobile-lube). | division derived from `serviceCategory` + `vesselMake` + `fleetSize` + `rvType`. |
| /admin/team | src/app/admin/team/page.tsx | admin | Team management (list users, create user, send password reset, edit role/active). | Firestore: users live; setDoc on create. Auth: createUserWithEmailAndPassword + sendPasswordResetEmail. API: PATCH /api/admin/team/[id]. | Per-user editable fields role+active; AppUser role enum: `admin|tech` (legacy users-doc model). |
| /admin/login | src/app/admin/login/page.tsx | auth | Google sign-in (signInWithPopup) → POST /api/auth/login to set session cookie. | API: POST /api/auth/login. | "?error=unauthorized" search-param branch. |
| /tech/login | src/app/tech/login/page.tsx | auth | Email/password sign-in → POST /api/auth/login; reset email link. | API: POST /api/auth/login. Auth: signInWithEmailAndPassword, sendPasswordResetEmail. | TechAuthShell handles role redirect. |
| /admin/fees | src/app/admin/fees/page.tsx | cms | Fees & promotions editor (flat/percentage/per-mile + promo codes). | Firestore: settings/fees (getDoc + setDoc). | Single doc holds `fees[]` + `promos[]` arrays; client-generated id (genId). |
| /admin/hero-editor | src/app/admin/hero-editor/page.tsx | cms | Hero copy editor (eyebrow lines, headline, subheadline). | Firestore: siteConfig/heroCopy (getDoc + setDoc). | Seeds defaults on first load. |
| /admin/qr | src/app/admin/qr/page.tsx | cms | QR codes list (search, sort, archive, delete). | Firestore: qrCodes live; updateDoc; deleteDoc. | Uses AdminTable. |
| /admin/qr/[id] | src/app/admin/qr/[id]/page.tsx | cms | QR detail (edit name/destination/style, regenerate PNG, scan chart). | Firestore: qrCodes/[id] live; qrScans where slug live (limit 500); updateDoc; deleteDoc. | Renders ECharts; preview canvas. |
| /admin/qr/new | src/app/admin/qr/new/page.tsx | cms | Create new QR code (slug auto-gen + dedup check, style preset, logo). | Firestore: qrCodes (getDocs for campaigns + addDoc on create). Helper: `isSlugAvailable`. | Slug status state machine. |
| /admin/services | src/app/admin/services/page.tsx | cms | Services + service categories editor (4 divisions: auto/marine/fleet/rv); featured/regular kinds. | Firestore: serviceCategories addDoc/updateDoc/deleteDoc; services addDoc/updateDoc/deleteDoc; writeBatch for re-ordering. | Sync rule: `bookingVisibility` authoritative; `showOnBooking` shadow boolean kept true unless hidden. |
| /field | src/app/field/page.tsx | field | Server redirect to /field/today. | None. | One-line redirect. |
| /field/customers | src/app/field/customers/page.tsx | field | Empty-state placeholder ("Customer browser…available in next update"). | None. | Stub UI; no Firestore. |
| /field/customers/new | src/app/field/customers/new/page.tsx | field | Create customer (delegates to CreateCustomerClient). | API: POST /api/field/customers. | dynamic="force-dynamic". |
| /field/jobs/[id] | src/app/field/jobs/[id]/page.tsx | field | Job detail (RescheduleControl + JobSheet). | Server: `getJobDetail(id)` from `@/lib/jobs/queries`. | dynamic="force-dynamic"; notFound() on miss. |
| /field/jobs/new | src/app/field/jobs/new/page.tsx | field | Create booking (delegates to CreateBookingClient). | API: POST /api/field/customers; POST /api/field/bookings. | searchParam `customerId` hint; dynamic="force-dynamic". |
| /field/more | src/app/field/more/page.tsx | field | Account info + sign-out. | API: POST /api/auth/logout. Auth: signOut(auth). | Uses useAuth hook. |
| /field/schedule | src/app/field/schedule/page.tsx | field | Field schedule (today-7 to today+90 window). | Server: `getScheduleJobs({startDate,endDate})`. | dynamic="force-dynamic". |
| /field/today | src/app/field/today/page.tsx | field | Today's jobs list. | Server: `getTodayJobs(today)`. | dynamic="force-dynamic". |
| /tech | src/app/tech/page.tsx | field | Field-manager dashboard (admin role only); non-admin techs redirected to /tech/jobs. | Firestore: users/[uid] live (role+isActive). | Renders FieldManagerDashboard + FmReturnPathWriter; admin-only gate. |
| /tech/jobs | src/app/tech/jobs/page.tsx | field | Tech "My Jobs" list (assignedTechId == uid; status in confirmed/in-progress). | Firestore: bookings where assignedTechId==uid && status in [confirmed,in-progress]. | Client-side sort by confirmedDate||preferredDate; uses formatTimeWindow helper. |
| /tech/jobs/[id] | src/app/tech/jobs/[id]/page.tsx | field | Tech job detail: vehicle/VIN scan + decode, complaint, dispatch to EstimateBuilder/Locked/Completed. | Firestore: bookings/[id] live; updateDoc on save. External: NHTSA decodeVIN (`@/lib/vehicleApi`). | Reads `vehicleYear/Make/Model/Trim/vin/vinOrHull/licenseTag/odometerIn/customerComplaint||notes||otherDescription`. |
| /tech/schedule | src/app/tech/schedule/page.tsx | field | Admin-only mirror of /admin/schedule (filterable list view). | Firestore: bookings live; users live (techsByUid map); users/[uid] for role gate. | Non-admin redirected to /tech/jobs; mirrors filter logic from `lib/schedule-filters`. |
| /tech/unassigned | src/app/tech/unassigned/page.tsx | field | Admin-only list of unassigned bookings (status in pending/confirmed/in-progress). | Firestore: bookings where status in [pending,confirmed,in-progress]; users/[uid] for role gate. | Filters !isTest && !assignedTechId client-side. |
| / | src/app/page.tsx | public | Marketing homepage; server-loads hero/services/categories; client hero-quote form. | Firestore (server): siteConfig/heroCopy, services, serviceCategories via firebase-admin. Firestore (client write): quickQuotes addDoc. | revalidate=300; quickQuotes write tagged `source:"hero-quote-form"`. |
| /about | src/app/about/page.tsx | public | Founder story + values + verticals marketing. | None (static + Cloudinary). | Static; uses BrandLogo + cloudinaryUrl. |
| /book | src/app/book/page.tsx | public | Auto-opens BookingContext booking wizard modal. | None directly (delegates to BookingContext). | Renders client-only `BookRedirect` which calls `openBooking()` on mount. |
| /contact | src/app/contact/page.tsx | public | Marketing contact page (delegates to ContactContent). | None directly. | Static. |
| /faq | src/app/faq/page.tsx | public | FAQ static content (delegates to FAQContent). | None. | Pure static. |
| /fleet | src/app/fleet/page.tsx | public | Fleet division marketing. | None directly (cloudinary refs). | No Firestore reads. |
| /how-it-works | src/app/how-it-works/page.tsx | public | "How mobile service works" marketing + FAQ block. | None. | Hardcoded FAQ array; cloudinary helpers. |
| /marine | src/app/marine/page.tsx | public | Marine division marketing; lists marine services. | Firestore (firebase-admin): services, serviceCategories filtered to division=="marine". | revalidate=300. |
| /privacy | src/app/privacy/page.tsx | public | Privacy policy. | None. | Static. |
| /rv | src/app/rv/page.tsx | public | RV division marketing; lists RV services. | Firestore (firebase-admin): services, serviceCategories filtered to division=="rv". | revalidate=300. |
| /service-areas | src/app/service-areas/page.tsx | public | Service areas marketing. | None. | Static. |
| /services | src/app/services/page.tsx | public | Automotive services marketing; server-loads auto services. | Firestore (firebase-admin): services, serviceCategories filtered to division=="auto". | revalidate=300. |
| /services-overview | src/app/services-overview/page.tsx | public | Services overview marketing. | None directly. | Static; cloudinary refs. |
| /terms | src/app/terms/page.tsx | public | Terms of service. | None. | Static. |

## 2. API routes matrix

| Route | File | Methods | Bucket | Capability | Backing data | Notes |
|---|---|---|---|---|---|---|
| /api/admin/bookings/[id] | src/app/api/admin/bookings/[id]/route.ts | PATCH | admin | Whitelisted booking edit (confirmedDate, timeWindow, status). | Firestore: bookings/[id] (set merge). | Auth: requireRole(["owner","admin_only"]); maps `scheduledDate→confirmedDate`, `timeSlot→timeWindow`; ALLOWED_STATUSES enum. |
| /api/admin/customers/[id] | src/app/api/admin/customers/[id]/route.ts | PATCH | admin | Whitelisted customer edit (name, email, phone). | Firestore: customers/[id] (set merge). | Auth: requireRole(["owner","admin_only"]); normalizes email→lowercase, phone→digits-only. |
| /api/admin/invoices/[id] | src/app/api/admin/invoices/[id]/route.ts | PATCH | admin | Whitelisted invoice edit (dueDate only). | Firestore: invoices/[id] (set merge). | Auth: requireRole(["owner","admin_only"]); ISO YYYY-MM-DD validation. |
| /api/admin/invoices/[id]/retry | src/app/api/admin/invoices/[id]/retry/route.ts | POST | admin | Manually retry QBO finalize for an errored invoice; reuses cloud function `sendInvoiceWithQBPayment`. | Firestore: invoices/[id] get + set merge. External: identitytoolkit signInWithCustomToken; cloud function `sendInvoiceWithQBPayment` (us-east1-coastal-mobile-lube). | Auth: requireRole(["owner","admin_only"]); writes qboFinalizeStatus, lastError, qboResponseSnippet, attemptedAt; mints custom token + exchanges for ID token via Firebase Auth REST. |
| /api/admin/team | src/app/api/admin/team/route.ts | GET | admin | Read team/coastal singleton (members + ownership). | Firestore: team via getTeam(). | Auth: requireRole(["owner","admin_only"]). |
| /api/admin/team/[id] | src/app/api/admin/team/[id]/route.ts | PATCH | admin | Whitelisted user edit (role, isActive); mirrors into team/coastal members[]. | Firestore: users/[id] (set merge); team/coastal (set merge — array rewrite). | Auth: requireRole(["owner","admin_only"]); ALLOWED_ROLES = `admin, tech`; legacy mirror to team singleton. |
| /api/admin/team/add | src/app/api/admin/team/add/route.ts | POST | admin | Add a team member: create/lookup auth user, set custom-claim role, append to team/coastal members[]. | Firebase Admin Auth: getUserByEmail/createUser; setUserRole (custom claim). Firestore: team/coastal (update arrayUnion). | Auth: requireRole(["owner"]); only roles `tech` or `admin_only` allowed for new members. |
| /api/admin/team/remove | src/app/api/admin/team/remove/route.ts | POST | admin | Soft-remove a team member: flip active=false on team/coastal members[] entry; clear user role custom claim. | Firestore: team/coastal (update). Custom claims: clearUserRole. | Auth: requireRole(["owner"]); refuses to remove ownerUid. |
| /api/auth/login | src/app/api/auth/login/route.ts | POST | auth | Verify Firebase ID token, mint 5-day session cookie, set `__session` HttpOnly cookie. | Firebase Admin Auth: verifyIdToken + createSessionCookie. | In prod sets domain=.coastalmobilelube.com. |
| /api/auth/logout | src/app/api/auth/logout/route.ts | POST | auth | Overwrite `__session` cookie with maxAge=0. | None. | Mirror set options of /api/auth/login (domain/path). |
| /api/field/bookings | src/app/api/field/bookings/route.ts | POST | field | Create a booking from the field app (customerId+assetId+scheduledDate+timeWindow). | Firestore: customers/[customerId] get; assets/[assetId] get; bookings new doc. Helper: `formatTimeWindow` from `@/app/admin/shared`. | Auth: requireRole(["owner","tech"]); ALLOWED_TIME_WINDOWS = morning/midday/afternoon/late; status default = "confirmed", source="field"; assignedTechId = caller; denormalizes name/phone/email/address; writes both vehicle*Y/M/M (vehicle/trailer/fleet) or vessel*Y/M/M (boat). |
| /api/field/customers | src/app/api/field/customers/route.ts | GET, POST | field | GET: search customers (q, limit). POST: create customer with phone-dedup. | Firestore: customers (limit 1000 read for search; where phoneNormalized==X for dedup; new doc on create). | Auth: requireRole(["owner","tech"]); POST validates 10-digit phone; dedups on `phoneNormalized`; returns existing on dup; writes assets:[], source:"field-app". |
| /api/field/customers/[id]/assets | src/app/api/field/customers/[id]/assets/route.ts | GET, POST | field | GET: list customer assets (filters out deletedAt). POST: create asset + arrayUnion into customers.assets. | Firestore: assets where customerId==id; assets new doc; customers/[id] (arrayUnion). | Auth: requireRole(["owner","tech"]); id format `${type}_<rid>`; AssetType ∈ vehicle/boat/trailer/fleet_vehicle. |
| /api/field/jobs/[id]/asset | src/app/api/field/jobs/[id]/asset/route.ts | GET, PATCH | field | GET: current+other assets for a job. PATCH: edit/swap/create asset on a job (3 modes). | Firestore: bookings/[id], assets/[assetId], customers query (email/phoneNormalized/name fallback for customerId). On create: assets new doc + customers arrayUnion + bookings update. | Auth: requireRole(["owner","tech"]); 409 when bookings.invoiceId set (finalized). |
| /api/field/jobs/[id]/check-in | src/app/api/field/jobs/[id]/check-in/route.ts | POST | field | Tech check-in: status→in_progress; write techCheckInAt + jobStartedAt + checkInLocation; auto-assign tech if unassigned. | Firestore: bookings/[id] update. Helper: ensureBookingAsset (best-effort asset linkage). | Auth: requireRole(["owner","tech"]); 409 if status already in_progress/completed/cancelled. |
| /api/field/jobs/[id]/customer | src/app/api/field/jobs/[id]/customer/route.ts | PATCH | field | Edit customer info on a job; mirrors to customers/[id] via lookup; preserves snapshot when invoice finalized. | Firestore: bookings/[id] update (skipped when finalized); customers update via findCustomerId (email→phoneNormalized→name). | Auth: requireRole(["owner","tech"]); 10-digit phone required; dual-write booking + customers. |
| /api/field/jobs/[id]/notes | src/app/api/field/jobs/[id]/notes/route.ts | POST | field | Replace job `notes` field. | Firestore: bookings/[id] update {notes, updatedAt}. | Auth: requireRole(["owner","tech"]). |
| /api/field/jobs/[id]/photos | src/app/api/field/jobs/[id]/photos/route.ts | POST | field | Append a Cloudinary photo to bookings.photos. | Firestore: bookings/[id] arrayUnion(photos). | Auth: requireRole(["owner","tech"]); requires url to start with https://res.cloudinary.com/; remains writable when invoice finalized (photos are evidentiary). |
| /api/field/jobs/[id]/schedule | src/app/api/field/jobs/[id]/schedule/route.ts | PATCH | field | Reschedule a booking; logs to bookings/[id]/bookingHistory. | Firestore: bookings/[id] update; bookings/[id]/bookingHistory.add. | Auth: requireRole(["owner","tech"]); ALLOWED_TIME_WINDOWS enum; writes `confirmedDate`, `preferredDate`, `timeWindow`, `confirmedArrivalWindow`. |
| /api/field/jobs/[id]/services | src/app/api/field/jobs/[id]/services/route.ts | POST | field | Append an estimate line item to bookings.estimateLineItems; recompute totals. | Firestore: bookings/[id] update (estimateLineItems, estimateSubtotal, estimateTaxableSubtotal, estimateTax, estimateTotal). Helper: computeTotals. | Auth: requireRole(["owner","tech"]); 409 when invoiceId set; line id `li_<nanoid12>`. |
| /api/field/jobs/[id]/services/[itemId] | src/app/api/field/jobs/[id]/services/[itemId]/route.ts | DELETE | field | Remove an estimate line item; recompute totals. | Firestore: bookings/[id] update (estimate*). | Auth: requireRole(["owner","tech"]); 409 when invoiceId set. |
| /api/field/jobs/[id]/signature | src/app/api/field/jobs/[id]/signature/route.ts | POST | field | Save customer signature (estimate or completion) as data URL on booking. | Firestore: bookings/[id] update {customer{Estimate,Completion}SignatureUrl, customer{...}SignedAt}. | Auth: requireRole(["owner","tech"]); kind ∈ {estimate,completion}; stores `data:image/...` directly (no Cloudinary upload yet). |
| /api/field/jobs/[id]/status | src/app/api/field/jobs/[id]/status/route.ts | POST | field | Transition job status (pending/confirmed/scheduled/in_progress/completed/cancelled); auto-stamp side timestamps. | Firestore: bookings/[id] update. Helper: ensureBookingAsset on in_progress. | Auth: requireRole(["owner","tech"]); writes techCheckInAt+jobStartedAt+assignedTechId on in_progress, jobCompletedAt on completed, cancelledAt on cancelled. |
| /api/qbo/email-invoice/[invoiceId] | src/app/api/qbo/email-invoice/[invoiceId]/route.ts | POST | field | Server proxy: read invoice, mint custom→ID token for caller, POST to cloud function `sendInvoiceEmail` (non-QB branch). | Firestore: invoices/[invoiceId] get. Firebase Admin Auth: createCustomToken; identitytoolkit signInWithCustomToken (REST); cloud function `sendInvoiceEmail` (us-east1-coastal-mobile-lube). | Auth: requireRole(["owner","tech"]); 410 if invoice.deleted; 400 if no customerEmail/invoiceNumber; pinned to non-QB sendInvoiceEmail (Phase 2). |

## 3. Firestore collections matrix

| Collection | Shape (key fields) | Writers | Readers | Subcollections | Indexes | Bucket | Notes |
|---|---|---|---|---|---|---|---|
| _migrations | Ad-hoc: `{id?:string, ranAt?, projectId?}` (written by migration runner via `set({...})`). | scripts/migrations/run.ts:83 (set) | scripts/migrations/run.ts:62 (get) | none | none in firestore.indexes.json | internal | Tracks migration idempotency; firestore.rules: `read: hasOwnerClaim`, `write: false` (Admin SDK only). |
| assets | `Asset` union (`@/types/asset.ts`): `{id, customerId, type:"vehicle"|"boat"|"trailer"|"fleet_vehicle", year?, make?, model?, vin?/hullId?, licensePlate?, nickname?, mileage?, deletedAt?, legacyVehicleId?, createdAt, updatedAt}`. | src/lib/assets/mutations.ts; src/lib/jobs/ensureBookingAsset.ts:179 (batch.set); src/app/api/field/customers/[id]/assets/route.ts:172 (batch.set + customers arrayUnion); src/app/api/field/jobs/[id]/asset/route.ts:228/289 (update/create batch). | src/lib/assets/queries.ts; src/lib/jobs/queries.ts; src/app/api/field/jobs/[id]/asset/route.ts; src/app/api/field/bookings/route.ts:70 (existence check). | none | none in firestore.indexes.json | field | id format `${type}_<nanoid12>`. `deletedAt` soft-delete. `customers.assets[]` mirrors ownership via arrayUnion. `legacyVehicleId` set during `vehicles → assets` migration (M-1C-01). |
| bookings | `Booking` (`@/app/admin/shared.ts:20-140`): canonical operational doc. Key fields: `id, name, customerName, phone, customerPhone, email, customerEmail, address, customerAddress, service, serviceCategory, selectedServices[], division, source, type, status (new/new-lead/pending/confirmed/in-progress/completed/invoiced/cancelled/dead), preferredDate, confirmedDate, timeWindow, confirmedArrivalWindow, datesFlexible, vehicleYear/Make/Model/Trim/vin/vinOrHull/licenseTag, vesselYear/Make/Model, fleetSize, engineType, engineCount, rvType, otherDescription, notes, adminNotes, customerComplaint, odometerIn, odometerOut, returningCustomer, isTest, isTestFlaggedAt/By, customerDeleted (read-side only), assignedTechId, techCheckInAt, jobStartedAt, jobCompletedAt, photos[], commsLog[], reAuthEvents[], customerSignatureUrl, vehicleInfo{}, estimateLineItems[], estimateSubtotal, estimateTaxableSubtotal, estimateTax, estimateTotal, estimateConsent{choice,authorizeUpTo,contactAbove,authorizedOtherPerson}, customerEstimateSignatureUrl, customerEstimateSignedAt, estimateLocked, customerCompletionSignatureUrl, customerCompletionSignedAt, invoiceId, invoiceNumber, customerId, assetId, confirmedAt, cancelledAt, createdAt, updatedAt, lastViewedAt}`. | src/components/BookingWizardModal.tsx:896 (addDoc); src/components/admin/NewBookingModal.tsx:457/443 (addDoc/batch.set); src/components/admin/NewCustomerModal.tsx:50 (addDoc); src/app/api/field/bookings/route.ts:144 (admin set); src/app/api/admin/bookings/[id]/route.ts:74 (set merge); src/app/admin/schedule/page.tsx:309/335/351/365 (updateDoc), :379 (deleteDoc); src/app/admin/invoicing/page.tsx:1042 (link booking↔invoice); src/app/api/field/jobs/[id]/{check-in,customer,notes,photos,schedule,services{,/[itemId]},signature,status,asset}/route.ts (update); src/app/tech/jobs/[id]/page.tsx:230 (updateDoc). functions/index.js: reads at 1948, 1619, 2241, 2541, 2596, 2668. | src/app/admin/{page,bookings,customers,invoicing,schedule}/page.tsx (live); src/app/tech/{jobs,unassigned,schedule,jobs/[id]}/page.tsx (live, where assignedTechId/uid); src/lib/jobs/queries.ts (server reads); src/components/admin/* (panels). | bookingHistory (created in src/app/api/field/jobs/[id]/schedule/route.ts:94 — type:"reschedule") | none in firestore.indexes.json | both | Multiple writers — see §4.4. Status enum varies between `in-progress` (admin/UI hyphen) and `in_progress` (status API underscore). `customerDeleted` tombstone gates reads in /admin/customers. `isTest` filter widely used. `division` derived from `serviceCategory`+`vesselMake`+`fleetSize`+`rvType`. Denormalized customer fields (name/phone/email/address) and vehicleInfo blob. |
| customers | `Customer` (`@/types/customer.ts`): `{id, name, email?, phone?, phoneNormalized?, address?, assets?:string[], vehicles?:string[] (deprecated), isTest?, createdAt?, updatedAt?}`. Side-channel field: `qbCustomerId` (set merge from functions/index.js:1217-1220). | src/lib/customers/getOrCreateCustomerId.ts:52 (setDoc); src/lib/customers/mutations.ts; src/components/BookingWizardModal.tsx:876 (addDoc); src/app/api/field/customers/route.ts:149 (set); src/app/api/admin/customers/[id]/route.ts:50 (set merge); src/app/api/field/jobs/[id]/customer/route.ts:144 (update); src/app/api/field/jobs/[id]/asset/route.ts:291 (arrayUnion assets); src/app/api/field/customers/[id]/assets/route.ts:175 (arrayUnion assets); src/lib/jobs/ensureBookingAsset.ts (best-effort customer linkage); functions/index.js (sets qbCustomerId — see §4.7). | src/app/admin/customers/page.tsx (live); src/components/admin/CustomerMergeModal.tsx; src/components/admin/NewBookingModal.tsx; src/app/api/field/customers/route.ts (search/dedup); src/app/api/field/customers/[id]/assets/route.ts; src/app/api/field/jobs/[id]/{asset,customer}/route.ts; src/lib/customers/queries.ts. | none referenced | none in firestore.indexes.json | both | Phone-dedup via `phoneNormalized`. `vehicles[]` deprecated in favor of `assets[]` (M-1C-01/02). Side-channel `qbCustomerId` write from QBO sync — see §4.7. |
| invoices | Invoice (typed inline in `src/app/admin/invoicing/page.tsx:48-124`): `{id, invoiceNumber, customerName, customerPhone, customerEmail, lineItems:[{serviceName, quantity, unitPrice, lineTotal, taxable}], subtotal, taxAmount, total, status:"draft"|"sent"|"paid"|"overdue", notes, invoiceDate, dueDate, paidDate?, paidAmount?, division?, jobReference?, vehicle?, qbInvoiceId?, qbDocNumber?, qbPaymentLink?, qbTotalAmount?, qbTaxAmount?, qbSubtotal?, qboFinalizeStatus?:"error"|string, lastError?, lastErrorAt?, qboResponseSnippet?, attemptedAt?, isTest?, deleted?, deletedAt?, deletedBy?, bookingId?, vehicleInfo?{year,make,model,trim,vin,licenseTag,odometerIn,odometerOut}, customerComplaint?, photos?[], customerSignatureUrl?, techCheckInAt?, jobCompletedAt?, assignedTechId?, source?:"tech_completion"|"manual", customerEstimateSignatureUrl?, customerEstimateSignedAt?, customerCompletionSignatureUrl?, customerCompletionSignedAt?, estimateConsent?, reAuthEvents?[], createdAt?, updatedAt?}`. | src/app/admin/invoicing/page.tsx:1032 (addDoc), 1029/1127/1143/1235 (updateDoc + soft-delete); src/app/api/admin/invoices/[id]/route.ts:51 (set merge dueDate); src/app/api/admin/invoices/[id]/retry/route.ts:128/144/167 (set merge qboFinalizeStatus etc.); functions/index.js:900/1452/1499/1714 etc. (cloud-function writebacks for QBO finalize); src/lib/invoiceFromBooking.ts. | src/app/admin/{page,invoices,invoicing}/page.tsx (live); src/components/admin/InvoiceDetailPanel.tsx; src/components/admin/FixInvoiceDialog.tsx; src/app/api/qbo/email-invoice/[invoiceId]/route.ts; src/app/api/admin/invoices/[id]/retry/route.ts; functions/index.js. | none referenced | none in firestore.indexes.json | admin | Soft-delete: `deleted:true, deletedAt, deletedBy`. QBO-authoritative totals: `qbTotalAmount/qbTaxAmount/qbSubtotal` after Automated Sales Tax. Source enum: `"tech_completion"|"manual"|null`. Side-channel writes from cloud functions (qbInvoiceId, qbPaymentLink, qbDocNumber, qboFinalizeStatus, etc.) — see §4.7. |
| qrCodes | `QRCodeDoc` (typed in `src/app/admin/qr/shared.ts`): `{id, name, slug, destination, campaign?, createdAt, lastScannedAt?, scanCount?, archived?, archivedAt?, styleConfig:QRStyleConfig, logoDataUrl?, ...}`. | src/app/admin/qr/new/page.tsx:167 (addDoc); src/app/admin/qr/page.tsx:144/188 (updateDoc/deleteDoc); src/app/admin/qr/[id]/page.tsx:268/293/307/366/385 (updateDoc/deleteDoc); src/app/q/[slug]/route.ts:100 (updateDoc — increment scanCount). | src/app/admin/qr/page.tsx (live); src/app/admin/qr/[id]/page.tsx (live); src/app/admin/qr/new/page.tsx (getDocs for campaigns); src/app/q/[slug]/route.ts:66 (where slug); src/lib/qr/slugs.ts (isSlugAvailable). | none referenced | none in firestore.indexes.json | cms | Public read allowed by firestore.rules; styleConfig embeds QRStyleConfig from `@/lib/qr/types`. |
| qrScans | `QRScanDoc` (typed in `src/app/admin/qr/shared.ts`): `{id, slug, scannedAt, country?, region?, city?, device?, userAgent?, referer?, ...}`. | src/app/q/[slug]/route.ts:88 (addDoc, fire-and-forget). | src/app/admin/qr/[id]/page.tsx:99 (live where slug, limit 500, orderBy scannedAt desc). | none | **slug ASC, scannedAt DESC** (firestore.indexes.json). | cms | Public CREATE only; admin READ; immutable (no update/delete) per firestore.rules. |
| quickQuotes | Ad-hoc: `{firstName, lastName, phone, email, city, service, source:"hero-quote-form"|"quote-modal", createdAt}`. | src/app/page-client.tsx:122 (addDoc); src/components/QuoteModal.tsx (addDoc). | none in code (admin-only via catch-all rule). | none | none in firestore.indexes.json | public | Public CREATE only (no specific rule — covered by catch-all admin-only). No reader UI in repo. |
| rateLimits | `{ ts:[<ms epoch ints>] }` keyed by `rateLimits/emailsSent` doc. | functions/index.js:255 (rateLimitRef = .doc('emailsSent'); read+update). | functions/index.js (only). | none referenced | none in firestore.indexes.json | internal | Server-only; rule: catch-all admin-only. |
| serviceCategories | `ServiceCategory` (re-exported from `@/hooks/useServices`): `{id, name, division:"auto"|"marine"|"fleet"|"rv", description?, sortOrder, isActive, createdAt?, updatedAt?, ...}`. | src/app/admin/services/page.tsx:163/180/220/242/253/280 (addDoc/updateDoc/deleteDoc/writeBatch); src/scripts/migrateRvServices.ts. | src/hooks/useServices.ts; src/lib/firebase-admin.ts:67/95 (where isActive); src/app/{services,marine,rv}/page.tsx (server reads). | none | none in firestore.indexes.json | cms | Public read allowed by firestore.rules; admin write. |
| services | `Service` (re-exported from `@/hooks/useServices`): `{id, name, description?, price:number, priceLabel?, category, subcategory?, division, sortOrder, isActive, showOnBooking:bool, showOnPricing:bool, bookingVisibility?:BookingVisibility, bundleItems?:string[], notes?, laborHours?, createdAt?, updatedAt?, ...}`. | src/app/admin/services/page.tsx:306/342/354/371/392 (addDoc/updateDoc/deleteDoc); src/lib/services/catalog.ts; src/scripts/{seedPricing,migrateRvServices}.ts. | src/app/admin/services/page.tsx; src/hooks/useServices.ts; src/lib/firebase-admin.ts; src/components/admin/booking-cms/SelectedCategoryPanel.tsx; src/app/{services,marine,rv}/page.tsx (server reads, filtered by division). | none | none in firestore.indexes.json | cms | Sync rule: `bookingVisibility` authoritative; `showOnBooking` shadow boolean kept true unless hidden. |
| settings | Per-doc shapes: `settings/fees:{fees[],promos[],convenienceFee?,...}`; `settings/quickbooks:{accessToken, refreshToken, realmId, connectedAt, ...}`; `settings/qbOAuthState:{state, createdAt}`; `settings/business:{...}` (read by functions/index.js). | src/app/admin/fees/page.tsx:236 (setDoc); src/app/admin/integrations/page.tsx:40 (deleteDoc quickbooks); src/components/admin/services/FeeSettings.tsx; src/components/{BookingWizardModal,admin/NewBookingModal}.tsx (setDoc settings/fees fallback); functions/index.js:1057/1119/1129/1139 (qbOAuth state + quickbooks tokens). | src/app/admin/fees/page.tsx (getDoc); src/app/admin/integrations/page.tsx (getDoc quickbooks); src/app/admin/invoicing/page.tsx:1060/1172 (getDoc quickbooks); src/components/{BookingWizardModal,admin/NewBookingModal}.tsx; functions/index.js (settings/business read). | none referenced | none in firestore.indexes.json | admin | settings/fees has explicit public-read rule; other settings docs covered by catch-all admin-only. |
| siteConfig | `siteConfig/heroCopy:{eyebrowLine1, eyebrowLine2, headline, subheadline, updatedAt}` (mirrors HeroCopy in `@/lib/hero`). | src/app/admin/hero-editor/page.tsx:34/47 (setDoc seeds + saves). | src/app/admin/hero-editor/page.tsx (getDoc); src/lib/firebase-admin.ts:30 (server read). | none referenced | none in firestore.indexes.json | cms | Public read allowed; admin write. Seed-on-miss in editor page. |
| team | `Team` (`@/types/team.ts`): singleton `team/coastal:{businessId:"coastal", members:TeamMember[], ownerUid, updatedAt}`. TeamMember: `{uid, email, displayName, role:UserRole(owner/tech/admin_only), active, addedAt, addedBy}`. | src/app/api/admin/team/add/route.ts:69 (arrayUnion); src/app/api/admin/team/remove/route.ts:42 (active=false rewrite); src/app/api/admin/team/[id]/route.ts:71 (mirror role/active). | src/lib/auth/server.ts (getTeam); src/app/api/admin/team/route.ts (GET). | none | none in firestore.indexes.json | admin | Singleton at `team/coastal`. members[] mirrors users/[uid] fields (role, isActive↔active). Read by any signed-in user (firestore.rules); write by hasOwnerClaim. |
| users | `AppUser` (`@/app/admin/shared.ts:9-18`): `{uid, email, displayName, role:"admin"|"tech", isActive, createdAt?, createdBy, lastLoginAt?}`. (Note: `role` enum here ≠ custom-claim UserRole `owner|tech|admin_only` in `@/types/role.ts`.) | src/app/admin/team/page.tsx:313 (setDoc on create); src/app/api/admin/team/[id]/route.ts:50 (set merge); functions/index.js:2333/2638 (auth check reads). | src/app/admin/team/page.tsx (live); src/app/tech/{page,schedule,unassigned}/page.tsx (live); src/app/tech/FieldManagerDashboard.tsx; src/components/AdminAuthGuard.tsx; src/components/tech/{TechAuthShell,JobDetailBackLink}.tsx; src/components/admin/ScheduleDetailPanel.tsx (techsByUid); functions/index.js (auth checks). | none | none in firestore.indexes.json | admin | Self-create allowed for first sign-in. Two role models coexist (legacy doc-based + custom-claim) — see §4.11. |

### Cross-reference vs firestore.rules

- Rules-defined collections: users, bookings, services, serviceCategories, qrCodes, qrScans, settings/fees (single doc), customers, siteConfig, invoices, team, cloverPayments, invoiceDeliveries, assets, _migrations. Catch-all (admin-only) covers everything else.
- Code-referenced top-level collections: assets, bookings, customers, invoices, qrCodes, qrScans, quickQuotes, rateLimits, serviceCategories, services, settings, siteConfig, team, users, _migrations.
- Subcollections referenced in code: bookings/[id]/bookingHistory.
- Orphan rules (rule exists, zero code refs): cloverPayments, invoiceDeliveries.
- Code-referenced collections without a specific rule (covered only by catch-all admin-only): quickQuotes, rateLimits.

## 4. Schema discoveries

### 4.1 timeWindow vs timeSlot

`timeWindow` is canonical. Two `timeSlot` holdouts:

- `src/app/api/admin/bookings/[id]/route.ts:30-33` — sanitize() accepts either `timeSlot` or `timeWindow` and writes `timeWindow`. Header comment line 6: "WO field names → schema field names: scheduledDate→confirmedDate, timeSlot→timeWindow."
- `src/components/field/JobStatusBar.tsx:57-60` — local variable named `timeSlot` derived from `job.scheduledWindow`; not a Firestore field name (display only).

Canonical values per `formatTimeWindow` (`src/app/admin/shared.ts:242-255`): `morning`, `midday`, `afternoon`, `late`. Legacy aliases recognized for display only: `early-morning`/`earlyMorning`, `late-afternoon`/`lateAfternoon`. Field-app POSTs (`/api/field/bookings`, `/api/field/jobs/[id]/schedule`) hard-restrict to `morning|midday|afternoon|late`.

### 4.2 assets vs customerAssets

Canonical collection is `assets`. The string `customerAssets` appears only in a comment at `src/lib/jobs/ensureBookingAsset.ts:7` ("Naming note: the work order calls this collection `customerAssets`, but the existing `assets/*` collection (see `src/lib/assets/mutations.ts`) is already the system of record…"). No live Firestore writes or reads target a `customerAssets` collection.

### 4.3 Job\*Card.tsx component naming

`find src -name 'Job*Card.tsx' -o -name 'Job*Section.tsx'` output:

```
src/components/field/JobAssetCard.tsx
src/components/field/JobCustomerCard.tsx
src/components/field/JobNotesSection.tsx
src/components/field/JobPaymentSection.tsx
src/components/field/JobPhotosSection.tsx
src/components/field/JobSection.tsx
src/components/field/JobServicesSection.tsx
src/components/field/JobSignaturesSection.tsx
```

`*Card.tsx` is used for the customer/asset summary cards; `*Section.tsx` is used for content sections (notes, payment, photos, services, signatures), plus the wrapping primitive `JobSection.tsx`. No legacy `*Section` ↔ `*Card` duplicates remain.

### 4.4 Dual-shape writers

Three client writers create new docs in `bookings`:

- `src/components/BookingWizardModal.tsx:896` — public booking wizard. Writes: `division, service, selectedServices[]:{id,name,price,category,division}, otherDescription, somethingElseText?, vinOrHull, vehicleYear/Make/Model/Trim, fuelType, vin, needsConfirmation, vesselYear/Make/Model, firstName, lastName, name, phone, email, contactPreference, address, preferredDate, timeWindow, notes, convenienceFee:{amount,waived,label}, totalEstimate, customerId, source:"Website", status:"pending", createdAt, updatedAt`.
- `src/components/admin/NewBookingModal.tsx:457` (existing customer branch) and `:443` (new customer batch branch) — admin "New Booking". Writes the shape carried in `bookingData` plus `name, phone, email, address` (existing) or `firstName, lastName, fullName, phone, email, address, customerId` (new). Source not explicitly set in the existing-customer branch (defaults to `bookingData.source`).
- `src/components/admin/NewCustomerModal.tsx:50` — admin "New Customer" (creates an empty pending booking record): `name, firstName, lastName, fullName, phone, email, address, vehicleMake, notes, source:"admin-manual", status:"pending", createdAt, updatedAt`.

A fourth (server-side) writer is `src/app/api/field/bookings/route.ts:108-144` — writes `customerId, assetId, name, customerName, phone, customerPhone, email, customerEmail, address, customerAddress, preferredDate, confirmedDate, timeWindow, confirmedArrivalWindow, status:"confirmed", source:"field", selectedServices:[], assignedTechId, createdBy, createdAt, updatedAt, confirmedAt` plus `vehicleYear/Make/Model` (vehicle/trailer/fleet) or `vesselYear/Make/Model` (boat).

Field shape varies across writers in the following observed dimensions: presence of `firstName/lastName/fullName`, presence of `customerId`, presence of `assignedTechId`, presence of `confirmedDate/confirmedArrivalWindow`, presence of `convenienceFee`/`totalEstimate`, default `status` (`pending` vs `confirmed`), default `source` (`Website` / `admin-manual` / `field` / `bookingData.source`), and inclusion of `division/serviceCategory`.

### 4.5 Soft-delete tombstones

Verification command output (36 hits):

```
src/types/customer.ts:28:  isTest?: boolean;
src/types/asset.ts:15:  deletedAt?: string;
src/app/admin/shared.ts:69:  isTest?: boolean;
src/app/admin/shared.ts:70:  isTestFlaggedAt?: FirestoreTimestamp;
src/app/admin/shared.ts:71:  isTestFlaggedBy?: string;
src/app/admin/shared.ts:152:  isTest?: boolean;
src/app/admin/page.tsx:43:  isTest?: boolean;
src/app/admin/page.tsx:68:            .filter((b) => b.isTest !== true),
src/app/admin/page.tsx:78:            .filter((i) => !i.deleted && !i.isTest),
src/app/admin/schedule/page.tsx:222:  const visibleBookings = showTest ? bookings : bookings.filter((b) => b.isTest !== true);
src/app/admin/schedule/page.tsx:293:  const testBookingCount = bookings.filter((b) => b.isTest === true).length;
src/app/admin/schedule/page.tsx:636:                      {b.isTest === true && (
src/app/admin/customers/page.tsx:76:                !(d.data() as Record<string, unknown>).customerDeleted &&
src/app/admin/customers/page.tsx:77:                (d.data() as Record<string, unknown>).isTest !== true,
src/app/admin/invoices/page.tsx:51:  isTest?: boolean;
src/app/admin/invoices/page.tsx:83:            .filter((i) => !i.deleted && !i.isTest),
src/app/admin/invoicing/page.tsx:77:  isTest?: boolean;
src/app/admin/invoicing/page.tsx:79:  deletedAt?: { toDate: () => Date };
src/app/admin/invoicing/page.tsx:580:      return showTest ? live : live.filter((i) => i.isTest !== true);
src/app/admin/invoicing/page.tsx:585:    () => invoices.filter((i) => i.isTest === true && i.deleted !== true).length,
src/app/admin/invoicing/page.tsx:706:    const visibleBookings = showTest ? bookings : bookings.filter((b) => b.isTest !== true);
src/app/admin/invoicing/page.tsx:1237:      deletedAt: serverTimestamp(),
src/app/admin/invoicing/page.tsx:1472:                      {inv.isTest === true && (
src/app/api/field/customers/[id]/assets/route.ts:74:      if (data.deletedAt) return null;
src/app/api/field/jobs/[id]/asset/route.ts:154:      .filter((a) => a.id !== currentAssetId && !a.deletedAt);
src/app/tech/FieldManagerDashboard.tsx:36:  isTest?: boolean;
src/app/tech/FieldManagerDashboard.tsx:102:    () => (bookings ?? []).filter((b) => !b.isTest && b.status !== 'dead'),
src/app/tech/FieldManagerDashboard.tsx:106:    () => (invoices ?? []).filter((i) => !i.isTest && !i.deleted),
src/app/tech/unassigned/page.tsx:94:      .filter((b) => !b.isTest && !b.assignedTechId)
src/app/tech/schedule/page.tsx:119:    let list = allBookings.filter((b) => !b.isTest);
src/components/admin/CustomerMergeModal.tsx:195:            customerDeleted: false,
src/components/admin/CustomerProfilePanel.tsx:429:                        customerDeleted: true,
src/lib/jobs/queries.ts:208:    if (b.isTest) continue;
src/lib/jobs/ensureBookingAsset.ts:138:    if (a.deletedAt) continue;
src/lib/assets/mutations.ts:54:/** Soft-delete: marks `deletedAt`, removes from customer.assets[]. */
src/lib/assets/mutations.ts:61:    deletedAt: new Date().toISOString(),
```

Tombstones in use:

- `isTest:boolean` on bookings + invoices; gates reads in `/admin`, `/admin/bookings` (via type), `/admin/customers`, `/admin/invoices`, `/admin/invoicing`, `/admin/schedule` (with `showTest` toggle), `/tech/unassigned`, `/tech/schedule`, `FieldManagerDashboard`, `lib/jobs/queries.ts`. Companion fields: `isTestFlaggedAt`, `isTestFlaggedBy`.
- `deleted:boolean` + `deletedAt:Timestamp` + `deletedBy:string` on invoices; written from `/admin/invoicing/page.tsx:1232-1242`. Gates reads in `/admin/page.tsx`, `/admin/invoices/page.tsx`, `FieldManagerDashboard`, `/api/qbo/email-invoice/[invoiceId]/route.ts:103-105`.
- `customerDeleted:boolean` on bookings; gates reads in `/admin/customers/page.tsx:76`. Toggled by `CustomerProfilePanel.tsx:429` and reset by `CustomerMergeModal.tsx:195`.
- `deletedAt:string` (ISO) on assets; gates reads in `/api/field/customers/[id]/assets/route.ts:74`, `/api/field/jobs/[id]/asset/route.ts:154`, `lib/jobs/ensureBookingAsset.ts:138`. Written by `lib/assets/mutations.ts:61`.

The string `tombstoned` appears nowhere in source.

### 4.6 Orphaned routes

Verification command output for `/admin/pricing`: zero hits. The route is no longer in source.

Per-route inbound-reference counts (`Link href`, template-literal `router.push`, etc., excluding the page's own file):

```
/about: 4
/admin: 43
/admin/bookings: 3
/admin/customers: 3
/admin/fees: 2
/admin/hero-editor: 2
/admin/integrations: 2
/admin/invoices: 5
/admin/invoicing: 7
/admin/login: 8
/admin/qr: 6
/admin/schedule: 4
/admin/services: 2
/admin/team: 2
/book: 7
/contact: 4
/faq: 1
/field: 9
/field/customers: 5
/field/customers/new: 1
/field/jobs: 3
/field/jobs/new: 2
/field/more: 2
/field/schedule: 3
/field/today: 5
/fleet: 8
/how-it-works: 4
/marine: 8
/privacy: 1
/rv: 5
/service-areas: 1
/services: 9
/services-overview: 4
/tech: 11
/tech/jobs: 9
/tech/login: 5
/tech/schedule: 3
/tech/unassigned: 3
/terms: 1
```

Every page route has at least 1 inbound reference. None orphaned.

Non-`/api` route handler outside the page set: `src/app/q/[slug]/route.ts` — public QR-redirect endpoint (GET). Reads `qrCodes` (where slug, limit 1), writes `qrScans` (addDoc, fire-and-forget) + updates `qrCodes/[id]` (increment scanCount, lastScannedAt). Excluded from §2's matrix because the WO-prescribed find scope is `src/app/api`.

### 4.7 Side-channel writebacks

Cloud-function writebacks observed in `functions/index.js` that touch fields the UI also reads:

- `customers.qbCustomerId`: written from `functions/index.js:1217-1220` inside `syncCustomerToQB → writeBack(qbCustomerId)` (set merge). UI reads `customers` but does not write `qbCustomerId`.
- `invoices.qbCustomerId`: written from `functions/index.js:1225-1228` (set merge alongside the customer writeback).
- `invoices.qbInvoiceId`, `invoices.qbDocNumber`, `invoices.qbPaymentLink`, `invoices.qboFinalizeStatus`, `invoices.lastError`, `invoices.lastErrorAt`, `invoices.qboResponseSnippet`, `invoices.attemptedAt`, `invoices.qbTotalAmount`, `invoices.qbTaxAmount`, `invoices.qbSubtotal`: written from `functions/index.js` inside `sendInvoiceWithQBPayment` (lines 900, 1452, 1499, 1714, 1740-area, 1874, 1890). UI reads these in `/admin/invoices/page.tsx` (FixInvoiceDialog) and `/admin/invoicing/page.tsx`. The `/api/admin/invoices/[id]/retry` route also writes a subset of these fields directly (`qboFinalizeStatus`, `lastError`, `qboResponseSnippet`, `attemptedAt`).
- `bookings.invoiceId`, `bookings.invoiceNumber`: written from `functions/index.js` inside the QBO finalize flow (booking reads at 1948, 2241, 2541, 2596, 2668). Also written from `/admin/invoicing/page.tsx:1042` when an invoice is linked to a booking.
- `settings/quickbooks` (accessToken, refreshToken, realmId, expiresAt): written from `functions/index.js:1119, :1139` (qbOAuthCallback + token refresh). UI reads at `/admin/integrations/page.tsx:17` and `/admin/invoicing/page.tsx:1060/1172`. UI deletes at `/admin/integrations/page.tsx:40`.
- `settings/qbOAuthState`: written from `functions/index.js:1057, :1129` (set/delete). Not read or written by UI.

`storage.rules` and `firebase.json` exist at repo root (not deeply inventoried).

### 4.8 Hardcoded Cloudinary cloud names

Verification command output (7 hits):

```
functions/lib/fdacs-email-template.js:30:const LOGO_URL = 'https://res.cloudinary.com/dgcdcqjrz/image/upload/f_png,h_192,q_auto/v1775916096/Coastal_logo_bh3biu.png';
functions/lib/fdacs-template.js:568:      <img src="https://res.cloudinary.com/dgcdcqjrz/image/upload/f_png,h_192,q_auto/v1775916096/Coastal_logo_bh3biu.png"
src/app/layout.tsx:30:  "https://res.cloudinary.com/dgcdcqjrz/image/upload/w_1200,h_630,c_fill,q_auto:good,f_jpg/v1777313741/01-hero-home-sunset-vans-wide_e1mmkz.png";
src/app/page-client.tsx:668:                  src="https://res.cloudinary.com/dgcdcqjrz/image/upload/f_auto,q_auto,w_400,h_400,c_fill,g_face/v1776880422/JBinderHS_aalfk5.png"
src/components/field/edit/PhotoUploadButton.tsx:9:const CLOUD_NAME = "duy2qmmkh";
src/lib/brand/logos.ts:7:const CLOUDINARY_BASE = 'https://res.cloudinary.com/dgcdcqjrz/image/upload';
src/lib/cloudinary.ts:1:const CLOUD_NAME = "dgcdcqjrz";
```

- `dgcdcqjrz` (6 sites): `functions/lib/fdacs-email-template.js`, `functions/lib/fdacs-template.js`, `src/app/layout.tsx`, `src/app/page-client.tsx`, `src/lib/brand/logos.ts`, `src/lib/cloudinary.ts`.
- `duy2qmmkh` (1 site): `src/components/field/edit/PhotoUploadButton.tsx`.

The two cloud names target different Cloudinary accounts.

### 4.9 Mixed naming for the same concept

Three names co-exist for "things being billed/serviced":

- `selectedServices` (44 hits): used on `bookings` for the wizard-selected service catalog entries (`{id, name, price, category, division?}`). Files: src/app/admin/{invoicing,layout,shared}/, src/app/api/field/bookings/route.ts, src/app/tech/jobs/page.tsx, src/components/admin/CustomerProfilePanel.tsx, DashboardDrilldownModal.tsx, NewBookingModal.tsx, ScheduleCalendar.tsx, ScheduleDetailPanel.tsx, src/components/BookingWizardModal.tsx, src/components/tech/EstimateBuilder.tsx, src/lib/jobs/queries.ts.
- `lineItems` (78 hits): used on `invoices` for billable rows (`{serviceName, quantity, unitPrice, lineTotal, taxable}`). Files: functions/index.js, functions/lib/{disclosures,fdacs-email-template,fdacs-template}.js, src/app/admin/invoicing/page.tsx, src/app/api/admin/invoices/[id]/retry/route.ts, src/app/api/qbo/email-invoice/[invoiceId]/route.ts, src/components/admin/InvoiceDetailPanel.tsx, src/components/field/JobServicesSection.tsx, src/components/tech/MarkCompleteModal.tsx, src/lib/invoiceFromBooking.ts, src/lib/jobs/queries.ts.
- `estimateLineItems` (19 hits): used on `bookings` for tech-app on-site estimate rows (`{id, description, qty, unitPrice, taxable, partsCondition?, sourceServiceId?, addedDuringWork?, reAuthEventId?}`). Files: src/app/admin/shared.ts, src/app/api/field/jobs/[id]/services/{route.ts,[itemId]/route.ts}, src/components/tech/EstimateBuilder.tsx, src/components/tech/EstimateLocked.tsx, src/components/tech/MarkCompleteModal.tsx, src/lib/services/totals.ts.

The three names live on different docs (`bookings.selectedServices`, `bookings.estimateLineItems`, `invoices.lineItems`) with different shapes.

### 4.10 Denormalized snapshots

Customer fields snapshotted on `bookings`:

- `customerName`, `customerPhone`, `customerEmail` — declared on `Booking` (`src/app/admin/shared.ts:25-27`). Written by `/api/field/bookings/route.ts:108-118` (writes both `name+customerName`, `phone+customerPhone`, etc.), `/api/field/jobs/[id]/customer/route.ts:103-110` (mirrors both halves; skipped when invoice finalized).
- `customerAddress` paired with `address` (same dual-write pattern in `/api/field/bookings/route.ts`).

Vehicle/asset fields snapshotted on `bookings`:

- `vehicleYear/Make/Model/Trim`, `vesselYear/Make/Model`, `vin`, `vinOrHull`, `licenseTag`, `odometerIn`, `odometerOut` — flat fields on `Booking`.
- `vehicleInfo:{year, make, model, trim, vin, licenseTag, odometerIn, odometerOut}` — nested object on `Booking` (`src/app/admin/shared.ts:98-107`) and on `Invoice` (`src/app/admin/invoicing/page.tsx:84-93` + comment line 83: "FDACS Phase B — copied from parent booking at invoice creation").

Customer fields snapshotted on `invoices`:

- `customerName`, `customerPhone`, `customerEmail`, `customerAddress` (`src/app/admin/invoicing/page.tsx`, `/api/qbo/email-invoice/[invoiceId]/route.ts:25-39` adapter type).
- `customerComplaint`, `photos[]`, `customerSignatureUrl`, `techCheckInAt`, `jobCompletedAt`, `assignedTechId` — copied from parent booking at invoice creation (FDACS Phase B). Per `/api/field/jobs/[id]/customer/route.ts:114-117`: when `bookings.invoiceId` is set, the booking writeback is skipped to preserve the invoice snapshot.

### 4.11 Auth/permission gates

Two role models coexist:

- Legacy `users/{uid}` Firestore doc with `role:"admin"|"tech"`, `isActive:boolean` (`AppUser` type at `src/app/admin/shared.ts:9-18`). Drives `firestore.rules` `isAdmin()`/`isTech()` (lines 16-21) and the `AdminAuthGuard`/`TechAuthShell` UI gates.
- Custom-claim `UserRole = "owner" | "tech" | "admin_only"` (`src/types/role.ts`). Drives `firestore.rules` `hasOwnerClaim()`/`hasTechClaim()`/`hasAdminOnlyClaim()` (lines 28-39) — namespaced helpers — and `requireRole(...)` server checks in API routes.

Distinct gate patterns observed:

- `AdminAuthGuard` (`src/components/AdminAuthGuard.tsx`): client-side auth gate for `/admin/*`. Reads `users/[uid]` doc (`role` + `isActive`); auto-provisions an admin doc when email is in hardcoded `ALLOWED_ADMIN_EMAILS` allowlist (lines 9-14): `jon@jgoldco.com, coastalmobilelube@gmail.com, jonrgold@gmail.com, info@coastalmobilelube.com`. Used by `src/app/admin/layout.tsx`.
- `TechAuthShell` (`src/components/tech/TechAuthShell.tsx`): client-side gate for `/tech/*`. Used by `src/app/tech/layout.tsx`, `src/app/tech/login/page.tsx`, `src/app/tech/page.tsx`.
- `__session` cookie middleware (`src/middleware.ts:23-39`): edge-safe presence check on `/admin/*`, `/tech/*`, and `/api/admin/*`; redirects to `/admin/login` or `/tech/login` if absent. Header comment notes that full session-cookie verification is deferred to `requireRole()` server-side because firebase-admin can't run in the Edge runtime.
- `requireRole(allowed: UserRole[])` (`src/lib/auth/server.ts`): API-route gate; verifies `__session` via `verifySessionCookie()`, asserts custom-claim `role` is in `allowed`. Used by every `/api/admin/*` and `/api/field/*` route plus `/api/qbo/email-invoice/[invoiceId]`. 401 on `UNAUTHENTICATED`, 403 otherwise.
- Hardcoded email allowlist: see `AdminAuthGuard` above.
- In-page admin-only gate: `/tech/page.tsx`, `/tech/schedule/page.tsx`, `/tech/unassigned/page.tsx` each subscribe to `users/[uid]` and `router.replace('/tech/jobs')` when `role !== 'admin'`.

### 4.12 Dormant scaffolding

`src/lib/clover/*`:

```
src/lib/clover/api.ts
src/lib/clover/errors.ts
src/lib/clover/go.ts
src/lib/clover/hostedCheckout.ts
src/lib/clover/index.ts
src/lib/clover/oauth.ts
src/lib/clover/README.md
src/lib/clover/restPayDisplay.ts
src/lib/clover/types.ts
src/lib/clover/webhook.ts
```

Six files declare or use `NotImplementedError`: `src/lib/clover/{errors, go, hostedCheckout, index, restPayDisplay, webhook}.ts`. The collection `cloverPayments` has a `firestore.rules` entry but zero code refs (orphan rule). The type `CloverPayment` exists at `src/types/clover.ts` and is exported from `src/types/index.ts`.

### 4.13 Migration markers

Migration files in `scripts/migrations/` (run via `scripts/migrations/run.ts`, which writes `_migrations/{id}` markers on completion):

- `m-1a-01-backfill-assigned-tech` (file: `m-1a-01-backfill-assigned-tech.ts`)
- `m-1a-02-backfill-service-category` (file: `m-1a-02-backfill-service-category.ts`)
- `m-1a-03-init-team` (file: `m-1a-03-init-team.ts`)
- `m-1c-01-vehicles-to-assets` (file: `m-1c-01-vehicles-to-assets.ts`)
- `m-1c-02-backfill-customer-assets` (file: `m-1c-02-backfill-customer-assets.ts`)

`scripts/migrations/run.ts:62` reads `_migrations/{id}` to skip already-run migrations on the target project (defaults to `coastal-mobile-lube-staging`).

## 5. Known unknowns

- Booking status values diverge across writers/readers: legacy admin/UI uses `in-progress` (hyphen) for the in-flight state (`src/app/admin/bookings/page.tsx:38`, `src/app/admin/page.tsx:50`, `src/app/admin/shared.ts`) while the field-app status API uses `in_progress` (underscore) and emits `pending|confirmed|scheduled|in_progress|completed|cancelled` (`src/app/api/field/jobs/[id]/status/route.ts:9-16`, `/api/field/jobs/[id]/check-in/route.ts:48-58`). Did not trace whether existing reader filters explicitly match either form, or whether docs mix.
- `Booking.serviceCategory` is referenced in `src/app/admin/schedule/page.tsx:58-61` (division derivation) and on the `Job` type (`src/types/job.ts:28`, enum `auto|marine|rv|fleet`). Could not exhaustively trace whether all booking writers populate it (BookingWizardModal does not appear to set it explicitly; uses `division` instead).
- `Booking.division` appears in writers (BookingWizardModal:898) and readers (`src/app/admin/schedule/page.tsx:57`, `src/app/tech/schedule/page.tsx`). Relationship between `division` and `serviceCategory` not fully reconciled — schedule page treats either as authoritative with fallback derivation from `vesselMake`/`fleetSize`/`rvType`.
- `Customer.qbCustomerId` and `Invoice.qbCustomerId` are written from cloud functions (functions/index.js:1217-1228) but are not declared on `Customer` (`src/types/customer.ts`) or on the inline `Invoice` type in `src/app/admin/invoicing/page.tsx`. Did not trace which read sites consume them.
- The `bookings/{id}/bookingHistory` subcollection is only written from `src/app/api/field/jobs/[id]/schedule/route.ts:94` (type:"reschedule") and is not mentioned in `firestore.rules`. Did not trace whether anything reads it.
- `firebase.json` and `storage.rules` exist at repo root but were not deeply inventoried in this pass.
- `commsLog` array on `Booking` (`src/app/admin/shared.ts:59`) — origin writer not located in this pass; type declaration only.
- `cloverPayments` and `invoiceDeliveries` collections have firestore.rules entries (read for `hasOwnerOrAdminClaim`, write false) but zero code refs in src/ or functions/; the corresponding TypeScript types `CloverPayment` (`src/types/clover.ts`) and `InvoiceDelivery` (`src/types/delivery.ts`) exist. Whether any deploy artifact populates them was not investigated.
- `legacyVehicleId` on `Asset` (`src/types/asset.ts:14`) is documented as set during the `vehicles → assets` migration; the legacy `vehicles` collection is not present in any current code reference (only mentioned in `src/types/{customer,vehicle}.ts` deprecation comments and migration filenames). Whether the `vehicles` collection still has live data was not checked.
- The role enum in legacy `AppUser.role` is `"admin"|"tech"` (`src/app/admin/shared.ts:7`) and the custom-claim `UserRole` is `"owner"|"tech"|"admin_only"` (`src/types/role.ts:9`). Some routes (e.g. `/api/admin/team/[id]/route.ts:8`) limit ALLOWED_ROLES to `"admin"|"tech"` for users-doc writes while custom claims are set independently via `setUserRole`. Drift between the two systems was not exhaustively cross-checked.

## 6. File-shape glossary

Defined types under `src/types/` (re-exported from `src/types/index.ts`):

### UserRole — `src/types/role.ts:9`

```ts
export type UserRole = 'owner' | 'tech' | 'admin_only';
```

### Team / TeamMember — `src/types/team.ts`

```ts
export interface TeamMember {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  active: boolean;
  addedAt: string; // ISO timestamp
  addedBy: string; // uid
}
export interface Team {
  businessId: string; // 'coastal' for now
  members: TeamMember[];
  ownerUid: string;
  updatedAt: string;
}
```

### Asset (union) / AssetType — `src/types/asset.ts`

```ts
export type AssetType = 'vehicle' | 'boat' | 'trailer' | 'fleet_vehicle';
interface AssetBase {
  id: string;
  customerId: string;
  type: AssetType;
  nickname?: string;
  notes?: string;
  legacyVehicleId?: string;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}
export interface VehicleAsset extends AssetBase { type: 'vehicle'; year: number; make: string; model: string; trim?: string; vin?: string; licensePlate?: string; color?: string; mileage?: number; }
export interface BoatAsset extends AssetBase { type: 'boat'; year?: number; make: string; model: string; hullId?: string; registrationNumber?: string; length?: number; engineHours?: number; }
export interface TrailerAsset extends AssetBase { type: 'trailer'; year?: number; make?: string; model?: string; vin?: string; licensePlate?: string; capacity?: number; }
export interface FleetVehicleAsset extends AssetBase { type: 'fleet_vehicle'; year: number; make: string; model: string; vin?: string; licensePlate?: string; fleetNumber?: string; mileage?: number; }
export type Asset = VehicleAsset | BoatAsset | TrailerAsset | FleetVehicleAsset;
```

### Customer — `src/types/customer.ts`

```ts
export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  phoneNormalized?: string; // digits-only
  address?: string;
  assets?: string[]; // populated by M-1C-02 from legacy `vehicles`
  vehicles?: string[]; // @deprecated — kept for back-compat
  isTest?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
```

### Job / ServiceCategory — `src/types/job.ts`

```ts
export type ServiceCategory = 'auto' | 'marine' | 'rv' | 'fleet';
export const SERVICE_CATEGORIES: readonly ServiceCategory[] = ['auto','marine','rv','fleet'] as const;
export interface Job {
  id: string;
  customerId: string;
  assetId?: string;          // replaces vehicleId
  assignedTechId: string | null;
  ownerUid: string;
  serviceCategory: ServiceCategory;
  status?: string;
  scheduledFor?: string;     // ISO date
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
```

(Header comment at `src/types/job.ts:1-6`: "Canonical Job type — the forward-looking shape that admin and tech surfaces will converge on… The currently-live operational entity is the `Booking` shape in `@/app/admin/shared`; that drives the FDACS-critical path and is NOT replaced here.")

### Vehicle (deprecated) — `src/types/vehicle.ts`

```ts
/** @deprecated Use `VehicleAsset` from `@/types` instead. */
export interface Vehicle {
  id: string;
  customerId: string;
  year?: number | string;
  make?: string;
  model?: string;
  trim?: string;
  vin?: string;
  licensePlate?: string;
  plate?: string;            // some legacy docs use this
  color?: string;
  mileage?: number;
  nickname?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}
```

### CloverPayment — `src/types/clover.ts`

```ts
export interface CloverPayment {
  id: string;                     // Firestore doc id
  cloverPaymentId: string;
  cloverMerchantId: string;
  invoiceId: string;
  qboInvoiceId?: string;
  qboPaymentId?: string;
  amount: number;                 // cents
  last4?: string;
  cardBrand?: string;             // e.g. 'VISA'
  status: 'pending' | 'succeeded' | 'failed' | 'refunded';
  source: 'rest_pay_display' | 'hosted_checkout' | 'go_app' | 'manual';
  createdAt: string;
  updatedAt: string;
  errorMessage?: string;
}
```

### InvoiceDelivery — `src/types/delivery.ts`

```ts
export interface InvoiceDelivery {
  id: string;
  invoiceId: string;
  qboInvoiceId?: string;
  provider: 'qbo' | 'nodemailer';
  recipient: string;
  status: 'queued' | 'sent' | 'delivered' | 'bounced' | 'failed';
  errorMessage?: string;
  bounceReason?: string;          // e.g. "550 5.1.1 user does not exist"
  attemptedAt: string;
  resolvedAt?: string;
}
```

### Booking — `src/app/admin/shared.ts:20-140`

Live operational shape (FDACS-critical path). See §3 row "bookings" for the full field list copied from `Booking` in `src/app/admin/shared.ts:20-140`.

### AppUser — `src/app/admin/shared.ts:9-18`

```ts
export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'tech';   // legacy enum; ≠ custom-claim UserRole
  isActive: boolean;
  createdAt?: FirestoreTimestamp;
  createdBy: string;
  lastLoginAt?: FirestoreTimestamp | null;
}
```

### Invoice — `src/app/admin/invoicing/page.tsx:48-124`

Inline-typed in the admin invoicing page (no `src/types/` declaration). See §3 row "invoices" for the full field list including FDACS Phase B/C extensions.

## 7. Count summary

- Pages: 43 (admin: 8, field: 13, cms: 6, public: 14, auth: 2, both: 0)
- API routes: 24 (admin: 8, field: 14, public: 0, auth: 2, internal: 0, both: 0)
- Firestore collections referenced: 15 (assets, bookings, customers, invoices, qrCodes, qrScans, quickQuotes, rateLimits, serviceCategories, services, settings, siteConfig, team, users, _migrations)
- Cloud functions in `functions/index.js`: 14 (onNewBooking, sendConfirmationEmail, sendBookingConfirmation, decodeVIN, sendInvoiceEmail, qbOAuthStart, qbOAuthCallback, sendInvoiceWithQBPayment, sendCancellationEmail, qbWebhook, generateFdacsInvoicePdfOnCreate, regenerateFdacsInvoicePdf, mirrorInvoiceToDriveOnSent, mirrorInvoiceToDriveCallable)
- Schema discoveries: 13 sections
- Known unknowns: 10
