/* eslint-disable no-console */
import * as fs from 'fs';
import * as path from 'path';
import type { Firestore } from 'firebase-admin/firestore';

/**
 * Marker-only migration. The actual storage.rules edit happened in WO step 16.
 * This reads the local storage.rules and confirms the new
 * /signatures/estimates/{estimateId}/{revision} block exists, so subsequent
 * A1 work knows the storage layer is on the expected schema.
 */
const SIGNATURES_PATTERN = /match\s+\/signatures\/estimates\/\{[A-Za-z]+\}\/\{[A-Za-z]+\}/;

const migration = {
  id: 'm-a1-03-storage-rules-signatures',
  description:
    'Verify storage.rules has the /signatures/estimates/{estimateId}/{revision} block',
  async run(_db: Firestore) {
    const result = {
      scanned: 0,
      updated: 0,
      skipped: 0,
      errors: [] as string[],
    };

    const rulesPath = path.resolve(__dirname, '..', '..', 'storage.rules');
    if (!fs.existsSync(rulesPath)) {
      result.errors.push(`storage.rules not found at ${rulesPath}`);
      return result;
    }
    const contents = fs.readFileSync(rulesPath, 'utf8');
    result.scanned = 1;

    if (!SIGNATURES_PATTERN.test(contents)) {
      result.errors.push(
        'storage.rules is missing the signatures/estimates/{estimateId}/{revision} block — re-run WO step 16',
      );
      return result;
    }

    console.log('  storage.rules contains the signatures/estimates block');
    result.updated = 1;
    return result;
  },
};

export default migration;
