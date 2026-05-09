"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Briefcase, UserPlus } from "lucide-react";
import { toast } from "sonner";

export function QuickCreate({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  function handleStub() {
    toast.info("Coming soon — create from admin for now");
    setTimeout(() => onOpenChange(false), 400);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>Quick create</SheetTitle>
        </SheetHeader>
        <div className="mt-4 grid gap-2 px-4 pb-6">
          <Button
            variant="outline"
            size="lg"
            className="justify-start gap-3"
            onClick={handleStub}
          >
            <Briefcase className="h-5 w-5" strokeWidth={1.75} />
            New job
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="justify-start gap-3"
            onClick={handleStub}
          >
            <UserPlus className="h-5 w-5" strokeWidth={1.75} />
            New customer
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
