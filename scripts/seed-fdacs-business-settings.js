// One-shot script to seed settings/business doc with FDACS-required fields.
// Idempotent: only writes fields that don't already exist (uses set with merge).

const admin = require('firebase-admin');
const path = require('path');

admin.initializeApp({
  credential: admin.credential.cert(path.join(process.env.HOME, '.coastal-firebase-admin.json')),
});

const businessSettings = {
  businessName: 'Coastal Mobile Lube & Tire',
  businessAddress: '<JON FILLS IN — physical address Jason registers with State>',
  businessPhone: '(813) XXX-XXXX',
  businessEmail: 'info@coastalmobilelube.com',

  mvRegistrationNumber: 'Pending',
  fdacsLastUpdated: admin.firestore.FieldValue.serverTimestamp(),

  warrantyStatement: 'Coastal Mobile Lube & Tire warrants parts and labor for 30 days or 1,000 miles, whichever comes first, against defects in materials or workmanship. This warranty does not cover damage caused by misuse, neglect, or normal wear. Customer must return vehicle to Coastal for warranty service.',
  shopSuppliesDisclosure: 'A shop supplies fee may be applied to cover incidental materials such as rags, lubricants, cleaners, and disposal of fluids used during service. This fee is not a tax.',
  tireFeeDisclosure: 'Per Florida Statute 403.718, a $1.00 waste tire fee is applied to each new motor vehicle tire sold. This fee is collected by the dealer and remitted to the State of Florida for waste tire management programs.',
  batteryFeeDisclosure: 'Per Florida Statute 403.7185, a $1.50 lead-acid battery fee is applied to each new battery sold. This fee is collected by the dealer and remitted to the State of Florida for battery recycling programs.',

  consentOverThreshold: 150,
  consentOption1Text: 'I authorize the repairs as listed in the estimate. The motor vehicle repair shop may proceed with the repair.',
  consentOption2Text: 'I request a written estimate before any repair work is done.',
  consentOption3Text: 'I do not request a written estimate so long as the repair cost does not exceed $______. The shop must contact me for authorization before exceeding this amount.',
};

(async () => {
  const ref = admin.firestore().doc('settings/business');
  const existing = await ref.get();

  if (!existing.exists) {
    await ref.set(businessSettings);
    console.log('Created settings/business doc with FDACS fields');
  } else {
    const data = existing.data();
    const toAdd = {};
    Object.keys(businessSettings).forEach((k) => {
      if (data[k] === undefined) toAdd[k] = businessSettings[k];
    });
    if (Object.keys(toAdd).length > 0) {
      await ref.set(toAdd, { merge: true });
      console.log('Merged missing FDACS fields into settings/business:', Object.keys(toAdd));
    } else {
      console.log('settings/business already has all FDACS fields, no changes');
    }
  }
  process.exit(0);
})();
