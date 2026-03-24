"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { CheckCircle, Check, ChevronLeft } from "lucide-react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  arrayUnion,
} from "firebase/firestore";

// ── Types ──

interface Vehicle {
  year: string;
  make: string;
  model: string;
  notes: string;
}

interface CustomerData {
  id: string;
  name: string;
  phone: string;
  email: string;
  vehicles: Vehicle[];
}

interface BookingData {
  // Vehicle
  vehicleYear: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleNotes: string;
  // Services
  services: string[];
  serviceNotes: string;
  // Location
  address: string;
  city: string;
  zip: string;
  locationType: string;
  accessNotes: string;
  // Schedule
  preferredDate: string;
  preferredTimeWindow: string;
  backupDate: string;
  // Customer info
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  referralSource: string;
}

// ── Constants ──

const inputClasses =
  "w-full text-sm rounded-[10px] px-3 py-2.5 outline-none border-2 border-[#eee] bg-[#fafafa] focus:border-[#1A5FAC] transition-colors";

const labelClasses =
  "block text-[11px] uppercase font-semibold text-[#999] tracking-[0.5px] mb-1.5";

const stepLabels = ["Vehicle", "Service", "Location", "Schedule", "Confirm"];

const vehicleYears = [
  "2026", "2025", "2024", "2023", "2022", "2021", "2020",
  "2019", "2018", "2017", "2016", "2015", "2014", "2013",
  "2012", "2011", "2010", "2009", "2008", "2007", "2006",
  "2005", "2004", "2003", "2002", "2001", "2000",
  "Older than 2000",
];

const vehicleMakes = [
  "Toyota", "Honda", "Ford", "Chevrolet", "Nissan", "Hyundai", "Kia",
  "BMW", "Mercedes-Benz", "Audi", "Lexus", "Acura", "Mazda", "Subaru",
  "Volkswagen", "Jeep", "Ram", "GMC", "Dodge", "Chrysler", "Buick",
  "Cadillac", "Lincoln", "Volvo", "Tesla", "Infiniti", "Genesis",
  "Land Rover", "Porsche", "Other",
];

interface ServiceItem {
  name: string;
  price: string;
  priceValue: number;
}

const automotiveServices: ServiceItem[] = [
  { name: "Synthetic Oil Change", price: "from $49", priceValue: 49 },
  { name: "Tire Rotation & Balance", price: "from $29", priceValue: 29 },
  { name: "Tire Sales & Installation", price: "pricing varies", priceValue: 0 },
  { name: "Brake Inspection", price: "included with service", priceValue: 0 },
  { name: "Battery Test & Replacement", price: "test free / replacement from $149", priceValue: 0 },
  { name: "Filter Replacement (Air/Cabin)", price: "from $29", priceValue: 29 },
  { name: "Wiper Blades", price: "from $19", priceValue: 19 },
  { name: "Fluid Top-Off & Check", price: "included with service", priceValue: 0 },
];

const marineServices: ServiceItem[] = [
  { name: "Outboard Oil Change", price: "from $89", priceValue: 89 },
  { name: "Inboard Engine Service", price: "call for pricing", priceValue: 0 },
  { name: "Lower Unit Service", price: "from $79", priceValue: 79 },
  { name: "Seasonal Winterization", price: "call for pricing", priceValue: 0 },
];

const allServices = [...automotiveServices, ...marineServices];

const timeWindows = [
  "Morning (7am-10am)",
  "Mid-day (10am-1pm)",
  "Afternoon (1pm-4pm)",
  "No preference",
];

const locationTypes = [
  "Home driveway",
  "Office parking lot",
  "Marina / boat ramp",
  "Apartment complex",
  "Other",
];

const referralSources = [
  "Google search",
  "Social media",
  "Referral from a friend",
  "Saw the van",
  "Flyer or mailer",
  "Other",
];

// ── Helpers ──

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length === 0) return "";
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function digitsOnly(phone: string): string {
  return phone.replace(/\D/g, "");
}

function getTomorrowDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

function computeEstimatedTotal(selectedServices: string[]): string {
  let total = 0;
  let hasPriced = false;
  for (const name of selectedServices) {
    const svc = allServices.find((s) => s.name === name);
    if (svc && svc.priceValue > 0) {
      total += svc.priceValue;
      hasPriced = true;
    }
  }
  if (!hasPriced) return "";
  return `from $${total}`;
}

// ── Main Component ──

const emptyBooking: BookingData = {
  vehicleYear: "",
  vehicleMake: "",
  vehicleModel: "",
  vehicleNotes: "",
  services: [],
  serviceNotes: "",
  address: "",
  city: "Tampa",
  zip: "",
  locationType: "",
  accessNotes: "",
  preferredDate: "",
  preferredTimeWindow: "",
  backupDate: "",
  customerName: "",
  customerPhone: "",
  customerEmail: "",
  referralSource: "",
};

