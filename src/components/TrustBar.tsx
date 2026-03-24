import { Shield, Wrench, Award, Tag } from "lucide-react";

const trustItems = [
  { icon: Shield, text: "Fully Licensed & Insured" },
  { icon: Wrench, text: "ASE-Certified Technicians" },
  { icon: Award, text: "12-Month Service Warranty" },
  { icon: Tag, text: "Transparent Pricing, No Surprises" },
];

export default function TrustBar() {
  return (
    <section className="bg-[#0B2040]">
      <div className="section-inner px-4 lg:px-6 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0">
          {trustItems.map((item, i) => (
            <div
              key={item.text}
              className={`flex flex-col md:flex-row items-center gap-3 text-center md:text-left justify-center ${
                i < trustItems.length - 1
                  ? "md:border-r md:border-white/[0.12]"
                  : ""
              } md:px-6`}
            >
              <item.icon size={32} className="text-white shrink-0" strokeWidth={1.5} />
              <span className="text-[14px] font-semibold text-white">
                {item.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
