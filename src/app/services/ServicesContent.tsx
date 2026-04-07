"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Phone, ArrowRight } from "lucide-react";
import Button from "@/components/Button";
import { useBooking } from "@/contexts/BookingContext";
import { cloudinaryUrl, images } from "@/lib/cloudinary";
import { useServices, type Service } from "@/hooks/useServices";
import { groupByCategory } from "@/lib/serviceHelpers";

/* ─── Category → image mapping ─── */
function getCategoryImage(category: string): string | null {
  const lower = category.toLowerCase();
  if (lower.includes("oil")) return cloudinaryUrl(images.oilChangeService, { width: 800, height: 600 });
  if (lower.includes("tire")) return cloudinaryUrl(images.tireService, { width: 800, height: 600 });
  if (lower.includes("brake")) return cloudinaryUrl(images.drivewayServiceAlt, { width: 800, height: 600 });
  if (lower.includes("battery")) return cloudinaryUrl(images.oilChangeServiceAlt, { width: 800, height: 600 });
  if (lower.includes("fluid")) return cloudinaryUrl(images.vanInteriorEquipment, { width: 800, height: 600 });
  if (lower.includes("filter") || lower.includes("air")) return cloudinaryUrl(images.drivewayService, { width: 800, height: 600 });
  if (lower.includes("wiper")) return cloudinaryUrl(images.commercialService, { width: 800, height: 600 });
  return null;
}

/* ─── Reusable: 2-col service grid ─── */
function ServiceGrid({ items, onItemClick }: { items: { name: string; price: string }[]; onItemClick?: (item: { name: string; price: string }) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {items.map((item) => (
        <button
          type="button"
          key={item.name}
          onClick={() => onItemClick?.(item)}
          className="flex items-center justify-between bg-white border border-[#f0ede6] rounded-[10px] px-5 py-4 shadow-[0_1px_6px_rgba(11,32,64,0.04)] cursor-pointer transition-all duration-200 hover:shadow-[0_4px_16px_rgba(224,123,45,0.12)] hover:border-[#E07B2D]/30 hover:-translate-y-[1px] text-left"
        >
          <span className="text-[15px] font-medium text-[#0B2040]">{item.name}</span>
          <span className="text-[15px] font-bold text-[#E07B2D] whitespace-nowrap ml-4">{item.price}</span>
        </button>
      ))}
    </div>
  );
}

