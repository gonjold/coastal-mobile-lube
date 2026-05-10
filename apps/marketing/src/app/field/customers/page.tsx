import { Users } from "lucide-react";

export default function FieldCustomersPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
      <Users
        className="h-10 w-10 text-muted-foreground/60"
        strokeWidth={1.5}
      />
      <h2 className="mt-4 font-display text-lg font-semibold text-foreground">
        Customer browser
      </h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Search and pull up customer history from the field. Available in the
        next update.
      </p>
    </div>
  );
}
