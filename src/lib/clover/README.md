# Clover Integration

## Phase 1 Status

- Sandbox scaffolding complete
- OAuth flow defined (exchange / refresh / authorize URL)
- Device paths stubbed (Flex + Go + Hosted Checkout)
- NO production code yet — all sandbox-only until Phase 3

## Jon's manual setup tasks (BEFORE Phase 3)

### 1. Create Clover developer account

- Sign up at <https://www.clover.com/developer-home>
- Use email: `jgsystems@icloud.com` (Coastal AI ops account)
- Verify via email

### 2. Create a sandbox app

- Dashboard → Your Apps → Create New App
- App Name: "Coastal Mobile Lube — Field Service"
- App Type: REST app (Web)
- Site URL: `http://localhost:3000` (sandbox), `https://coastalmobilelube.com` (production later)
- OAuth Redirect URLs:
  - `http://localhost:3000/api/clover/oauth/callback` (dev)
  - `https://coastalmobilelube.com/api/clover/oauth/callback` (production)
  - `https://admin.coastalmobilelube.com/api/clover/oauth/callback` (post-Phase-5)
- Required Permissions:
  - Merchant: Read merchant info
  - Orders: Read/write
  - Payments: Read/write
  - Inventory: Read (for items if needed later)
  - Customers: Read/write

### 3. Note the credentials (paste into Bitwarden)

- App ID
- App Secret
- Sandbox merchant ID (a test merchant account auto-created with the app)

### 4. Set env vars locally and in Netlify

See `.env.example` Clover block. For local dev, paste into `.env.local`. For
Netlify, set under Site Settings → Environment Variables.

### 5. Verify connection

```bash
npx tsx scripts/test-clover-connection.ts
```

Expected output: `Sandbox merchant info retrieved: <merchant name>`

## Phase 3 handoff

When Phase 3 begins, Stream 3A picks up:

1. Replace stub in `restPayDisplay.ts` with real REST Pay Display calls (if device is Flex)
2. Replace stub in `go.ts` with manual-entry/webhook flow (if device is Go)
3. Replace stub in `hostedCheckout.ts` with full Hosted Checkout integration
4. Replace stub in `webhook.ts` with HMAC-SHA256 signature verification
5. Submit production OAuth app for Clover review (Decision 10)

The shared 80% (`oauth.ts`, `api.ts`, `types.ts`, `errors.ts`) does not
change between Flex and Go — Phase 3 only swaps the device-specific files.

## API reference

- Sandbox base: `https://apisandbox.dev.clover.com`
- Production base: `https://api.clover.com`
- Docs: <https://docs.clover.com/dev/>

## Decision log

- Q1: Device unconfirmed → build for both Flex and Go
- Q2: Starter plan ($14.95/mo) → may have API tier restrictions; verify in sandbox
- Q10: Production OAuth submission deferred to Phase 3 kickoff
