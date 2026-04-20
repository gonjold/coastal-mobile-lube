# MESSAGE FOR JASON

Hey Jason -- here's what I need you to do to get payments and bookkeeping wired into the site. Two things, should take about 20 minutes total.

## 1. QuickBooks Online (do this tomorrow)

- Go to quickbooks.intuit.com and sign up for Simple Start ($30/mo, cheapest plan)
- Use your business email (info@coastalmobilelube.com)
- During setup when it asks about your business: "Coastal Mobile Lube & Tire LLC," Service-based business, Florida
- Once you're in, go to Settings (gear icon top right) > Account and Settings > Payments
- Turn ON "Accept credit cards and bank transfers" -- this is what lets customers pay invoices online
- Then go to Settings > Manage Users > Invite an Accountant
- Enter my email: jon@jgoldco.com
- That gives me access to connect our system without needing your password
- After that's done, text me "QB is set up" and I'll handle the rest

## 2. Clover (you may have already done some of this)

- Confirm you're on the Essentials plan (not Starter -- I need API access for the integration)
- Log into your Clover web dashboard (clover.com)
- Find your Merchant ID -- it's the 13-character code in your dashboard URL (looks like: XXXXXXXXX1234)
- Text me that Merchant ID
- Later I'll send you a link to authorize our app to connect to your Clover account -- just click it and approve when I send it

## What this gets you

