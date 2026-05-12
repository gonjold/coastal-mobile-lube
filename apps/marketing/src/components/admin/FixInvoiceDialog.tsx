"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@coastal/shared-ui";
import { Button } from "@coastal/shared-ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@coastal/shared-ui";

export interface ErroredInvoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  lastError?: string | null;
  qboResponseSnippet?: string | null;
  attemptedAt?: { toDate: () => Date } | null;
}

export default function FixInvoiceDialog({
  invoice,
  open,
  onOpenChange,
}: {
  invoice: ErroredInvoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [retrying, setRetrying] = useState(false);
  const [result, setResult] = useState<
    { ok: true; detail?: string } | { ok: false; error: string; snippet?: string } | null
  >(null);

  function close() {
    setResult(null);
    onOpenChange(false);
  }

  async function retry() {
    if (!invoice) return;
    setRetrying(true);
    setResult(null);
    try {
      const res = await fetch(`/api/admin/invoices/${invoice.id}/retry`, {
        method: "POST",
      });
      const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (res.ok && json.ok) {
        setResult({
          ok: true,
          detail:
            typeof json.response === "object" && json.response
              ? JSON.stringify(json.response, null, 2)
              : String(json.response ?? "Success"),
        });
        toast.success("Invoice retry succeeded");
      } else {
        setResult({
          ok: false,
          error: (json.error as string) || `HTTP ${res.status}`,
          snippet: (json.snippet as string) || undefined,
        });
        toast.error("Retry failed", {
          description: (json.error as string) || `HTTP ${res.status}`,
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Network error";
      setResult({ ok: false, error: msg });
      toast.error("Retry failed", { description: msg });
    } finally {
      setRetrying(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(true) : close())}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="inline-flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" strokeWidth={1.75} />
            Fix invoice
          </DialogTitle>
          <DialogDescription>
            QuickBooks finalize failed on this invoice. Review the error below
            and retry. The cloud function is invoked server-to-server.
          </DialogDescription>
        </DialogHeader>

        {invoice && (
          <div className="space-y-4 text-[13px]">
            <div className="grid grid-cols-[100px_1fr] gap-y-2 gap-x-3 text-foreground">
              <div className="text-muted-foreground">Invoice</div>
              <div className="font-semibold">{invoice.invoiceNumber}</div>
              <div className="text-muted-foreground">Customer</div>
              <div className="font-semibold">
                {invoice.customerName || "(no name)"}
              </div>
              {invoice.attemptedAt?.toDate && (
                <>
                  <div className="text-muted-foreground">Attempted</div>
                  <div className="text-muted-foreground">
                    {invoice.attemptedAt.toDate().toLocaleString()}
                  </div>
                </>
              )}
            </div>

            {invoice.lastError && (
              <Alert variant="destructive">
                <AlertTitle>Error message</AlertTitle>
                <AlertDescription className="font-mono text-[12px] whitespace-pre-wrap break-all">
                  {invoice.lastError}
                </AlertDescription>
              </Alert>
            )}

            {invoice.qboResponseSnippet && (
              <details className="rounded-md border border-border bg-muted/40 px-3 py-2 text-[12px]">
                <summary className="cursor-pointer text-muted-foreground select-none">
                  QB response snippet
                </summary>
                <pre className="mt-2 font-mono whitespace-pre-wrap break-all text-foreground/80">
                  {invoice.qboResponseSnippet}
                </pre>
              </details>
            )}

            {result?.ok && (
              <Alert className="bg-success/10 border-success/20 text-success">
                <CheckCircle2 className="h-4 w-4" strokeWidth={1.75} />
                <AlertTitle>Retry succeeded</AlertTitle>
                {result.detail && (
                  <AlertDescription className="font-mono text-[11px] whitespace-pre-wrap break-all max-h-[140px] overflow-y-auto">
                    {result.detail}
                  </AlertDescription>
                )}
              </Alert>
            )}

            {result && !result.ok && (
              <Alert variant="destructive">
                <AlertTitle>Retry failed</AlertTitle>
                <AlertDescription className="font-mono text-[11px] whitespace-pre-wrap break-all">
                  {result.error}
                  {result.snippet && (
                    <>
                      {"\n\n"}
                      {result.snippet}
                    </>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={close} disabled={retrying}>
            Close
          </Button>
          <Button onClick={retry} disabled={retrying || !invoice}>
            {retrying ? (
              <>
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" strokeWidth={1.75} />
                Retrying…
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-1.5" strokeWidth={1.75} />
                Retry finalize
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
