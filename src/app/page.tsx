"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) {
      router.push("/dashboard");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto py-14 px-6">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Astral Field</h1>
        <p className="text-gray-700 mb-8">AI-powered fantasy football platform.</p>
        <div className="flex gap-3">
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
            onClick={() => router.push("/auth/register")}
          >
            Get Started
          </button>
          <button
            className="px-4 py-2 border border-gray-300 rounded-lg"
            onClick={() => router.push("/auth/login")}
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
}

