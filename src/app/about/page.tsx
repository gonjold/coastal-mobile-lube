import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Phone, Check } from "lucide-react";
import Button from "@/components/Button";
import { cloudinaryUrl, images } from "@/lib/cloudinary";

export const metadata: Metadata = {
  title: "About Us | Coastal Mobile Lube & Tire | Apollo Beach, FL",
  description:
    "30 years of dealership fixed ops experience, now mobile in Apollo Beach and the South Shore. Meet the team behind Coastal Mobile Lube and Tire.",
};

const valueProps = [
  {
    number: "01",
    title: "White-Glove Service",
    description:
      "Every customer gets the same luxury experience you would expect at a top dealership. We show up on time, treat your property with respect, and leave the work area cleaner than we found it.",
  },
  {
    number: "02",
    title: "Integrity First",
    description:
      "We quote honestly, work transparently, and never upsell services you do not need. If it is not broken, we will tell you.",
  },
  {
    number: "03",
    title: "30 Years of Know-How",
    description:
      "Three decades managing dealership service departments means we have seen it all. That experience shows up in every oil change, every tire rotation, every marine service call.",
  },
  {
    number: "04",
    title: "Faith-Driven Values",
    description:
      "Honesty, hard work, kindness, and service to others. Those are not just words on a wall. They guide every decision we make and every customer interaction we have.",
  },
];

const verticals = [
  {
    title: "Automotive",
    description: "Cars, trucks, and SUVs serviced at your home or office.",
    href: "/services",
  },
  {
    title: "Fleet",
    description:
      "Scheduled maintenance programs for businesses with 5 vehicles or 500.",
    href: "/fleet",
  },
  {
    title: "Marine",
    description:
      "Dockside service for outboard, inboard, and diesel marine engines.",
    href: "/marine",
  },
  {
    title: "RV and Trailers",
    description:
      "Oil changes, tire service, and maintenance at your RV park or storage lot.",
    href: "/services",
  },
];

