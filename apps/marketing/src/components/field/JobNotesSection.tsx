"use client";

import { useState } from "react";
import { JobSection } from "./JobSection";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export function JobNotesSection({
  jobId,
  initialNotes,
}: {
  jobId: string;
  initialNotes: string;
}) {
  const [notes, setNotes] = useState(initialNotes);
  const [savedNotes, setSavedNotes] = useState(initialNotes);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (notes === savedNotes) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/field/jobs/${jobId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      if (!res.ok) {
        throw new Error((await res.text()) || `HTTP ${res.status}`);
      }
      setSavedNotes(notes);
      toast.success("Notes saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <JobSection
      title="Notes"
      action={
        saving ? (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" /> Saving
          </span>
        ) : null
      }
    >
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={save}
        rows={4}
        placeholder="Add notes for this job..."
        className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      />
    </JobSection>
  );
}
