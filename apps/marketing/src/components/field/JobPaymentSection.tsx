"use client";

import { useState } from "react";
import { JobSection } from "./JobSection";
import type { JobDetail } from "@/lib/jobs/queries";
import { Button } from "@coastal/shared-ui";
import { Mail, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";

// TODO Phase 3: add Clover charge button alongside email-link button
// Stubs in /lib/clover/* are dormant and throw NotImplementedError if called.
// Phase 3 will wire them up + add a "Charge card" button + a "Send pay-by-text"
// button here. Do NOT import from @/lib/clover/* in this file before then.

export function JobPaymentSection({ job }: { job: JobDetail }) {
  const [sending, setSending] = useState(false);

  if (!job.qboInvoiceId) {
    return (
      <JobSection title="Payment">
        <p className="text-sm italic text-muted-foreground">
          No invoice yet. Finalize services first.
        </p>
      </JobSection>
    );
  }

  async function emailLink() {
    if (sending) return;
    setSending(true);
    try {
      const res = await fetch(
        `/api/qbo/email-invoice/${job.qboInvoiceId}`,
        { method: "POST" },
      );
      if (!res.ok) {
        throw new Error((await res.text()) || `HTTP ${res.status}`);
      }
      toast.success("Payment link emailed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Send failed");
    } finally {
      setSending(false);
    }
  }

  return (
    <JobSection title="Payment">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileText className="h-4 w-4" strokeWidth={1.75} />
          <span>
            Invoice {job.qboInvoiceNumber ?? job.qboInvoiceId}
          </span>
        </div>
        <Button onClick={emailLink} disabled={sending} className="w-full gap-2">
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Mail className="h-4 w-4" strokeWidth={1.75} />
          )}
          Email payment link
        </Button>
      </div>
    </JobSection>
  );
}
