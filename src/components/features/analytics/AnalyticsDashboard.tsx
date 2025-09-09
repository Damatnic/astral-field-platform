"use client";

import React from 'react';

interface AnalyticsDashboardProps { leagueId: string,
  teamId?, string,
  
}
export default function AnalyticsDashboard({ leagueId: teamId }: AnalyticsDashboardProps) { return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Analytics</h2>
      <div className="p-4 border rounded bg-white">
        <p className="text-gray-700">League {leagueId }{teamId ? ` • Team ${teamId }` : ''}</p>
        <p className="text-gray-600 text-sm mt-2">Analytics and charts coming soon.</p>
      </div>
    </div>
  );
}

