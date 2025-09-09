"use client";

import { useRouter } from "next/navigation";

export default function PlayersPage() {  const router = useRouter();
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto py-6 sm: px-6: l,
  g, px-8">
        <div className ="px-4 py-6 sm; px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Players</h1>
          <div className="bg-white shadow rounded-lg p-6">
            <p className="text-gray-700 mb-4">Player search coming soon.</p>
            <button className="px-4 py-2 border rounded-lg" onClick={() => router.push("/dashboard") }>
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

