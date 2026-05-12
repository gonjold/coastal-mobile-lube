'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@coastal/shared-ui';
import { useAdminModal } from '@/lib/AdminModalContext';

/** A3b-1 minimal port. The marketing FixInvoiceDialog (185 LOC) drives a retry
 * against /api/admin/invoices/[id]/retry. Ops doesn't yet have an equivalent
 * route; calling marketing's directly cross-origin needs auth-cookie work.
 * For now this dialog explains the error and links to the marketing route.
 * A3c lands the ops retry endpoint and full QB-error UX. */
export function FixInvoiceDialog() {
  const { activeModal, prefill, closeModal } = useAdminModal();
  const open = activeModal === 'fix-invoice';
  const [opening, setOpening] = useState(false);

  function jumpToMarketing() {
    if (!prefill?.invoiceId) {
      toast.error('Missing invoice id');
      return;
    }
    setOpening(true);
    window.open(`https://coastalmobilelube.com/admin/invoicing?fix=${prefill.invoiceId}`, '_blank');
    closeModal();
    setOpening(false);
  }

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) closeModal(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Retry QB invoice</DialogTitle>
          <DialogDescription>
            QuickBooks rejected this invoice. Retry from marketing /admin/invoicing
            (auth-cookie-backed) until the ops retry route ships in A3c.
          </DialogDescription>
        </DialogHeader>
        <Alert>
          <AlertTitle>Invoice {prefill?.invoiceId?.slice(0, 8)}</AlertTitle>
          <AlertDescription>
            Marketing&apos;s fix dialog reads the QB error response and offers a one-click retry.
          </AlertDescription>
        </Alert>
        <DialogFooter>
          <Button variant="outline" onClick={closeModal}>Close</Button>
          <Button onClick={jumpToMarketing} disabled={opening}>Open marketing fix</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
