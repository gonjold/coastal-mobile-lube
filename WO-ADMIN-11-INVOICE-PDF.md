# WO-ADMIN-11: Invoice PDF Attachment + Admin Download

## Context
The invoice email already sends a clean branded HTML summary (screenshot confirmed working). This WO adds a professional PDF invoice as an attachment to that email, and adds a "Download PDF" button in the admin InvoiceDetailPanel so Jason can download invoices locally too.

**Repo:** gonjold/coastal-mobile-lube
**Branch:** main
**Stack:** Next.js / TypeScript / Tailwind CSS v4 / Firebase Cloud Functions
**Deploy:** Netlify (frontend) + Firebase (functions)
**Firebase project:** coastal-mobile-lube (us-east1)
**Email sender:** info@coastalmobilelube.com

## IMPORTANT RULES
- Read EVERY file mentioned in full BEFORE making any changes
- Surgical edits only. Do NOT rewrite entire files
- Do NOT touch globals.css, tailwind.config, or AdminSidebar.tsx
- Build, commit, push, deploy BOTH frontend (Netlify) and functions (Firebase) at the end
- Do NOT skip any steps

---

## STEP 0: Read all target files first

Read these files IN FULL before touching anything:

```
functions/src/index.ts (or functions/index.js -- whichever exists)
functions/package.json
src/components/admin/InvoiceDetailPanel.tsx
src/app/admin/invoicing/page.tsx
```

Find:
1. The existing function that sends invoice emails. It might be called `sendInvoiceEmail`, `sendInvoice`, or something similar. Note EXACTLY how it receives data, accesses Gmail credentials, and sends the email.
2. How the invoice detail panel and three-dot menu trigger the "Send Invoice" action.
3. What invoice data fields are available (invoiceNumber, customer, lineItems, subtotal, tax, total, dueDate, etc.).

---

## STEP 1: Install pdfkit in functions

```bash
cd ~/coastal-mobile-lube/functions
npm install pdfkit
```

If using TypeScript:
```bash
npm install --save-dev @types/pdfkit
```

---

## STEP 2: Add PDF generation to the invoice email Cloud Function

Find the existing invoice email function. Add a PDF generation step BEFORE the email is sent. The PDF is generated in memory (no file system writes needed) using pdfkit, then attached to the email via nodemailer.

**Add this PDF generation helper function** in the Cloud Functions file, above the existing invoice email function:

