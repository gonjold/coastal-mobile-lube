import { useState } from "react";

const DIVISIONS = ["Automotive", "Fleet", "Marine", "RV & Trailer"];

const currentYear = 2026;
const YEARS = Array.from({ length: 40 }, (_, i) => currentYear + 1 - i);

const CATEGORIES = {
  Automotive: [
    { id: "oil", label: "Oil Change", services: [
      { name: "Synthetic Blend", price: 79.95 },
      { name: "Full Synthetic", price: 99.95 },
      { name: "High Mileage Synthetic", price: 109.95 },
      { name: "Diesel Oil Change", price: 129.95 },
    ]},
    { id: "tires", label: "Tires", services: [
      { name: "Mount and Balance Single", price: 35 },
      { name: "Mount and Balance 4 Tires", price: 120 },
      { name: "Tire Rotation", price: 29.95 },
      { name: "Flat Repair", price: 25 },
    ]},
    { id: "brakes", label: "Brakes", services: [
      { name: "Front Brake Job", price: 249.95 },
      { name: "Rear Brake Job", price: 249.95 },
      { name: "Front and Rear Brake Job", price: 449.95 },
    ]},
    { id: "battery", label: "Battery", services: [
      { name: "Battery Replacement", price: 149.95 },
      { name: "Battery Service", price: 39.95 },
    ]},
    { id: "maintenance", label: "Maintenance", services: [
      { name: "Coolant Flush", price: 129.95 },
      { name: "Transmission Flush", price: 179.95 },
      { name: "Power Steering Flush", price: 99.95 },
    ]},
    { id: "hvac", label: "HVAC", services: [
      { name: "EVAC and Recharge", price: 179.95 },
      { name: "Cabin Air Filter", price: 39.95 },
    ]},
    { id: "wipers", label: "Wipers", services: [
      { name: "Front Wiper Blades", price: 29.95 },
      { name: "Rear Wiper Blade", price: 19.95 },
    ]},
    { id: "other", label: "Other", services: [] },
  ],
  Fleet: [
    { id: "oil", label: "Oil Change", services: [
      { name: "Fleet Synthetic Blend", price: null },
      { name: "Fleet Full Synthetic", price: null },
    ]},
    { id: "tires", label: "Tire Service", services: [
      { name: "Mount and Balance", price: null },
      { name: "Tire Rotation", price: null },
    ]},
    { id: "battery", label: "Battery", services: [
      { name: "Battery Replacement", price: null },
    ]},
    { id: "brakes", label: "Brakes", services: [
      { name: "Front Brake Job", price: null },
      { name: "Rear Brake Job", price: null },
    ]},
    { id: "pm", label: "Preventive Maintenance", services: [
      { name: "Fluid Flush", price: null },
      { name: "Filter Service", price: null },
    ]},
    { id: "other", label: "Other", services: [] },
  ],
  Marine: [
    { id: "oil", label: "Oil Change", services: [
      { name: "Inboard Oil Change", price: 149.95 },
      { name: "Outboard Oil Change", price: 99.95 },
      { name: "Stern Drive Oil Change", price: 129.95 },
    ]},
    { id: "engine", label: "Engine Service", services: [
      { name: "Impeller Replacement", price: 199.95 },
      { name: "Fuel Filter", price: 79.95 },
    ]},
    { id: "winter", label: "Winterization", services: [
      { name: "Winterization", price: 249.95 },
      { name: "De-Winterization", price: 199.95 },
    ]},
    { id: "other", label: "Other", services: [] },
  ],
  "RV & Trailer": [
    { id: "oil", label: "Oil Change", services: [
      { name: "RV Oil Change", price: 129.95 },
      { name: "Generator Oil Change", price: 89.95 },
    ]},
    { id: "tires", label: "Tire Service", services: [
      { name: "Mount and Balance", price: 45 },
      { name: "Tire Rotation", price: 39.95 },
    ]},
    { id: "generator", label: "Generator", services: [
      { name: "Generator Service", price: 149.95 },
      { name: "Generator Tune-Up", price: 99.95 },
    ]},
    { id: "roof", label: "Roof / Exterior", services: [
      { name: "Roof Inspection", price: 79.95 },
      { name: "Sealant Application", price: 149.95 },
    ]},
    { id: "other", label: "Other", services: [] },
  ],
};

const VEHICLE_ID_LABELS = {
  Automotive: { label: "VIN", placeholder: "Enter VIN", hint: "Found on driver's door jamb sticker", showYMM: true },
  Fleet: { label: "VIN", placeholder: "Enter VIN", hint: "Found on driver's door jamb sticker", showYMM: true },
  Marine: { label: "Hull #", placeholder: "Enter Hull #", hint: "Stamped on boat transom", showYMM: false },
  "RV & Trailer": { label: "VIN", placeholder: "Enter VIN", hint: "Found on driver's door jamb sticker", showYMM: true },
};

