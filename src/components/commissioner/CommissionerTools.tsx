'use client';

import { useState } from 'react';
import {
  Settings, Shield, Users, Calendar, BarChart3,
  DollarSign, MessageCircle, AlertTriangle, Crown,
  Edit, Trash2, Plus, Eye, Lock, Unlock,
  RefreshCw, Download, Upload, Mail, Bell,
  CheckCircle, XCircle, Clock, Target
} from 'lucide-react';

interface CommissionerToolsProps {
  leagueId: string;
}

interface LeagueSettings {
  league_name: string;
  scoring_type: string;
  roster_size: number;
  bench_size: number;
  ir_slots: number;
  trade_deadline: string;
  playoff_start_week: number;
  playoff_teams: number;
  faab_budget: number;
  max_acquisitions: number;
}

interface Team {
  id: string;
  team_name: string;
  owner_name: string;
  owner_email: string;
  is_active: boolean;
  wins: number;
  losses: number;
  ties: number;
  points_for: number;
  points_against: number;
}

interface Transaction {
  id: string;
  type: 'trade' | 'waiver' | 'free_agent' | 'drop';
  status: 'pending' | 'approved' | 'vetoed';
  team_name: string;
  details: string;
  timestamp: string;
  requires_approval: boolean;
}

export default function CommissionerTools({ leagueId }: CommissionerToolsProps) {
  const [activeTab, setActiveTab] = useState<'settings' | 'teams' | 'transactions' | 'schedule' | 'communications'>('settings');
  const [showConfirmModal, setShowConfirmModal] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Mock data - in real app, this would come from API
  const [leagueSettings, setLeagueSettings] = useState<LeagueSettings>({
    league_name: "Astral Field Fantasy League",
    scoring_type: "ppr",
    roster_size: 16,
    bench_size: 7,
    ir_slots: 2,
    trade_deadline: "2024-11-26",
    playoff_start_week: 15,
    playoff_teams: 6,
    faab_budget: 1000,
    max_acquisitions: 25
  });

  const [teams, setTeams] = useState<Team[]>([
    { id: "1", team_name: "Gridiron Gladiators", owner_name: "Nicholas D'Amato", owner_email: "nick@example.com", is_active: true, wins: 9, losses: 3, ties: 0, points_for: 1547.2, points_against: 1398.5 },
    { id: "2", team_name: "Touchdown Titans", owner_name: "Sarah Johnson", owner_email: "sarah@example.com", is_active: true, wins: 8, losses: 4, ties: 0, points_for: 1523.8, points_against: 1425.1 },
    { id: "3", team_name: "Field Goal Phantoms", owner_name: "Mike Chen", owner_email: "mike@example.com", is_active: true, wins: 8, losses: 4, ties: 0, points_for: 1489.3, points_against: 1456.2 }
  ]);

  const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>([
    {
      id: "t1",
      type: "trade",
      status: "pending",
      team_name: "Gridiron Gladiators",
      details: "Trading Tyreek Hill for Davante Adams with Touchdown Titans",
      timestamp: "2024-12-01T10:00:00Z",
      requires_approval: true
    },
    {
      id: "w1", 
      type: "waiver",
      status: "pending",
      team_name: "Field Goal Phantoms",
      details: "Claiming Jordan Mason for $15 FAAB, dropping Romeo Doubs",
      timestamp: "2024-12-01T08:30:00Z",
      requires_approval: false
    }
  ]);

  const handleSettingsChange = (field: keyof LeagueSettings, value: string | number) => {
    setLeagueSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
    alert('Settings saved successfully!');
  };

  const handleTransactionAction = async (transactionId: string, action: 'approve' | 'veto') => {
    setIsLoading(true);
    setPendingTransactions(prev => 
      prev.map(t => t.id === transactionId ? { ...t, status: action === 'approve' ? 'approved' : 'vetoed' } : t)
    );
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsLoading(false);
  };

  const handleTeamAction = (teamId: string, action: 'edit' | 'deactivate' | 'reset_password') => {
    setShowConfirmModal(`${action}-${teamId}`);
  };

  const confirmAction = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
    setShowConfirmModal(null);
    alert('Action completed successfully!');
  };

  const handleBulkEmail = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
    alert('Email sent to all league members!');
  };

  return (
    <div className="space-y-6">
      {/* Commissioner Header */}
      <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-6 text-white">
        <div className="flex items-center space-x-3">
          <Crown className="h-8 w-8" />
          <div>
            <h2 className="text-2xl font-bold">Commissioner Tools</h2>
            <p className="text-red-100">Manage your league settings, teams, and transactions</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {[
            { id: 'settings', label: 'League Settings', icon: Settings },
            { id: 'teams', label: 'Team Management', icon: Users },
            { id: 'transactions', label: 'Transactions', icon: DollarSign },
            { id: 'schedule', label: 'Schedule Tools', icon: Calendar },
            { id: 'communications', label: 'Communications', icon: MessageCircle }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === id
                  ? 'border-red-500 text-red-600 dark:text-red-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400'
              }`}
            >
              <Icon className="w-5 h-5 mr-2" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* League Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Basic League Settings
              </h3>
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <span className="text-sm text-yellow-600 dark:text-yellow-400">
                  Changes take effect immediately
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  League Name
                </label>
                <input
                  type="text"
                  value={leagueSettings.league_name}
                  onChange={(e) => handleSettingsChange('league_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Scoring Type
                </label>
                <select
                  value={leagueSettings.scoring_type}
                  onChange={(e) => handleSettingsChange('scoring_type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="standard">Standard</option>
                  <option value="ppr">PPR</option>
                  <option value="half_ppr">Half PPR</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Roster Size
                </label>
                <input
                  type="number"
                  value={leagueSettings.roster_size}
                  onChange={(e) => handleSettingsChange('roster_size', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Bench Size
                </label>
                <input
                  type="number"
                  value={leagueSettings.bench_size}
                  onChange={(e) => handleSettingsChange('bench_size', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Trade Deadline
                </label>
                <input
                  type="date"
                  value={leagueSettings.trade_deadline}
                  onChange={(e) => handleSettingsChange('trade_deadline', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  FAAB Budget
                </label>
                <input
                  type="number"
                  value={leagueSettings.faab_budget}
                  onChange={(e) => handleSettingsChange('faab_budget', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSaveSettings}
                disabled={isLoading}
                className="inline-flex items-center px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Team Management Tab */}
      {activeTab === 'teams' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Team Management
                </h3>
                <button className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Team
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Team
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Owner
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Record
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {teams.map((team) => (
                    <tr key={team.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {team.team_name.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {team.team_name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">{team.owner_name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{team.owner_email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {team.wins}-{team.losses}-{team.ties}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {team.points_for.toFixed(1)} PF
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          team.is_active 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                        }`}>
                          {team.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleTeamAction(team.id, 'edit')}
                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleTeamAction(team.id, 'reset_password')}
                            className="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400"
                          >
                            <Lock className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleTeamAction(team.id, 'deactivate')}
                            className="text-red-600 hover:text-red-900 dark:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Pending Transactions
            </h3>
            
            <div className="space-y-4">
              {pendingTransactions.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No pending transactions</p>
                </div>
              ) : (
                pendingTransactions.map((transaction) => (
                  <div key={transaction.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                            transaction.type === 'trade' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' :
                            transaction.type === 'waiver' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {transaction.type.toUpperCase()}
                          </span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {transaction.team_name}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(transaction.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {transaction.details}
                        </p>
                      </div>
                      
                      {transaction.status === 'pending' && transaction.requires_approval && (
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => handleTransactionAction(transaction.id, 'approve')}
                            disabled={isLoading}
                            className="inline-flex items-center px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleTransactionAction(transaction.id, 'veto')}
                            disabled={isLoading}
                            className="inline-flex items-center px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Veto
                          </button>
                        </div>
                      )}
                      
                      {transaction.status !== 'pending' && (
                        <span className={`px-3 py-1 text-sm rounded-full font-medium ${
                          transaction.status === 'approved' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                        }`}>
                          {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Schedule Tools Tab */}
      {activeTab === 'schedule' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Schedule Management
              </h3>
              <div className="space-y-4">
                <button className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Regenerate Schedule
                </button>
                <button className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  <Download className="h-4 w-4 mr-2" />
                  Export Schedule
                </button>
                <button className="w-full flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                  <Calendar className="h-4 w-4 mr-2" />
                  Adjust Playoff Dates
                </button>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Scoring Adjustments
              </h3>
              <div className="space-y-4">
                <button className="w-full flex items-center justify-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors">
                  <Edit className="h-4 w-4 mr-2" />
                  Manual Score Edit
                </button>
                <button className="w-full flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Apply Stat Corrections
                </button>
                <button className="w-full flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Reset Week Scores
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Communications Tab */}
      {activeTab === 'communications' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              League Communications
            </h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Send Message to League
                </label>
                <textarea
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter your message to all league members..."
                />
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded" />
                      <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Email notification</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded" />
                      <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Push notification</span>
                    </label>
                  </div>
                  <button
                    onClick={handleBulkEmail}
                    disabled={isLoading}
                    className="inline-flex items-center px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    {isLoading ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Mail className="h-4 w-4 mr-2" />
                    )}
                    Send Message
                  </button>
                </div>
              </div>
              
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                  Quick Actions
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <Bell className="h-4 w-4 mr-2" />
                    Playoff Reminder
                  </button>
                  <button className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    <Target className="h-4 w-4 mr-2" />
                    Trade Deadline Alert
                  </button>
                  <button className="flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                    <Clock className="h-4 w-4 mr-2" />
                    Lineup Reminder
                  </button>
                  <button className="flex items-center justify-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors">
                    <DollarSign className="h-4 w-4 mr-2" />
                    FAAB Balance Alert
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-yellow-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Confirm Action
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to perform this action? This cannot be undone.
            </p>
            <div className="flex items-center justify-end space-x-4">
              <button
                onClick={() => setShowConfirmModal(null)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                disabled={isLoading}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {isLoading ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}