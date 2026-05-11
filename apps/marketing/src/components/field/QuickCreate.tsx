"use client";

import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@coastal/shared-ui";
import { Button } from "@coastal/shared-ui";
import { Briefcase, UserPlus } from "lucide-react";

export function QuickCreate({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>Quick create</SheetTitle>
        </SheetHeader>
        <div className="mt-4 grid gap-2 px-4 pb-6">
          <Button
            asChild
            variant="outline"
            size="lg"
            className="justify-start gap-3"
            onClick={() => onOpenChange(false)}
          >
            <Link href="/field/jobs/new">
              <Briefcase className="h-5 w-5" strokeWidth={1.75} />
              New job
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="justify-start gap-3"
            onClick={() => onOpenChange(false)}
          >
            <Link href="/field/customers/new">
              <UserPlus className="h-5 w-5" strokeWidth={1.75} />
              New customer
            </Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
