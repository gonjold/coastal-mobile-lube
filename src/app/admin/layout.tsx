"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import AdminAuthGuard from "@/components/AdminAuthGuard";
import AdminSidebar from "@/components/admin/AdminSidebar";
import {
  AdminModalProvider,
  useAdminModal,
} from "@/contexts/AdminModalContext";
import NewBookingModal from "@/components/admin/NewBookingModal";
import NewCustomerModal from "@/components/admin/NewCustomerModal";
import CustomerProfilePanel, {
  type CustomerForPanel,
  type PanelInvoice,
} from "@/components/admin/CustomerProfilePanel";
import { type Booking, buildCustomerList, toISODate } from "./shared";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  /* ── Login page - no admin chrome ── */
  if (pathname === "/admin/login") {
    return (
      <>
        <style
          dangerouslySetInnerHTML={{
            __html:
              "header, footer, #site-sticky-bar { display: none !important; } main { padding-bottom: 0 !important; }",
          }}
        />
        {children}
      </>
    );
  }

  return (
    <>
      {/* Hide public site chrome */}
      <style
        dangerouslySetInnerHTML={{
          __html:
            "header, footer, #site-sticky-bar { display: none !important; } main { padding-bottom: 0 !important; }",
        }}
      />

      <AdminModalProvider>
        <AdminSidebar />

        <div className="ml-[230px] min-h-screen bg-[#F7F8FA]">
          <main>
            <AdminAuthGuard>{children}</AdminAuthGuard>
          </main>
        </div>

        <AdminModals />
      </AdminModalProvider>
    </>
  );
}

/* ── Renders the global modals based on context state ── */
function AdminModals() {
  const { activeModal, preFill, closeModal } = useAdminModal();

  return (
    <>
      {activeModal === "booking" && (
        <NewBookingModal
          onClose={closeModal}
          preFilledCustomer={preFill?.customer || null}
        />
      )}
      {activeModal === "customer" && (
        <NewCustomerModal onClose={closeModal} />
      )}
      {activeModal === "customer-profile" && preFill?.customer && (
        <CustomerProfileModalWrapper
          customerInfo={preFill.customer}
          onClose={closeModal}
        />
      )}
    </>
  );
}

/* ── Wrapper that loads data for CustomerProfilePanel ── */
function CustomerProfileModalWrapper({
  customerInfo,
  onClose,
}: {
  customerInfo: { name: string; phone?: string; email?: string; address?: string };
  onClose: () => void;
}) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [invoices, setInvoices] = useState<PanelInvoice[]>([]);

  useEffect(() => {
    const qBookings = query(collection(db, "bookings"), orderBy("createdAt", "desc"));
    const unsub1 = onSnapshot(qBookings, (snap) => {
      setBookings(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Booking));
    });
    const qInvoices = query(collection(db, "invoices"), orderBy("createdAt", "desc"));
    const unsub2 = onSnapshot(qInvoices, (snap) => {
      setInvoices(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as PanelInvoice));
    });
    return () => { unsub1(); unsub2(); };
  }, []);

  const customers = useMemo(() => buildCustomerList(bookings), [bookings]);

  const matched = useMemo(() => {
    const phone = customerInfo.phone?.replace(/\D/g, "");
    const email = customerInfo.email?.toLowerCase();
    return customers.find((c) => {
      if (phone && c.phone?.replace(/\D/g, "") === phone) return true;
      if (email && c.email?.toLowerCase() === email) return true;
      return c.name.toLowerCase() === customerInfo.name.toLowerCase();
    });
  }, [customers, customerInfo]);

  const customerBookings = matched?.bookings || [];

  const customerInvoices = useMemo(() => {
    const name = customerInfo.name.toLowerCase();
    return invoices.filter((i) => (i as unknown as { customerName?: string }).customerName?.toLowerCase() === name);
  }, [invoices, customerInfo.name]);

  const customer: CustomerForPanel | null = matched
    ? {
        name: matched.name,
        phone: matched.phone,
        email: matched.email,
        address: matched.address,
        type: (customerBookings[0] as unknown as Record<string, string>)?.customerType || "Residential",
        status: customerBookings.some((b) => b.status === "completed") ? "Active" : "Lead",
        totalSpent: customerBookings
          .filter((b) => b.status === "completed")
          .reduce((sum, b) => sum + (b.selectedServices?.reduce((s, svc) => s + (svc.price || 0), 0) || 0), 0),
        jobCount: customerBookings.filter((b) => b.status === "completed").length,
        lastVisit: (() => {
          const completed = customerBookings.filter((b) => b.status === "completed");
          if (completed.length === 0) return "";
          const date = completed[0].confirmedDate || completed[0].preferredDate;
          if (!date) return "";
          return new Date(date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        })(),
        customerSince: (() => {
          const oldest = customerBookings[customerBookings.length - 1];
          if (!oldest?.createdAt?.toDate) return "";
          return oldest.createdAt.toDate().toLocaleDateString("en-US", { month: "short", year: "numeric" });
        })(),
        communicationPreferences: (customerBookings[0] as unknown as Record<string, unknown>)?.communicationPreferences as CustomerForPanel["communicationPreferences"],
        notes: (customerBookings[0] as unknown as Record<string, string>)?.notes,
      }
    : null;

  return (
    <CustomerProfilePanel
      customer={customer}
      bookings={customerBookings}
      invoices={customerInvoices}
      onClose={onClose}
    />
  );
}
