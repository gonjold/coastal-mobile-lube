"use client";

import { Input } from "@coastal/shared-ui";
import { Label } from "@/components/ui/label";

export type AssetType = "vehicle" | "boat" | "trailer" | "fleet_vehicle";

export type AssetFormValues = {
  year: string;
  make: string;
  model: string;
  vin: string;
  licensePlate: string;
  nickname: string;
};

export type AssetFormErrors = Partial<Record<keyof AssetFormValues, string>>;

export const EMPTY_ASSET: AssetFormValues = {
  year: "",
  make: "",
  model: "",
  vin: "",
  licensePlate: "",
  nickname: "",
};

export function validateAsset(v: AssetFormValues): AssetFormErrors | null {
  const errors: AssetFormErrors = {};
  if (!v.make.trim()) errors.make = "Make is required";
  if (!v.model.trim()) errors.model = "Model is required";
  if (v.year && !/^\d{4}$/.test(v.year.trim())) {
    errors.year = "Enter a 4-digit year";
  }
  return Object.keys(errors).length === 0 ? null : errors;
}

export function AssetForm({
  values,
  onChange,
  errors,
  disabled,
  idPrefix,
}: {
  values: AssetFormValues;
  onChange: (next: AssetFormValues) => void;
  errors?: AssetFormErrors;
  disabled?: boolean;
  idPrefix: string;
}) {
  function set<K extends keyof AssetFormValues>(key: K, v: string) {
    onChange({ ...values, [key]: v });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${idPrefix}-year`}>Year</Label>
          <Input
            id={`${idPrefix}-year`}
            inputMode="numeric"
            maxLength={4}
            value={values.year}
            disabled={disabled}
            onChange={(e) => set("year", e.target.value.replace(/\D/g, ""))}
            aria-invalid={Boolean(errors?.year) || undefined}
          />
          {errors?.year && (
            <p className="text-xs text-destructive">{errors.year}</p>
          )}
        </div>
        <div className="col-span-2 flex flex-col gap-1.5">
          <Label htmlFor={`${idPrefix}-make`}>
            Make <span className="text-destructive">*</span>
          </Label>
          <Input
            id={`${idPrefix}-make`}
            value={values.make}
            disabled={disabled}
            onChange={(e) => set("make", e.target.value)}
            aria-invalid={Boolean(errors?.make) || undefined}
          />
          {errors?.make && (
            <p className="text-xs text-destructive">{errors.make}</p>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-model`}>
          Model <span className="text-destructive">*</span>
        </Label>
        <Input
          id={`${idPrefix}-model`}
          value={values.model}
          disabled={disabled}
          onChange={(e) => set("model", e.target.value)}
          aria-invalid={Boolean(errors?.model) || undefined}
        />
        {errors?.model && (
          <p className="text-xs text-destructive">{errors.model}</p>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-nickname`}>Nickname / display name</Label>
        <Input
          id={`${idPrefix}-nickname`}
          value={values.nickname}
          disabled={disabled}
          onChange={(e) => set("nickname", e.target.value)}
          placeholder="e.g. Mom's Honda"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${idPrefix}-vin`}>VIN</Label>
          <Input
            id={`${idPrefix}-vin`}
            value={values.vin}
            disabled={disabled}
            onChange={(e) => set("vin", e.target.value.toUpperCase())}
            maxLength={17}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${idPrefix}-plate`}>License plate</Label>
          <Input
            id={`${idPrefix}-plate`}
            value={values.licensePlate}
            disabled={disabled}
            onChange={(e) =>
              set("licensePlate", e.target.value.toUpperCase())
            }
          />
        </div>
      </div>
    </div>
  );
}
