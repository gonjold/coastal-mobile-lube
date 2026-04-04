import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Service Areas | Coastal Mobile Lube & Tire",
  description:
    "Mobile oil changes, tire service, and maintenance in Apollo Beach, Riverview, Ruskin, Sun City Center, and 12 South Shore communities. We come to you.",
};

const serviceAreas = [
  {
    name: "Apollo Beach",
    description:
      "Our home base. Apollo Beach residents get the fastest response times and most flexible scheduling. From Waterset to MiraBay, we know every neighborhood and driveway in town.",
  },
  {
    name: "Riverview",
    description:
      "One of the fastest-growing communities in Hillsborough County, and one of our busiest service areas. We handle oil changes, tire rotations, and brake work throughout Riverview, from Panther Trace to Alafia.",
  },
  {
    name: "Ruskin",
    description:
      "Just south of Apollo Beach along US-41, Ruskin is a short drive from our base. We service personal vehicles, work trucks, and boats at marinas along the Little Manatee River.",
  },
  {
    name: "Sun City Center",
    description:
      "Convenient mobile service for Sun City Center residents who prefer not to drive to a shop. We bring factory-grade oil changes, battery service, and tire rotations right to your door.",
  },
  {
    name: "Sun City",
    description:
      "Nestled between Ruskin and Wimauma, Sun City homeowners count on us for hassle-free vehicle maintenance. No appointment drop-offs, no waiting rooms. Just quality service in your driveway.",
  },
  {
    name: "Fish Hawk",
    description:
      "Fish Hawk families juggle busy schedules. Our mobile service means you can get an oil change or tire rotation while you handle everything else at home. We cover all of Fish Hawk Ranch and Starling.",
  },
  {
    name: "Gibsonton",
    description:
      "Located right along US-41, Gibsonton is a quick trip from our Apollo Beach base. We service cars, trucks, and commercial vehicles throughout the Gibsonton corridor.",
  },
  {
    name: "Palmetto",
    description:
      "Just across the Manatee River, Palmetto residents enjoy the same fast, professional mobile service. Oil changes, brake checks, and tire work done at your home or business.",
  },
  {
    name: "Ellenton",
    description:
      "Conveniently located near I-75 and the Ellenton outlets, this community is well within our service radius. We handle everything from routine oil changes to full brake jobs on-site.",
  },
  {
    name: "Parrish",
    description:
      "Parrish is growing fast with new communities popping up along the 301 corridor. We bring professional mobile maintenance to North River Ranch, Harrison Ranch, and surrounding neighborhoods.",
  },
  {
    name: "Balm",
    description:
      "Rural Balm and the surrounding agricultural areas east of US-301 are part of our regular service territory. We work on personal vehicles, farm trucks, and equipment right on your property.",
  },
  {
    name: "Wimauma",
    description:
      "South of Riverview along SR-674, Wimauma residents rely on us for dependable mobile service. No need to drive into town. We bring the shop to you, from oil changes to tire installs.",
  },
];

