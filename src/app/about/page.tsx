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
                My name is Jason, and I have spent 30 years in automotive
                dealership fixed operations. I built my career leading service
                departments and fixed ops teams inside franchise dealerships.
                When I decided to step away from that world, the goal was
                simple: bring factory-level care directly to the people of
                Apollo Beach and the South Shore.
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

      </section>

      {/* Section 2 — Van Wrap Showcase */}
      <section className="relative bg-[#FAFBFC]">
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
      <section className="relative bg-[#FAFBFC]">
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
                For three decades, I managed service departments and fixed ops
                teams inside franchise dealerships. I loved the work, the
                precision, the problem-solving. But I kept coming back to the
                same thought: customers deserve this level of care without
                rearranging their whole day to get it. So I left the dealership
                world and built Coastal Mobile to bring the shop to your
                driveway, your dock, or your parking lot.
              </p>
              <p className="text-[15px] leading-[1.7] text-[#444]">
                We handle personal vehicles, boats, work trucks, RVs, trailers,
                fleet vehicles, and recreational equipment. If it has an engine
                and needs service, we are there. Our vacuum oil extraction
                system means no drain plug removal, no mess, and a faster job.
                It is the same technology used in high-end dealerships, and it
                is one of the things our customers notice right away.
              </p>
              <p className="text-[15px] leading-[1.7] text-[#444]">
                My faith guides everything about how I run this business.
                Integrity, honesty, hard work, kindness, and service to others.
                Those are not slogans on a website. They are how I was raised,
                and they are the standard every customer gets. Whether it is a
                quick oil change or a full fleet maintenance program, you will
                always get white-glove service and a straight answer. That is
                the Coastal Mobile promise, and I stand behind it.
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


      {/* Section 4 — Value Props */}
      <section className="relative bg-white">
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


      {/* Section 5 — Three Verticals */}
      <section className="relative overflow-hidden bg-[#F7F8FA]">
        <div className="max-w-[1100px] mx-auto px-4 lg:px-6 py-12 md:py-16 text-center relative z-10">
          <p className="text-[12px] uppercase font-bold text-[#1A5FAC] tracking-[2.5px] mb-4">
            Full Service
          </p>
          <h2 className="text-[28px] md:text-[34px] font-extrabold text-[#0B2040] mb-3">
            One team for everything you own
          </h2>
          <p className="text-[16px] leading-[1.65] text-[#666] max-w-[520px] mx-auto mb-10">
            Personal vehicles, boats, work trucks, RVs, trailers, fleet
            vehicles. If it has an engine, we service it.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
            {verticals.map((vertical) => (
              <div
                key={vertical.title}
                className="rounded-[14px] p-6 text-left hover:-translate-y-0.5 transition-all duration-200 bg-white border border-[#f0ede6] shadow-[0_2px_20px_rgba(11,32,64,0.06)]"
              >
                <h3 className="text-[18px] font-bold text-[#0B2040] mb-2">
                  {vertical.title}
                </h3>
                <p className="text-[14px] leading-[1.65] text-[#666] mb-4">
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


      {/* Section 6 — CTA */}
      <section className="relative bg-[#FAFBFC]">
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
