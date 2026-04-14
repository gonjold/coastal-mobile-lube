"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

/* ── Types ── */

export interface ModalPreFill {
  customer?: {
    name: string;
    phone?: string;
    email?: string;
    address?: string;
  };
  bookingId?: string;
}

interface AdminModalContextValue {
  activeModal: "booking" | "customer" | "invoice" | "customer-profile" | null;
  prefillData: ModalPreFill | null;
  preFill: ModalPreFill | null;
  openModal: (
    type: "booking" | "customer" | "invoice" | "customer-profile",
    data?: ModalPreFill,
  ) => void;
  closeModal: () => void;
}

/* ── Context ── */

const AdminModalContext = createContext<AdminModalContextValue | null>(null);

/* ── Provider ── */

export function AdminModalProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [activeModal, setActiveModal] = useState<
    "booking" | "customer" | "invoice" | "customer-profile" | null
  >(null);
  const [preFill, setPreFill] = useState<ModalPreFill | null>(null);

  const openModal = useCallback(
    (
      type: "booking" | "customer" | "invoice" | "customer-profile",
      data?: ModalPreFill,
    ) => {
      if (type === "invoice") {
        // Set activeModal so the invoicing page can detect it
        setPreFill(data || null);
        setActiveModal("invoice");
        // Also navigate (handles case where user is on a different page)
        if (data?.customer) {
          const params = new URLSearchParams({
            from: "customer",
            name: data.customer.name,
            phone: data.customer.phone || "",
            email: data.customer.email || "",
          });
          router.push(`/admin/invoicing?${params.toString()}`);
        } else if (data?.bookingId) {
          router.push(
            `/admin/invoicing?from=booking&id=${data.bookingId}`,
          );
        } else {
          router.push("/admin/invoicing?from=new");
        }
        return;
      }
      setPreFill(data || null);
      setActiveModal(type);
    },
    [router],
  );

  const closeModal = useCallback(() => {
    setActiveModal(null);
    setPreFill(null);
  }, []);

  return (
    <AdminModalContext.Provider
      value={{ activeModal, preFill, prefillData: preFill, openModal, closeModal }}
    >
      {children}
    </AdminModalContext.Provider>
  );
}

/* ── Hook ── */

export function useAdminModal() {
  const ctx = useContext(AdminModalContext);
  if (!ctx)
    throw new Error("useAdminModal must be used within AdminModalProvider");
  return ctx;
}
