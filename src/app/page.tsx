import {
  Car,
  Truck,
  Anchor,
  Shield,
  Wrench,
  Clock,
  DollarSign,
  ChevronRight,
} from "lucide-react";
import Button from "@/components/Button";
import WaveDivider from "@/components/WaveDivider";
import { cloudinaryUrl, images } from "@/lib/cloudinary";
import Link from "next/link";

const serviceCards = [
  {
    icon: Car,
    title: "Automotive",
    description:
      "Oil changes, tire services, and routine maintenance at your home or office.",
    href: "/services",
  },
  {
    icon: Truck,
    title: "Fleet & Commercial",
    description:
      "From company sedans to heavy-duty box trucks. Scheduled maintenance that keeps your fleet moving.",
    href: "/fleet",
  },
  {
    icon: Anchor,
    title: "Marine",
    description:
      "Dockside and boat ramp service for outboard and inboard engines across Tampa.",
    href: "/marine",
  },
];

const steps = [
  {
    num: "1",
    title: "Book Online or Call",
    description: "Pick your service and choose a time that works for you.",
  },
  {
    num: "2",
    title: "We Come to You",
    description:
      "Our fully equipped van arrives at your location, ready to work.",
  },
  {
    num: "3",
    title: "Drive Away Done",
    description:
      "No waiting rooms, no drop-offs. Get back to your day.",
  },
];

const trustPoints = [
  {
    icon: Shield,
    title: "30 Years of Fixed Ops Expertise",
    description:
      "Our team comes from franchise dealership leadership. We know what factory-trained service looks like.",
  },
  {
    icon: Wrench,
    title: "Vacuum Oil Extraction",
    description:
      "No drain plug removal, no mess. Our extraction system is cleaner, faster, and safer for your engine.",
  },
  {
    icon: Clock,
    title: "Your Schedule, Your Location",
    description:
      "Driveways, office lots, marinas, fleet yards. We work where you are.",
  },
  {
    icon: DollarSign,
    title: "Transparent Pricing",
    description:
      "No surprise fees, no shop markup. You see the price before we start.",
  },
];

export default function Home() {
  const heroImage = cloudinaryUrl(images.heroVanDriveway, {
    width: 1920,
    height: 800,
  });

  return (
    <>
      {/* ── Hero Section ── */}
      <section
        className="relative flex items-center justify-center min-h-[400px] md:min-h-[500px]"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundColor: "#0B2040",
        }}
      >
        <div className="absolute inset-0 bg-navy/70" />
        <div className="relative z-10 text-center text-white px-6 py-16 md:py-24 max-w-[800px] mx-auto">
          <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-5 leading-[1.15]">
            Tampa&apos;s Trusted Mobile Lube, Tire, and Marine Service
          </h1>
          <p className="text-lg md:text-xl text-white/90 mb-8 leading-relaxed">
            We bring the shop to your driveway, parking lot, or marina. 30 years
            of dealership expertise, none of the hassle.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button href="/book" variant="primary" size="lg">
              Book Your Service
            </Button>
            <a
              href="tel:8137225823"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold border-2 border-white text-white rounded-[var(--radius-button)] hover:bg-white hover:text-navy transition-all"
            >
              Call 813-722-LUBE
            </a>
          </div>
        </div>
      </section>

      <WaveDivider color="#F4EEE3" />

      {/* ── Service Cards Section ── */}
      <section className="bg-sand">
        <div className="section">
          <div className="section-inner">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold mb-3">
                What We Do
              </h2>
              <div className="w-12 h-0.5 bg-teal mx-auto" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {serviceCards.map((card) => (
                <Link
                  key={card.title}
                  href={card.href}
                  className="bg-white rounded-[var(--radius-card)] p-6 shadow-sm hover:shadow-lg transition-shadow flex flex-col group"
                >
                  <div className="w-12 h-12 rounded-full bg-teal-soft flex items-center justify-center mb-4">
                    <card.icon size={24} className="text-teal" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{card.title}</h3>
                  <p className="text-text-mid text-sm leading-relaxed mb-4 flex-1">
                    {card.description}
                  </p>
                  <span className="inline-flex items-center text-blue text-sm font-medium group-hover:gap-2 gap-1 transition-all">
                    Learn More <ChevronRight size={16} />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <WaveDivider color="#FFFFFF" />

      {/* ── How It Works Section ── */}
      <section className="bg-white">
        <div className="section">
          <div className="section-inner">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
              How It Works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4 relative">
              {/* Connector line (desktop only) */}
              <div className="hidden md:block absolute top-6 left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] border-t-2 border-dashed border-teal/30" />

              {steps.map((step) => (
                <div
                  key={step.num}
                  className="flex flex-col items-center text-center relative"
                >
                  <div className="w-12 h-12 rounded-full bg-teal text-white flex items-center justify-center text-lg font-bold mb-4 relative z-10">
                    {step.num}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                  <p className="text-text-mid text-sm leading-relaxed max-w-[280px]">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <WaveDivider color="#FFFDF8" />

      {/* ── Why Coastal Mobile Section ── */}
      <section className="bg-cream">
        <div className="section">
          <div className="section-inner">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">
              Why Coastal Mobile
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {trustPoints.map((point) => (
                <div key={point.title} className="flex gap-4">
                  <div className="w-11 h-11 rounded-full bg-teal-soft flex items-center justify-center shrink-0">
                    <point.icon size={22} className="text-teal" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold mb-1">
                      {point.title}
                    </h3>
                    <p className="text-text-mid text-sm leading-relaxed">
                      {point.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <WaveDivider color="#0B2040" />

      {/* ── CTA Banner Section ── */}
      <section className="bg-navy">
        <div className="py-16 md:py-20 px-6 text-center">
          <div className="max-w-[600px] mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Ready to skip the shop?
            </h2>
            <p className="text-white/80 text-lg mb-8">
              Book your mobile service today and get back to what matters.
            </p>
            <Button href="/book" variant="primary" size="lg">
              Book Now
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
