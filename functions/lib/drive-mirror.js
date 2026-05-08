const { google } = require('googleapis');
const admin = require('firebase-admin');
const { Readable } = require('stream');

const SHARED_DRIVE_ID = '0AGtQ4ZkGjJ5sUk9PVA';
const ROOT_FOLDER_NAME = 'Invoices';
const FOLDER_CACHE_DOC = 'settings/driveFolderCache';

const MONTH_NAMES = [
  '01-January', '02-February', '03-March', '04-April', '05-May', '06-June',
  '07-July', '08-August', '09-September', '10-October', '11-November', '12-December',
];

function sanitizeForDrive(str) {
  if (!str) return '';
  return String(str)
    .replace(/[\/\\:\*\?"<>\|]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 80);
}

function formatPhotoFilename(capturedAt, suffix) {
  const d = capturedAt && typeof capturedAt.toDate === 'function'
    ? capturedAt.toDate()
    : new Date(capturedAt || Date.now());
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}-${hh}${min}${ss}${suffix ? '-' + suffix : ''}.jpg`;
}

async function getDriveClient() {
  const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/drive'],
  });
  const authClient = await auth.getClient();
  return google.drive({ version: 'v3', auth: authClient });
}

async function getOrCreateFolder(drive, name, parentId, cacheKey, cacheRef) {
  if (cacheKey && cacheRef) {
    const cacheSnap = await cacheRef.get();
    const cache = cacheSnap.exists ? cacheSnap.data() : {};
    if (cache[cacheKey]) return cache[cacheKey];
  }

  const safeName = name.replace(/'/g, "\\'");
  const res = await drive.files.list({
    q: `name='${safeName}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`,
    fields: 'files(id,name)',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
    corpora: 'drive',
    driveId: SHARED_DRIVE_ID,
  });

  let folderId;
  if (res.data.files && res.data.files.length > 0) {
    folderId = res.data.files[0].id;
  } else {
    const createRes = await drive.files.create({
      resource: {
        name,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentId],
      },
      fields: 'id',
      supportsAllDrives: true,
    });
    folderId = createRes.data.id;
  }

  if (cacheKey && cacheRef) {
    await cacheRef.set({ [cacheKey]: folderId }, { merge: true });
  }

  return folderId;
}

async function uploadFile(drive, name, parentId, mimeType, buffer) {
  const stream = Readable.from(buffer);
  const res = await drive.files.create({
    resource: {
      name,
      parents: [parentId],
    },
    media: {
      mimeType,
      body: stream,
    },
    fields: 'id,webViewLink',
    supportsAllDrives: true,
  });
  return { fileId: res.data.id, webViewLink: res.data.webViewLink };
}

async function mirrorInvoiceToDrive(invoiceId, invoice, booking) {
  const drive = await getDriveClient();
  const db = admin.firestore();
  const cacheRef = db.doc(FOLDER_CACHE_DOC);

  const sentDate = invoice.sentDate && typeof invoice.sentDate.toDate === 'function'
    ? invoice.sentDate.toDate()
    : (invoice.sentDate ? new Date(invoice.sentDate) : new Date());
  const year = String(sentDate.getFullYear());
  const month = MONTH_NAMES[sentDate.getMonth()];
  const customer = sanitizeForDrive(
    invoice.customerName || (booking && booking.customerName) || 'Unknown Customer'
  );
  const jobFolderName = `${invoice.invoiceNumber} - ${customer}`;

  const invoicesFolderId = await getOrCreateFolder(
    drive, ROOT_FOLDER_NAME, SHARED_DRIVE_ID, 'Invoices', cacheRef
  );
  const yearFolderId = await getOrCreateFolder(
    drive, year, invoicesFolderId, `Invoices/${year}`, cacheRef
  );
  const monthFolderId = await getOrCreateFolder(
    drive, month, yearFolderId, `Invoices/${year}/${month}`, cacheRef
  );
  const jobFolderId = await getOrCreateFolder(
    drive, jobFolderName, monthFolderId, null, null
  );

  if (!invoice.customerInvoicePdfPath) {
    throw new Error('customerInvoicePdfPath missing on invoice');
  }
  const bucket = admin.storage().bucket();
  const [pdfBuffer] = await bucket.file(invoice.customerInvoicePdfPath).download();

  const pdfFileName = `${invoice.invoiceNumber} - ${customer} - Invoice.pdf`;
  const { fileId: pdfFileId, webViewLink: pdfWebViewLink } = await uploadFile(
    drive, pdfFileName, jobFolderId, 'application/pdf', pdfBuffer
  );

  let partial = false;
  const photos = (booking && Array.isArray(booking.photos)) ? booking.photos : [];
  if (photos.length > 0) {
    const photosFolderId = await getOrCreateFolder(drive, 'photos', jobFolderId, null, null);
    const seenFilenames = new Set();
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      try {
        if (!photo || !photo.url) {
          throw new Error('photo missing url');
        }
        const response = await fetch(photo.url);
        if (!response.ok) throw new Error(`Photo fetch failed: ${response.status}`);
        const photoBuffer = Buffer.from(await response.arrayBuffer());

        let filename = formatPhotoFilename(photo.capturedAt);
        let suffix = 2;
        while (seenFilenames.has(filename)) {
          filename = formatPhotoFilename(photo.capturedAt, suffix++);
        }
        seenFilenames.add(filename);

        await uploadFile(drive, filename, photosFolderId, 'image/jpeg', photoBuffer);
      } catch (photoErr) {
        console.error(`[DRIVE-MIRROR] photo ${i} upload failed for ${invoiceId}:`, photoErr.message || photoErr);
        partial = true;
      }
    }
  }

  const drivePdfUrl = pdfWebViewLink || `https://drive.google.com/file/d/${pdfFileId}/view`;

  return {
    driveJobFolderId: jobFolderId,
    driveJobFolderUrl: `https://drive.google.com/drive/folders/${jobFolderId}`,
    drivePdfFileId: pdfFileId,
    drivePdfUrl,
    partial,
  };
}

async function deleteDriveFolder(folderId) {
  const drive = await getDriveClient();
  // The firebase-adminsdk SA has Shared Drive "Content manager" permission, which
  // allows trashing but not permanent delete (Manager-only). Trash is the safe
  // operation here — used for verification fixture cleanup, not user-facing data.
  await drive.files.update({
    fileId: folderId,
    requestBody: { trashed: true },
    supportsAllDrives: true,
  });
}

module.exports = {
  mirrorInvoiceToDrive,
  deleteDriveFolder,
  sanitizeForDrive,
  formatPhotoFilename,
  SHARED_DRIVE_ID,
};
