"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "@coastal/shared-ui";

type Photo = {
  id: string;
  url: string;
  caption?: string;
};

export function PhotoGrid({ photos }: { photos: Photo[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const active = activeIndex !== null ? photos[activeIndex] : null;

  if (photos.length === 0) {
    return (
      <p className="text-sm italic text-muted-foreground">No photos yet.</p>
    );
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        {photos.map((p, idx) => (
          <button
            type="button"
            key={p.id}
            onClick={() => setActiveIndex(idx)}
            aria-label={p.caption ?? `Open photo ${idx + 1}`}
            className="aspect-square overflow-hidden rounded-md border border-border bg-muted transition-opacity duration-150 ease-out hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.url}
              alt={p.caption ?? "Job photo"}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </button>
        ))}
      </div>
      <Dialog
        open={active !== null}
        onOpenChange={(o) => !o && setActiveIndex(null)}
      >
        <DialogContent
          className="sm:max-w-3xl bg-black/95 border-0 p-2"
          showCloseButton
        >
          {active && (
            <div className="flex flex-col gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={active.url}
                alt={active.caption ?? "Job photo"}
                className="max-h-[80vh] w-full object-contain"
              />
              {active.caption && (
                <p className="text-center text-xs text-muted-foreground">
                  {active.caption}
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
