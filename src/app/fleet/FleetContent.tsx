"use client";

import { useState } from "react";
import Link from "next/link";
import { Phone, ChevronDown, ArrowRight } from "lucide-react";
import Button from "@/components/Button";

const vehicleTypes = [
  {
    title: "Company Cars & Sedans",
    description:
      "Employee vehicles, sales rep cars, executive fleet. Oil changes, tire rotations, brake checks, and routine maintenance on a schedule that works for your team.",
  },
  {
    title: "Vans & SUVs",
    description:
      "Service vans, delivery vehicles, passenger shuttles. We handle fleets of any mix with consistent service quality and reporting.",
  },
  {
    title: "Box Trucks & Heavy-Duty",
    description:
      "Straight trucks, flatbeds, utility vehicles, and commercial equipment. DOT-ready inspections and maintenance programs built for uptime.",
  },
];

const processSteps = [
  {
    num: "1",
    title: "Consultation",
    desc: "We learn your fleet size, vehicle mix, and maintenance needs. No commitment.",
    bg: "#0B2040",
  },
  {
    num: "2",
    title: "Custom plan",
    desc: "We build a maintenance schedule and pricing structure that fits your budget and your vehicles.",
    bg: "#0B2040",
  },
  {
    num: "3",
    title: "Scheduled visits",
    desc: "Our van shows up on schedule at your location. Your team keeps working.",
    bg: "#0B2040",
  },
  {
    num: "4",
    title: "Reporting",
    desc: "You get service records, maintenance history, and upcoming service alerts for every vehicle.",
    bg: "#E07B2D",
  },
];

const valueProps = [
  {
    title: "Zero downtime",
    desc: "Your vehicles stay in service. We work around your schedule, not the other way around.",
  },
  {
    title: "One point of contact",
    desc: "No chasing multiple shops or service writers. One call, one team, one invoice.",
  },
  {
    title: "Volume pricing",
    desc: "Multi-vehicle discounts that scale with your fleet size. The more vehicles, the better your rate.",
  },
  {
    title: "Service records",
    desc: "Digital maintenance history for every vehicle. Know exactly what was done and when.",
  },
  {
    title: "Flexible scheduling",
    desc: "Weekly, bi-weekly, monthly, or on-demand. We match your cadence.",
  },
  {
    title: "All vehicle types",
    desc: "Sedans to box trucks. Gas, diesel, hybrid. One provider covers your entire fleet.",
  },
];

const fleetServices = [
  { name: "Synthetic Oil Changes", note: "scheduled by mileage or interval" },
  {
    name: "Tire Rotation & Balance",
    note: "extend tire life across your fleet",
  },
  {
    name: "Tire Sales & Installation",
    note: "we source and install on-site",
  },
  {
    name: "Brake Inspection & Service",
    note: "catch problems before they cost you",
  },
  {
    name: "Battery Testing & Replacement",
    note: "no surprise dead batteries",
  },
  {
    name: "Fluid Service & Top-Off",
    note: "coolant, brake, transmission, power steering",
  },
  { name: "Filter Replacement", note: "engine air and cabin filters" },
  {
    name: "DOT Inspections",
    note: "keep your commercial vehicles compliant",
  },
  {
    name: "Wiper Blades & Lights",
    note: "small items that add up across a fleet",
  },
  {
    name: "Emergency Mobile Service",
    note: "breakdowns happen, we respond fast",
  },
];

const faqItems = [
  {
    q: "What size fleet do you work with?",
    a: "We work with fleets from 3 vehicles to 50+. Whether you have a handful of company cars or a full commercial operation, we build a program that fits.",
  },
  {
    q: "How does fleet pricing work?",
    a: "We offer volume discounts based on fleet size and service frequency. The more vehicles and the more regular the schedule, the better your per-vehicle rate. Contact us for a custom quote.",
  },
  {
    q: "Can you handle box trucks and heavy-duty vehicles?",
    a: "Yes. We service light-duty company cars through heavy-duty box trucks, flatbeds, and utility vehicles. If it has an engine and tires, we likely cover it.",
  },
  {
    q: "Do you provide service records for each vehicle?",
    a: "Yes. Every service is documented with the vehicle, date, mileage, services performed, and any notes. You get digital records you can pull up anytime.",
  },
  {
    q: "What if a vehicle breaks down outside the maintenance schedule?",
    a: "Call us. We offer emergency mobile service for fleet customers. We will get to your vehicle as quickly as possible to minimize downtime.",
  },
  {
    q: "Do you service diesel vehicles?",
    a: "Yes. We handle both gas and diesel vehicles including diesel oil changes with the appropriate filters and oil specifications.",
  },
];

