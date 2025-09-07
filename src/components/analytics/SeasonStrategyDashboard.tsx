"use client";

import React from "react";

export default function SeasonStrategyDashboard({
  leagueId,
}: {
  leagueId: string;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Season Strategy</h2>
      <div className="p-4 border rounded bg-white">
        <p className="text-gray-700">
          Strategy dashboard for league {leagueId} coming soon.
        </p>
      </div>
    </div>
  );
}
