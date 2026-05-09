# Migrations

## Run a migration (dry-run on staging)

```bash
DRY_RUN=true MIGRATION_PROJECT_ID=coastal-mobile-lube-staging \
  npx tsx scripts/migrations/run.ts
```

## Run for real on staging

```bash
MIGRATION_PROJECT_ID=coastal-mobile-lube-staging \
  npx tsx scripts/migrations/run.ts
```

## Required env

- `MIGRATION_PROJECT_ID` — Firebase project to target (defaults to
  `coastal-mobile-lube-staging`).
- `FIREBASE_ADMIN_KEY` — path to service account JSON. Defaults to
  `~/.coastal-firebase-admin.json`.
- `OWNER_UID` — Jon's Firebase Auth UID, required for M-1A-01 and M-1A-03.
- `OWNER_EMAIL` — required for M-1A-03.
- `OWNER_NAME` — display name for the seed team member (optional; defaults
  to `Owner`).
- `DRY_RUN=true` — print what would change without writing.

The runner refuses to write to the production project
(`coastal-mobile-lube`) unless `I_KNOW_THIS_IS_PROD=true` is also set.

## Naming convention

`m-{phase}-{number}-{description}.ts` — e.g.
`m-1a-01-backfill-assigned-tech.ts`. The runner picks files matching
`^m-.*\.(ts|js)$` and runs them in lexical order.

## Migration interface

Each migration must `export default` an object with:

```ts
{
  id: string;            // matches the filename without .ts
  description: string;
  run(db): Promise<{
    scanned: number;
    updated: number;
    skipped: number;
    errors: string[];
  }>;
}
```

## Idempotency

After a successful run (zero errors, not dry-run), the runner writes a doc
to `_migrations/{id}` capturing the result. Re-runs with that doc present
are skipped.

## Phase 1 migrations

- `m-1a-01-backfill-assigned-tech.ts` — set `Job.assignedTechId = OWNER_UID`
  where null. Targets the forward-looking `jobs` collection (Phase 2);
  no-op until that collection is populated.
- `m-1a-02-backfill-service-category.ts` — set
  `Job.serviceCategory = 'auto'` where missing.
- `m-1a-03-init-team.ts` — create `team/coastal` singleton with the owner
  as first member.
- `m-1c-01-vehicles-to-assets.ts` — copy `vehicles/*` to `assets/*` with
  `type: 'vehicle'`, preserving `legacyVehicleId`.
- `m-1c-02-backfill-customer-assets.ts` — populate `Customer.assets[]`
  arrays based on `assets.customerId` linkage.
