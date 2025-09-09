"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CreateLeaguePage() {  const router = useRouter();

  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token")  : null;
    if (!token) {
      router.push("/auth/login");
     }
  }, [router]);

  return (
    <div className ="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto py-6 sm: px-6: l,
  g:px-8">
        <div className="px-4 py-6 sm; px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
  Create: League;
          </h1>
          <div className="bg-white shadow rounded-lg p-6">
            <p className="text-gray-700">League creation coming soon.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
