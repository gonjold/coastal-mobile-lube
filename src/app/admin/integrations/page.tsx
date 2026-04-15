"use client";

import { useState, useEffect } from "react";
import AdminTopBar from "@/components/admin/AdminTopBar";
import { db } from "@/lib/firebase";
import { doc, getDoc, deleteDoc } from "firebase/firestore";

export default function IntegrationsPage() {
  const [qbConnected, setQbConnected] = useState(false);
  const [qbRealmId, setQbRealmId] = useState("");
  const [qbConnectedDate, setQbConnectedDate] = useState("");
  const [qbLoading, setQbLoading] = useState(true);

  useEffect(() => {
    const loadQB = async () => {
      try {
        const qbDoc = await getDoc(doc(db, "settings", "quickbooks"));
        if (qbDoc.exists()) {
          const data = qbDoc.data();
          if (data.accessToken) {
            setQbConnected(true);
            setQbRealmId(data.realmId || "");
            setQbConnectedDate(
              data.connectedAt
                ? new Date(data.connectedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
                : ""
            );
          }
        }
      } catch (err) {
        console.error("Failed to load QB status:", err);
      }
      setQbLoading(false);
    };
    loadQB();
  }, []);

  const handleDisconnectQB = async () => {
    try {
      await deleteDoc(doc(db, "settings", "quickbooks"));
      setQbConnected(false);
      setQbRealmId("");
      setQbConnectedDate("");
    } catch (err) {
      console.error("Failed to disconnect QB:", err);
    }
  };

  return (
    <>
      <AdminTopBar title="Integrations" subtitle="Connected services" />
      <div className="px-4 lg:px-8 py-6 max-w-[1400px] mx-auto space-y-6">
        {/* QuickBooks */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-lg font-bold text-[#0B2040] mb-4">QuickBooks Online</h2>

          {qbLoading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : qbConnected ? (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500" />
                <span className="text-sm font-semibold text-green-700">Connected</span>
                <span className="text-xs text-gray-500 ml-2">Company ID: {qbRealmId}</span>
              </div>
              {qbConnectedDate && (
                <p className="text-xs text-gray-500 mb-3">Connected on {qbConnectedDate}</p>
              )}
              <p className="text-sm text-gray-600 mb-4">
                Invoices created in the admin portal will automatically sync to QuickBooks.
                Customer payments through QuickBooks update invoice status automatically.
              </p>
              <button
                onClick={handleDisconnectQB}
                className="px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-50"
              >
                Disconnect QuickBooks
              </button>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Connect QuickBooks to automatically sync invoices and receive payment notifications.
              </p>
              <a
                href="https://us-east1-coastal-mobile-lube.cloudfunctions.net/qbOAuthStart"
                className="inline-block px-6 py-2.5 bg-[#2CA01C] text-white rounded-lg text-sm font-semibold hover:bg-[#248a16]"
              >
                Connect to QuickBooks
              </a>
            </div>
          )}
        </div>

        {/* Divider */}
        <hr className="border-gray-200" />

        {/* Clover */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-lg font-bold text-[#0B2040] mb-4">Clover Commerce Sync</h2>
          <p className="text-sm text-gray-600 mb-4">
            Sync Clover Go card swipes to QuickBooks automatically. Follow these steps from your Clover web dashboard:
          </p>
          <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
            <li>Log into <span className="font-semibold">clover.com</span></li>
            <li>Go to <span className="font-semibold">More Tools</span></li>
            <li>Search for <span className="font-semibold">&quot;QuickBooks by Commerce Sync&quot;</span></li>
            <li>Install the app (Essentials plan, ~$19/mo)</li>
            <li>Connect to your QuickBooks account when prompted</li>
          </ol>
          <p className="text-xs text-gray-500 mt-3">
            Commerce Sync automatically transfers daily Clover sales to QuickBooks each night.
          </p>
        </div>
      </div>
    </>
  );
}
