"use client";

import React from 'react';

export default function ComparativeBenchmarkDashboard({ leagueId }: { leagueId: string }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Comparative Benchmark</h2>
      <div className="p-4 border rounded bg-white">
        <p className="text-gray-700">Benchmarking for league {leagueId} coming soon.</p>
      </div>
    </div>
  );
}