export default function BookingMockup() {
  const [division, setDivision] = useState("Automotive");
  const [selectedCat, setSelectedCat] = useState(null);
  const [expandedCat, setExpandedCat] = useState(null);
  const [selectedServices, setSelectedServices] = useState([]);
  const [otherText, setOtherText] = useState("");
  const [vinValue, setVinValue] = useState("");
  const [vehicleYear, setVehicleYear] = useState("");
  const [vehicleMake, setVehicleMake] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [contactMethod, setContactMethod] = useState("Call");

  const categories = CATEGORIES[division] || [];
  const vehicleId = VEHICLE_ID_LABELS[division];

  const handleCatClick = (cat) => {
    if (cat.id === "other") {
      setSelectedCat(cat);
      setExpandedCat(null);
      return;
    }
    if (selectedCat?.id === cat.id) {
      setExpandedCat(expandedCat === cat.id ? null : cat.id);
    } else {
      setSelectedCat(cat);
      setExpandedCat(null);
      const hasSpecifics = selectedServices.some(s => s.catId === cat.id && !s.isCategory);
      if (!hasSpecifics) {
        setSelectedServices(prev => [
          ...prev.filter(s => s.catId !== cat.id),
          { catId: cat.id, label: cat.label, isCategory: true, price: null }
        ]);
      }
    }
  };

  const handleServiceToggle = (cat, service) => {
    const key = `${cat.id}-${service.name}`;
    const exists = selectedServices.find(s => s.key === key);
    if (exists) {
      const remaining = selectedServices.filter(s => s.key !== key);
      const otherSpecifics = remaining.some(s => s.catId === cat.id && !s.isCategory);
      if (!otherSpecifics) {
        setSelectedServices([
          ...remaining,
          { catId: cat.id, label: cat.label, isCategory: true, price: null }
        ]);
      } else {
        setSelectedServices(remaining);
      }
    } else {
      setSelectedServices(prev => [
        ...prev.filter(s => !(s.catId === cat.id && s.isCategory)),
        { key, catId: cat.id, label: `${cat.label}: ${service.name}`, isCategory: false, price: service.price }
      ]);
    }
  };

  const handleDivisionSwitch = (d) => {
    setDivision(d);
    setSelectedCat(null);
    setExpandedCat(null);
    setSelectedServices([]);
    setOtherText("");
    setVinValue("");
    setVehicleYear("");
    setVehicleMake("");
    setVehicleModel("");
  };

  const totalServices = selectedServices.length + (selectedCat?.id === "other" && otherText ? 1 : 0);
  const hasAnyPriced = selectedServices.some(s => s.price != null);
  const totalPrice = selectedServices.reduce((sum, s) => sum + (s.price || 0), 0);

  const inputStyle = {
    width: "100%",
    padding: "12px 16px",
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.15)",
    background: "rgba(255,255,255,0.06)",
    color: "#fff",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
  };

  const selectStyle = {
    ...inputStyle,
    appearance: "none",
    WebkitAppearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff80' d='M2 4l4 4 4-4'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 14px center",
    paddingRight: 36,
    cursor: "pointer",
  };

  const labelStyle = {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: 1,
    display: "block",
    marginBottom: 6,
  };

  return (
    <div style={{ background: "#0B1929", minHeight: "100vh", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* Nav */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 32px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg, #1a3a5c, #0d2640)", border: "2px solid rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: "#fff", fontWeight: 700, letterSpacing: 0.5 }}>COASTAL</div>
          <div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 18 }}>Coastal Mobile</div>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 600, letterSpacing: 2 }}>LUBE & TIRE</div>
          </div>
        </div>
        <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 14 }}>813-722-LUBE</span>
      </nav>

      {/* Hero Banner */}
      <div style={{ background: "linear-gradient(135deg, #0d2640 0%, #132f4f 50%, #0B1929 100%)", padding: "32px 32px 24px" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {DIVISIONS.map(d => (
            <button key={d} onClick={() => handleDivisionSwitch(d)} style={{
              padding: "8px 20px", borderRadius: 24,
              border: division === d ? "none" : "1px solid rgba(255,255,255,0.2)",
              background: division === d ? "#E8913A" : "transparent",
              color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            }}>{d}</button>
          ))}
        </div>
        <h1 style={{ color: "#fff", fontSize: 28, fontWeight: 800, margin: 0 }}>Book your service</h1>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 15, marginTop: 6 }}>
          Pick a service, choose a date, and we will confirm your appointment within 2 hours.
          Or call <span style={{ color: "#E8913A", fontWeight: 600 }}>813-722-LUBE</span>.
        </p>
      </div>

      {/* Main Content */}
      <div style={{ display: "flex", gap: 24, padding: "24px 32px", alignItems: "flex-start" }}>
        {/* Left Column */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* What do you need? */}
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 700, marginBottom: 4 }}>What do you need?</h2>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 16 }}>Select a category. Tap again to choose a specific service.</p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
              {categories.map(cat => {
                const isSelected = selectedCat?.id === cat.id;
                const lowestPrice = cat.services.length > 0
                  ? Math.min(...cat.services.filter(s => s.price != null).map(s => s.price))
                  : null;
                return (
                  <button key={cat.id} onClick={() => handleCatClick(cat)} style={{
                    width: "100%", padding: "18px 12px 14px", borderRadius: 12,
                    border: isSelected ? "2px solid #E8913A" : "1px solid rgba(255,255,255,0.12)",
                    background: isSelected ? "rgba(232,145,58,0.1)" : "rgba(255,255,255,0.04)",
                    cursor: "pointer", textAlign: "center", fontFamily: "inherit",
                  }}>
                    <div style={{ color: "#fff", fontSize: 14, fontWeight: 700 }}>{cat.label}</div>
                    {lowestPrice != null && (
                      <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 4 }}>Starting at ${lowestPrice.toFixed(2)}</div>
                    )}
                    {cat.id === "other" && (
                      <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 4 }}>Describe what you need</div>
                    )}
                    {cat.services.length > 0 && isSelected && (
                      <div style={{ color: "#E8913A", fontSize: 11, marginTop: 6, fontWeight: 500 }}>
                        {expandedCat === cat.id ? "Hide options" : "See specific services"}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Expanded Services */}
            {expandedCat && selectedCat?.services?.length > 0 && (
              <div style={{ marginTop: 12, background: "rgba(255,255,255,0.04)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", padding: 16 }}>
                <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 600, marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>
                  {selectedCat.label} -- choose specific service (optional)
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {selectedCat.services.map(s => {
                    const isChecked = selectedServices.find(ss => ss.key === `${selectedCat.id}-${s.name}`);
                    return (
                      <button key={s.name} onClick={() => handleServiceToggle(selectedCat, s)} style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
                        padding: "10px 14px", borderRadius: 8, width: "100%", textAlign: "left", fontFamily: "inherit",
                        border: isChecked ? "1px solid #E8913A" : "1px solid rgba(255,255,255,0.08)",
                        background: isChecked ? "rgba(232,145,58,0.08)" : "transparent", cursor: "pointer",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{
                            width: 20, height: 20, borderRadius: 4,
                            border: isChecked ? "2px solid #E8913A" : "2px solid rgba(255,255,255,0.25)",
                            background: isChecked ? "#E8913A" : "transparent",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 12, color: "#fff", flexShrink: 0
                          }}>{isChecked && <span style={{ lineHeight: 1 }}>&#10003;</span>}</div>
                          <span style={{ color: "#fff", fontSize: 14, fontWeight: 500 }}>{s.name}</span>
                        </div>
                        {s.price != null && (
                          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: 500 }}>${s.price.toFixed(2)}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 10, fontStyle: "italic" }}>
                  Not sure? Just leave the broad category and describe it below.
                </div>
              </div>
            )}

            {selectedCat?.id === "other" && (
              <div style={{ marginTop: 12 }}>
                <label style={labelStyle}>What do you need?</label>
                <input type="text" value={otherText} onChange={e => setOtherText(e.target.value)}
                  placeholder="Briefly describe the service you need" style={inputStyle} />
              </div>
            )}
          </div>

          {/* Your Details */}
          <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)", padding: 24 }}>
            <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Your details</h2>

            {/* Vehicle Info Section */}
            <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Vehicle Information</div>

              {/* VIN or Hull */}
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>{vehicleId.label} (optional)</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input type="text" value={vinValue} onChange={e => setVinValue(e.target.value)}
                    placeholder={vehicleId.placeholder} style={{ ...inputStyle, flex: 1, width: "auto" }} />
                  <button style={{
                    padding: "12px 16px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.15)",
                    background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", cursor: "pointer",
                    fontSize: 12, fontWeight: 600, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap",
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                    Scan
                  </button>
                </div>
                <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 4 }}>{vehicleId.hint}</div>
              </div>

              {/* YMM Fields - show for non-Marine */}
              {vehicleId.showYMM && (
                <>
                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, textAlign: "center", margin: "8px 0" }}>
                    or enter vehicle details
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                    <div>
                      <label style={labelStyle}>Year</label>
                      <select value={vehicleYear} onChange={e => setVehicleYear(e.target.value)} style={selectStyle}>
                        <option value="" style={{ background: "#0d2640" }}>Year</option>
                        {YEARS.map(y => (
                          <option key={y} value={y} style={{ background: "#0d2640" }}>{y}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Make</label>
                      <input type="text" value={vehicleMake} onChange={e => setVehicleMake(e.target.value)}
                        placeholder="e.g. Toyota" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Model</label>
                      <input type="text" value={vehicleModel} onChange={e => setVehicleModel(e.target.value)}
                        placeholder="e.g. Camry" style={inputStyle} />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Name */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Your Name</label>
              <input placeholder="Your name" style={inputStyle} />
            </div>

            {/* Zip + Phone */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>Zip Code</label>
                <input placeholder="e.g. 33601" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Phone</label>
                <input placeholder="(555) 555-5555" style={inputStyle} />
              </div>
            </div>

            {/* Email */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Email</label>
              <input placeholder="you@email.com" style={inputStyle} />
            </div>

            {/* Contact Method */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Best Way to Reach You</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {["Call", "Text", "Email"].map(m => (
                  <button key={m} onClick={() => setContactMethod(m)} style={{
                    padding: "10px", borderRadius: 8, fontFamily: "inherit",
                    border: contactMethod === m ? "2px solid #E8913A" : "1px solid rgba(255,255,255,0.15)",
                    background: contactMethod === m ? "rgba(232,145,58,0.12)" : "rgba(255,255,255,0.04)",
                    color: contactMethod === m ? "#E8913A" : "rgba(255,255,255,0.6)",
                    fontWeight: 600, fontSize: 14, cursor: "pointer",
                  }}>{m}</button>
                ))}
              </div>
            </div>

            {/* Date */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Preferred Date</label>
              <input type="date" style={{ ...inputStyle, color: "rgba(255,255,255,0.5)" }} />
            </div>

            {/* Notes - renamed */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Anything else we should know?</label>
              <textarea placeholder="Tire size, special requests, access instructions, etc." rows={3}
                style={{ ...inputStyle, resize: "vertical" }} />
            </div>

            {/* Submit */}
            <button style={{
              width: "100%", padding: "16px", borderRadius: 10, border: "none",
              background: "#E8913A", color: "#fff", fontSize: 16, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit", marginTop: 8,
            }}>Get My Quote</button>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, textAlign: "center", marginTop: 10 }}>
              or call <span style={{ color: "#E8913A", fontWeight: 600 }}>813-722-LUBE</span> for immediate help
            </p>
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ width: 300, flexShrink: 0, position: "sticky", top: 24 }}>
          <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.1)", padding: 24 }}>
            <h3 style={{ color: "#E8913A", fontSize: 18, fontWeight: 700, marginBottom: 16, marginTop: 0 }}>Your services</h3>

            {totalServices === 0 ? (
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>No services selected yet</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {selectedServices.map((s, i) => (
                  <div key={i} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "10px 12px", borderRadius: 8,
                    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: "#fff", fontSize: 13, fontWeight: 500 }}>{s.label}</div>
                      {s.price != null && (
                        <div style={{ color: "#E8913A", fontSize: 12, fontWeight: 500, marginTop: 2 }}>${s.price.toFixed(2)}</div>
                      )}
                      {s.isCategory && (
                        <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 2 }}>Price confirmed at booking</div>
                      )}
                    </div>
                    <button onClick={() => setSelectedServices(prev => prev.filter((_, idx) => idx !== i))}
                      style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 16, padding: "0 4px", flexShrink: 0 }}>x</button>
                  </div>
                ))}
                {selectedCat?.id === "other" && otherText && (
                  <div style={{ padding: "10px 12px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Other</div>
                    <div style={{ color: "#fff", fontSize: 13, fontWeight: 500, marginTop: 2 }}>{otherText}</div>
                  </div>
                )}
              </div>
            )}

            {totalServices > 0 && (
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", marginTop: 16, paddingTop: 16 }}>
                {hasAnyPriced ? (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "#fff", fontWeight: 700, fontSize: 15 }}>
                      <span>Estimated total</span>
                      <span style={{ color: "#E8913A" }}>${totalPrice.toFixed(2)}</span>
                    </div>
                    <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 4 }}>
                      Starting at pricing. Final quote confirmed by our team.
                    </div>
                  </>
                ) : (
                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
                    We will confirm pricing when we reach out
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