When you finish a job, you mark it complete in the admin portal. The system automatically:
1. Creates an invoice in QuickBooks with all the line items
2. Sends the customer a branded Coastal email with a PDF invoice attached and a "Pay Now" button
3. Customer clicks "Pay Now" and pays online through QuickBooks
4. Payment auto-records in your books -- no data entry
5. Clover Go card swipes at the van also sync to QuickBooks automatically through Commerce Sync (I'll set that up from the Clover App Market once both accounts are connected)

Your books stay clean, customers get professional invoices, and you can take payment on-site or online.

---
---
---

# WO-ADMIN-13: QuickBooks Online OAuth Integration

## Context
This WO connects the Coastal admin portal to QuickBooks Online via OAuth 2.0. It creates the auth flow, token management, customer sync, and invoice creation with payment link retrieval. The payment link gets embedded in the existing branded invoice email.

**Repo:** gonjold/coastal-mobile-lube
**Branch:** main
**Stack:** Next.js / TypeScript / Tailwind CSS v4 / Firebase Cloud Functions
**Deploy:** Netlify (frontend) + Firebase (functions)
**Firebase project:** coastal-mobile-lube (us-east1)

## PREREQUISITES (before running this WO)
- Jon has been invited as Accountant user on Jason's QB account
- Jon has registered a QuickBooks app on developer.intuit.com
- Client ID and Client Secret are available
- QB sandbox company created for testing

## IMPORTANT RULES
- Read EVERY file mentioned in full BEFORE making any changes
- Surgical edits only. Do NOT rewrite entire files
- Do NOT touch globals.css, tailwind.config, or AdminSidebar.tsx
- Build, commit, push, deploy BOTH frontend (Netlify) and functions (Firebase) at the end
- Do NOT skip any steps

---

## STEP 0: Register QuickBooks App (Manual -- Jon does this before running CC)

1. Go to developer.intuit.com, sign in with jon@jgoldco.com
2. Click "Create an App" > "QuickBooks Online and Payments"
3. App name: "Coastal Mobile Lube"
4. Scopes: com.intuit.quickbooks.accounting (this covers invoices, customers, payments)
5. Redirect URI: https://us-east1-coastal-mobile-lube.cloudfunctions.net/qbOAuthCallback
6. Copy Client ID and Client Secret
7. Store in Firebase secrets:
   ```bash
   echo "CLIENT_ID_VALUE" | firebase functions:secrets:set QB_CLIENT_ID --project coastal-mobile-lube
   echo "CLIENT_SECRET_VALUE" | firebase functions:secrets:set QB_CLIENT_SECRET --project coastal-mobile-lube
   ```
8. Create a sandbox company for testing

---

## STEP 1: Create QB OAuth Cloud Functions

**File:** `functions/src/index.ts` (or `functions/index.js`)

Read the existing functions file in full first. Add three new Cloud Functions using the same patterns (v2 onRequest, defineSecret, cors, etc.) as the existing functions.

### Function 1: qbOAuthStart

Initiates the OAuth flow by redirecting to QuickBooks authorization page.

```javascript
// GET endpoint -- admin clicks "Connect to QuickBooks" button
exports.qbOAuthStart = functions.region('us-east1').https.onRequest(async (req, res) => {
  const QB_CLIENT_ID = process.env.QB_CLIENT_ID;
  const redirectUri = 'https://us-east1-coastal-mobile-lube.cloudfunctions.net/qbOAuthCallback';
  
  // Generate a random state parameter for CSRF protection
  const state = require('crypto').randomBytes(16).toString('hex');
  
  // Store state temporarily in Firestore for verification
  const admin = require('firebase-admin');
  const db = admin.firestore();
  await db.collection('settings').doc('qbOAuthState').set({
    state,
    createdAt: new Date().toISOString(),
  });

  const authUrl = `https://appcenter.intuit.com/connect/oauth2?` +
    `client_id=${QB_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&scope=com.intuit.quickbooks.accounting` +
    `&state=${state}`;
  
  res.redirect(authUrl);
});
```

### Function 2: qbOAuthCallback

Handles the OAuth redirect, exchanges code for tokens, stores tokens in Firestore.

```javascript
exports.qbOAuthCallback = functions.region('us-east1').https.onRequest(async (req, res) => {
  const { code, state, realmId } = req.query;
  
  const admin = require('firebase-admin');
  const db = admin.firestore();
  
  // Verify state parameter
  const stateDoc = await db.collection('settings').doc('qbOAuthState').get();
  if (!stateDoc.exists || stateDoc.data().state !== state) {
    res.status(403).send('Invalid state parameter');
    return;
  }
  
  const QB_CLIENT_ID = process.env.QB_CLIENT_ID;
  const QB_CLIENT_SECRET = process.env.QB_CLIENT_SECRET;
  
  // Exchange code for tokens
  const tokenResponse = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(`${QB_CLIENT_ID}:${QB_CLIENT_SECRET}`).toString('base64'),
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: 'https://us-east1-coastal-mobile-lube.cloudfunctions.net/qbOAuthCallback',
    }),
  });
  
  const tokens = await tokenResponse.json();
  
  if (tokens.error) {
    res.status(400).send(`OAuth error: ${tokens.error}`);
    return;
  }
  
  // Store tokens in Firestore (encrypted at rest by default)
  await db.collection('settings').doc('quickbooks').set({
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    accessTokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
    refreshTokenExpiresAt: new Date(Date.now() + tokens.x_refresh_token_expires_in * 1000).toISOString(),
    realmId: realmId, // This is the QB Company ID
    connectedAt: new Date().toISOString(),
  });
  
  // Clean up state doc
  await db.collection('settings').doc('qbOAuthState').delete();
  
  // Redirect back to admin with success message
  res.redirect('https://coastal-mobile-lube.netlify.app/admin?qb=connected');
});
```

### Function 3: qbRefreshToken (helper, not an endpoint)

Create a helper function that refreshes the QB access token. Call this before any QB API request.

```javascript
async function getQBAccessToken() {
  const admin = require('firebase-admin');
  const db = admin.firestore();
  
  const qbDoc = await db.collection('settings').doc('quickbooks').get();
  if (!qbDoc.exists) throw new Error('QuickBooks not connected');
  
  const qbData = qbDoc.data();
  const now = new Date();
  const expiresAt = new Date(qbData.accessTokenExpiresAt);
  
  // If token expires within 5 minutes, refresh it
  if (now >= new Date(expiresAt.getTime() - 5 * 60 * 1000)) {
    const QB_CLIENT_ID = process.env.QB_CLIENT_ID;
    const QB_CLIENT_SECRET = process.env.QB_CLIENT_SECRET;
    
    const tokenResponse = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${QB_CLIENT_ID}:${QB_CLIENT_SECRET}`).toString('base64'),
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: qbData.refreshToken,
      }),
    });
    
    const tokens = await tokenResponse.json();
    
    if (tokens.error) throw new Error(`Token refresh failed: ${tokens.error}`);
    
    // CRITICAL: Save new refresh token atomically (refresh tokens are single-use)
    await db.collection('settings').doc('quickbooks').update({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      accessTokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      refreshTokenExpiresAt: new Date(Date.now() + tokens.x_refresh_token_expires_in * 1000).toISOString(),
    });
    
    return { accessToken: tokens.access_token, realmId: qbData.realmId };
  }
  
  return { accessToken: qbData.accessToken, realmId: qbData.realmId };
}
```

---

## STEP 2: Create QB Customer Sync Function

When a customer is created in Coastal (via booking wizard or admin), push them to QB.

```javascript
// Helper: create or find customer in QB
async function syncCustomerToQB(customerData) {
  const { accessToken, realmId } = await getQBAccessToken();
  const baseUrl = `https://quickbooks.api.intuit.com/v3/company/${realmId}`;
  
  // First, check if customer already exists by email
  if (customerData.email) {
    const queryResponse = await fetch(
      `${baseUrl}/query?query=${encodeURIComponent(`SELECT * FROM Customer WHERE PrimaryEmailAddr = '${customerData.email}'`)}&minorversion=75`,
      {
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json' },
      }
    );
    const queryResult = await queryResponse.json();
    if (queryResult.QueryResponse?.Customer?.[0]) {
      return queryResult.QueryResponse.Customer[0].Id; // Already exists
    }
  }
  
  // Create new customer
  const qbCustomer = {
    DisplayName: `${customerData.firstName || ''} ${customerData.lastName || ''}`.trim() || customerData.name || 'Customer',
    GivenName: customerData.firstName || '',
    FamilyName: customerData.lastName || '',
    PrimaryEmailAddr: customerData.email ? { Address: customerData.email } : undefined,
    PrimaryPhone: customerData.phone ? { FreeFormNumber: customerData.phone } : undefined,
    BillAddr: customerData.address ? {
      Line1: customerData.address,
      City: customerData.city || '',
      CountrySubDivisionCode: customerData.state || 'FL',
      PostalCode: customerData.zip || '',
    } : undefined,
  };
  
  const createResponse = await fetch(`${baseUrl}/customer?minorversion=75`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(qbCustomer),
  });
  
  const created = await createResponse.json();
  if (created.Fault) throw new Error(`QB customer create failed: ${JSON.stringify(created.Fault)}`);
  
  return created.Customer.Id;
}
```

---

## STEP 3: Create QB Invoice + Payment Link Function

This is the main function. Creates a QB invoice from a Coastal invoice, retrieves the payment link, then sends the branded email with the link embedded.

```javascript
exports.sendInvoiceWithQBPayment = functions.region('us-east1').https.onRequest(async (req, res) => {
  // cors wrapper here -- match existing pattern
  
  const {
    invoiceId,         // Coastal Firestore invoice ID
    invoiceNumber,     // CMLT-2026-XXX
    customerName,
    customerEmail,
    customerPhone,
    customerAddress,
    customerId,        // Coastal Firestore customer ID
    lineItems,         // [{ description, quantity, price }]
    subtotal,
    tax,
    convenienceFee,
    total,
    vehicle,
    dueDate,
  } = req.body;
  
  const admin = require('firebase-admin');
  const db = admin.firestore();
  
  try {
    const { accessToken, realmId } = await getQBAccessToken();
    const baseUrl = `https://quickbooks.api.intuit.com/v3/company/${realmId}`;
    
    // 1. Sync customer to QB (or find existing)
    let qbCustomerId;
    
    // Check if we already have a QB customer ID stored
    if (customerId) {
      const customerDoc = await db.collection('customers').doc(customerId).get();
      if (customerDoc.exists && customerDoc.data().qbCustomerId) {
        qbCustomerId = customerDoc.data().qbCustomerId;
      }
    }
    
    if (!qbCustomerId) {
      qbCustomerId = await syncCustomerToQB({
        firstName: customerName?.split(' ')[0] || '',
        lastName: customerName?.split(' ').slice(1).join(' ') || '',
        email: customerEmail,
        phone: customerPhone,
        address: customerAddress,
      });
      
      // Save QB customer ID back to Coastal customer doc
      if (customerId) {
        await db.collection('customers').doc(customerId).update({ qbCustomerId });
      }
    }
    
    // 2. Create QB invoice
    // First, we need a QB "Service" item. Check if one exists or create it.
    let serviceItemId = await getOrCreateQBServiceItem(accessToken, realmId);
    
    const qbLineItems = (lineItems || []).map((item, i) => ({
      DetailType: 'SalesItemLineDetail',
      Amount: (item.quantity || 1) * parseFloat(item.price || item.unitPrice || 0),
      Description: item.description || item.name || item.service || 'Service',
      SalesItemLineDetail: {
        ItemRef: { value: serviceItemId },
        UnitPrice: parseFloat(item.price || item.unitPrice || 0),
        Qty: item.quantity || 1,
      },
    }));
    
    // Add convenience fee as a line item if present
    if (convenienceFee && parseFloat(convenienceFee) > 0) {
      qbLineItems.push({
        DetailType: 'SalesItemLineDetail',
        Amount: parseFloat(convenienceFee),
        Description: 'Mobile Service Fee',
        SalesItemLineDetail: {
          ItemRef: { value: serviceItemId },
          UnitPrice: parseFloat(convenienceFee),
          Qty: 1,
        },
      });
    }
    
    const qbInvoice = {
      CustomerRef: { value: qbCustomerId },
      Line: qbLineItems,
      DocNumber: invoiceNumber,
      BillEmail: { Address: customerEmail },
      AllowOnlineCreditCardPayment: true,
      AllowOnlineACHPayment: true,
      DueDate: dueDate || undefined,
      CustomerMemo: { value: vehicle ? `Vehicle: ${vehicle}` : 'Thank you for your business!' },
      // Do NOT let QB auto-send its own email
      EmailStatus: 'NotSet',
    };
    
    const invoiceResponse = await fetch(`${baseUrl}/invoice?minorversion=75`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(qbInvoice),
    });
    
    const invoiceResult = await invoiceResponse.json();
    if (invoiceResult.Fault) {
      throw new Error(`QB invoice create failed: ${JSON.stringify(invoiceResult.Fault)}`);
    }
    
    const qbInvoiceId = invoiceResult.Invoice.Id;
    
    // 3. Get the payment link
    const linkResponse = await fetch(
      `${baseUrl}/invoice/${qbInvoiceId}?minorversion=75&include=invoiceLink`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      }
    );
    
    const linkResult = await linkResponse.json();
    const paymentLink = linkResult.Invoice?.InvoiceLink || '';
    
    // 4. Save QB invoice ID and payment link to Coastal invoice doc
    if (invoiceId) {
      await db.collection('invoices').doc(invoiceId).update({
        qbInvoiceId,
        qbPaymentLink: paymentLink,
        status: 'sent',
        sentDate: new Date().toISOString(),
      });
    }
    
    // 5. Send branded email with payment link
    // (Reuse the existing sendInvoiceEmail HTML template but inject the payment link)
    const formattedDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
    
    const lineItemsHTML = (lineItems || []).map(item => {
      const qty = item.quantity || 1;
      const price = parseFloat(item.price || item.unitPrice || 0);
      const itemTotal = qty * price;
      return `<tr>
        <td style="padding:10px 16px;border-bottom:1px solid #eee;font-size:14px;">${item.description || item.name || 'Service'}</td>
        <td style="padding:10px 16px;border-bottom:1px solid #eee;text-align:center;font-size:14px;">${qty}</td>
        <td style="padding:10px 16px;border-bottom:1px solid #eee;text-align:right;font-size:14px;">$${price.toFixed(2)}</td>
        <td style="padding:10px 16px;border-bottom:1px solid #eee;text-align:right;font-size:14px;font-weight:700;">$${itemTotal.toFixed(2)}</td>
      </tr>`;
    }).join('');
    
    const payButtonHTML = paymentLink ? `
      <tr>
        <td style="padding:24px 32px;text-align:center;">
          <a href="${paymentLink}" style="display:inline-block;padding:14px 40px;background:#E07B2D;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;border-radius:8px;">
            Pay Now
          </a>
          <p style="font-size:12px;color:#888;margin:10px 0 0 0;">Secure payment powered by QuickBooks</p>
        </td>
      </tr>
    ` : '';
    
    const htmlEmail = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;">
    <tr>
      <td style="background:#0B2040;padding:28px 32px;text-align:center;">
        <h1 style="color:#ffffff;font-size:22px;margin:0;font-weight:700;">Coastal Mobile Lube & Tire</h1>
        <p style="color:#6BA3E0;font-size:13px;margin:6px 0 0 0;letter-spacing:1px;">INVOICE ${invoiceNumber}</p>
      </td>
    </tr>
    <tr>
      <td style="padding:32px;">
        <p style="font-size:16px;color:#1a1a1a;margin:0 0 20px 0;">Hi ${customerName},</p>
        <p style="font-size:15px;color:#333;line-height:1.6;margin:0 0 24px 0;">Here is your invoice for recent services. Please review the details below.</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px 0;">
          <tr>
            <th style="background:#0B2040;color:white;padding:10px 16px;font-size:10px;text-transform:uppercase;text-align:left;">Service</th>
            <th style="background:#0B2040;color:white;padding:10px 16px;font-size:10px;text-transform:uppercase;text-align:center;">Qty</th>
            <th style="background:#0B2040;color:white;padding:10px 16px;font-size:10px;text-transform:uppercase;text-align:right;">Price</th>
            <th style="background:#0B2040;color:white;padding:10px 16px;font-size:10px;text-transform:uppercase;text-align:right;">Total</th>
          </tr>
          ${lineItemsHTML}
        </table>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="text-align:right;padding:8px 16px;">
              <span style="font-size:11px;color:#888;text-transform:uppercase;">Total Due</span>
              <span style="font-size:24px;font-weight:700;color:#E07B2D;margin-left:16px;">$${parseFloat(total).toFixed(2)}</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    ${payButtonHTML}
    <tr>
      <td style="padding:0 32px 24px 32px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF8EE;border-left:3px solid #E07B2D;border-radius:0 8px 8px 0;">
          <tr>
            <td style="padding:16px 20px;">
              <p style="font-size:13px;font-weight:700;color:#0B2040;margin:0 0 6px 0;">Payment Instructions</p>
              <p style="font-size:13px;color:#666;margin:2px 0;">We accept cash, check, Venmo, Zelle, and all major credit cards.</p>
              <p style="font-size:13px;color:#666;margin:2px 0;">For questions, call or text us at <a href="tel:+18132775500" style="color:#1A5FAC;text-decoration:none;font-weight:600;">(813) 277-5500</a>.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:0 32px 32px 32px;">
        <p style="font-size:14px;color:#666;margin:0;">Thank you for choosing Coastal Mobile Lube & Tire. We appreciate your business!</p>
      </td>
    </tr>
    <tr>
      <td style="background:#0B2040;padding:24px 32px;text-align:center;">
        <p style="color:#6BA3E0;font-size:13px;margin:0;">Coastal Mobile Lube & Tire</p>
        <p style="color:#ffffff60;font-size:12px;margin:6px 0 0 0;">Apollo Beach, FL | Mon-Fri 8AM-5PM</p>
        <p style="color:#ffffff40;font-size:11px;margin:8px 0 0 0;">We come to you.</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
    
    // Generate PDF (reuse existing generateInvoicePDF if it exists, or skip for now)
    // Send email
    const nodemailer = require('nodemailer');
    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD;
    
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: gmailUser, pass: gmailPass },
    });
    
    await transporter.sendMail({
      from: `"Coastal Mobile Lube" <${gmailUser}>`,
      to: customerEmail,
      cc: 'info@coastalmobilelube.com',
      subject: `Invoice ${invoiceNumber} - Coastal Mobile Lube & Tire`,
      html: htmlEmail,
      // TODO: attach PDF here using generateInvoicePDF from WO-11
    });
    
    res.status(200).json({
      success: true,
      qbInvoiceId,
      paymentLink,
    });
    
  } catch (err) {
    console.error('QB invoice error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Helper: get or create a generic "Service" item in QB
async function getOrCreateQBServiceItem(accessToken, realmId) {
  const baseUrl = `https://quickbooks.api.intuit.com/v3/company/${realmId}`;
  
  // Check for existing Service item
  const queryResponse = await fetch(
    `${baseUrl}/query?query=${encodeURIComponent("SELECT * FROM Item WHERE Name = 'Service'")}&minorversion=75`,
    { headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json' } }
  );
  const queryResult = await queryResponse.json();
  if (queryResult.QueryResponse?.Item?.[0]) {
    return queryResult.QueryResponse.Item[0].Id;
  }
  
  // Create Service item
  const createResponse = await fetch(`${baseUrl}/item?minorversion=75`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      Name: 'Service',
      Type: 'Service',
      IncomeAccountRef: { name: 'Services', value: '1' }, // May need to query for correct account
    }),
  });
  const created = await createResponse.json();
  if (created.Fault) throw new Error(`QB item create failed: ${JSON.stringify(created.Fault)}`);
  return created.Item.Id;
}
```

---

## STEP 4: QB Webhook Listener (payment received)

Register a webhook in the Intuit Developer Dashboard pointing to this function URL.

```javascript
exports.qbWebhook = functions.region('us-east1').https.onRequest(async (req, res) => {
  // Respond immediately
  res.status(200).send('OK');
  
  const admin = require('firebase-admin');
  const db = admin.firestore();
  
  // QB webhook payload contains eventNotifications array
  const notifications = req.body?.eventNotifications || [];
  
  for (const notification of notifications) {
    const entities = notification?.dataChangeEvent?.entities || [];
    
    for (const entity of entities) {
      // We care about Payment entities
      if (entity.name === 'Payment' && entity.operation === 'Create') {
        try {
          const { accessToken, realmId } = await getQBAccessToken();
          
          // Fetch the payment details
          const paymentResponse = await fetch(
            `https://quickbooks.api.intuit.com/v3/company/${realmId}/payment/${entity.id}?minorversion=75`,
            { headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json' } }
          );
          const paymentResult = await paymentResponse.json();
          const payment = paymentResult.Payment;
          
          if (!payment) continue;
          
          // Find linked invoice(s)
          const linkedInvoices = (payment.Line || [])
            .filter(line => line.LinkedTxn)
            .flatMap(line => line.LinkedTxn)
            .filter(txn => txn.TxnType === 'Invoice');
          
          for (const linkedInvoice of linkedInvoices) {
            const qbInvoiceId = linkedInvoice.TxnId;
            
            // Find Coastal invoice by qbInvoiceId
            const coastalInvoices = await db.collection('invoices')
              .where('qbInvoiceId', '==', qbInvoiceId)
              .get();
            
            if (!coastalInvoices.empty) {
              const coastalInvoice = coastalInvoices.docs[0];
              await coastalInvoice.ref.update({
                status: 'paid',
                paidDate: new Date().toISOString(),
                paidAmount: payment.TotalAmt,
                qbPaymentId: payment.Id,
              });
            }
          }
        } catch (err) {
          console.error('QB webhook processing error:', err);
        }
      }
    }
  }
});
```

---

## STEP 5: Add "Connect to QuickBooks" Button in Admin Settings

**File:** `src/app/admin/services/page.tsx` (or wherever admin settings live)

Add a QuickBooks connection section below the Service Fees section (from WO-12).

1. Load QB connection status from Firestore `settings/quickbooks` doc on mount
2. Show connection status (connected/disconnected) with the merchant's realmId
3. "Connect to QuickBooks" button that links to the qbOAuthStart function URL
4. If already connected, show green "Connected" badge and a "Disconnect" button

```tsx
{/* QuickBooks Connection */}
<div className="mt-8 bg-white border border-gray-200 rounded-xl p-6">
  <h2 className="text-lg font-bold text-[#0B2040] mb-4">QuickBooks Online</h2>
  
  {qbConnected ? (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500"></span>
        <span className="text-sm font-semibold text-green-700">Connected</span>
        <span className="text-xs text-gray-500 ml-2">Company ID: {qbRealmId}</span>
      </div>
      <p className="text-xs text-gray-500 mb-3">Connected on {qbConnectedDate}</p>
      <p className="text-sm text-gray-600 mb-4">Invoices created in the admin portal will automatically sync to QuickBooks. Customer payments through QuickBooks update invoice status automatically.</p>
      <button
        onClick={handleDisconnectQB}
        className="px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-50"
      >
        Disconnect QuickBooks
      </button>
    </div>
  ) : (
    <div>
      <p className="text-sm text-gray-600 mb-4">Connect QuickBooks to automatically sync invoices and receive payment notifications.</p>
      <a
        href="https://us-east1-coastal-mobile-lube.cloudfunctions.net/qbOAuthStart"
        className="inline-block px-6 py-2.5 bg-[#2CA01C] text-white rounded-lg text-sm font-semibold hover:bg-[#248a16]"
      >
        Connect to QuickBooks
      </a>
    </div>
  )}
</div>
```

---

## STEP 6: Wire "Send Invoice" to use QB Payment Flow

**File:** `src/app/admin/invoicing/page.tsx` and `src/components/admin/InvoiceDetailPanel.tsx`

Find the existing "Send Invoice" action (three-dot menu and/or detail panel button). Replace the direct sendInvoiceEmail call with the new sendInvoiceWithQBPayment function.

In the handler:
1. Check if QB is connected (check Firestore settings/quickbooks doc)
2. If connected: call sendInvoiceWithQBPayment (creates QB invoice + sends branded email with Pay Now link)
3. If not connected: fall back to existing sendInvoiceEmail (no payment link, just branded email + PDF)

```typescript
const handleSendInvoice = async (invoice) => {
  // Check QB connection
  const qbDoc = await getDoc(doc(db, 'settings', 'quickbooks'));
  const qbConnected = qbDoc.exists() && qbDoc.data().accessToken;
  
  const endpoint = qbConnected
    ? 'https://us-east1-coastal-mobile-lube.cloudfunctions.net/sendInvoiceWithQBPayment'
    : 'https://us-east1-coastal-mobile-lube.cloudfunctions.net/sendInvoiceEmail';
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customerName: invoice.customer || invoice.customerName,
      customerEmail: invoice.customerEmail || invoice.email,
      customerPhone: invoice.customerPhone || invoice.phone || '',
      customerAddress: invoice.customerAddress || invoice.address || '',
      customerId: invoice.customerId || '',
      lineItems: invoice.lineItems,
      subtotal: invoice.subtotal,
      tax: invoice.tax,
      convenienceFee: invoice.convenienceFee || 0,
      total: invoice.total,
      vehicle: invoice.vehicle || '',
      dueDate: invoice.dueDate || '',
    }),
  });
  
  if (!response.ok) {
    console.error('Send invoice failed:', await response.text());
  }
};
```

---

## STEP 7: Clover Commerce Sync Setup (Manual -- Jason does this)

This is NOT code. Add these instructions to the admin settings page as a help section:

1. Jason logs into clover.com from a web browser
2. Goes to More Tools
3. Searches for "QuickBooks by Commerce Sync"
4. Installs the app (Essentials plan, ~$19/mo)
5. Connects to his QuickBooks account when prompted
6. Commerce Sync automatically transfers daily Clover sales to QB each night

This handles all Clover Go card swipe payments flowing into QB without any custom code.

---

## STEP 8: Build and Deploy

```bash
cd ~/coastal-mobile-lube/functions
npm install
cd ~/coastal-mobile-lube
firebase deploy --only functions --project coastal-mobile-lube
npm run build
git add src/ functions/
git commit -m "WO-13: QuickBooks OAuth integration with invoice sync and payment links"
git push origin main
npx netlify-cli deploy --prod --message="WO-13: QuickBooks integration"
```

---

## VERIFICATION

1. Go to /admin settings, click "Connect to QuickBooks"
2. Authorize with Jason's QB account (or sandbox first)
3. Create an invoice in the admin
4. Click "Send Invoice" from three-dot menu
5. Check: invoice appears in QB dashboard
6. Check: customer receives branded email with "Pay Now" button
7. Click "Pay Now" -- should open QB payment page
8. Make a test payment -- Coastal admin should auto-update to "paid"

---

*End of WO-ADMIN-13*
