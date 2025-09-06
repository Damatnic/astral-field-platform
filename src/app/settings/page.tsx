'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Settings, User, Shield, Bell, Moon, Globe, ArrowLeft } from 'lucide-react';
import MFASettings from '@/components/features/auth/MFASettings';

export default function SettingsPage() {
  const router = useRouter();
  const { user, checkAuth } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'preferences', label: 'Preferences', icon: Settings },
  ];

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    setLoading(false);
  }, [user, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center space-x-3">
              <Settings className="h-6 w-6 text-blue-400" />
              <h1 className="text-2xl font-bold text-white">Settings</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <nav className="space-y-1 bg-gray-800 rounded-lg p-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 text-left rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  <tab.icon className="h-5 w-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="bg-gray-800 rounded-lg p-6">
                  <h2 className="text-xl font-semibold text-white mb-6">Profile Information</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={user.username}
                        readOnly
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={user.email}
                        readOnly
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        User ID
                      </label>
                      <input
                        type="text"
                        value={user.id}
                        readOnly
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-700">
                    <p className="text-gray-400 text-sm">
                      Profile information is managed through the authentication system. 
                      Contact support if you need to make changes.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <MFASettings />
                
                <div className="bg-gray-800 rounded-lg p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">Password</h2>
                  <p className="text-gray-400 mb-4">
                    Password management is handled through the authentication system.
                  </p>
                  <button className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors">
                    Change Password
                  </button>
                </div>

                <div className="bg-gray-800 rounded-lg p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">Active Sessions</h2>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                      <div>
                        <p className="text-white font-medium">Current Session</p>
                        <p className="text-gray-400 text-sm">
                          {new Date().toLocaleString()} • Windows • Chrome
                        </p>
                      </div>
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded">
                        Current
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div className="bg-gray-800 rounded-lg p-6">
                  <h2 className="text-xl font-semibold text-white mb-6">Notification Preferences</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-white mb-4">Fantasy Football</h3>
                      <div className="space-y-3">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            defaultChecked
                            className="rounded border-gray-600 text-blue-600 focus:ring-blue-500 bg-gray-700"
                          />
                          <span className="ml-3 text-gray-300">Draft notifications</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            defaultChecked
                            className="rounded border-gray-600 text-blue-600 focus:ring-blue-500 bg-gray-700"
                          />
                          <span className="ml-3 text-gray-300">Trade proposals</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            defaultChecked
                            className="rounded border-gray-600 text-blue-600 focus:ring-blue-500 bg-gray-700"
                          />
                          <span className="ml-3 text-gray-300">Waiver wire results</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            defaultChecked
                            className="rounded border-gray-600 text-blue-600 focus:ring-blue-500 bg-gray-700"
                          />
                          <span className="ml-3 text-gray-300">Weekly matchup reminders</span>
                        </label>
                      </div>
                    </div>

                    <div className="border-t border-gray-700 pt-6">
                      <h3 className="text-lg font-medium text-white mb-4">Security</h3>
                      <div className="space-y-3">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            defaultChecked
                            className="rounded border-gray-600 text-blue-600 focus:ring-blue-500 bg-gray-700"
                          />
                          <span className="ml-3 text-gray-300">Login alerts</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            defaultChecked
                            className="rounded border-gray-600 text-blue-600 focus:ring-blue-500 bg-gray-700"
                          />
                          <span className="ml-3 text-gray-300">Security notifications</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <div className="bg-gray-800 rounded-lg p-6">
                  <h2 className="text-xl font-semibold text-white mb-6">Application Preferences</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Theme
                      </label>
                      <select className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <option value="dark">Dark Mode</option>
                        <option value="light">Light Mode</option>
                        <option value="auto">Auto (System)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Time Zone
                      </label>
                      <select className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <option value="auto">Auto-detect</option>
                        <option value="US/Eastern">Eastern Time</option>
                        <option value="US/Central">Central Time</option>
                        <option value="US/Mountain">Mountain Time</option>
                        <option value="US/Pacific">Pacific Time</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Default League View
                      </label>
                      <select className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <option value="dashboard">Dashboard</option>
                        <option value="standings">Standings</option>
                        <option value="analytics">Analytics</option>
                      </select>
                    </div>

                    <div className="border-t border-gray-700 pt-6">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="rounded border-gray-600 text-blue-600 focus:ring-blue-500 bg-gray-700"
                        />
                        <span className="ml-3 text-gray-300">Enable advanced analytics</span>
                      </label>
                    </div>

                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="rounded border-gray-600 text-blue-600 focus:ring-blue-500 bg-gray-700"
                        />
                        <span className="ml-3 text-gray-300">Show AI recommendations</span>
                      </label>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-700">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      Save Preferences
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}