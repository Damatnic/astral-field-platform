"use client";

import React, { useState } from 'react';

export default function SportsDataSync() {
  const [status, setStatus] = useState<string>("");
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">SportsData.io Integration</h2>
      <div className="p-4 border rounded bg-white">
        <p className="text-gray-700 mb-3">Sync tools coming soon.</p>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded"
          onClick={() => setStatus("Sync started (demo)")}
        >
          Start Demo Sync
        </button>
        {status && <p className="mt-2 text-sm text-gray-600">{status}</p>}
      </div>
    </div>
  );
}

