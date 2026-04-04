import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Phone } from "lucide-react";
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
      <section className="bg-[#0B2040]">
        <div className="max-w-[1100px] mx-auto px-4 lg:px-6 pt-10 pb-4 md:pt-14 md:pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-center">
            <div>
              <img
                src="https://res.cloudinary.com/dgcdcqjrz/image/upload/w_200,q_auto:good,f_auto/v1774315498/Coastal_Lube_logo_v1_zbx9qs.png"
                alt="Coastal Mobile Lube & Tire"
                className="max-w-[140px] h-auto object-contain mb-6"
                style={{ filter: "drop-shadow(0 0 12px rgba(255,255,255,0.15))" }}
              />
              <p className="text-[13px] uppercase font-bold text-[#6BA3E0] tracking-[1.5px] mb-3">
                OUR STORY
              </p>
              <h1 className="text-[30px] md:text-[42px] font-extrabold leading-[1.08] text-white tracking-[-1px] mb-5">
                Dealership expertise, delivered to your door
              </h1>
              <p className="text-[16px] leading-[1.65] text-white/70 max-w-[700px]">
                Based in Apollo Beach, Florida, Coastal Mobile Lube and Tire
                brings 30 years of automotive dealership experience directly to
                your driveway, your dock, or your parking lot. Personal
                vehicles, boats, work trucks, RVs, trailers, fleet vehicles. If
                it has an engine, we take care of it.
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
            OUR STORY
          </p>
          <h2 className="text-[28px] md:text-[34px] font-extrabold leading-[1.1] text-[#0B2040] tracking-[-0.5px] mb-8">
            Built on 30 years and a handshake
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-center">
            <div className="space-y-5">
              <p className="text-[15px] leading-[1.7] text-[#444]">
                I spent three decades in automotive dealership fixed operations.
                Managing service departments, leading teams of technicians,
                making sure every vehicle that rolled out met the standard. It
                was good work, and I learned something important along the way:
                people do not love taking their car to the shop. They do it
                because they have to.
              </p>
              <p className="text-[15px] leading-[1.7] text-[#444]">
                Coastal Mobile Lube and Tire started with a simple question.
                What if we brought the shop to you? Same quality, same
                professional service, same attention to detail. Just without the
                waiting room, the shuttle ride, and the lost afternoon.
              </p>
              <p className="text-[15px] leading-[1.7] text-[#444]">
                We are based right here in Apollo Beach, serving the South Shore
                communities where we live and work. Our business runs on
                integrity, honesty, hard work, and kindness. Those values come
                from our faith, and they show up in every interaction. Whether
                we are changing your oil in the driveway, servicing your boat at
                the dock, or maintaining a fleet of work trucks, you get the
                same white-glove care every single time.
              </p>
              <img
                src={cloudinaryUrl(images.vanWrapSide, { width: 800 })}
                alt="Coastal Mobile Lube & Tire wrapped service van"
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
            One team for everything you own
          </h2>
          <p className="text-[16px] leading-[1.65] text-white/70 max-w-[520px] mx-auto mb-10">
            Personal vehicles, boats, work trucks, RVs, trailers, fleet
            vehicles. If it has an engine, we service it.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
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
