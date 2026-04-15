"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

interface FeeSettingsProps {
  onToast: (message: string, type?: "success" | "info") => void;
}

export default function FeeSettings({ onToast }: FeeSettingsProps) {
  const [feeSettings, setFeeSettings] = useState({
    enabled: true,
    amount: 39.95,
    label: "Mobile Service Fee",
    taxable: false,
    waiveFirstService: true,
    promoOverride: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadFees = async () => {
      try {
        const feeDoc = await getDoc(doc(db, "settings", "fees"));
        if (feeDoc.exists()) {
          const data = feeDoc.data();
          setFeeSettings({
            enabled: data.convenienceFee?.enabled ?? true,
            amount: data.convenienceFee?.amount ?? 39.95,
            label: data.convenienceFee?.label ?? "Mobile Service Fee",
            taxable: data.convenienceFee?.taxable ?? false,
            waiveFirstService: data.convenienceFee?.waiveFirstService ?? true,
            promoOverride: data.convenienceFee?.promoOverride ?? false,
          });
        }
      } catch (err) {
        console.error("Failed to load fee settings:", err);
      }
      setLoading(false);
    };
    loadFees();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(
        doc(db, "settings", "fees"),
        { convenienceFee: feeSettings },
        { merge: true }
      );
      onToast("Fee settings saved");
    } catch (err) {
      console.error("Failed to save fee settings:", err);
    }
    setSaving(false);
  };

  const labelSt: React.CSSProperties = {
    display: "block",
    fontSize: 12,
    fontWeight: 700,
    color: "#6B7280",
    textTransform: "uppercase",
    marginBottom: 4,
  };

  return (
    <div
      id="fees"
      style={{
        marginTop: 32,
        background: "#FFFFFF",
        border: "1px solid #E5E7EB",
        borderRadius: 12,
        padding: 24,
      }}
    >
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0B2040", marginBottom: 16 }}>
        Service Fees
      </h2>

      {loading ? (
        <p style={{ fontSize: 14, color: "#6B7280" }}>Loading...</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <FeeRow
            title="Mobile Service Fee"
            desc="Charge a fee for mobile service visits"
            on={feeSettings.enabled}
            onToggle={() => setFeeSettings((p) => ({ ...p, enabled: !p.enabled }))}
          />

          {feeSettings.enabled && (
            <>
              <div>
                <label style={labelSt}>Fee Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={feeSettings.amount}
                  onChange={(e) =>
                    setFeeSettings((p) => ({ ...p, amount: parseFloat(e.target.value) || 0 }))
                  }
                  style={{ width: 192, border: "1px solid #E5E7EB", borderRadius: 8, padding: "8px 12px", fontSize: 14 }}
                />
              </div>
              <div>
                <label style={labelSt}>Display Label</label>
                <input
                  type="text"
                  value={feeSettings.label}
                  onChange={(e) => setFeeSettings((p) => ({ ...p, label: e.target.value }))}
                  placeholder="e.g. Mobile Service Fee, Convenience Fee"
                  style={{ width: "100%", maxWidth: 384, border: "1px solid #E5E7EB", borderRadius: 8, padding: "8px 12px", fontSize: 14 }}
                />
              </div>
              <FeeRow
                title="Waive for first-time customers"
                desc="New customers get the fee waived on their first booking"
                on={feeSettings.waiveFirstService}
                onToggle={() => setFeeSettings((p) => ({ ...p, waiveFirstService: !p.waiveFirstService }))}
              />
              <FeeRow
                title="Include in tax calculation"
                desc="Whether the fee is subject to sales tax"
                on={feeSettings.taxable}
                onToggle={() => setFeeSettings((p) => ({ ...p, taxable: !p.taxable }))}
              />
            </>
          )}

          <div style={{ paddingTop: 8 }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: "10px 24px",
                background: "#E07B2D",
                color: "#FFF",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                border: "none",
                cursor: saving ? "default" : "pointer",
                opacity: saving ? 0.5 : 1,
              }}
            >
              {saving ? "Saving..." : "Save Fee Settings"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function FeeRow({
  title,
  desc,
  on,
  onToggle,
}: {
  title: string;
  desc: string;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div>
        <p style={{ fontSize: 14, fontWeight: 600, color: "#0B2040" }}>{title}</p>
        <p style={{ fontSize: 12, color: "#6B7280" }}>{desc}</p>
      </div>
      <button
        onClick={onToggle}
        style={{
          position: "relative",
          display: "inline-flex",
          height: 24,
          width: 44,
          alignItems: "center",
          borderRadius: 12,
          border: "none",
          cursor: "pointer",
          background: on ? "#1A5FAC" : "#E5E7EB",
          transition: "background 0.2s",
        }}
      >
        <span
          style={{
            display: "inline-block",
            height: 16,
            width: 16,
            borderRadius: 8,
            background: "#FFF",
            boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
            transform: on ? "translateX(24px)" : "translateX(4px)",
            transition: "transform 0.2s",
          }}
        />
      </button>
    </div>
  );
}
