"use client";

import { useEffect } from "react";
import AdminBadge from "./AdminBadge";
import { formatCurrency } from "@/lib/formatCurrency";

/* ── Types ── */

interface LineItem {
  serviceName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface InvoiceForPanel {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  lineItems: LineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  status: "draft" | "sent" | "paid" | "overdue";
  notes: string;
  invoiceDate: string;
  dueDate: string;
  paidDate?: string;
  paidAmount?: number;
  division?: string;
  jobReference?: string;
  vehicle?: string;
}

/* ── Helpers ── */

function formatDateAbbr(dateStr: string): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function isOverdue(inv: InvoiceForPanel): boolean {
  if (inv.status === "overdue") return true;
  if (inv.status === "sent" && inv.dueDate) {
    return new Date(inv.dueDate + "T23:59:59") < new Date();
  }
  return false;
}

function getStatusBadgeVariant(status: string): "green" | "red" | "amber" | "gray" | "blue" {
  switch (status) {
    case "paid": return "green";
    case "overdue": return "red";
    case "sent": return "blue";
    case "draft": return "gray";
    default: return "gray";
  }
}

/* ── Component ── */

export default function InvoiceDetailPanel({
  invoice,
  onClose,
  onMarkPaid,
  onPrint,
  onSendInvoice,
}: {
  invoice: InvoiceForPanel | null;
  onClose: () => void;
  onMarkPaid: (invoiceId: string) => void;
  onPrint: (invoice: InvoiceForPanel) => void;
  onSendInvoice?: (invoice: InvoiceForPanel) => void;
}) {
  /* Escape key handler */
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!invoice) return null;