export default function AboutPage() {
  return (
    <>
      {/* Section 1 — Hero */}
      <section className="relative overflow-hidden" style={{ background: "linear-gradient(180deg, #0A1C38 0%, #0B2040 40%, #0F2847 70%, #132E54 100%)" }}>
        {/* Atmospheric glow layers */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 80% 50% at 20% 50%, rgba(26,95,172,0.12) 0%, transparent 70%)" }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 60% at 80% 30%, rgba(224,123,45,0.06) 0%, transparent 60%)" }} />
        {/* Subtle grid texture */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        {/* Oval badge watermark */}
        <img
          src={cloudinaryUrl(images.logo, { width: 500, quality: "auto" })}
          alt=""
          aria-hidden="true"
          className="absolute right-[5%] top-1/2 -translate-y-1/2 w-[350px] h-auto pointer-events-none select-none opacity-[0.04] hidden lg:block"
        />

        <div className="max-w-[1100px] mx-auto px-4 lg:px-6 pt-10 pb-8 md:pt-16 md:pb-12 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
            <div>
              <p className="text-[12px] uppercase font-bold text-[#D9A441] tracking-[2.5px] mb-4">
                Our Story
              </p>
              <h1 className="text-[32px] md:text-[46px] font-extrabold leading-[1.06] text-white tracking-[-1.5px] mb-5">
                Dealership expertise, delivered to your{" "}
                <span className="relative">
                  <span className="text-[#E07B2D]">door.</span>
                  <span className="absolute -bottom-1 left-0 right-0 h-[3px] rounded-full bg-[#E07B2D]/40" />
                </span>
              </h1>
              <p className="text-[16px] leading-[1.7] text-white/60 max-w-[440px] mb-6">
                Based in Apollo Beach, Florida, Coastal Mobile Lube and Tire
                brings 30 years of automotive dealership experience directly to
                your driveway, your dock, or your parking lot. Personal
                vehicles, boats, work trucks, RVs, trailers, fleet vehicles. If
                it has an engine, we take care of it.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 pt-4 border-t border-white/[0.08]">
                {["30 years experience", "Apollo Beach based", "Licensed & insured"].map((item) => (
                  <div key={item} className="flex items-center gap-2.5">
                    <div className="flex items-center justify-center shrink-0 w-[22px] h-[22px] rounded-full bg-[#0D8A8F]/20">
                      <Check size={12} className="text-[#0D8A8F]" />
                    </div>
                    <span className="text-sm text-white/45 font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative rounded-[14px] overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.3)]">
              <img
                src={cloudinaryUrl(images.heroVanDrivewayAlt, {
                  width: 800,
                })}
                alt="Coastal Mobile Lube service van in a driveway"
                className="w-full h-auto"
              />
              <div className="absolute inset-0 rounded-[14px] pointer-events-none" style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)" }} />
            </div>
          </div>
        </div>

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-[80px] pointer-events-none" style={{ background: "linear-gradient(to bottom, transparent, #132E54)" }} />
      </section>

      {/* Navy-to-light transition */}
      <div style={{ background: "linear-gradient(to bottom, #132E54 0%, #1a3a5e 30%, #3a6a8e 60%, #FAFBFC 100%)", height: "60px" }} />

      {/* Section 2 — Van Wrap Showcase */}
      <section className="relative" style={{ background: "linear-gradient(180deg, #FAFBFC 0%, #FFFFFF 50%, #FAFBFC 100%)" }}>
        <div className="max-w-[1100px] mx-auto px-4 lg:px-6 pt-10 pb-4 md:pt-14 md:pb-6">
          <div className="text-center mb-8">
            <p className="text-[13px] uppercase font-bold text-[#1A5FAC] tracking-[1.5px] mb-3">
              Our Rig
            </p>
            <h2 className="text-[28px] md:text-[34px] font-extrabold leading-[1.1] text-[#0B2040] tracking-[-0.5px]">
              The shop on wheels
            </h2>
          </div>
          <div className="relative rounded-[14px] overflow-hidden shadow-[0_8px_40px_rgba(11,32,64,0.12),0_2px_10px_rgba(11,32,64,0.06)] border border-[#f0ede6] bg-white p-4 md:p-6">
            <img
              src={cloudinaryUrl(images.vanWrapSide, { width: 1200 })}
              alt="Coastal Mobile Lube & Tire wrapped service van"
              className="w-full h-auto rounded-[10px]"
            />
          </div>
        </div>
      </section>

      {/* Section 3 — The Story */}
      <section className="relative" style={{ background: "linear-gradient(180deg, #FAFBFC 0%, #F8F6F1 100%)" }}>
        <div className="max-w-[1100px] mx-auto px-4 lg:px-6 py-10 md:py-14">
          <p className="text-[13px] uppercase font-bold text-[#1A5FAC] tracking-[1.5px] mb-3">
            Our Story
          </p>
          <h2 className="text-[28px] md:text-[34px] font-extrabold leading-[1.1] text-[#0B2040] tracking-[-0.5px] mb-8">
            Built on 30 years and a handshake
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
            <div className="space-y-5">
              <p className="text-[15px] leading-[1.7] text-[#444]">
                I spent 30 years in automotive dealership fixed operations.
                Running service departments, managing teams, and making sure
                every vehicle that left the bay met a factory standard. It was a
                good career, and I am proud of the work we did. But over time, I
                kept coming back to the same thought. People deserve better than
                sitting in a waiting room all afternoon. They deserve to have
                someone they trust show up and take care of things right where
                they are. That is why I left the dealership world and started
                Coastal Mobile Lube and Tire.
              </p>
              <p className="text-[15px] leading-[1.7] text-[#444]">
                We bring factory-level service directly to you in Apollo Beach
                and across the South Shore. Cars, trucks, boats, RVs, trailers,
                fleet vehicles. If it has an engine, we take care of it. One
                thing that sets us apart is vacuum oil extraction. We pull the
                oil through the dipstick tube instead of removing the drain
                plug, which means no mess under your vehicle and no risk of a
                stripped or cross-threaded plug. It is the same technology
                high-end dealerships use, and now you can get it in your own
                driveway.
              </p>
              <p className="text-[15px] leading-[1.7] text-[#444]">
                Everything we do is built on faith-based values. Integrity,
                honesty, hard work, kindness, and service to others. Those are
                not just words on our van. They guide how we treat every
                customer and every job, big or small. When you call Coastal, you
                get white-glove care and a handshake you can count on.
              </p>
            </div>
            <div className="relative rounded-[14px] overflow-hidden shadow-[0_8px_36px_rgba(11,32,64,0.12),0_2px_8px_rgba(11,32,64,0.06)]">
              <img
                src={cloudinaryUrl(images.vanInteriorEquipment, {
                  width: 800,
                })}
                alt="Interior of the Coastal Mobile service van with professional equipment"
                className="w-full h-auto"
              />
              <div
                className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-5 py-4"
                style={{
                  background: "linear-gradient(to right, rgba(255,255,255,0.92), rgba(255,255,255,0.88))",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                }}
              >
                <span className="text-[14px] font-semibold text-[#0B2040]">
                  Fully equipped mobile shop
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Story-to-ValueProps transition */}
      <div style={{ background: "linear-gradient(to bottom, #F8F6F1, #FFFFFF)", height: "40px" }} />

      {/* Section 4 — Value Props */}
      <section className="relative" style={{ background: "linear-gradient(180deg, #FFFFFF 0%, #FAFBFC 100%)" }}>
        <div className="max-w-[1100px] mx-auto px-4 lg:px-6 py-10 md:py-14">
          <div className="text-center mb-10">
            <p className="text-[13px] uppercase font-bold text-[#1A5FAC] tracking-[1.5px] mb-3">
              Why Coastal
            </p>
            <h2 className="text-[28px] md:text-[34px] font-extrabold leading-[1.1] text-[#0B2040] tracking-[-0.5px]">
              What sets us apart
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {valueProps.map((prop) => (
              <div
                key={prop.number}
                className="bg-white rounded-[14px] p-7 shadow-[0_2px_20px_rgba(11,32,64,0.06)] border border-[#f0ede6] hover:shadow-[0_4px_28px_rgba(11,32,64,0.1)] hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="inline-flex items-center justify-center w-[36px] h-[36px] text-[13px] font-bold text-white bg-[#E07B2D] rounded-[10px] shadow-[0_2px_8px_rgba(224,123,45,0.3)]">
                    {prop.number}
                  </span>
                  <h3 className="text-[18px] font-bold text-[#0B2040]">
                    {prop.title}
                  </h3>
                </div>
                <p className="text-[15px] leading-[1.65] text-[#555]">
                  {prop.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ValueProps-to-Verticals transition */}
      <div style={{ background: "linear-gradient(to bottom, #FAFBFC 0%, #0F2847 100%)", height: "80px" }} />

      {/* Section 5 — Three Verticals */}
      <section className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0B2040 0%, #0F2847 50%, #132E54 100%)" }}>
        {/* Subtle glow */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 50% 100% at 50% 50%, rgba(224,123,45,0.06) 0%, transparent 70%)" }} />

        <div className="max-w-[1100px] mx-auto px-4 lg:px-6 py-12 md:py-16 text-center relative z-10">
          <p className="text-[12px] uppercase font-bold text-[#D9A441] tracking-[2.5px] mb-4">
            Full Service
          </p>
          <h2 className="text-[28px] md:text-[34px] font-extrabold text-white mb-3">
            One team for everything you own
          </h2>
          <p className="text-[16px] leading-[1.65] text-white/50 max-w-[520px] mx-auto mb-10">
            Personal vehicles, boats, work trucks, RVs, trailers, fleet
            vehicles. If it has an engine, we service it.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
            {verticals.map((vertical) => (
              <div
                key={vertical.title}
                className="rounded-[14px] p-6 text-left hover:-translate-y-0.5 transition-all duration-200"
                style={{
                  background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                }}
              >
                <h3 className="text-[18px] font-bold text-white mb-2">
                  {vertical.title}
                </h3>
                <p className="text-[14px] leading-[1.65] text-white/50 mb-4">
                  {vertical.description}
                </p>
                <Link
                  href={vertical.href}
                  className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#E07B2D] hover:text-[#CC6A1F] transition-colors"
                >
                  Learn more
                  <ArrowRight size={15} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Verticals-to-CTA transition */}
      <div style={{ background: "linear-gradient(to bottom, #132E54 0%, #1a3a5e 30%, #3a6a8e 60%, #FAFBFC 100%)", height: "60px" }} />

      {/* Section 6 — CTA */}
      <section className="relative" style={{ background: "linear-gradient(180deg, #FAFBFC 0%, #F8F6F1 100%)" }}>
        <div className="max-w-[1100px] mx-auto px-4 lg:px-6 py-14 md:py-16 text-center">
          <h2 className="text-[28px] md:text-[36px] font-extrabold leading-[1.1] text-[#0B2040] tracking-[-0.5px] mb-4">
            Ready to skip the shop?
          </h2>
          <p className="text-[16px] leading-[1.65] text-[#555] max-w-[480px] mx-auto mb-8">
            Book your first service online or call us. Most appointments
            available within the week.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button href="/book" variant="primary" size="lg" className="shadow-[0_4px_24px_rgba(224,123,45,0.35)]">
              Book Service
            </Button>
            <Button href="tel:8137225823" variant="secondary" size="lg">
              <Phone size={16} className="mr-2" />
              Call 813-722-LUBE
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