export default function FleetContent() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      {/* Section 1: Hero */}
      <section className="bg-white">
        <div className="max-w-[1100px] mx-auto px-4 lg:px-6 pt-10 pb-4 md:pt-14 md:pb-8">
          <div>
            <p className="text-[13px] uppercase font-bold text-[#1A5FAC] tracking-[1.5px] mb-3">
              Fleet & Commercial
            </p>
            <h1 className="text-[30px] md:text-[42px] font-[800] leading-[1.08] text-[#0B2040] tracking-[-1px] mb-5">
              Keep your fleet on the road
            </h1>
            <p className="text-[16px] leading-[1.7] text-[#444] max-w-[480px] mb-8">
              Scheduled mobile maintenance for company vehicles, box trucks,
              vans, and commercial fleets. We come to your yard, your lot, or
              your job site. No vehicle downtime, no shop visits.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button href="/contact" variant="primary" size="lg">
                Get Fleet Quote
              </Button>
              <a
                href="tel:8137225823"
                className="inline-flex items-center justify-center gap-2 px-[30px] py-[14px] font-semibold text-[#0B2040] bg-white border-2 border-[#ddd] rounded-[var(--radius-button)] hover:border-[#bbb] transition-all"
              >
                <Phone size={16} />
                Call 813-722-LUBE
              </a>
            </div>
          </div>
          <img
            src="https://res.cloudinary.com/dgcdcqjrz/image/upload/w_1600,h_450,c_fill,q_auto:good,f_auto/v1774318456/commercial-service_wbgfog.jpg"
            alt="Commercial fleet mobile service"
            className="w-full rounded-[12px] max-h-[400px] object-cover mt-10"
          />
        </div>
      </section>

      {/* Section 2: What We Cover */}
      <section className="bg-[#FAFBFC]">
        <div className="section-inner px-4 lg:px-6 py-10 md:py-14">
          <p className="text-[13px] uppercase font-bold text-[#1A5FAC] tracking-[1.5px] mb-3">
            Vehicle Types
          </p>
          <h2 className="text-[28px] font-extrabold text-[#0B2040] mb-8">
            Light-duty to heavy-duty
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {vehicleTypes.map((type) => (
              <div
                key={type.title}
                className="bg-white border border-[#e8e8e8] rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 border-t-[3px] border-t-[#0B2040]"
              >
                <h3 className="text-[18px] font-bold text-[#0B2040] mb-2">
                  {type.title}
                </h3>
                <p className="text-[14px] text-[#444] leading-[1.7]">
                  {type.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3: How Fleet Service Works */}
      <section className="bg-white">
        <div className="section-inner px-4 lg:px-6 py-10 md:py-14">
          <div className="text-center mb-12">
            <p className="text-[13px] uppercase font-bold text-[#1A5FAC] tracking-[1.5px] mb-3">
              The Process
            </p>
            <h2 className="text-[28px] font-extrabold text-[#0B2040]">
              Built around your operation
            </h2>
          </div>
          <div className="relative">
            <div
              className="hidden md:block absolute top-[30px] h-[2px] bg-[#eee]"
              style={{
                left: "calc(12.5% + 30px)",
                right: "calc(12.5% + 30px)",
              }}
            />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-6">
              {processSteps.map((step) => (
                <div
                  key={step.num}
                  className="flex flex-col items-center text-center relative z-10"
                >
                  <div
                    className="flex items-center justify-center w-[60px] h-[60px] rounded-[14px] text-white text-xl font-bold mb-5"
                    style={{ background: step.bg }}
                  >
                    {step.num}
                  </div>
                  <h3 className="text-[18px] font-bold text-[#0B2040] mb-2">
                    {step.title}
                  </h3>
                  <p className="text-[14px] leading-[1.7] text-[#444] max-w-[280px]">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Why Fleets Choose Us */}
      <section className="bg-[#0B2040]">
        <div className="section-inner px-4 lg:px-6 py-10 md:py-14">
          <h2 className="text-[28px] font-extrabold text-white mb-8">
            Why fleet managers choose Coastal Mobile
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {valueProps.map((prop) => (
              <div
                key={prop.title}
                className="border-l-[3px] border-l-[#E07B2D] pl-4"
              >
                <h3 className="text-[16px] font-bold text-white mb-1">
                  {prop.title}
                </h3>
                <p className="text-[14px] text-white/70 leading-[1.7]">
                  {prop.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 5: Fleet Services List */}
      <section className="bg-[#FAFBFC]">
        <div className="section-inner px-4 lg:px-6 py-10 md:py-14">
          <p className="text-[13px] uppercase font-bold text-[#1A5FAC] tracking-[1.5px] mb-3">
            Services
          </p>
          <h2 className="text-[28px] font-extrabold text-[#0B2040] mb-8">
            What we handle for fleets
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {fleetServices.map((service) => (
              <div
                key={service.name}
                className="flex items-start gap-2.5 bg-white border border-[#e8e8e8] rounded-[10px] px-[14px] py-[14px]"
              >
                <span className="inline-block shrink-0 w-1.5 h-1.5 rounded-full bg-[#E07B2D] mt-[7px]" />
                <div>
                  <span className="text-[14px] font-semibold text-[#0B2040]">
                    {service.name}
                  </span>
                  <span className="text-[14px] text-[#888]">
                    {" "}
                    - {service.note}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 6: Fleet CTA */}
      <section className="bg-[#0B2040]">
        <div className="section-inner px-4 lg:px-6 py-10 md:py-14 text-center">
          <h2 className="text-[28px] font-extrabold text-white mb-3">
            Let&apos;s talk about your fleet.
          </h2>
          <p className="text-[15px] text-white/70 mb-8 mx-auto max-w-[520px]">
            Tell us your fleet size and vehicle types. We will put together a
            custom maintenance plan and pricing proposal within 48 hours.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button href="/contact" variant="primary" size="lg">
              Get Fleet Quote
            </Button>
            <a
              href="tel:8137225823"
              className="inline-flex items-center justify-center gap-2 px-[30px] py-[14px] font-semibold text-white bg-transparent border-2 border-white/40 rounded-[var(--radius-button)] hover:border-white/70 transition-all"
            >
              <Phone size={16} />
              Call 813-722-LUBE
            </a>
          </div>
        </div>
      </section>

      {/* Section 7: Fleet FAQs */}
      <section className="bg-white">
        <div className="section-inner px-4 lg:px-6 py-10 md:py-14">
          <div className="max-w-[700px] mx-auto">
            <p className="text-[13px] uppercase font-bold text-[#1A5FAC] tracking-[1.5px] mb-3">
              Common Questions
            </p>
            <h2 className="text-[28px] font-extrabold text-[#0B2040] mb-8">
              Fleet Service FAQs
            </h2>
            <div>
              {faqItems.map((faq, i) => (
                <div key={i} className="border-b border-[#eee]">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between gap-4 py-4 text-left"
                  >
                    <span className="text-[15px] font-semibold text-[#0B2040]">
                      {faq.q}
                    </span>
                    <ChevronDown
                      size={18}
                      className={`shrink-0 text-[#888] transition-transform ${
                        openFaq === i ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {openFaq === i && (
                    <p className="text-[14px] text-[#444] leading-[1.7] pb-4">
                      {faq.a}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section 8: Other Services Teaser */}
      <section className="bg-[#FAFBFC]">
        <div className="section-inner px-4 lg:px-6 py-10 md:py-14">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-[#e8e8e8] rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-7 hover:border-[#E07B2D] hover:-translate-y-[2px] transition-all duration-200">
              <h3 className="text-[20px] font-bold text-[#0B2040] mb-2">
                Automotive
              </h3>
              <p className="text-[14px] text-[#444] leading-[1.7] mb-4">
                Personal vehicle maintenance at your home or office.
              </p>
              <Link
                href="/services"
                className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#E07B2D] hover:text-[#CC6A1F] transition-colors"
              >
                Learn about automotive services
                <ArrowRight size={15} />
              </Link>
            </div>
            <div className="bg-white border border-[#e8e8e8] rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-7 hover:border-[#E07B2D] hover:-translate-y-[2px] transition-all duration-200">
              <h3 className="text-[20px] font-bold text-[#0B2040] mb-2">
                Marine
              </h3>
              <p className="text-[14px] text-[#444] leading-[1.7] mb-4">
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
