"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const profiles = [
  { id: 1, name: "Nicholas", color: "bg-blue-500", icon: "👤" },
  { id: 2, name: "Brittany", color: "bg-green-500", icon: "👥" },
  { id: 3, name: "Cason", color: "bg-purple-500", icon: "🏈" },
  { id: 4, name: "David", color: "bg-red-500", icon: "⭐" },
  { id: 5, name: "Demo 1", color: "bg-yellow-500", icon: "🏆" },
  { id: 6, name: "Demo 2", color: "bg-pink-500", icon: "🎯" },
  { id: 7, name: "Demo 3", color: "bg-indigo-500", icon: "🚀" },
  { id: 8, name: "Demo 4", color: "bg-orange-500", icon: "🔥" },
  { id: 9, name: "Demo 5", color: "bg-teal-500", icon: "💎" },
  { id: 10, name: "Admin", color: "bg-gray-700", icon: "👑" },
];

export default function HomePage() {
  const router = useRouter();
  const [selectedProfile, setSelectedProfile] = useState<number | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleProfileSelect = (profileId: number) => {
    setSelectedProfile(profileId);
    setPin("");
    setError("");
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (pin.length !== 4) {
      setError("PIN must be 4 digits");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Call the quick-login API with profile ID and PIN
      const response = await fetch("/api/quick-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: selectedProfile,
          pin: pin,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Store the token and redirect to dashboard
        localStorage.setItem("token", data.token);
        localStorage.setItem("userId", data.userId);
        localStorage.setItem("profileId", String(selectedProfile));
        router.push("/dashboard");
      } else {
        setError(data.error || "Invalid PIN");
        setPin("");
      }
    } catch (err) {
      setError("Authentication failed. Please try again.");
      setPin("");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinChange = (value: string) => {
    // Only allow digits and max 4 characters
    if (/^\d*$/.test(value) && value.length <= 4) {
      setPin(value);
      setError("");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="max-w-6xl mx-auto py-12 px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">🏈 Astral Field</h1>
          <p className="text-xl text-gray-300">AI-powered fantasy football platform</p>
        </div>

        {!selectedProfile ? (
          <>
            {/* Profile Selection */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 shadow-2xl">
              <h2 className="text-2xl font-semibold text-white mb-6 text-center">
                Select Your Profile
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {profiles.map((profile) => (
                  <button
                    key={profile.id}
                    onClick={() => handleProfileSelect(profile.id)}
                    className={`${profile.color} hover:opacity-90 transition-all transform hover:scale-105 rounded-xl p-6 text-white shadow-lg`}
                  >
                    <div className="text-4xl mb-2">{profile.icon}</div>
                    <div className="font-semibold">{profile.name}</div>
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* PIN Entry */}
            <div className="max-w-md mx-auto">
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 shadow-2xl">
                <button
                  onClick={() => setSelectedProfile(null)}
                  className="text-gray-400 hover:text-white mb-4 flex items-center gap-2"
                >
                  ← Back to profiles
                </button>

                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 shadow-lg"
                       style={{ backgroundColor: profiles[selectedProfile - 1].color.replace('bg-', '#').replace('500', '500') }}>
                    <span className="text-4xl">
                      {profiles.find(p => p.id === selectedProfile)?.icon}
                    </span>
                  </div>
                  <h2 className="text-2xl font-semibold text-white">
                    {profiles.find(p => p.id === selectedProfile)?.name}
                  </h2>
                  <p className="text-gray-400 mt-2">Enter your 4-digit PIN</p>
                </div>

                <form onSubmit={handlePinSubmit} className="space-y-6">
                  <div>
                    <input
                      type="password"
                      inputMode="numeric"
                      pattern="\d{4}"
                      maxLength={4}
                      value={pin}
                      onChange={(e) => handlePinChange(e.target.value)}
                      className="w-full text-center text-3xl font-mono tracking-widest bg-gray-700 text-white rounded-lg px-4 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="• • • •"
                      autoFocus
                    />
                  </div>

                  {error && (
                    <div className="text-red-400 text-sm text-center">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={pin.length !== 4 || isLoading}
                    className={`w-full py-3 rounded-lg font-semibold transition-all ${
                      pin.length === 4 && !isLoading
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "bg-gray-700 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    {isLoading ? "Authenticating..." : "Sign In"}
                  </button>

                  {/* PIN Keypad */}
                  <div className="grid grid-cols-3 gap-2 mt-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => handlePinChange(pin + num)}
                        className="bg-gray-700 hover:bg-gray-600 text-white text-xl font-semibold py-3 rounded-lg transition-all"
                      >
                        {num}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setPin("")}
                      className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold py-3 rounded-lg transition-all"
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePinChange(pin + "0")}
                      className="bg-gray-700 hover:bg-gray-600 text-white text-xl font-semibold py-3 rounded-lg transition-all"
                    >
                      0
                    </button>
                    <button
                      type="button"
                      onClick={() => setPin(pin.slice(0, -1))}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-semibold py-3 rounded-lg transition-all"
                    >
                      ←
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </>
        )}

        {/* Quick Access Info */}
        <div className="mt-12 text-center text-gray-400 text-sm">
          <p>Quick access profiles • Each profile uses a 4-digit PIN</p>
          <p className="mt-2">Enter your secure PIN to access your profile</p>
        </div>
      </div>
    </div>
  );
}