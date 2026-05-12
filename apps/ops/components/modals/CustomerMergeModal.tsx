'use client';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@coastal/shared-ui';
import { useAdminModal } from '@/lib/AdminModalContext';

/** A3b-1 stub. The marketing CustomerMergeModal (415 LOC, hand-rolled overlay)
 * has a full dedupe wizard. Porting + the shared-ui Dialog rewrite is scoped
 * to A3c per the modal-disposition trade-off. For now this stub prevents the
 * palette command from being a dead end and unblocks the merge entry-point UI. */
export function CustomerMergeModal() {
  const { activeModal, closeModal } = useAdminModal();
  const open = activeModal === 'merge';

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) closeModal(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Merge customers</DialogTitle>
          <DialogDescription>
            The full merge wizard ships in A3c. For now, use the marketing
            /admin/customers screen to dedupe (Jason&apos;s workflow is unchanged).
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={closeModal}>Close</Button>
          <Button
            onClick={() => {
              window.open('https://coastalmobilelube.com/admin/customers', '_blank');
              closeModal();
            }}
          >
            Open marketing /admin/customers
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