```javascript
function generateInvoicePDF(invoiceData) {
  return new Promise((resolve, reject) => {
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({
      size: 'LETTER',
      margin: 50,
      info: {
        Title: `Invoice ${invoiceData.invoiceNumber}`,
        Author: 'Coastal Mobile Lube & Tire',
      },
    });

    const buffers = [];
    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const navy = '#0B2040';
    const blue = '#1A5FAC';
    const orange = '#E07B2D';
    const gray = '#666666';
    const lightGray = '#F7F8FA';
    const pageWidth = 512; // 612 - 50*2 margins

    // --- HEADER ---
    // Navy bar across top
    doc.rect(0, 0, 612, 100).fill(navy);

    // Company name
    doc.font('Helvetica-Bold').fontSize(20).fillColor('#ffffff')
      .text('Coastal Mobile Lube & Tire', 50, 30);
    doc.font('Helvetica').fontSize(10).fillColor('#6BA3E0')
      .text('We come to you.', 50, 55);

    // Invoice number + date (right side of header)
    doc.font('Helvetica-Bold').fontSize(14).fillColor('#ffffff')
      .text(invoiceData.invoiceNumber, 350, 30, { width: 212, align: 'right' });
    doc.font('Helvetica').fontSize(10).fillColor('#6BA3E0')
      .text(`Issued: ${invoiceData.issuedDate || 'N/A'}`, 350, 50, { width: 212, align: 'right' });
    if (invoiceData.dueDate) {
      doc.text(`Due: ${invoiceData.dueDate}`, 350, 64, { width: 212, align: 'right' });
    }

    // --- BILL TO ---
    let y = 120;
    doc.font('Helvetica-Bold').fontSize(9).fillColor(gray)
      .text('BILL TO', 50, y);
    y += 16;
    doc.font('Helvetica-Bold').fontSize(12).fillColor(navy)
      .text(invoiceData.customerName || 'Customer', 50, y);
    y += 16;
    if (invoiceData.customerEmail) {
      doc.font('Helvetica').fontSize(10).fillColor(gray)
        .text(invoiceData.customerEmail, 50, y);
      y += 14;
    }
    if (invoiceData.customerPhone) {
      doc.font('Helvetica').fontSize(10).fillColor(gray)
        .text(invoiceData.customerPhone, 50, y);
      y += 14;
    }
    if (invoiceData.customerAddress) {
      doc.font('Helvetica').fontSize(10).fillColor(gray)
        .text(invoiceData.customerAddress, 50, y);
      y += 14;
    }

    // --- VEHICLE (if available) ---
    if (invoiceData.vehicle) {
      y += 6;
      doc.font('Helvetica-Bold').fontSize(9).fillColor(gray)
        .text('VEHICLE', 50, y);
      y += 14;
      doc.font('Helvetica').fontSize(10).fillColor(navy)
        .text(invoiceData.vehicle, 50, y);
      y += 14;
    }

    // --- LINE ITEMS TABLE ---
    y += 20;

    // Table header
    doc.rect(50, y, pageWidth, 28).fill(navy);
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#ffffff');
    doc.text('SERVICE', 58, y + 8, { width: 260 });
    doc.text('QTY', 320, y + 8, { width: 50, align: 'center' });
    doc.text('PRICE', 375, y + 8, { width: 80, align: 'right' });
    doc.text('TOTAL', 460, y + 8, { width: 94, align: 'right' });
    y += 28;

    // Table rows
    const lineItems = invoiceData.lineItems || [];
    lineItems.forEach((item, i) => {
      const rowHeight = 30;
      // Alternate row background
      if (i % 2 === 0) {
        doc.rect(50, y, pageWidth, rowHeight).fill(lightGray);
      }

      const qty = item.quantity || 1;
      const price = parseFloat(item.price || item.unitPrice || 0);
      const total = qty * price;

      doc.font('Helvetica').fontSize(10).fillColor(navy);
      doc.text(item.description || item.name || item.service || 'Service', 58, y + 9, { width: 260 });
      doc.fillColor(gray);
      doc.text(String(qty), 320, y + 9, { width: 50, align: 'center' });
      doc.text(`$${price.toFixed(2)}`, 375, y + 9, { width: 80, align: 'right' });
      doc.font('Helvetica-Bold').fillColor(navy);
      doc.text(`$${total.toFixed(2)}`, 460, y + 9, { width: 94, align: 'right' });

      y += rowHeight;
    });

    // --- TOTALS ---
    y += 8;
    doc.moveTo(350, y).lineTo(562, y).strokeColor('#e4e4e4').lineWidth(1).stroke();
    y += 12;

    // Subtotal
    if (invoiceData.subtotal != null) {
      doc.font('Helvetica').fontSize(10).fillColor(gray)
        .text('Subtotal', 350, y, { width: 110, align: 'right' });
      doc.font('Helvetica').fillColor(navy)
        .text(`$${parseFloat(invoiceData.subtotal).toFixed(2)}`, 460, y, { width: 94, align: 'right' });
      y += 18;
    }

    // Tax
    if (invoiceData.tax != null && parseFloat(invoiceData.tax) > 0) {
      doc.font('Helvetica').fontSize(10).fillColor(gray)
        .text('Tax', 350, y, { width: 110, align: 'right' });
      doc.font('Helvetica').fillColor(navy)
        .text(`$${parseFloat(invoiceData.tax).toFixed(2)}`, 460, y, { width: 94, align: 'right' });
      y += 18;
    }

    // Convenience fee
    if (invoiceData.convenienceFee != null && parseFloat(invoiceData.convenienceFee) > 0) {
      doc.font('Helvetica').fontSize(10).fillColor(gray)
        .text('Service Area Fee', 350, y, { width: 110, align: 'right' });
      doc.font('Helvetica').fillColor(navy)
        .text(`$${parseFloat(invoiceData.convenienceFee).toFixed(2)}`, 460, y, { width: 94, align: 'right' });
      y += 18;
    }

    // Total Due line
    y += 4;
    doc.moveTo(350, y).lineTo(562, y).strokeColor(navy).lineWidth(2).stroke();
    y += 12;
    doc.font('Helvetica-Bold').fontSize(11).fillColor(navy)
      .text('Total Due', 350, y, { width: 110, align: 'right' });
    doc.font('Helvetica-Bold').fontSize(16).fillColor(orange)
      .text(`$${parseFloat(invoiceData.total).toFixed(2)}`, 440, y - 2, { width: 114, align: 'right' });

    // --- PAYMENT INSTRUCTIONS ---
    y += 40;
    doc.rect(50, y, pageWidth, 70).fill('#FFF8EE');
    doc.rect(50, y, 3, 70).fill(orange);
    doc.font('Helvetica-Bold').fontSize(11).fillColor(navy)
      .text('Payment Instructions', 66, y + 12);
    doc.font('Helvetica').fontSize(10).fillColor(gray)
      .text('We accept cash, check, Venmo, Zelle, and all major credit cards.', 66, y + 28);
    doc.text('For questions about this invoice, call or text us at (813) 277-5500.', 66, y + 42);

    // --- FOOTER ---
    const footerY = 720;
    doc.moveTo(50, footerY).lineTo(562, footerY).strokeColor('#e4e4e4').lineWidth(0.5).stroke();
    doc.font('Helvetica').fontSize(9).fillColor('#999')
      .text('Coastal Mobile Lube & Tire | Apollo Beach, FL | coastalmobilelube.com', 50, footerY + 10, {
        width: pageWidth,
        align: 'center',
      });
    doc.text('Thank you for your business!', 50, footerY + 24, {
      width: pageWidth,
      align: 'center',
    });

    doc.end();
  });
}
```

