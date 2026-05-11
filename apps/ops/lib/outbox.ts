import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'coastal-outbox';
const DB_VERSION = 1;

export type OutboxItem = {
  id: string;
  url: string;
  method: 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  headers: Record<string, string>;
  body: string;
  blobRef?: string;
  createdAt: number;
  attempts: number;
  lastError?: string;
};

export type PhotoQueueItem = {
  id: string;
  blob: Blob;
  mime: string;
  sha256?: string;
};

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('pending')) {
          db.createObjectStore('pending', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('photoQueue')) {
          db.createObjectStore('photoQueue', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `oxb-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export async function enqueue(req: Request, blob?: Blob): Promise<OutboxItem> {
  const db = await getDB();
  const id = generateId();

  let blobRef: string | undefined;
  if (blob) {
    blobRef = generateId();
    await db.put('photoQueue', { id: blobRef, blob, mime: blob.type } as PhotoQueueItem);
  }

  const headers: Record<string, string> = {};
  req.headers.forEach((v, k) => { headers[k] = v; });

  const item: OutboxItem = {
    id,
    url: req.url,
    method: req.method as OutboxItem['method'],
    headers,
    body: blob ? '' : await req.clone().text(),
    blobRef,
    createdAt: Date.now(),
    attempts: 0,
  };

  await db.put('pending', item);
  return item;
}

export async function listPending(): Promise<OutboxItem[]> {
  const db = await getDB();
  return db.getAll('pending');
}

export async function pendingCount(): Promise<number> {
  const db = await getDB();
  return db.count('pending');
}

export async function removeItem(id: string, blobRef?: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['pending', 'photoQueue'], 'readwrite');
  await tx.objectStore('pending').delete(id);
  if (blobRef) await tx.objectStore('photoQueue').delete(blobRef);
  await tx.done;
}

export async function markFailed(id: string, error: string): Promise<void> {
  const db = await getDB();
  const item = await db.get('pending', id) as OutboxItem | undefined;
  if (!item) return;
  item.attempts += 1;
  item.lastError = error;
  await db.put('pending', item);
}

const MAX_ATTEMPTS = 5;

export async function flushQueue(): Promise<{ flushed: number; failed: number }> {
  const items = await listPending();
  let flushed = 0;
  let failed = 0;

  for (const item of items) {
    if (item.attempts >= MAX_ATTEMPTS) { failed++; continue; }

    try {
      let body: BodyInit | undefined = item.body;
      if (item.blobRef) {
        const db = await getDB();
        const photoRec = await db.get('photoQueue', item.blobRef) as PhotoQueueItem | undefined;
        if (photoRec) {
          const fd = new FormData();
          fd.append('file', photoRec.blob);
          body = fd;
          delete item.headers['content-type'];
          delete item.headers['Content-Type'];
        }
      }

      const res = await fetch(item.url, {
        method: item.method,
        headers: item.headers,
        body: item.method === 'DELETE' ? undefined : body,
        credentials: 'include',
      });

      if (res.ok) {
        await removeItem(item.id, item.blobRef);
        flushed++;
      } else {
        await markFailed(item.id, `HTTP ${res.status}`);
        failed++;
      }
    } catch (e) {
      await markFailed(item.id, String(e));
      failed++;
    }
  }

  return { flushed, failed };
}
