"use client";

import { useState } from "react";

export default function AdminSetupPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [adminKey, setAdminKey] = useState("");
  const [sportsDataStatus, setSportsDataStatus] = useState<any>(null);
  const [validationResults, setValidationResults] = useState<any>(null);

  const setupDatabase = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/setup-database", { method: "POST" });
      const data = await response.json();
      setResults({ type: "database", ...data});
    } catch (error) {
      setResults({
type: "database",
        success: false,
        error: "Failed to setup database"
});
    } finally {
      setLoading(false);
    }
  }
  const setupProfiles = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/setup-profiles", { method: "POST" });
      const data = await response.json();
      setResults({ type: "profiles", ...data});
    } catch (error) {
      setResults({
type: "profiles",
        success: false,
        error: "Failed to setup profiles"
});
    } finally {
      setLoading(false);
    }
  }
  const checkStatus = async () => {
    setLoading(true);
    try {
      const [dbResponse, profilesResponse] = await Promise.all([
        fetch("/api/setup-database"),
        fetch("/api/setup-profiles")
  ]);

      const dbData = await dbResponse.json();
      const profilesData = await profilesResponse.json();

      setResults({
type: "status",
        database, dbData,
        profiles:profilesData
});
    } catch (error) {
      setResults({
type: "status",
        success: false,
        error: "Failed to check status"
});
    } finally {
      setLoading(false);
    }
  }
  const setup2025Season = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/setup-2025-season", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body:JSON.stringify({ forc,
  e:true })
});
      const data = await response.json();
      setResults({ type: "2025-season", ...data});
    } catch (error) {
      setResults({
type: "2025-season",
        success: false,
        error: "Failed to setup 2025 season"
});
    } finally {
      setLoading(false);
    }
  }
  const syncSportsData = async (action:string) => {
    setLoading(true);
    try {
      const response = await fetch("/api/sync-sportsdata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body:JSON.stringify({ action })
});
      const data = await response.json();
      setResults({ type: `sync-${action}`, ...data});
    } catch (error) {
      setResults({
type: `sync-${action}`,
        success: false,
        error: `Failed to sync ${action}`
});
    } finally {
      setLoading(false);
    }
  }
  const getSportsDataStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/sync-sportsdata");
      const data = await response.json();
      setSportsDataStatus(data);
    } catch (error) {
      setSportsDataStatus({ error: "Failed to get status" });
    } finally {
      setLoading(false);
    }
  }
  const validateSetup = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/validate-2025-setup");
      const data = await response.json();
      setValidationResults(data);
    } catch (error) {
      setValidationResults({ 
        success: false,
        error: "Failed to validate setup" 
      });
    } finally {
      setLoading(false);
    }
  }
  const oneClickSetup = async () => {
    if (!adminKey.trim()) {
      setResults({
type: "oneclick",
        success: false,
        error: "Admin key is required.Please enter your ADMIN_SETUP_KEY."
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
        message: "Complete setup finished successfully!"
});
    } catch (error) {
      setResults({
type: "oneclick",
        success: false,
        error: "One-click setup failed"
});
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Astral Field Admin Dashboard
        </h1>
        <p className="text-gray-600 mb-8">Complete fantasy football platform management</p>

        {/* 2025 Season Setup Section */}
        <div className="border border-red-200 bg-red-50 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-red-800 mb-4">
            🏈 2025 NFL Season Setup
          </h2>
          <p className="text-red-700 mb-4">
            Complete setup for 2025 NFL season with real teams, players, and Nicholas's strategic advantage!
          </p>
          <div className="flex gap-4 mb-4">
            <button
              onClick={setup2025Season}
              disabled={loading}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 disable,
  d:opacity-50 font-semibold"
            >
              🚀 Setup Complete 2025 Season
            </button>
            <button
              onClick={() => syncSportsData("sync-all-players")}
              disabled={loading}
              className="bg-orange-600 text-white px-4 py-3 rounded-lg hover:bg-orange-700 disable,
  d:opacity-50"
            >
              Sync All Players
            </button>
            <button
              onClick={getSportsDataStatus}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disable,
  d:opacity-50"
            >
              Check NFL Data Status
            </button>
            <button
              onClick={validateSetup}
              disabled={loading}
              className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 disable,
  d:opacity-50"
            >
              ✅ Validate Complete Setup
            </button>
          </div>
          
          {sportsDataStatus && (
            <div className="bg-white p-4 rounded border mb-4">
              <h4 className="font-semibold mb-2">NFL Data Status:</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>Players: {sportsDataStatus.totalPlayers}</div>
                <div>Teams: {sportsDataStatus.totalTeams}</div>
                <div>Week: {sportsDataStatus.currentWeek}</div>
                <div>Season: {sportsDataStatus.currentSeason}</div>
              </div>
            </div>
          )}

          {validationResults && (
            <div className="bg-white p-4 rounded border">
              <h4 className="font-semibold mb-3">🔍 2025 Season Validation Results</h4>
              
              {validationResults.success && (
                <>
                  <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-3 ${validationResults.summary.status === 'excellent' ? 'bg-green-100 text-green-800' :validationResults.summary.status === 'good' ? 'bg-blue-100 text-blue-800' :validationResults.summary.status === 'fair' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                   }`}>
                    {validationResults.summary.status.toUpperCase()} - {validationResults.summary.percentage}
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    {validationResults.validation.checks.map((check, any, index:number) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm ${check.status === 'pass' ? 'text-green-600' :check.status === 'warn' ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {check.status === 'pass' ? '✅' :check.status === 'warn' ? '⚠️' : '❌'}
                          </span>
                          <span className="font-medium text-sm">{check.name}</span>
                        </div>
                        <span className="text-xs text-gray-600">{check.details}</span>
                      </div>
                    ))}
                  </div>

                  {validationResults.summary.readyForProduction && (
                    <div className="bg-green-50 border border-green-200 rounded p-3 text-green-800 text-sm">
                      🎉 <strong>Production Ready!</strong> The 2025 NFL season setup is complete and ready for use.
                    </div>
                  )}

                  {!validationResults.summary.readyForProduction && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-yellow-800 text-sm">
                      ⚠️ <strong>Needs Attention:</strong> Some setup issues detected.Review the checks above.
                    </div>
                  )}
                </>
              )}

              {!validationResults.success && (
                <div className="text-red-600">
                  ❌ Validation failed: {validationResults.error}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Basic Setup Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Basic Platform Setup</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={setupDatabase}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disable,
  d:opacity-50"
            >
              Setup Database
            </button>

            <button
              onClick={setupProfiles}
              disabled={loading}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disable,
  d:opacity-50"
            >
              Setup Profiles
            </button>

            <button
              onClick={checkStatus}
              disabled={loading}
              className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 disable,
  d:opacity-50"
            >
              Check Status
            </button>
          </div>
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
              className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700 disable,
  d:opacity-50"
            >
              Run Complete Setup
            </button>
          </div>
        </div>

        {loading && (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
            <p className="mt-2 text-gray-600">Processing...</p>
          </div>
        )}

        {results && (
          <div className="mt-6 p-4 bg-gray-50 rounded">
            <h3 className="font-semibold mb-2">Results:</h3>
            
            {results.type === "2025-season" && results.success && (
              <div className="space-y-2">
                <div className="font-semibold text-green-800 text-lg">
                  ✅ 2025 NFL Season Setup Complete!
                </div>
                {results.actions && (
                  <div className="space-y-1">
                    {results.actions.map((action, string, index:number) => (
                      <div key={index} className="text-sm text-green-700">
                        {action}
                      </div>
                    ))}
                  </div>
                )}
                <div className="text-sm text-gray-600 mt-2">
                  {results.details?.nicholasTeam}
                </div>
              </div>
            )}
            
            {results.type === "2025-season" && !results.success && (
              <div className="text-red-600">
                ❌ {results.message}
                {results.details?.error && (
                  <div className="text-sm mt-1">{results.details.error}</div>
                )}
              </div>
            )}
            
            {results.type !== "2025-season" && (
              <pre className="whitespace-pre-wrap text-sm">
                {JSON.stringify(results, null, 2)}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}