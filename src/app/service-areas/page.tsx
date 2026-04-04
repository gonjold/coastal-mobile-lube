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
        className="relative py-20 md:py-28 px-6 text-center overflow-hidden"
        style={{
          background:
            "linear-gradient(180deg, #0B2040 0%, #0F2847 60%, #132E54 100%)",
        }}
      >
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 30%, rgba(224,123,45,0.1) 0%, transparent 40%)",
          }}
        />
        <div className="relative max-w-[680px] mx-auto">
          <div className="inline-flex items-center gap-2 text-[#E07B2D] text-sm font-semibold tracking-wide uppercase mb-4">
            <MapPin size={16} />
            South Shore Coverage
          </div>
          <h1
            className="text-4xl md:text-5xl font-extrabold text-white mb-5"
            style={{ letterSpacing: "-0.5px", lineHeight: 1.15 }}
          >
            We Come to You
          </h1>
          <p className="text-[#CBD5E1] text-lg leading-relaxed max-w-[520px] mx-auto">
            Mobile oil changes, tire service, and vehicle maintenance across
            Apollo Beach and 12 South Shore communities. No shop visits, no
            waiting rooms.
          </p>
        </div>
      </section>

      {/* Service Area Cards */}
      <section className="bg-white py-16 md:py-20 px-6">
        <div className="max-w-[1100px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {serviceAreas.slice(0, 6).map((area) => (
              <ServiceAreaCard key={area.name} area={area} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#F4EEE3] py-16 md:py-20 px-6">
        <div className="max-w-[1100px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {serviceAreas.slice(6, 12).map((area) => (
              <ServiceAreaCard key={area.name} area={area} />
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-white py-16 md:py-20 px-6">
        <div className="max-w-[680px] mx-auto text-center">
          <h2
            className="text-2xl md:text-3xl font-bold text-[#0B2040] mb-4"
            style={{ letterSpacing: "-0.3px" }}
          >
            Ready to skip the shop?
          </h2>
          <p className="text-[#64748B] mb-8 leading-relaxed">
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
            className="inline-flex items-center gap-2 bg-[#E07B2D] hover:bg-[#CC6A1F] text-white font-bold px-8 py-3.5 rounded-lg transition-colors"
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
}: {
  area: { name: string; description: string };
}) {
  return (
    <div
      className="bg-white rounded-[14px] p-6 flex flex-col shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.1)] transition-shadow"
    >
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-9 h-9 rounded-full bg-[#E1F4F3] flex items-center justify-center flex-shrink-0">
          <MapPin size={18} className="text-[#0D8A8F]" />
        </div>
        <h3
          className="text-lg font-bold text-[#0B2040]"
          style={{ letterSpacing: "-0.3px" }}
        >
          {area.name}
        </h3>
      </div>
      <p className="text-[#64748B] text-sm leading-relaxed mb-5 flex-1">
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
