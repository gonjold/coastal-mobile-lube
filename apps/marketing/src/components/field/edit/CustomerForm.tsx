"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type CustomerFormValues = {
  name: string;
  phone: string;
  email: string;
  address: string;
};

export type CustomerFormErrors = Partial<Record<keyof CustomerFormValues, string>>;

const PLACES_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;

export function formatPhoneInput(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 10);
  if (d.length === 0) return "";
  if (d.length < 4) return d;
  if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

export function digitsOnly(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function validateCustomer(v: CustomerFormValues): CustomerFormErrors | null {
  const errors: CustomerFormErrors = {};
  if (!v.name.trim()) errors.name = "Name is required";
  const digits = digitsOnly(v.phone);
  if (!digits) errors.phone = "Phone is required";
  else if (digits.length !== 10) errors.phone = "Enter 10 digits";
  if (v.email && !/^\S+@\S+\.\S+$/.test(v.email.trim())) {
    errors.email = "Email looks off";
  }
  return Object.keys(errors).length === 0 ? null : errors;
}

export function CustomerForm({
  values,
  onChange,
  errors,
  disabled,
}: {
  values: CustomerFormValues;
  onChange: (next: CustomerFormValues) => void;
  errors?: CustomerFormErrors;
  disabled?: boolean;
}) {
  function set<K extends keyof CustomerFormValues>(key: K, v: string) {
    onChange({ ...values, [key]: v });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="edit-cust-name">
          Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="edit-cust-name"
          autoComplete="name"
          value={values.name}
          disabled={disabled}
          onChange={(e) => set("name", e.target.value)}
          aria-invalid={Boolean(errors?.name) || undefined}
        />
        {errors?.name && <p className="text-xs text-destructive">{errors.name}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="edit-cust-phone">
          Phone <span className="text-destructive">*</span>
        </Label>
        <Input
          id="edit-cust-phone"
          inputMode="tel"
          autoComplete="tel"
          placeholder="(555) 123-4567"
          value={values.phone}
          disabled={disabled}
          onChange={(e) => set("phone", formatPhoneInput(e.target.value))}
          aria-invalid={Boolean(errors?.phone) || undefined}
        />
        {errors?.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="edit-cust-email">Email</Label>
        <Input
          id="edit-cust-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="customer@example.com"
          value={values.email}
          disabled={disabled}
          onChange={(e) => set("email", e.target.value)}
          aria-invalid={Boolean(errors?.email) || undefined}
        />
        {errors?.email && <p className="text-xs text-destructive">{errors.email}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="edit-cust-address">Address</Label>
        <Input
          id="edit-cust-address"
          autoComplete="street-address"
          value={values.address}
          disabled={disabled}
          onChange={(e) => set("address", e.target.value)}
          aria-invalid={Boolean(errors?.address) || undefined}
          placeholder={
            PLACES_KEY ? "Start typing an address..." : "123 Main St, City, FL"
          }
        />
        {errors?.address && (
          <p className="text-xs text-destructive">{errors.address}</p>
        )}
        {!PLACES_KEY && (
          <p className="text-xs text-muted-foreground">
            Plain text — Google Places autocomplete activates when
            NEXT_PUBLIC_GOOGLE_PLACES_API_KEY is configured.
          </p>
        )}
      </div>
    </div>
  );
}
