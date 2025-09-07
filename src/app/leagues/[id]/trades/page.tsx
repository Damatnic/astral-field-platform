"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface TradesPageProps {
  params: Promise<{ id: string }>;
}

export default function TradesPage({ params }: TradesPageProps) {
  const router = useRouter();
  const [leagueId, setLeagueId] = useState<string>("");

  useEffect(() => {
    params.then((resolved) => setLeagueId(resolved.id));
  }, [params]);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.push("/auth/login");
    }
  }, [router]);

  if (!leagueId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Trade Center</h1>
          <div className="bg-white shadow rounded-lg p-6">
            <p className="text-gray-700">Trade tools coming soon for league {leagueId}.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

