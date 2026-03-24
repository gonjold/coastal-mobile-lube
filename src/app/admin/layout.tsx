import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Hide public site chrome when inside /admin */}
      <style
        dangerouslySetInnerHTML={{
          __html:
            "header, footer, #site-sticky-bar { display: none !important; } main { padding-bottom: 0 !important; }",
        }}
      />

      {/* Admin header */}
      <div className="flex items-center justify-between px-4 lg:px-8 py-4 border-b border-[#eee] bg-white">
        <span className="text-[16px] font-bold text-[#0B2040]">
          Coastal Mobile Admin
        </span>
        <Link
          href="/"
          className="text-[14px] font-semibold text-[#1A5FAC] hover:underline"
        >
          Back to site &rarr;
        </Link>
      </div>

      {children}
    </>
  );
}