export default function BookingWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [bookingData, setBookingData] = useState<BookingData>({ ...emptyBooking });
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  // Lookup state
  const [lookupPhone, setLookupPhone] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState<"idle" | "found" | "not_found">("idle");
  const [selectedVehicleIndex, setSelectedVehicleIndex] = useState<number | null>(null);

  // Returning customer editing vehicle
  const [editingVehicle, setEditingVehicle] = useState(false);
  const [useNewVehicle, setUseNewVehicle] = useState(false);

  // Step validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Animation
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState<"forward" | "back">("forward");

  const isReturning = customerData !== null;

  const update = useCallback((fields: Partial<BookingData>) => {
    setBookingData((prev) => ({ ...prev, ...fields }));
  }, []);

  const goTo = useCallback((step: number, dir: "forward" | "back" = "forward") => {
    setDirection(dir);
    setAnimating(true);
    setTimeout(() => {
      setCurrentStep(step);
      setErrors({});
      setAnimating(false);
    }, 200);
  }, []);

  // ── Lookup ──

  async function handleLookup() {
    const phone = digitsOnly(lookupPhone);
    if (phone.length < 10) return;
    setLookupLoading(true);
    setLookupResult("idle");
    try {
      const q = query(collection(db, "customers"), where("phone", "==", phone));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const docData = snap.docs[0];
        const data = docData.data();
        const customer: CustomerData = {
          id: docData.id,
          name: data.name || "",
          phone: data.phone || "",
          email: data.email || "",
          vehicles: data.vehicles || [],
        };
        setCustomerData(customer);
        setLookupResult("found");
        update({
          customerName: customer.name,
          customerPhone: formatPhone(customer.phone),
          customerEmail: customer.email,
        });
        if (customer.vehicles.length === 1) {
          setSelectedVehicleIndex(0);
          const v = customer.vehicles[0];
          update({
            vehicleYear: v.year,
            vehicleMake: v.make,
            vehicleModel: v.model,
            vehicleNotes: v.notes || "",
          });
        }
      } else {
        setLookupResult("not_found");
      }
    } catch {
      setLookupResult("not_found");
    }
    setLookupLoading(false);
  }

  function proceedFromLookup(skipToService: boolean) {
    if (skipToService) {
      goTo(2, "forward"); // Skip to Service step
    } else {
      goTo(1, "forward"); // Go to Vehicle step
    }
  }

  // ── Validation ──

  function validateVehicle(): boolean {
    const errs: Record<string, string> = {};
    if (!bookingData.vehicleYear) errs.vehicleYear = "Required";
    if (!bookingData.vehicleMake) errs.vehicleMake = "Required";
    if (!bookingData.vehicleModel.trim()) errs.vehicleModel = "Required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function validateService(): boolean {
    const errs: Record<string, string> = {};
    if (bookingData.services.length === 0) errs.services = "Select at least one service";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function validateLocation(): boolean {
    const errs: Record<string, string> = {};
    if (!bookingData.address.trim()) errs.address = "Required";
    if (!bookingData.city.trim()) errs.city = "Required";
    if (!bookingData.zip.trim()) errs.zip = "Required";
    if (!bookingData.locationType) errs.locationType = "Required";
    if (!bookingData.preferredDate) errs.preferredDate = "Required";
    if (!bookingData.preferredTimeWindow) errs.preferredTimeWindow = "Required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function validateConfirm(): boolean {
    const errs: Record<string, string> = {};
    if (!bookingData.customerName.trim()) errs.customerName = "Required";
    if (digitsOnly(bookingData.customerPhone).length < 10) errs.customerPhone = "Valid phone required";
    if (!bookingData.customerEmail.trim() || !bookingData.customerEmail.includes("@"))
      errs.customerEmail = "Valid email required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // ── Service Toggle ──

  function toggleService(name: string) {
    setBookingData((prev) => {
      const services = prev.services.includes(name)
        ? prev.services.filter((s) => s !== name)
        : [...prev.services, name];
      return { ...prev, services };
    });
  }

  // ── Submit ──

  async function handleSubmit() {
    if (!validateConfirm()) return;
    setIsSubmitting(true);
    try {
      const estimatedTotal = computeEstimatedTotal(bookingData.services);
      await addDoc(collection(db, "appointments"), {
        customerName: bookingData.customerName.trim(),
        customerPhone: digitsOnly(bookingData.customerPhone),
        customerEmail: bookingData.customerEmail.trim(),
        vehicleYear: bookingData.vehicleYear,
        vehicleMake: bookingData.vehicleMake,
        vehicleModel: bookingData.vehicleModel.trim(),
        vehicleNotes: bookingData.vehicleNotes.trim(),
        services: bookingData.services,
        serviceNotes: bookingData.serviceNotes.trim(),
        address: bookingData.address.trim(),
        city: bookingData.city.trim(),
        zip: bookingData.zip.trim(),
        locationType: bookingData.locationType,
        accessNotes: bookingData.accessNotes.trim(),
        preferredDate: bookingData.preferredDate,
        preferredTimeWindow: bookingData.preferredTimeWindow,
        backupDate: bookingData.backupDate || "",
        referralSource: bookingData.referralSource,
        estimatedTotal,
        status: "pending",
        createdAt: serverTimestamp(),
        source: "website",
      });

      // Save or update customer
      if (isReturning && customerData) {
        // If returning customer used a new vehicle, add it
        if (useNewVehicle || selectedVehicleIndex === null) {
          const newVehicle = {
            year: bookingData.vehicleYear,
            make: bookingData.vehicleMake,
            model: bookingData.vehicleModel.trim(),
            notes: bookingData.vehicleNotes.trim(),
          };
          const customerRef = doc(db, "customers", customerData.id);
          await updateDoc(customerRef, {
            vehicles: arrayUnion(newVehicle),
          });
        }
      } else {
        // New customer
        await addDoc(collection(db, "customers"), {
          name: bookingData.customerName.trim(),
          phone: digitsOnly(bookingData.customerPhone),
          email: bookingData.customerEmail.trim(),
          vehicles: [
            {
              year: bookingData.vehicleYear,
              make: bookingData.vehicleMake,
              model: bookingData.vehicleModel.trim(),
              notes: bookingData.vehicleNotes.trim(),
            },
          ],
          createdAt: serverTimestamp(),
          source: "website",
        });
      }

      setIsComplete(true);
    } catch (err) {
      console.error("Booking submission error:", err);
      setErrors({ submit: "Something went wrong. Please try again or call us." });
    }
    setIsSubmitting(false);
  }

  // ── Reset ──

  function resetWizard() {
    setCurrentStep(0);
    setBookingData({ ...emptyBooking });
    setCustomerData(null);
    setIsComplete(false);
    setLookupPhone("");
    setLookupResult("idle");
    setSelectedVehicleIndex(null);
    setEditingVehicle(false);
    setUseNewVehicle(false);
    setErrors({});
  }

  // ── Estimated total ──

  const estimatedTotal = computeEstimatedTotal(bookingData.services);
  const tomorrowDate = getTomorrowDate();

  // ── Animation style ──

  const contentStyle: React.CSSProperties = {
    opacity: animating ? 0 : 1,
    transform: animating
      ? direction === "forward"
        ? "translateX(20px)"
        : "translateX(-20px)"
      : "translateX(0)",
    transition: "opacity 0.2s ease, transform 0.2s ease",
  };

  // ── Confirmation Screen ──

  if (isComplete) {
    return (
      <div className="pt-8 pb-16 md:pt-12 px-4">
        <div className="max-w-[640px] mx-auto bg-white border border-[#e4e4e4] rounded-[16px] shadow-[0_8px_40px_rgba(0,0,0,0.06)] p-7 md:p-10">
          <div className="text-center mb-8">
            <CheckCircle size={56} className="mx-auto mb-4" style={{ color: "#2d7a2d" }} />
            <h2 className="text-[26px] font-extrabold text-[#0B2040] mb-2">
              Booking received!
            </h2>
            <p className="text-[15px] text-[#666]">
              We will confirm your appointment within one business day.
            </p>
          </div>

          <div className="bg-[#FAFBFC] rounded-[10px] p-5 mb-8">
            <div className="space-y-2 text-[14px]">
              <div className="flex justify-between">
                <span className="text-[#999]">Vehicle</span>
                <span className="text-[#333] font-medium text-right">
                  {bookingData.vehicleYear} {bookingData.vehicleMake} {bookingData.vehicleModel}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#999]">Services</span>
                <span className="text-[#333] font-medium text-right max-w-[60%]">
                  {bookingData.services.join(", ")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#999]">Location</span>
                <span className="text-[#333] font-medium text-right">
                  {bookingData.address}, {bookingData.city} {bookingData.zip}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#999]">Preferred date</span>
                <span className="text-[#333] font-medium">
                  {bookingData.preferredDate} - {bookingData.preferredTimeWindow}
                </span>
              </div>
              {estimatedTotal && (
                <div className="flex justify-between pt-2 border-t border-[#eee]">
                  <span className="text-[#999]">Estimated total</span>
                  <span className="text-[#0B2040] font-bold">{estimatedTotal}</span>
                </div>
              )}
            </div>
          </div>

          <div className="text-center space-y-3">
            <p className="text-[14px] text-[#666]">
              For immediate help, call{" "}
              <a href="tel:8137225823" className="font-semibold text-[#E07B2D]">
                813-722-LUBE
              </a>
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={resetWizard}
                className="text-[14px] font-semibold text-[#1A5FAC] hover:underline"
              >
                Book another service
              </button>
              <Link
                href="/"
                className="text-[14px] font-semibold text-[#999] hover:text-[#666]"
              >
                Back to home
              </Link>
            </div>
          </div>
        </div>

        <p className="text-center text-[13px] text-[#aaa] mt-6">
          Questions? Call{" "}
          <a href="tel:8137225823" className="text-[#aaa] underline">813-722-LUBE</a>
          {" "}or visit our{" "}
          <Link href="/contact" className="text-[#aaa] underline">contact page</Link>.
        </p>
      </div>
    );
  }

  // ── Progress Bar ──

  function ProgressBar() {
    if (currentStep === 0) return null;
    return (
      <div className="mb-6">
        <div className="flex items-center gap-1 mb-2">
          {stepLabels.map((label, i) => {
            const stepNum = i + 1;
            let bg = "#eee";
            if (stepNum < currentStep) bg = "#E07B2D";
            else if (stepNum === currentStep) bg = "#0B2040";
            return (
              <div key={label} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full h-[4px] rounded-full transition-colors duration-300"
                  style={{ backgroundColor: bg }}
                />
                <span
                  className="hidden md:block text-[10px] font-semibold transition-colors"
                  style={{
                    color: stepNum <= currentStep ? "#0B2040" : "#ccc",
                  }}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>
        <p className="md:hidden text-[12px] font-semibold text-[#0B2040] text-center">
          Step {currentStep} of {stepLabels.length}: {stepLabels[currentStep - 1]}
        </p>
      </div>
    );
  }

  // ── Navigation Buttons ──

  function NavButtons({
    onNext,
    nextLabel = "Next",
    backStep,
    disabled = false,
  }: {
    onNext: () => void;
    nextLabel?: string;
    backStep?: number;
    disabled?: boolean;
  }) {
    return (
      <div className="mt-6 space-y-3">
        <button
          onClick={onNext}
          disabled={disabled}
          className="w-full font-semibold text-white rounded-[var(--radius-button)] py-3.5 bg-[#E07B2D] hover:bg-[#CC6A1F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {disabled && isSubmitting ? "Submitting..." : nextLabel}
        </button>
        {backStep !== undefined && (
          <button
            onClick={() => goTo(backStep, "back")}
            className="w-full flex items-center justify-center gap-1 text-[14px] font-medium text-[#999] hover:text-[#666] transition-colors"
          >
            <ChevronLeft size={16} />
            Back
          </button>
        )}
      </div>
    );
  }

  // ── Render Steps ──

  function renderStep() {
    switch (currentStep) {
      case 0:
        return renderWelcome();
      case 1:
        return renderVehicle();
      case 2:
        return renderService();
      case 3:
        return renderLocation();
      case 4:
        return renderConfirm();
      default:
        return null;
    }
  }

  // ── Step 0: Welcome / Lookup ──

  function renderWelcome() {
    return (
      <div>
        <h2 className="text-[22px] font-bold text-[#0B2040] mb-1">
          Book your mobile service
        </h2>
        <p className="text-[14px] text-[#999] mb-8">Takes about two minutes.</p>

        {/* Returning customer lookup */}
        <div className="mb-6">
          <p className="text-[14px] font-semibold text-[#0B2040] mb-3">
            Returning customer?
          </p>
          <div className="flex gap-2">
            <input
              type="tel"
              value={lookupPhone}
              onChange={(e) => setLookupPhone(formatPhone(e.target.value))}
              placeholder="(555) 555-5555"
              className={`flex-1 text-[18px] text-center rounded-[10px] px-3 py-3 outline-none border-2 border-[#eee] bg-[#fafafa] focus:border-[#1A5FAC] transition-colors`}
            />
            <button
              onClick={handleLookup}
              disabled={digitsOnly(lookupPhone).length < 10 || lookupLoading}
              className="px-5 py-3 font-semibold text-white rounded-[var(--radius-button)] bg-[#E07B2D] hover:bg-[#CC6A1F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {lookupLoading ? "Looking..." : "Look me up"}
            </button>
          </div>

          {/* Found */}
          {lookupResult === "found" && customerData && (
            <div className="mt-4 p-4 bg-[#F0FAF0] border border-[#c3e6c3] rounded-[10px]">
              <p className="text-[15px] font-semibold text-[#2d7a2d] mb-2">
                Welcome back, {customerData.name}!
              </p>
              {customerData.vehicles.length > 1 ? (
                <div>
                  <p className="text-[13px] text-[#666] mb-2">Select a vehicle:</p>
                  <div className="space-y-2">
                    {customerData.vehicles.map((v, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setSelectedVehicleIndex(i);
                          update({
                            vehicleYear: v.year,
                            vehicleMake: v.make,
                            vehicleModel: v.model,
                            vehicleNotes: v.notes || "",
                          });
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg border text-[14px] transition-colors ${
                          selectedVehicleIndex === i
                            ? "border-[#E07B2D] bg-[#FFF8F3]"
                            : "border-[#eee] bg-white"
                        }`}
                      >
                        {v.year} {v.make} {v.model}
                      </button>
                    ))}
                    <button
                      onClick={() => {
                        setSelectedVehicleIndex(null);
                        setUseNewVehicle(true);
                        update({ vehicleYear: "", vehicleMake: "", vehicleModel: "", vehicleNotes: "" });
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg border text-[14px] transition-colors ${
                        useNewVehicle
                          ? "border-[#E07B2D] bg-[#FFF8F3]"
                          : "border-[#eee] bg-white"
                      }`}
                    >
                      + Add a new vehicle
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      if (useNewVehicle) {
                        proceedFromLookup(false); // Go to vehicle step
                      } else if (selectedVehicleIndex !== null) {
                        proceedFromLookup(true); // Skip to service step
                      }
                    }}
                    disabled={selectedVehicleIndex === null && !useNewVehicle}
                    className="mt-3 w-full font-semibold text-white rounded-[var(--radius-button)] py-3 bg-[#E07B2D] hover:bg-[#CC6A1F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continue booking
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-[13px] text-[#666] mb-3">
                    Vehicle on file: {customerData.vehicles[0]?.year}{" "}
                    {customerData.vehicles[0]?.make} {customerData.vehicles[0]?.model}
                  </p>
                  <button
                    onClick={() => proceedFromLookup(true)}
                    className="w-full font-semibold text-white rounded-[var(--radius-button)] py-3 bg-[#E07B2D] hover:bg-[#CC6A1F] transition-colors"
                  >
                    Continue booking
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Not found */}
          {lookupResult === "not_found" && (
            <div className="mt-4 p-4 bg-[#FAFBFC] border border-[#eee] rounded-[10px]">
              <p className="text-[14px] text-[#666]">
                No worries, we will get you set up.
              </p>
              <button
                onClick={() => proceedFromLookup(false)}
                className="mt-3 w-full font-semibold text-white rounded-[var(--radius-button)] py-3 bg-[#E07B2D] hover:bg-[#CC6A1F] transition-colors"
              >
                Continue as new customer
              </button>
            </div>
          )}
        </div>

        {/* First time */}
        {lookupResult === "idle" && (
          <div className="text-center pt-4 border-t border-[#eee]">
            <button
              onClick={() => proceedFromLookup(false)}
              className="text-[14px] font-medium text-[#1A5FAC] hover:underline"
            >
              I&apos;m a new customer
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Step 1: Vehicle ──

  function renderVehicle() {
    // Returning customer with pre-selected vehicle
    if (isReturning && selectedVehicleIndex !== null && !editingVehicle && !useNewVehicle) {
      return (
        <div>
          <ProgressBar />
          <h2 className="text-[20px] font-bold text-[#0B2040] mb-4">
            What are we working on?
          </h2>
          <div className="p-4 bg-[#FAFBFC] border border-[#eee] rounded-[10px] mb-4">
            <p className="text-[15px] font-semibold text-[#0B2040]">
              Using your {bookingData.vehicleYear} {bookingData.vehicleMake}{" "}
              {bookingData.vehicleModel}
            </p>
            <div className="flex gap-4 mt-2">
              <button
                onClick={() => setEditingVehicle(true)}
                className="text-[13px] font-medium text-[#1A5FAC] hover:underline"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  setSelectedVehicleIndex(null);
                  setUseNewVehicle(true);
                  update({ vehicleYear: "", vehicleMake: "", vehicleModel: "", vehicleNotes: "" });
                }}
                className="text-[13px] font-medium text-[#1A5FAC] hover:underline"
              >
                Use a different vehicle
              </button>
            </div>
          </div>
          <NavButtons
            onNext={() => {
              if (validateVehicle()) goTo(2, "forward");
            }}
            backStep={0}
          />
        </div>
      );
    }

    return (
      <div>
        <ProgressBar />
        <h2 className="text-[20px] font-bold text-[#0B2040] mb-4">
          What are we working on?
        </h2>
        <div className="space-y-4">
          <div>
            <label className={labelClasses}>Year</label>
            <select
              value={bookingData.vehicleYear}
              onChange={(e) => update({ vehicleYear: e.target.value })}
              className={`${inputClasses} ${errors.vehicleYear ? "border-red-400" : ""}`}
            >
              <option value="">Select year</option>
              {vehicleYears.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            {errors.vehicleYear && <p className="text-red-500 text-[12px] mt-1">{errors.vehicleYear}</p>}
          </div>
          <div>
            <label className={labelClasses}>Make</label>
            <select
              value={bookingData.vehicleMake}
              onChange={(e) => update({ vehicleMake: e.target.value })}
              className={`${inputClasses} ${errors.vehicleMake ? "border-red-400" : ""}`}
            >
              <option value="">Select make</option>
              {vehicleMakes.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            {errors.vehicleMake && <p className="text-red-500 text-[12px] mt-1">{errors.vehicleMake}</p>}
          </div>
          <div>
            <label className={labelClasses}>Model</label>
            <input
              type="text"
              value={bookingData.vehicleModel}
              onChange={(e) => update({ vehicleModel: e.target.value })}
              placeholder="e.g. Camry, Civic, F-150"
              className={`${inputClasses} ${errors.vehicleModel ? "border-red-400" : ""}`}
            />
            {errors.vehicleModel && <p className="text-red-500 text-[12px] mt-1">{errors.vehicleModel}</p>}
          </div>
          <div>
            <label className={labelClasses}>Notes about your vehicle</label>
            <textarea
              value={bookingData.vehicleNotes}
              onChange={(e) => update({ vehicleNotes: e.target.value })}
              placeholder="Trim level, color, anything that helps us prepare. Optional."
              rows={3}
              className={`${inputClasses} resize-none`}
            />
          </div>
        </div>
        <NavButtons
          onNext={() => {
            if (validateVehicle()) goTo(2, "forward");
          }}
          backStep={0}
        />
      </div>
    );
  }

  // ── Step 2: Service Selection ──

  function renderService() {
    return (
      <div>
        <ProgressBar />
        <h2 className="text-[20px] font-bold text-[#0B2040] mb-4">
          What do you need?
        </h2>

        {errors.services && (
          <p className="text-red-500 text-[13px] mb-3">{errors.services}</p>
        )}

        {/* Automotive */}
        <div className="space-y-2 mb-5">
          {automotiveServices.map((svc) => {
            const selected = bookingData.services.includes(svc.name);
            return (
              <button
                key={svc.name}
                onClick={() => toggleService(svc.name)}
                className={`w-full flex items-center justify-between px-4 py-[14px] rounded-[10px] border text-left transition-all ${
                  selected
                    ? "border-l-[3px] border-l-[#E07B2D] border-t-[#eee] border-r-[#eee] border-b-[#eee] bg-[#FFF8F3]"
                    : "border-[#eee] bg-white hover:bg-[#FAFBFC]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {selected && (
                    <Check size={14} className="text-[#E07B2D] shrink-0" />
                  )}
                  <span className="font-semibold text-[14px] text-[#333]">
                    {svc.name}
                  </span>
                </div>
                <span className="text-[13px] font-medium text-[#888] whitespace-nowrap ml-3">
                  {svc.price}
                </span>
              </button>
            );
          })}
        </div>

        {/* Marine */}
        <p className="text-[12px] uppercase font-bold text-[#999] tracking-[1px] mb-2">
          Marine
        </p>
        <div className="space-y-2 mb-5">
          {marineServices.map((svc) => {
            const selected = bookingData.services.includes(svc.name);
            return (
              <button
                key={svc.name}
                onClick={() => toggleService(svc.name)}
                className={`w-full flex items-center justify-between px-4 py-[14px] rounded-[10px] border text-left transition-all ${
                  selected
                    ? "border-l-[3px] border-l-[#E07B2D] border-t-[#eee] border-r-[#eee] border-b-[#eee] bg-[#FFF8F3]"
                    : "border-[#eee] bg-white hover:bg-[#FAFBFC]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {selected && (
                    <Check size={14} className="text-[#E07B2D] shrink-0" />
                  )}
                  <span className="font-semibold text-[14px] text-[#333]">
                    {svc.name}
                  </span>
                </div>
                <span className="text-[13px] font-medium text-[#888] whitespace-nowrap ml-3">
                  {svc.price}
                </span>
              </button>
            );
          })}
        </div>

        {/* Notes */}
        <div className="mb-4">
          <label className={labelClasses}>Anything else we should know?</label>
          <textarea
            value={bookingData.serviceNotes}
            onChange={(e) => update({ serviceNotes: e.target.value })}
            placeholder="Specific concerns, symptoms, tire size needed, etc."
            rows={3}
            className={`${inputClasses} resize-none`}
          />
        </div>

        {/* Running total */}
        {estimatedTotal && (
          <div className="p-3 bg-[#FAFBFC] rounded-[10px] border border-[#eee] mb-1">
            <p className="text-[15px] font-bold text-[#0B2040]">
              Estimated total: {estimatedTotal}
            </p>
            <p className="text-[12px] text-[#999] mt-1">
              Final pricing confirmed before we start. No surprises.
            </p>
          </div>
        )}

        <NavButtons
          onNext={() => {
            if (validateService()) goTo(3, "forward");
          }}
          backStep={1}
        />
      </div>
    );
  }

  // ── Step 3: Location & Schedule ──

  function renderLocation() {
    return (
      <div>
        <ProgressBar />
        <h2 className="text-[20px] font-bold text-[#0B2040] mb-4">
          Where and when?
        </h2>

        {/* Location */}
        <div className="space-y-4 mb-6">
          <div>
            <label className={labelClasses}>Service address</label>
            <input
              type="text"
              value={bookingData.address}
              onChange={(e) => update({ address: e.target.value })}
              placeholder="Street address"
              className={`${inputClasses} ${errors.address ? "border-red-400" : ""}`}
            />
            {errors.address && <p className="text-red-500 text-[12px] mt-1">{errors.address}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClasses}>City</label>
              <input
                type="text"
                value={bookingData.city}
                onChange={(e) => update({ city: e.target.value })}
                className={`${inputClasses} ${errors.city ? "border-red-400" : ""}`}
              />
              {errors.city && <p className="text-red-500 text-[12px] mt-1">{errors.city}</p>}
            </div>
            <div>
              <label className={labelClasses}>Zip code</label>
              <input
                type="text"
                value={bookingData.zip}
                onChange={(e) => update({ zip: e.target.value })}
                className={`${inputClasses} ${errors.zip ? "border-red-400" : ""}`}
              />
              {errors.zip && <p className="text-red-500 text-[12px] mt-1">{errors.zip}</p>}
            </div>
          </div>
          <div>
            <label className={labelClasses}>Location type</label>
            <select
              value={bookingData.locationType}
              onChange={(e) => update({ locationType: e.target.value })}
              className={`${inputClasses} ${errors.locationType ? "border-red-400" : ""}`}
            >
              <option value="">Select type</option>
              {locationTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            {errors.locationType && <p className="text-red-500 text-[12px] mt-1">{errors.locationType}</p>}
          </div>
          <div>
            <label className={labelClasses}>Access notes</label>
            <input
              type="text"
              value={bookingData.accessNotes}
              onChange={(e) => update({ accessNotes: e.target.value })}
              placeholder="Gate code, parking instructions, dock number, etc."
              className={inputClasses}
            />
          </div>
        </div>

        {/* Schedule */}
        <div className="space-y-4">
          <div>
            <label className={labelClasses}>Preferred date</label>
            <input
              type="date"
              value={bookingData.preferredDate}
              onChange={(e) => update({ preferredDate: e.target.value })}
              min={tomorrowDate}
              className={`${inputClasses} ${errors.preferredDate ? "border-red-400" : ""}`}
            />
            {errors.preferredDate && <p className="text-red-500 text-[12px] mt-1">{errors.preferredDate}</p>}
          </div>
          <div>
            <label className={labelClasses}>Preferred time window</label>
            <select
              value={bookingData.preferredTimeWindow}
              onChange={(e) => update({ preferredTimeWindow: e.target.value })}
              className={`${inputClasses} ${errors.preferredTimeWindow ? "border-red-400" : ""}`}
            >
              <option value="">Select time</option>
              {timeWindows.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            {errors.preferredTimeWindow && <p className="text-red-500 text-[12px] mt-1">{errors.preferredTimeWindow}</p>}
          </div>
          <div>
            <label className={labelClasses}>Backup date (optional)</label>
            <input
              type="date"
              value={bookingData.backupDate}
              onChange={(e) => update({ backupDate: e.target.value })}
              min={tomorrowDate}
              className={inputClasses}
            />
          </div>
          <p className="text-[12px] text-[#999]">
            We will confirm your exact appointment time within one business day.
          </p>
        </div>

        <NavButtons
          onNext={() => {
            if (validateLocation()) goTo(4, "forward");
          }}
          backStep={2}
        />
      </div>
    );
  }

  // ── Step 4: Your Info & Confirm ──

  function renderConfirm() {
    return (
      <div>
        <ProgressBar />
        <h2 className="text-[20px] font-bold text-[#0B2040] mb-4">
          Almost done.
        </h2>

        {/* Customer info */}
        <div className="space-y-4 mb-6">
          <div>
            <label className={labelClasses}>Name</label>
            <input
              type="text"
              value={bookingData.customerName}
              onChange={(e) => update({ customerName: e.target.value })}
              placeholder="Full name"
              className={`${inputClasses} ${errors.customerName ? "border-red-400" : ""}`}
              readOnly={isReturning && !editingVehicle}
            />
            {errors.customerName && <p className="text-red-500 text-[12px] mt-1">{errors.customerName}</p>}
          </div>
          <div>
            <label className={labelClasses}>Phone</label>
            <input
              type="tel"
              value={bookingData.customerPhone}
              onChange={(e) => update({ customerPhone: formatPhone(e.target.value) })}
              placeholder="(555) 555-5555"
              className={`${inputClasses} ${errors.customerPhone ? "border-red-400" : ""}`}
              readOnly={isReturning && !editingVehicle}
            />
            {errors.customerPhone && <p className="text-red-500 text-[12px] mt-1">{errors.customerPhone}</p>}
          </div>
          <div>
            <label className={labelClasses}>Email</label>
            <input
              type="email"
              value={bookingData.customerEmail}
              onChange={(e) => update({ customerEmail: e.target.value })}
              placeholder="you@email.com"
              className={`${inputClasses} ${errors.customerEmail ? "border-red-400" : ""}`}
              readOnly={isReturning && !editingVehicle}
            />
            {errors.customerEmail && <p className="text-red-500 text-[12px] mt-1">{errors.customerEmail}</p>}
          </div>
          {isReturning && (
            <button
              onClick={() => setEditingVehicle(!editingVehicle)}
              className="text-[13px] font-medium text-[#1A5FAC] hover:underline"
            >
              {editingVehicle ? "Lock info" : "Edit my info"}
            </button>
          )}
          {!isReturning && (
            <div>
              <label className={labelClasses}>How did you hear about us?</label>
              <select
                value={bookingData.referralSource}
                onChange={(e) => update({ referralSource: e.target.value })}
                className={inputClasses}
              >
                <option value="">Select (optional)</option>
                {referralSources.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="bg-[#FAFBFC] rounded-[10px] p-5 mb-2">
          <p className="text-[12px] uppercase font-bold text-[#999] tracking-[1px] mb-3">
            Booking summary
          </p>
          <div className="space-y-2 text-[14px]">
            <div className="flex justify-between">
              <span className="text-[#999]">Vehicle</span>
              <span className="text-[#333] font-medium text-right">
                {bookingData.vehicleYear} {bookingData.vehicleMake} {bookingData.vehicleModel}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#999] shrink-0">Services</span>
              <span className="text-[#333] font-medium text-right max-w-[65%]">
                {bookingData.services.join(", ")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#999]">Location</span>
              <span className="text-[#333] font-medium text-right">
                {bookingData.address}, {bookingData.city} {bookingData.zip}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#999]">Preferred date</span>
              <span className="text-[#333] font-medium">
                {bookingData.preferredDate} - {bookingData.preferredTimeWindow}
              </span>
            </div>
            {estimatedTotal && (
              <div className="flex justify-between pt-2 border-t border-[#eee]">
                <span className="text-[#999]">Estimated total</span>
                <span className="text-[#0B2040] font-bold">{estimatedTotal}</span>
              </div>
            )}
          </div>
        </div>

        {errors.submit && (
          <p className="text-red-500 text-[13px] mt-3">{errors.submit}</p>
        )}

        <NavButtons
          onNext={handleSubmit}
          nextLabel="Confirm Booking"
          backStep={3}
          disabled={isSubmitting}
        />
      </div>
    );
  }

  // ── Main Render ──

  return (
    <div className="pt-8 pb-16 md:pt-12 px-4">
      <div className="max-w-[640px] mx-auto bg-white border border-[#e4e4e4] rounded-[16px] shadow-[0_8px_40px_rgba(0,0,0,0.06)] p-7 md:p-10">
        <div style={contentStyle}>{renderStep()}</div>
      </div>

      <p className="text-center text-[13px] text-[#aaa] mt-6">
        Questions? Call{" "}
        <a href="tel:8137225823" className="text-[#aaa] underline">813-722-LUBE</a>
        {" "}or visit our{" "}
        <Link href="/contact" className="text-[#aaa] underline">contact page</Link>.
      </p>
    </div>
  );
}
