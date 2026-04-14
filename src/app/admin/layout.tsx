"use client";

import { usePathname } from "next/navigation";
import AdminAuthGuard from "@/components/AdminAuthGuard";
import AdminSidebar from "@/components/admin/AdminSidebar";
import {
  AdminModalProvider,
  useAdminModal,
} from "@/contexts/AdminModalContext";
import NewBookingModal from "@/components/admin/NewBookingModal";
import NewCustomerModal from "@/components/admin/NewCustomerModal";

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
    </>
  );
}
