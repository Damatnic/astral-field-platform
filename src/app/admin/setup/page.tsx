"use client";

import { useState } from "react";

export default function AdminSetupPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [adminKey, setAdminKey] = useState("");

  const setupDatabase = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/setup-database", { method: "POST" });
      const data = await response.json();
      setResults({ type: "database", ...data });
    } catch (error) {
      setResults({
        type: "database",
        success: false,
        error: "Failed to setup database",
      });
    } finally {
      setLoading(false);
    }
  };

  const setupProfiles = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/setup-profiles", { method: "POST" });
      const data = await response.json();
      setResults({ type: "profiles", ...data });
    } catch (error) {
      setResults({
        type: "profiles",
        success: false,
        error: "Failed to setup profiles",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = async () => {
    setLoading(true);
    try {
      const [dbResponse, profilesResponse] = await Promise.all([
        fetch("/api/setup-database"),
        fetch("/api/setup-profiles"),
      ]);

      const dbData = await dbResponse.json();
      const profilesData = await profilesResponse.json();

      setResults({
        type: "status",
        database: dbData,
        profiles: profilesData,
      });
    } catch (error) {
      setResults({
        type: "status",
        success: false,
        error: "Failed to check status",
      });
    } finally {
      setLoading(false);
    }
  };

  const oneClickSetup = async () => {
    if (!adminKey.trim()) {
      setResults({
        type: "oneclick",
        success: false,
        error: "Admin key is required. Please enter your ADMIN_SETUP_KEY.",
      });
      return;
    }

    setLoading(true);
    try {
      // Setup database
      await fetch("/api/setup-database", { method: "POST" });

      // Setup profiles
      await fetch("/api/setup-profiles", { method: "POST" });

      setResults({
        type: "oneclick",
        success: true,
        message: "Complete setup finished successfully!",
      });
    } catch (error) {
      setResults({
        type: "oneclick",
        success: false,
        error: "One-click setup failed",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Admin Setup Dashboard
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <button
            onClick={setupDatabase}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Setup Database
          </button>

          <button
            onClick={setupProfiles}
            disabled={loading}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
          >
            Setup Profiles
          </button>

          <button
            onClick={checkStatus}
            disabled={loading}
            className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 disabled:opacity-50"
          >
            Check Status
          </button>
        </div>

        <div className="border-t pt-6">
          <h2 className="text-lg font-semibold mb-4">One-Click Setup</h2>
          <div className="flex gap-4 mb-4">
            <input
              type="password"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              placeholder="Enter ADMIN_SETUP_KEY"
              className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={oneClickSetup}
              disabled={loading}
              className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
            >
              Run Complete Setup
            </button>
          </div>
        </div>

        {loading && (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Processing...</p>
          </div>
        )}

        {results && (
          <div className="mt-6 p-4 bg-gray-50 rounded">
            <h3 className="font-semibold mb-2">Results:</h3>
            <pre className="whitespace-pre-wrap text-sm">
              {JSON.stringify(results, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