export default function ServiceAreasPage() {
  return (
    <>
      {/* Hero */}
      <section
        className="relative overflow-hidden"
        style={{
          background:
            "linear-gradient(180deg, #0A1C38 0%, #0B2040 40%, #0F2847 70%, #132E54 100%)",
        }}
      >
        {/* Atmospheric glow layers */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 20% 50%, rgba(26,95,172,0.12) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 60% at 80% 30%, rgba(224,123,45,0.06) 0%, transparent 60%)",
          }}
        />
        {/* Subtle grid texture */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        <div className="section-inner px-4 lg:px-6 pt-10 pb-6 md:pt-14 md:pb-10 relative z-10">
          <div className="max-w-[680px] mx-auto text-center">
            <div className="inline-flex items-center gap-2 text-[#D9A441] text-[12px] font-bold tracking-[2.5px] uppercase mb-4">
              <MapPin size={16} />
              South Shore Coverage
            </div>
            <h1 className="text-[30px] md:text-[42px] font-[800] leading-[1.08] text-white tracking-[-1px] mb-5">
              We Come to You
            </h1>
            <p className="text-[16px] leading-[1.7] text-white/60 max-w-[520px] mx-auto">
              Mobile oil changes, tire service, and vehicle maintenance across
              Apollo Beach and 12 South Shore communities. No shop visits, no
              waiting rooms.
            </p>
          </div>
        </div>

        {/* Bottom gradient fade */}
        <div
          className="absolute bottom-0 left-0 right-0 h-[60px] pointer-events-none"
          style={{
            background: "linear-gradient(to bottom, transparent, #0F2847)",
          }}
        />
      </section>

      {/* Navy-to-light transition */}
      <div
        style={{
          background:
            "linear-gradient(to bottom, #0F2847 0%, #1a3a5e 30%, #3a6a8e 60%, #FAFBFC 100%)",
          height: "60px",
        }}
      />

      {/* Service Area Cards - Group 1 */}
      <section
        className="relative"
        style={{
          background:
            "linear-gradient(180deg, #FAFBFC 0%, #FFFFFF 50%, #FAFBFC 100%)",
        }}
      >
        <div className="section-inner px-4 lg:px-6 py-10 md:py-14">
          <div className="max-w-[1100px] mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {serviceAreas.slice(0, 6).map((area) => (
                <ServiceAreaCard key={area.name} area={area} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Light-to-warm transition */}
      <div
        style={{
          background: "linear-gradient(to bottom, #FAFBFC, #F8F6F1)",
          height: "40px",
        }}
      />

      {/* Service Area Cards - Group 2 */}
      <section
        className="relative"
        style={{
          background:
            "linear-gradient(180deg, #F8F6F1 0%, #F4EEE3 50%, #F8F6F1 100%)",
        }}
      >
        <div className="section-inner px-4 lg:px-6 py-10 md:py-14">
          <div className="max-w-[1100px] mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {serviceAreas.slice(6, 12).map((area) => (
                <ServiceAreaCard key={area.name} area={area} warm />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Warm-to-dark transition */}
      <div
        style={{
          background:
            "linear-gradient(to bottom, #F8F6F1 0%, #0F2847 100%)",
          height: "80px",
        }}
      />

      {/* Bottom CTA */}
      <section
        className="relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #0B2040 0%, #0F2847 50%, #132E54 100%)",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 50% 100% at 50% 50%, rgba(224,123,45,0.05) 0%, transparent 70%)",
          }}
        />
        <div className="section-inner px-4 lg:px-6 py-12 md:py-16 text-center relative z-10">
          <h2 className="text-[28px] font-extrabold text-white mb-4">
            Ready to skip the shop?
          </h2>
          <p className="text-[15px] text-white/60 mb-8 max-w-[480px] mx-auto">
            Book your mobile service online in under two minutes, or call us at{" "}
            <a
              href="tel:8137225823"
              className="text-[#E07B2D] font-semibold hover:underline"
            >
              813-722-LUBE
            </a>
            .
          </p>
          <Link
            href="/book"
            className="inline-flex items-center gap-2 bg-[#E07B2D] hover:bg-[#CC6A1F] text-white font-bold px-8 py-3.5 rounded-lg transition-colors shadow-[0_4px_24px_rgba(224,123,45,0.35)]"
          >
            Book Service Now
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </>
  );
}

function ServiceAreaCard({
  area,
  warm,
}: {
  area: { name: string; description: string };
  warm?: boolean;
}) {
  return (
    <div
      className={`rounded-[14px] p-6 flex flex-col border shadow-[0_2px_20px_rgba(11,32,64,0.06)] hover:shadow-[0_4px_28px_rgba(11,32,64,0.1)] hover:translate-y-[-2px] transition-all duration-300 ${
        warm
          ? "bg-white border-[#ebe5d8]"
          : "bg-white border-[#f0ede6]"
      }`}
    >
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-9 h-9 rounded-full bg-[#0B2040]/[0.08] flex items-center justify-center flex-shrink-0">
          <MapPin size={18} className="text-[#E07B2D]" />
        </div>
        <h3
          className="text-lg font-bold text-[#0B2040]"
          style={{ letterSpacing: "-0.3px" }}
        >
          {area.name}
        </h3>
      </div>
      <p className="text-[14px] text-[#444] leading-[1.7] mb-5 flex-1">
        {area.description}
      </p>
      <Link
        href="/book"
        className="inline-flex items-center gap-1.5 text-[#E07B2D] font-semibold text-sm hover:text-[#CC6A1F] transition-colors"
      >
        Book Service in {area.name}
        <ArrowRight size={15} />
      </Link>
    </div>
  );
}
