import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Phone } from "lucide-react";
import Button from "@/components/Button";
import { cloudinaryUrl, images } from "@/lib/cloudinary";

export const metadata: Metadata = {
  title: "About Us | Coastal Mobile Lube & Tire | Tampa",
  description:
    "Three decades of franchise dealership fixed operations experience, now mobile. Learn how Coastal Mobile Lube and Tire brings dealership-quality service to your driveway, parking lot, or marina.",
};

const valueProps = [
  {
    number: "01",
    title: "Dealership Standards, Mobile Convenience",
    description:
      "Every service follows factory maintenance protocols. Same parts, same procedures, same quality. Performed at your location instead of ours.",
  },
  {
    number: "02",
    title: "Certified Technicians Only",
    description:
      "Our team holds ASE certifications and factory training credentials. No apprentices, no shortcuts.",
  },
  {
    number: "03",
    title: "Transparent, Flat-Rate Pricing",
    description:
      "You see the price before we start. No diagnostic fees, no surprise charges, no upselling.",
  },
  {
    number: "04",
    title: "12-Month Service Warranty",
    description:
      "Every job is backed by a full 12-month warranty on parts and labor. If something is not right, we make it right.",
  },
];

const verticals = [
  {
    title: "Automotive",
    description: "Cars, trucks, and SUVs serviced at your home or office",
    href: "/services",
  },
  {
    title: "Fleet",
    description:
      "5 vehicles or 500. Scheduled programs built for your operation.",
    href: "/fleet",
  },
  {
    title: "Marine",
    description:
      "Dockside and boat ramp service for outboard and inboard engines",
    href: "/marine",
  },
];

export default function AboutPage() {
  return (
    <>
      {/* Section 1 — Hero */}
      <section className="bg-white">
        <div className="max-w-[1100px] mx-auto px-4 lg:px-6 pt-10 pb-4 md:pt-14 md:pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-center">
            <div>
              <p className="text-[13px] uppercase font-bold text-[#1A5FAC] tracking-[1.5px] mb-3">
                OUR STORY
              </p>
              <h1 className="text-[30px] md:text-[42px] font-extrabold leading-[1.08] text-[#0B2040] tracking-[-1px] mb-5">
                30 years of dealership expertise, on wheels
              </h1>
              <p className="text-[16px] leading-[1.65] text-[#444] max-w-[700px]">
                Coastal Mobile Lube and Tire was built on a simple idea:
                dealership-quality maintenance should not require a dealership
                visit. Our team brings three decades of franchise fixed
                operations leadership to your driveway, parking lot, or marina.
              </p>
            </div>
            <div>
              <img
                src={cloudinaryUrl(images.heroVanDrivewayAlt, {
                  width: 800,
                })}
                alt="Coastal Mobile Lube service van in a driveway"
                className="w-full h-auto rounded-[12px] shadow-[0_8px_30px_rgba(0,0,0,0.08)]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Section 2 — The Story */}
      <section className="bg-[#FAFBFC]">
        <div className="max-w-[1100px] mx-auto px-4 lg:px-6 py-10 md:py-14">
          <p className="text-[13px] uppercase font-bold text-[#1A5FAC] tracking-[1.5px] mb-3">
            THE DIFFERENCE
          </p>
          <h2 className="text-[28px] md:text-[34px] font-extrabold leading-[1.1] text-[#0B2040] tracking-[-0.5px] mb-8">
            Built by someone who ran the shop
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-center">
            <div className="space-y-5">
              <p className="text-[15px] leading-[1.7] text-[#444]">
                Most mobile mechanics are solo operators learning as they go.
                Coastal Mobile is different. Our founder spent 30 years inside
                franchise dealership service departments, managing teams of 20 or
                more technicians, overseeing thousands of vehicles a month, and
                building the kind of quality control systems that manufacturers
                require.
              </p>
              <p className="text-[15px] leading-[1.7] text-[#444]">
                That experience does not disappear when you leave the building.
                It goes with you. Every oil change, every tire installation,
                every marine service call follows the same standards, the same
                checklists, and the same accountability that a factory-certified
                service department demands.
              </p>
              <p className="text-[15px] leading-[1.7] text-[#444]">
                The only thing that changed is the location. Instead of you
                driving to us, we drive to you.
              </p>
              <img
                src="https://res.cloudinary.com/dgcdcqjrz/image/upload/w_800,q_auto:good,f_auto/v1774317068/Van_mockup_ln68oh.png"
                alt="Coastal Mobile Lube service van"
                className="w-full max-w-[500px] mx-auto rounded-[12px] mt-8 mb-8"
              />
            </div>
            <div>
              <img
                src={cloudinaryUrl(images.vanInteriorEquipment, {
                  width: 800,
                })}
                alt="Interior of the Coastal Mobile service van with professional equipment"
                className="w-full h-auto rounded-[12px] shadow-[0_8px_30px_rgba(0,0,0,0.08)]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Section 3 — Value Props */}
      <section className="bg-white">
        <div className="max-w-[1100px] mx-auto px-4 lg:px-6 py-10 md:py-14">
          <p className="text-[13px] uppercase font-bold text-[#1A5FAC] tracking-[1.5px] mb-3">
            WHY COASTAL
          </p>
          <h2 className="text-[28px] md:text-[34px] font-extrabold leading-[1.1] text-[#0B2040] tracking-[-0.5px] mb-8">
            What sets us apart
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {valueProps.map((prop) => (
              <div
                key={prop.number}
                className="bg-white border border-[#e8e8e8] rounded-[12px] p-7 border-l-[3px] border-l-[#E07B2D] pl-8"
              >
                <span className="inline-block text-[13px] font-bold text-[#E07B2D] bg-[#F0F4F8] rounded-[6px] px-2.5 py-1 mb-4">
                  {prop.number}
                </span>
                <h3 className="text-[18px] font-bold text-[#0B2040] mb-2">
                  {prop.title}
                </h3>
                <p className="text-[15px] leading-[1.65] text-[#444]">
                  {prop.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 4 — Three Verticals */}
      <section className="bg-[#0B2040]">
        <div className="max-w-[1100px] mx-auto px-4 lg:px-6 py-10 md:py-14 text-center">
          <h2 className="text-[28px] font-extrabold text-white mb-3">
            Three verticals, one team
          </h2>
          <p className="text-[16px] leading-[1.65] text-white/70 max-w-[520px] mx-auto mb-10">
            Automotive, fleet, and marine. One provider for everything that
            rolls or floats.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {verticals.map((vertical) => (
              <div
                key={vertical.title}
                className="border border-white/15 rounded-[12px] p-6 text-left"
              >
                <h3 className="text-[18px] font-bold text-white mb-2">
                  {vertical.title}
                </h3>
                <p className="text-[15px] leading-[1.65] text-white/70 mb-4">
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

      {/* Section 5 — CTA */}
      <section className="bg-[#FAFBFC]">
        <div className="max-w-[1100px] mx-auto px-4 lg:px-6 py-12 text-center">
          <h2 className="text-[28px] md:text-[34px] font-extrabold leading-[1.1] text-[#0B2040] tracking-[-0.5px] mb-4">
            Ready to skip the shop?
          </h2>
          <p className="text-[16px] leading-[1.65] text-[#444] max-w-[480px] mx-auto mb-8">
            Book your first service online or call us. Most appointments
            available within the week.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button href="/book" variant="primary" size="lg">
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