  const handleDownloadPDF = () => {
    const inv = invoice;
    const lineItemsHTML = (inv.lineItems || []).map((item: LineItem) => {
      const qty = item.quantity || 1;
      const price = item.unitPrice || 0;
      const total = qty * price;
      return `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:14px;">${item.serviceName || 'Service'}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:center;font-size:14px;">${qty}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:right;font-size:14px;">$${price.toFixed(2)}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:right;font-size:14px;font-weight:700;">$${total.toFixed(2)}</td>
        </tr>
      `;
    }).join('');

    const customerName = inv.customerName || '';
    const total = (inv.total || 0).toFixed(2);
    const subtotal = inv.subtotal != null ? inv.subtotal.toFixed(2) : null;
    const taxAmount = inv.taxAmount != null && inv.taxAmount > 0 ? inv.taxAmount.toFixed(2) : null;

    const printHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Invoice ${inv.invoiceNumber}</title>
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
      <div class="inv-num">${inv.invoiceNumber}</div>
      <div class="inv-date">Issued: ${inv.invoiceDate ? new Date(inv.invoiceDate + 'T12:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</div>
      ${inv.dueDate ? `<div class="inv-date">Due: ${new Date(inv.dueDate + 'T12:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>` : ''}
    </div>
  </div>

  <div class="bill-to">
    <div class="label">Bill To</div>
    <div class="name">${customerName}</div>
    ${inv.customerPhone ? `<div class="detail">${inv.customerPhone}</div>` : ''}
    ${inv.customerEmail ? `<div class="detail">${inv.customerEmail}</div>` : ''}
  </div>

  ${inv.vehicle ? `<div class="bill-to" style="padding-top:0"><div class="label">Vehicle</div><div class="name" style="font-size:13px">${inv.vehicle}</div></div>` : ''}

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
    ${taxAmount ? `<div class="row"><span class="label">Tax</span><span>$${taxAmount}</span></div>` : ''}
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

  const inv = invoice;
  const overdue = isOverdue(inv);
  const statusLabel = inv.status.charAt(0).toUpperCase() + inv.status.slice(1);
  const balance = inv.total - (inv.paidAmount ?? 0);
  const partiallyPaid = inv.status === "paid" && inv.paidAmount !== undefined && inv.paidAmount < inv.total && inv.paidAmount > 0;

  /* Amount hero background + color */
  let heroBg = "bg-[#F7F8FA]";
  let amountColor = "text-[#0B2040]";
  let amountLabel = "Balance Due";

  if (overdue || inv.status === "overdue") {
    heroBg = "bg-red-50";
    amountColor = "text-red-600";
  } else if (inv.status === "paid") {
    heroBg = "bg-green-50";
    amountColor = "text-green-700";
    amountLabel = "Amount Paid";
  }

  /* Detail rows */
  const detailRows: { label: string; value: string; isEmail?: boolean }[] = [
    { label: "Customer", value: inv.customerName || "—" },
    { label: "Email", value: inv.customerEmail || "—", isEmail: !!inv.customerEmail },
    { label: "Job Reference", value: inv.jobReference || "—" },
    { label: "Vehicle", value: inv.vehicle || "—" },
    { label: "Invoice Date", value: formatDateAbbr(inv.invoiceDate) },
    { label: "Due Date", value: formatDateAbbr(inv.dueDate) },
    { label: "Division", value: inv.division || "—" },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-[70]"
        onClick={onClose}
      />
      {/* Modal */}
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white rounded-2xl shadow-2xl w-[95vw] max-w-[960px] h-[90vh] flex flex-col pointer-events-auto overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
        {/* Header */}
        <div className="px-6 py-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#0B2040]">{inv.invoiceNumber}</h2>
              <div className="flex items-center gap-2 mt-1.5">
                <AdminBadge label={statusLabel} variant={getStatusBadgeVariant(inv.status)} />
                {overdue && (
                  <span className="text-xs font-semibold text-red-600">Past due</span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-xl text-gray-500 cursor-pointer hover:text-gray-700 transition p-1"
            >
              &times;
            </button>
          </div>

          {/* Amount hero block */}
          <div className={`mt-3 rounded-xl p-4 px-5 flex justify-between items-center ${heroBg}`}>
            <div>
              <div className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.05em]">
                {amountLabel}
              </div>
              <div className={`text-[32px] font-extrabold ${amountColor}`}>
                {formatCurrency(inv.status === "paid" ? (inv.paidAmount ?? inv.total) : balance)}
              </div>
            </div>
            {inv.status === "paid" && inv.paidDate && (
              <div className="text-right">
                <div className="text-[11px] text-gray-500">Paid on</div>
                <div className="text-[13px] font-semibold text-green-700">
                  {formatDateAbbr(inv.paidDate)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* Invoice details */}
          <div className="mb-5">
            {detailRows.map((row) => (
              <div
                key={row.label}
                className="flex justify-between items-start py-2 border-b border-gray-100 last:border-0"
              >
                <span className="text-[12px] text-gray-500 font-medium">{row.label}</span>
                {row.isEmail ? (
                  <a
                    href={`mailto:${row.value}`}
                    className="text-[13px] font-medium text-[#1A5FAC] hover:underline text-right"
                  >
                    {row.value}
                  </a>
                ) : (
                  <span className="text-[13px] font-medium text-[#0B2040] text-right">
                    {row.value}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Line items */}
          <div className="mb-4">
            <div className="border border-gray-200 rounded-[10px] overflow-hidden">
              {/* Header row */}
              <div className="grid grid-cols-[1fr_60px_80px_80px] bg-[#F7F8FA] px-3.5 py-2.5">
                <span className="text-[11px] font-bold text-gray-500 uppercase">Description</span>
                <span className="text-[11px] font-bold text-gray-500 uppercase text-center">Qty</span>
                <span className="text-[11px] font-bold text-gray-500 uppercase text-center">Rate</span>
                <span className="text-[11px] font-bold text-gray-500 uppercase text-center">Amount</span>
              </div>
              {/* Item rows */}
              {inv.lineItems.map((li, idx) => (
                <div
                  key={idx}
                  className={`grid grid-cols-[1fr_60px_80px_80px] px-3.5 py-3 ${
                    idx < inv.lineItems.length - 1 ? "border-b border-gray-200" : ""
                  }`}
                >
                  <span className="text-[13px] text-[#0B2040]">{li.serviceName}</span>
                  <span className="text-[13px] text-[#0B2040] text-center">{li.quantity}</span>
                  <span className="text-[13px] text-gray-500 text-center">{formatCurrency(li.unitPrice)}</span>
                  <span className="text-[13px] font-semibold text-[#0B2040] text-center">
                    {formatCurrency(li.quantity * li.unitPrice)}
                  </span>
                </div>
              ))}
            </div>

            {/* Totals block */}
            <div className="flex flex-col items-end gap-1.5 mt-3">
              <div className="flex items-center gap-4">
                <span className="text-[13px] text-gray-500">Subtotal</span>
                <span className="text-[13px] font-medium min-w-[80px] text-right">
                  {formatCurrency(inv.subtotal)}
                </span>
              </div>
              {inv.taxRate > 0 && (
                <div className="flex items-center gap-4">
                  <span className="text-[13px] text-gray-500">Tax ({inv.taxRate}%)</span>
                  <span className="text-[13px] font-medium min-w-[80px] text-right">
                    {formatCurrency(inv.taxAmount)}
                  </span>
                </div>
              )}
              <div className="w-[180px] h-px bg-gray-200 my-1" />
              <div className="flex items-center gap-4">
                <span className="text-sm font-bold text-[#0B2040]">Total</span>
                <span className="text-base font-bold min-w-[80px] text-right text-[#0B2040]">
                  {formatCurrency(inv.total)}
                </span>
              </div>
              {partiallyPaid && (
                <>
                  <div className="flex items-center gap-4">
                    <span className="text-[13px] text-green-600">Paid</span>
                    <span className="text-[13px] font-medium text-green-600 min-w-[80px] text-right">
                      {formatCurrency(inv.paidAmount!)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[13px] font-bold text-red-600">Balance Due</span>
                    <span className="text-[13px] font-bold text-red-600 min-w-[80px] text-right">
                      {formatCurrency(balance)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Notes */}
          {inv.notes && (
            <div className="bg-[#F7F8FA] rounded-[10px] p-3.5 mb-4">
              <p className="text-[11px] font-bold text-gray-500 uppercase mb-1">Notes</p>
              <p className="text-[13px] text-[#0B2040] whitespace-pre-wrap">{inv.notes}</p>
            </div>
          )}

          {/* QuickBooks sync placeholder */}
          <div className="bg-[#F7F8FA] rounded-[10px] p-3.5 flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-gray-300 shrink-0" />
            <span className="text-xs text-gray-500">QuickBooks sync not connected</span>
            <span className="text-[11px] font-semibold text-[#1A5FAC] cursor-pointer ml-auto">
              Set up
            </span>
          </div>
        </div>

        {/* Bottom action bar */}
        <div className="border-t border-gray-200 px-6 py-4 flex gap-2.5">
          {inv.status === "draft" && (
            <>
              <button
                onClick={() => onSendInvoice?.(inv)}
                className="flex-1 bg-[#1A5FAC] text-white rounded-[10px] py-2.5 font-semibold text-[13px] cursor-pointer hover:bg-[#174f94] transition"
              >
                Send Invoice
              </button>
              <button
                onClick={handleDownloadPDF}
                className="px-5 border border-gray-200 rounded-[10px] py-2.5 text-[#0B2040] font-semibold text-[13px] cursor-pointer hover:bg-gray-50 transition"
              >
                Download PDF
              </button>
              <button
                onClick={() => onPrint(inv)}
                className="px-5 border border-gray-200 rounded-[10px] py-2.5 text-gray-500 font-semibold text-[13px] cursor-pointer hover:bg-gray-50 transition"
              >
                Print / PDF
              </button>
            </>
          )}

          {(inv.status === "sent" || inv.status === "overdue") && (
            <>
              <button
                onClick={() => onMarkPaid(inv.id)}
                className="flex-1 bg-[#16A34A] text-white rounded-[10px] py-2.5 font-semibold text-[13px] cursor-pointer hover:bg-[#15803d] transition"
              >
                Mark as Paid
              </button>
              <button
                onClick={() => onSendInvoice?.(inv)}
                className="px-5 border border-gray-200 rounded-[10px] py-2.5 text-[#1A5FAC] font-semibold text-[13px] cursor-pointer hover:bg-gray-50 transition"
              >
                Resend
              </button>
              <button
                onClick={handleDownloadPDF}
                className="px-5 border border-gray-200 rounded-[10px] py-2.5 text-[#0B2040] font-semibold text-[13px] cursor-pointer hover:bg-gray-50 transition"
              >
                Download PDF
              </button>
              <button
                onClick={() => onPrint(inv)}
                className="px-5 border border-gray-200 rounded-[10px] py-2.5 text-gray-500 font-semibold text-[13px] cursor-pointer hover:bg-gray-50 transition"
              >
                Print / PDF
              </button>
            </>
          )}

          {inv.status === "paid" && (
            <>
              <button
                onClick={handleDownloadPDF}
                className="flex-1 border border-gray-200 rounded-[10px] py-2.5 text-[#0B2040] font-semibold text-[13px] cursor-pointer hover:bg-gray-50 transition"
              >
                Download PDF
              </button>
              <button
                onClick={() => onPrint(inv)}
                className="flex-1 border border-gray-200 rounded-[10px] py-2.5 text-gray-500 font-semibold text-[13px] cursor-pointer hover:bg-gray-50 transition"
              >
                Print / PDF
              </button>
              <button
                onClick={() => onSendInvoice?.(inv)}
                className="flex-1 border border-gray-200 rounded-[10px] py-2.5 text-[#1A5FAC] font-semibold text-[13px] cursor-pointer hover:bg-gray-50 transition"
              >
                Resend
              </button>
            </>
          )}
        </div>
      </div>
      </div>
    </>
  );
}