/* ─── Category section wrapper ─── */
function CategorySection({
  id,
  title,
  startingAt,
  description,
  image,
  children,
  even,
}: {
  id: string;
  title: string;
  startingAt: string;
  description: string;
  image?: string | null;
  children: React.ReactNode;
  even: boolean;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-[120px]"
      style={{ background: even ? "#FFFFFF" : "#FAFBFC" }}
    >
      <div className="section-inner px-4 lg:px-6 py-10 md:py-14">
        <div className={`grid grid-cols-1 ${image ? "lg:grid-cols-[3fr_2fr]" : ""} gap-8`}>
          <div className={image ? "order-2 lg:order-1" : ""}>
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 mb-2">
              <h2 className="text-[26px] font-extrabold text-[#0B2040]">{title}</h2>
              <span className="text-[14px] font-semibold text-[#E07B2D]">starting at {startingAt}</span>
            </div>
            <p className="text-[15px] text-[#555] leading-[1.65] mb-8 max-w-[600px]">{description}</p>
            {children}
          </div>
          {image && (
            <div className="order-1 lg:order-2">
              <img
                src={image}
                alt={title}
                className="w-full object-cover aspect-[4/3] rounded-lg shadow-md lg:max-h-[300px]"
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ================================================================
   Main component
   ================================================================ */
export default function ServicesContent() {
  const { services, categories: firestoreCategories, loading } = useServices({ division: "auto", activeOnly: true });

  // Separate packages from regular services
  const packages = services.filter((s) => s.type === "package").sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const regularServices = services.filter((s) => s.type !== "package");

  const autoPriority = ["oil", "tire", "wheel", "brake", "basic maintenance", "hvac"];
  const grouped = groupByCategory(regularServices)
    .filter((g) => !/labor\s*rate/i.test(g.category))
    .filter((g) => !/coastal\s*packages?/i.test(g.category))
    .sort((a, b) => {
      const aIdx = autoPriority.findIndex((p) => a.category.toLowerCase().includes(p));
      const bIdx = autoPriority.findIndex((p) => b.category.toLowerCase().includes(p));
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      return 0;
    });

  // Derive category nav from Firestore data, with Coastal Packages first
  const PACKAGES_TAB_ID = "coastal-packages";
  const serviceCategories = grouped.map((g) => ({
    id: g.category.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    label: g.category,
    startingAt: `$${Math.min(...g.services.map((s) => s.price)).toFixed(2)}`,
  }));
  const categories = [
    ...(packages.length > 0 ? [{ id: PACKAGES_TAB_ID, label: "Coastal Packages", startingAt: `$${Math.min(...packages.map((p) => p.price)).toFixed(2)}` }] : []),
    ...serviceCategories,
  ];

  const { openBooking } = useBooking();
  const [activeCategory, setActiveCategory] = useState("");
  const pillBarRef = useRef<HTMLDivElement>(null);

  // Set initial active category when data loads
  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0].id);
    }
  }, [categories, activeCategory]);


  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin w-8 h-8 border-4 border-[#E07B2D] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (grouped.length === 0) {
    return (
      <div className="text-center py-32 text-[#888]">
        <p className="text-lg font-semibold">Services loading...</p>
        <p className="mt-2">Please check back shortly or call 813-722-LUBE.</p>
      </div>
    );
  }

  return (
    <>
      {/* ─── Hero ─── */}
      <section
        className="relative overflow-hidden"
        style={{
          background:
            "linear-gradient(180deg, #0A1C38 0%, #0B2040 40%, #0F2847 70%, #132E54 100%)",
        }}
      >

        <div className="section-inner px-4 lg:px-6 pt-10 pb-6 md:pt-14 md:pb-10 relative z-10">
          <p className="text-[12px] uppercase font-bold text-[#D9A441] tracking-[2.5px] mb-4">
            Automotive Services
          </p>
          <h1 className="text-[30px] md:text-[42px] font-extrabold leading-[1.08] text-white tracking-[-1px] mb-5">
            What we handle on-site
          </h1>
          <p className="text-[16px] leading-[1.65] text-white/60 mb-8 max-w-[520px]">
            Factory-trained technicians come to your driveway, parking lot, or
            job site with everything needed to get the job done right.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="primary"
              size="lg"
              className="shadow-[0_4px_24px_rgba(224,123,45,0.35)]"
              onClick={openBooking}
            >
              Book Service
            </Button>
            <a
              href="tel:8137225823"
              className="inline-flex items-center justify-center gap-2 px-[30px] py-[14px] font-semibold text-white bg-white/[0.06] border border-white/20 rounded-[var(--radius-button)] hover:bg-white/[0.12] hover:border-white/35 transition-all backdrop-blur-sm"
            >
              <Phone size={16} />
              Call 813-722-LUBE
            </a>
          </div>
        </div>

      </section>

      {/* ─── Sticky Category Pill Navigation ─── */}
      <div
        ref={pillBarRef}
        className="sticky top-[64px] z-30 bg-white border-b border-[#e8e4dc]/60 shadow-[0_2px_12px_rgba(11,32,64,0.06)]"
      >
        <div className="section-inner px-4 lg:px-6">
          <div className="flex gap-2 py-3 overflow-x-auto no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`whitespace-nowrap px-5 py-2 rounded-full text-[13px] font-semibold transition-all ${
                  activeCategory === cat.id
                    ? "bg-[#0B2040] text-white shadow-[0_2px_8px_rgba(11,32,64,0.2)]"
                    : "bg-[#FAFBFC] text-[#666] hover:bg-[#f0ede6] hover:text-[#0B2040]"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Coastal Packages tab content ── */}
      {activeCategory === PACKAGES_TAB_ID && packages.length > 0 && (
        <section className="relative bg-[#FAFBFC]">
          <div className="section-inner px-4 lg:px-6 py-10 md:py-14">
            <div className="mb-8">
              <h2 className="text-[26px] font-extrabold text-[#0B2040]">Coastal Packages</h2>
              <p className="text-[15px] text-[#555] mt-2 max-w-[600px]">Bundle and save on routine maintenance</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {packages.map((pkg) => {
                const isFeatured = pkg.featured === true;
                return (
                  <div
                    key={pkg.id}
                    className={`relative bg-white rounded-[14px] shadow-[0_2px_20px_rgba(11,32,64,0.06)] p-7 flex flex-col ${
                      isFeatured
                        ? "border-t-[3px] border-t-[#E07B2D] border border-[#E07B2D]/20"
                        : "border border-[#f0ede6]"
                    }`}
                  >
                    {isFeatured && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#E07B2D] text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                        Most Popular
                      </span>
                    )}
                    <h3 className="text-[20px] font-bold text-[#0B2040] mb-1">{pkg.displayName || pkg.name}</h3>
                    <p className="text-[14px] font-semibold text-[#E07B2D] mb-4">Starting at ${pkg.price.toFixed(2)}</p>
                    <ul className="flex-1 flex flex-col gap-2 mb-6">
                      {pkg.bundleItems.map((item: string) => (
                        <li key={item} className="flex items-start gap-2 text-[14px] text-[#444] leading-[1.5]">
                          <span className="inline-block shrink-0 w-1.5 h-1.5 rounded-full bg-[#E07B2D] mt-[7px]" />
                          {item}
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      onClick={() => openBooking({ division: "Automotive", serviceId: pkg.id })}
                      className="w-full py-3 rounded-[10px] bg-[#E07B2D] text-white font-bold text-[15px] hover:bg-[#cc6a1f] transition-colors shadow-[0_4px_16px_rgba(224,123,45,0.25)] cursor-pointer"
                    >
                      Book This Package
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Dynamic Service Sections (tab content swap) ── */}
      {grouped.filter((g) => g.category.toLowerCase().replace(/[^a-z0-9]+/g, "-") === activeCategory).map((group, idx) => {
        const catId = group.category.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        const startingAt = `$${Math.min(...group.services.map((s) => s.price)).toFixed(2)}`;
        const description = firestoreCategories.find(
          (c) => c.name === group.category
        )?.description || "";

        return (
          <CategorySection
            key={catId}
            id={catId}
            title={group.category}
            startingAt={startingAt}
            description={description}
            image={getCategoryImage(group.category)}
            even={idx % 2 === 0}
          >
            <ServiceGrid
              items={group.services.map((s) => ({
                name: s.displayName || s.name,
                price: s.priceLabel && s.priceLabel.startsWith("$")
                  ? s.priceLabel
                  : s.price > 0
                    ? `$${s.price.toFixed(2)}`
                    : "Call for price",
              }))}
              onItemClick={(item) => {
                const svc = group.services.find((s) => (s.displayName || s.name) === item.name);
                openBooking({
                  division: "Automotive",
                  categoryId: group.category,
                  serviceId: svc?.id,
                });
              }}
            />
          </CategorySection>
        );
      })}

      {/* ─── Bottom CTA ─── */}
      <section
        className="relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #0B2040 0%, #0F2847 50%, #132E54 100%)",
        }}
      >
        <div className="section-inner px-4 lg:px-6 py-12 md:py-16 text-center relative z-10">
          <h2 className="text-[28px] md:text-[34px] font-extrabold text-white mb-4">
            Ready to book?
          </h2>
          <p className="text-[15px] text-white/60 mb-8 max-w-[440px] mx-auto">
            Pick a time that works for you. We come to your location with
            everything we need.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="primary"
              size="lg"
              className="shadow-[0_4px_24px_rgba(224,123,45,0.35)]"
              onClick={openBooking}
            >
              Book Service
            </Button>
            <a
              href="tel:8137225823"
              className="inline-flex items-center justify-center gap-2 px-[30px] py-[14px] font-semibold text-white bg-white/[0.06] border border-white/20 rounded-[var(--radius-button)] hover:bg-white/[0.12] hover:border-white/35 transition-all backdrop-blur-sm"
            >
              <Phone size={16} />
              Call 813-722-LUBE
            </a>
          </div>
        </div>
      </section>

      {/* ─── Other Services Teaser ─── */}
      <section className="relative overflow-hidden bg-[#F7F8FA]">
        <div className="section-inner px-4 lg:px-6 py-10 md:py-14 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-[14px] p-7 hover:translate-y-[-2px] transition-all duration-300 bg-white border border-[#f0ede6] shadow-[0_2px_20px_rgba(11,32,64,0.06)]">
              <h3 className="text-[20px] font-bold text-[#0B2040] mb-2">
                Fleet & Commercial
              </h3>
              <p className="text-[14px] text-[#666] leading-[1.7] mb-4">
                From company cars to box trucks. Scheduled maintenance programs
                built around your fleet.
              </p>
              <Link
                href="/fleet"
                className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#E07B2D] hover:text-[#CC6A1F] transition-colors"
              >
                Learn about fleet services
                <ArrowRight size={15} />
              </Link>
            </div>
            <div className="rounded-[14px] p-7 hover:translate-y-[-2px] transition-all duration-300 bg-white border border-[#f0ede6] shadow-[0_2px_20px_rgba(11,32,64,0.06)]">
              <h3 className="text-[20px] font-bold text-[#0B2040] mb-2">
                Marine
              </h3>
              <p className="text-[14px] text-[#666] leading-[1.7] mb-4">
                Outboard and inboard engine service at the marina or boat ramp.
              </p>
              <Link
                href="/marine"
                className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#E07B2D] hover:text-[#CC6A1F] transition-colors"
              >
                Learn about marine services
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
