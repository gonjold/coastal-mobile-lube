"use client";

import AdminTopBar from "@/components/admin/AdminTopBar";

export default function CloverPage() {
  return (
    <>
      <AdminTopBar title="Clover" subtitle="Payment processing" />
      <div className="px-4 lg:px-8 py-6 max-w-[1400px] mx-auto">
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