**Now modify the existing invoice email function** to generate the PDF and attach it:

Find the part where `transporter.sendMail(mailOptions)` is called. BEFORE that line, add:

```javascript
// Generate PDF
const pdfBuffer = await generateInvoicePDF({
  invoiceNumber: invoiceNumber,
  customerName: customerName,
  customerEmail: customerEmail,
  customerPhone: customerPhone || '',
  customerAddress: customerAddress || '',
  vehicle: vehicle || '',
  lineItems: lineItems,
  subtotal: subtotal,
  tax: tax,
  convenienceFee: convenienceFee || 0,
  total: total,
  issuedDate: issuedDate || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
  dueDate: dueDate || '',
});
```

Then add the attachment to the mailOptions object. Find the existing `mailOptions` and add:

```javascript
attachments: [
  {
    filename: `${invoiceNumber}.pdf`,
    content: pdfBuffer,
    contentType: 'application/pdf',
  },
],
```

**Also add a "View Invoice" CTA button in the HTML email body.** Find the existing HTML email template in the function. After the "Total Due" row and before the "Payment Instructions" section, add this HTML:

```html
<tr>
  <td style="padding:24px 32px 0 32px;text-align:center;">
    <p style="font-size:13px;color:#666;margin:0 0 12px 0;">A PDF copy of this invoice is attached to this email.</p>
  </td>
</tr>
```

**IMPORTANT: Match variable names exactly.** The existing function may call the fields `customerName`, `customer`, `name`, or something else. Read the existing function code and use the exact variable names already in scope. Do NOT invent new variable names that don't exist. The `invoiceData` object passed to `generateInvoicePDF` must use the actual variable names from the function's request body or computed values.

---

## STEP 3: Add "Download PDF" button in InvoiceDetailPanel

**File:** `src/components/admin/InvoiceDetailPanel.tsx`

