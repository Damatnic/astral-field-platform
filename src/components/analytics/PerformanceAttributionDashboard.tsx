"use client";

import React from 'react';

export default function PerformanceAttributionDashboard({ leagueId }: { leagueId: string }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Performance Attribution</h2>
      <div className="p-4 border rounded bg-white">
        <p className="text-gray-700">Attribution analysis for league {leagueId} coming soon.</p>
      </div>
    </div>
  );
}

