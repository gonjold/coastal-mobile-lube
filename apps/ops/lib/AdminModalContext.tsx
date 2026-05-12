'use client';

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';

export type ModalName = 'booking' | 'customer' | 'merge' | 'fix-invoice' | null;

export interface ModalPrefill {
  customer?: {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
  };
  bookingId?: string;
  invoiceId?: string;
}

interface AdminModalContextValue {
  activeModal: ModalName;
  prefill: ModalPrefill | null;
  openModal: (name: NonNullable<ModalName>, prefill?: ModalPrefill) => void;
  closeModal: () => void;
}

const AdminModalContext = createContext<AdminModalContextValue | null>(null);

export function AdminModalProvider({ children }: { children: ReactNode }) {
  const [activeModal, setActiveModal] = useState<ModalName>(null);
  const [prefill, setPrefill] = useState<ModalPrefill | null>(null);

  const openModal = useCallback((name: NonNullable<ModalName>, p?: ModalPrefill) => {
    setPrefill(p ?? null);
    setActiveModal(name);
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal(null);
    setPrefill(null);
  }, []);

  return (
    <AdminModalContext.Provider value={{ activeModal, prefill, openModal, closeModal }}>
      {children}
    </AdminModalContext.Provider>
  );
}

export function useAdminModal() {
  const ctx = useContext(AdminModalContext);
  if (!ctx) throw new Error('useAdminModal must be used within AdminModalProvider');
  return ctx;
}