Add a "Download PDF" button that generates the PDF client-side. Since pdfkit is a Node module (won't run in browser), use the browser's print-to-PDF instead, or call the Cloud Function to get the PDF.

**Simplest approach -- call a new Cloud Function endpoint that returns the PDF:**

Add a new Cloud Function `generateInvoicePDFEndpoint` (or add a query param to the existing send function):

Actually, the simplest approach is to use the browser's built-in print. Add this button and handler to InvoiceDetailPanel:

1. Find the action buttons area in InvoiceDetailPanel (near "Mark as Paid", "Send Invoice", etc.).

2. Add a "Download PDF" button:

```tsx
<button
  onClick={handleDownloadPDF}
  className="w-full py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-[#0B2040] hover:bg-gray-50"
>
  Download PDF
</button>
```

3. Add the handler. This opens a new window with a print-friendly invoice view:

```typescript
const handleDownloadPDF = () => {
  if (!invoice) return;

  const lineItemsHTML = (invoice.lineItems || []).map((item: any) => {
    const qty = item.quantity || 1;
    const price = parseFloat(item.price || item.unitPrice || 0);
    const total = qty * price;
    return `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:14px;">${item.description || item.name || item.service || 'Service'}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:center;font-size:14px;">${qty}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:right;font-size:14px;">$${price.toFixed(2)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:right;font-size:14px;font-weight:700;">$${total.toFixed(2)}</td>
      </tr>
    `;
  }).join('');

  const customerName = invoice.customer || invoice.customerName || '';
  const total = parseFloat(invoice.total || 0).toFixed(2);
  const subtotal = invoice.subtotal != null ? parseFloat(invoice.subtotal).toFixed(2) : null;
  const tax = invoice.tax != null && parseFloat(invoice.tax) > 0 ? parseFloat(invoice.tax).toFixed(2) : null;

  const printHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Invoice ${invoice.invoiceNumber}</title>
  <style>
    @media print {
      body { margin: 0; }
      .no-print { display: none; }
    }
    body { font-family: Arial, Helvetica, sans-serif; color: #1a1a1a; max-width: 800px; margin: 0 auto; padding: 40px; }
    .header { background: #0B2040; padding: 28px 32px; border-radius: 8px 8px 0 0; display: flex; justify-content: space-between; align-items: flex-start; }
    .header h1 { color: white; font-size: 20px; margin: 0; }
    .header .subtitle { color: #6BA3E0; font-size: 12px; margin-top: 4px; }
    .header .inv-num { color: white; font-size: 16px; font-weight: 700; text-align: right; }
    .header .inv-date { color: #6BA3E0; font-size: 11px; text-align: right; margin-top: 4px; }
    .bill-to { padding: 24px 0; }
    .bill-to .label { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
    .bill-to .name { font-size: 14px; font-weight: 700; color: #0B2040; }
    .bill-to .detail { font-size: 13px; color: #666; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { background: #0B2040; color: white; padding: 10px 12px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
    th:first-child { text-align: left; }
    th:nth-child(2) { text-align: center; }
    th:nth-child(3), th:nth-child(4) { text-align: right; }
    .totals { text-align: right; padding: 0 12px; }
    .totals .row { display: flex; justify-content: flex-end; gap: 24px; padding: 4px 0; font-size: 14px; }
    .totals .row .label { color: #666; }
    .totals .total-row { border-top: 2px solid #0B2040; padding-top: 10px; margin-top: 8px; }
    .totals .total-row .amount { font-size: 22px; font-weight: 700; color: #E07B2D; }
    .payment-box { background: #FFF8EE; border-left: 3px solid #E07B2D; padding: 16px 20px; margin: 24px 0; border-radius: 0 8px 8px 0; }
    .payment-box h3 { font-size: 13px; font-weight: 700; color: #0B2040; margin: 0 0 6px 0; }
    .payment-box p { font-size: 13px; color: #666; margin: 2px 0; }
    .footer { text-align: center; color: #999; font-size: 11px; margin-top: 40px; padding-top: 16px; border-top: 1px solid #eee; }
    .print-btn { display: block; margin: 20px auto; padding: 12px 32px; background: #0B2040; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }
    .print-btn:hover { background: #163050; }
  </style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">Print / Save as PDF</button>

  <div class="header">
    <div>
      <h1>Coastal Mobile Lube & Tire</h1>
      <div class="subtitle">We come to you.</div>
    </div>
    <div>
      <div class="inv-num">${invoice.invoiceNumber}</div>
      <div class="inv-date">Issued: ${invoice.createdAt ? new Date(invoice.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</div>
      ${invoice.dueDate ? `<div class="inv-date">Due: ${new Date(invoice.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>` : ''}
    </div>
  </div>

  <div class="bill-to">
    <div class="label">Bill To</div>
    <div class="name">${customerName}</div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Service</th>
        <th>Qty</th>
        <th>Price</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      ${lineItemsHTML}
    </tbody>
  </table>

  <div class="totals">
    ${subtotal ? `<div class="row"><span class="label">Subtotal</span><span>$${subtotal}</span></div>` : ''}
    ${tax ? `<div class="row"><span class="label">Tax</span><span>$${tax}</span></div>` : ''}
    <div class="row total-row">
      <span class="label" style="font-size:14px;font-weight:700;color:#0B2040;">Total Due</span>
      <span class="amount">$${total}</span>
    </div>
  </div>

  <div class="payment-box">
    <h3>Payment Instructions</h3>
    <p>We accept cash, check, Venmo, Zelle, and all major credit cards.</p>
    <p>For questions, call or text us at (813) 277-5500.</p>
  </div>

  <div class="footer">
    Coastal Mobile Lube & Tire | Apollo Beach, FL | coastalmobilelube.com<br>
    Thank you for your business!
  </div>
</body>
</html>`;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(printHTML);
    printWindow.document.close();
  }
};
```

4. Place the "Download PDF" button in the action area of the panel, alongside or below other action buttons. Use the same styling pattern as existing buttons.

---

## STEP 4: Wire "Send Invoice" three-dot action to send email with PDF

Check the invoicing page three-dot menu. The "Send Invoice" action should:

1. Call the existing invoice email Cloud Function (which now includes the PDF attachment)
2. Update the invoice status to "sent" in Firestore
3. Set sentDate to now

If the "Send Invoice" three-dot action currently only updates Firestore status (no email), it needs to also call the Cloud Function. Find the handler and add:

```typescript
// After updating Firestore status to 'sent'
try {
  await fetch(
    'https://us-east1-coastal-mobile-lube.cloudfunctions.net/sendInvoiceEmail',  // or whatever the function URL is
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        invoiceNumber: invoice.invoiceNumber,
        customerName: invoice.customer || invoice.customerName,
        customerEmail: invoice.customerEmail || invoice.email,
        customerPhone: invoice.customerPhone || invoice.phone || '',
        customerAddress: invoice.customerAddress || invoice.address || '',
        vehicle: invoice.vehicle || '',
        lineItems: invoice.lineItems,
        subtotal: invoice.subtotal,
        tax: invoice.tax,
        convenienceFee: invoice.convenienceFee || 0,
        total: invoice.total,
        dueDate: invoice.dueDate || '',
        issuedDate: invoice.createdAt ? new Date(invoice.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '',
      }),
    }
  );
} catch (emailErr) {
  console.error('Failed to send invoice email:', emailErr);
}
```

**Check the function URL.** Read the existing Cloud Functions code to find the exact function name. It might be `sendInvoiceEmail`, `sendInvoice`, or similar. Use the correct URL.

Also wire the same call from InvoiceDetailPanel if there is a "Send Invoice" button there.

---

## STEP 5: Increase Cloud Function memory for PDF generation

pdfkit needs more memory than a simple email. In the function definition, set memory to 512MB:

If using v1 functions:
```javascript
exports.sendInvoiceEmail = functions.region('us-east1').runWith({ memory: '512MB' }).https.onRequest(...)
```

If using v2 functions, add the memory option to the function definition.

Also set 512MB on the new `sendBookingConfirmation` function from WO-10 if it exists.

---

## STEP 6: Build and Deploy

**Deploy Cloud Functions first:**
```bash
cd ~/coastal-mobile-lube/functions
npm install
cd ~/coastal-mobile-lube
firebase deploy --only functions --project coastal-mobile-lube
```

**Then build and deploy frontend:**
```bash
cd ~/coastal-mobile-lube
npm run build
git add src/ functions/
git commit -m "WO-11: Invoice PDF attachment + admin download button"
git push origin main
npx netlify-cli deploy --prod --message="WO-11: Invoice PDF with email attachment"
```

---

## STEP 7: Verify

1. Go to /admin/invoicing
2. Click three-dot on an invoice, click "Send Invoice"
3. Check the recipient's email:
   - HTML email should still look the same as before
   - There should now be a PDF attachment named like "CMLT-2026-008.pdf"
   - PDF should have navy header, line items table, totals, payment instructions, footer
4. Open an invoice detail modal, click "Download PDF"
   - A new tab should open with the formatted invoice
   - "Print / Save as PDF" button at the top should trigger the browser print dialog
   - The printed output should look clean (no button, proper formatting)

---

*End of WO-ADMIN-11*
