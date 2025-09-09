'use client';

import { useState } from 'react';
import {
  Settings, Shield, Users, Calendar, BarChart3, DollarSign, MessageCircle, AlertTriangle, Crown, Edit, Trash2, Plus, Eye, Lock, Unlock, RefreshCw, Download, Upload, Mail, Bell,
  CheckCircle, XCircle, Clock, Target, TrendingUp, Award, FileText, Database, Activity, Zap,
  UserCheck, Ban, AlertCircle, Filter, Search, MoreHorizontal, ChevronDown, ChevronUp, Star, History, Gavel, Users2, Scale, ExternalLink
} from 'lucide-react';

interface CommissionerToolsProps {
  leagueId, string,
  
}
interface LeagueSettings {
  league_name, string,
    scoring_type, string,
  roster_size, number,
    bench_size, number,
  ir_slots, number,
    trade_deadline, string,
  playoff_start_week, number,
    playoff_teams, number,
  faab_budget, number,
    max_acquisitions, number,
}

interface Team {
  id, string,
    team_name, string,
  owner_name, string,
    owner_email, string,
  is_active: boolean,
    wins, number,
  losses, number,
    ties, number,
  points_for, number,
    points_against, number,
  
}
interface Transaction {
  id, string,
    type: 'trade' | 'waiver' | 'free_agent' | 'drop';
  status: 'pending' | 'approved' | 'vetoed',
    team_name, string,
  details, string,
    timestamp, string,
  requires_approval, boolean,
}

export default function CommissionerTools({ leagueId }:CommissionerToolsProps) { const [activeTab, setActiveTab] = useState<'settings' | 'teams' | 'transactions' | 'schedule' | 'communications' | 'analytics' | 'moderation' | 'automation'>('settings');
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
    { id: "1",
  team_name: "Gridiron Gladiators", owner_name: "Nicholas D'Amato",
  owner_email: "nick@example.com", is_active: true,
  wins: 9, losses: 3,
  ties: 0, points_for: 1547.2,
  points_against: 1398.5 },
    { id: "2",
  team_name: "Touchdown Titans", owner_name: "Sarah Johnson",
  owner_email: "sarah@example.com", is_active: true,
  wins: 8, losses: 4,
  ties: 0, points_for: 1523.8,
  points_against: 1425.1 },
    { id: "3",
  team_name: "Field Goal Phantoms", owner_name: "Mike Chen",
  owner_email: "mike@example.com", is_active: true,
  wins: 8, losses: 4,
  ties: 0, points_for: 1489.3,
  points_against: 1456.2 }
  ]);

  const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>([
    {
      id: "t1",
type: "trade",
      status: "pending",
  team_name: "Gridiron Gladiators",
      details: "Trading Tyreek Hill for Davante Adams with Touchdown Titans",
  timestamp: "2024-12-01T10:00:00Z",
  requires_approval:true
    },
    {
      id: "w1",
type: "waiver",
      status: "pending",
  team_name: "Field Goal Phantoms",
      details: "Claiming Jordan Mason for $15 FAAB, dropping Romeo Doubs",
      timestamp: "2024-12-01T08:30:00Z",
  requires_approval:false
    }
  ]);

  const handleSettingsChange = (field:keyof LeagueSettings,
  value:string | number)  => {
    setLeagueSettings(prev => ({ ...prev, [field]:value }));
  }
  const handleSaveSettings = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
    alert('Settings saved successfully!');
  }
  const handleTransactionAction = async (transactionId, string,
  action: 'approve' | 'veto') => {
    setIsLoading(true);
    setPendingTransactions(prev => 
      prev.map(t => t.id === transactionId ? { ...t, status:action === 'approve' ? 'approved' : 'vetoed' } :t)
    );
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsLoading(false);
  }
  const handleTeamAction = (teamId, string,
  action: 'edit' | 'deactivate' | 'reset_password') => {
    setShowConfirmModal(`${action}-${teamId}`);
  }
  const confirmAction = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
    setShowConfirmModal(null);
    alert('Action completed successfully!');
  }
  const handleBulkEmail = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
    alert('Email sent to all league members!');
  }
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
            { id: 'settings',
  label: 'League Settings', icon:Settings },
            { id: 'teams',
  label: 'Team Management', icon:Users },
            { id: 'transactions',
  label: 'Transactions', icon:DollarSign },
            { id: 'schedule',
  label: 'Schedule Tools', icon:Calendar },
            { id: 'communications',
  label: 'Communications', icon:MessageCircle },
            { id: 'analytics',
  label: 'Analytics', icon:BarChart3 },
            { id: 'moderation',
  label: 'Moderation', icon:Shield },
            { id: 'automation',
  label: 'Automation', icon:Zap }
          ].map(({ id, label, icon:Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as 'transactions' | 'teams' | 'settings' | 'schedule' | 'communications' | 'analytics' | 'moderation' | 'automation')}
              className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === id
                  ? 'border-red-500 text-red-600 dark:text-red-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover.border-gray-300 dark:text-gray-400'
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
                  value={leagueSettings.league_name }
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
                className="inline-flex items-center px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled opacity-50 transition-colors"
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                ) }
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
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">,
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
                    <tr key={team.id }>
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
                          {(typeof team.points_for === 'number' ? team.points_for : 0).toFixed(1)} PF
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${team.is_active 
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
                  <div key={transaction.id } className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`px-2 py-1 text-xs rounded-full font-medium ${transaction.type === 'trade' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' :transaction.type === 'waiver' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {transaction.type.toUpperCase()}
                          </span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {transaction.team_name}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            { new Date(transaction.timestamp).toLocaleString() }
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
                            className="inline-flex items-center px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled opacity-50 transition-colors"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleTransactionAction(transaction.id, 'veto')}
                            disabled={isLoading}
                            className="inline-flex items-center px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled opacity-50 transition-colors"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Veto
                          </button>
                        </div>
                      )}
                      
                      {transaction.status !== 'pending' && (
                        <span className={`px-3 py-1 text-sm rounded-full font-medium ${transaction.status === 'approved' 
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
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">,
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
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">,
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
                <button className="w-full flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover bg-red-700 transition-colors">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Reset Week Scores
                </button>
              </div>
            </div>
          </div>
        </div>
      ) }

      {/* Communications Tab */}
      {activeTab === 'communications' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">,
    League Communications
            </h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Send Message to League
                </label>
                <textarea
                  rows={4 }
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
                    className="inline-flex items-center px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled opacity-50 transition-colors"
                  >
                    {isLoading ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Mail className="h-4 w-4 mr-2" />
                    ) }
  Send Message
                  </button>
                </div>
              </div>
              
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">,
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
                  <button className="flex items-center justify-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover bg-yellow-700 transition-colors">
                    <DollarSign className="h-4 w-4 mr-2" />
                    FAAB Balance Alert
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <AnalyticsTab leagueId={leagueId } />
      )}

      {/* Moderation Tab */}
      {activeTab === 'moderation' && (
        <ModerationTab leagueId={leagueId } />
      )}

      {/* Automation Tab */}
      {activeTab === 'automation' && (
        <AutomationTab leagueId={leagueId } />
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-yellow-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">,
    Confirm Action
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to perform this action? This cannot be undone.
            </p>
            <div className="flex items-center justify-end space-x-4">
              <button
                onClick={() => setShowConfirmModal(null) }
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                disabled={isLoading}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled opacity-50 transition-colors"
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

// Analytics Tab Component
function AnalyticsTab({  leagueId   }: {  leagueId:string   }) { const [analyticsData] = useState({
    weeklyActivity: [
      { week: 'Week 1',
  trades: 12, waivers: 34,
  lineupChanges: 89  },
      { week: 'Week 2',
  trades: 8, waivers: 28,
  lineupChanges: 76 },
      { week: 'Week 3',
  trades: 15, waivers: 31,
  lineupChanges: 82 },
      { week: 'Week 4',
  trades: 10, waivers: 25,
  lineupChanges: 73 }
  ],
    leagueHealth: {
      engagement: 87,
  activityScore: 92,
      competitiveness: 78,
  fairnessIndex: 96
    },
    teamPerformance: [
      { team: 'Gridiron Gladiators',
  efficiency: 94, consistency: 89,
  luck: 67 },
      { team: 'Touchdown Titans',
  efficiency: 88, consistency: 92,
  luck: 73 },
      { team: 'Field Goal Phantoms',
  efficiency: 82, consistency: 85,
  luck: 81 }
    ]
  });

  return (
    <div className="space-y-8">
      {/* League Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600 dark:text-green-400">,
    Engagement Score
              </p>
              <p className="text-3xl font-bold text-green-700 dark:text-green-300">
                {analyticsData.leagueHealth.engagement}%
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
          <div className="mt-4">
            <div className="w-full bg-green-200 dark:bg-green-900/30 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${analyticsData.leagueHealth.engagement}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">,
    Activity Score
              </p>
              <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                {analyticsData.leagueHealth.activityScore}%
              </p>
            </div>
            <Activity className="h-8 w-8 text-blue-500" />
          </div>
          <div className="mt-4">
            <div className="w-full bg-blue-200 dark:bg-blue-900/30 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${analyticsData.leagueHealth.activityScore}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                Competitiveness
              </p>
              <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">
                {analyticsData.leagueHealth.competitiveness}%
              </p>
            </div>
            <Target className="h-8 w-8 text-purple-500" />
          </div>
          <div className="mt-4">
            <div className="w-full bg-purple-200 dark:bg-purple-900/30 rounded-full h-2">
              <div
                className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${analyticsData.leagueHealth.competitiveness}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600 dark:text-orange-400">,
    Fairness Index
              </p>
              <p className="text-3xl font-bold text-orange-700 dark:text-orange-300">
                {analyticsData.leagueHealth.fairnessIndex}%
              </p>
            </div>
            <Scale className="h-8 w-8 text-orange-500" />
          </div>
          <div className="mt-4">
            <div className="w-full bg-orange-200 dark:bg-orange-900/30 rounded-full h-2">
              <div
                className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${analyticsData.leagueHealth.fairnessIndex}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Activity Chart */}
      <div className="bg-white dark:bg-gray-700 rounded-lg p-6 shadow">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Weekly League Activity
        </h3>
        <div className="space-y-4">
          {analyticsData.weeklyActivity.map((week) => (
            <div key={week.week} className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {week.week}
              </span>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full" />
                  <span className="text-gray-600 dark:text-gray-400">
                    {week.trades} trades
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                  <span className="text-gray-600 dark:text-gray-400">
                    {week.waivers} waivers
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full" />
                  <span className="text-gray-600 dark:text-gray-400">
                    {week.lineupChanges} lineup changes
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Team Performance Analysis */}
      <div className="bg-white dark:bg-gray-700 rounded-lg p-6 shadow">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Team Performance Metrics
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Team
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Efficiency
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Consistency
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">,
    Luck Factor
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              {analyticsData.teamPerformance.map((team) => (
                <tr key={team.team}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {team.team}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`text-sm font-medium ${team.efficiency >= 90 ? 'text-green-600 dark:text-green-400' :team.efficiency >= 80 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {team.efficiency}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`text-sm font-medium ${team.consistency >= 90 ? 'text-green-600 dark:text-green-400' :team.consistency >= 80 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {team.consistency}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {team.luck}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-white dark:bg-gray-700 rounded-lg p-6 shadow">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">,
    Analytics Export
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Download className="h-4 w-4 mr-2" />
            Export Season Report
          </button>
          <button className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <FileText className="h-4 w-4 mr-2" />
            Generate League Summary
          </button>
          <button className="flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover bg-purple-700 transition-colors">
            <BarChart3 className="h-4 w-4 mr-2" />
  Performance Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

// Moderation Tab Component
function ModerationTab({  leagueId   }: {  leagueId:string   }) { const [moderationActions] = useState([
    {
      id: '1',
type: 'warning',
      user: 'Mike Chen',
  reason: 'Inappropriate team name',
      action: 'Team name changed to "Field Goal Phantoms"',
  date: '2024-11-15',
      status: 'resolved'
     },
    {
      id: '2',
type: 'trade_review',
      user: 'Sarah Johnson',
  reason: 'Suspicious trade reported by league members',
      action: 'Trade reviewed and approved - fair value exchange',
  date: '2024-11-10',
      status: 'resolved'
    },
    {
      id: '3',
type: 'collusion_check',
      user: 'Alex Rodriguez',
  reason: 'Potential roster sharing with eliminated team',
      action: 'Investigation ongoing',
  date: '2024-11-18',
      status: 'pending'
    }
  ]);

  const [reportedIssues] = useState([
    {
      id: '1',
  reporter: 'Jessica Martinez',
      reported: 'Mike Chen',
  category: 'Unsportsmanlike Conduct',
      description: 'Excessive trash talk in league chat',
  severity: 'medium',
      status: 'under_review',
  date: '2024-11-20'
    },
    {
      id: '2',
  reporter: 'Nicholas D\'Amato',
      reported: 'Sarah Johnson',
  category: 'Roster Manipulation',
      description: 'Starting injured players to potentially lose games',
  severity: 'high',
      status: 'investigating',
  date: '2024-11-19'
    }
  ]);

  return (
    <div className="space-y-8">
      {/* Moderation Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">3</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Open Reports</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">12</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Resolved Issues</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">1</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Warnings</p>
            </div>
            <AlertCircle className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">0</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Suspended Users</p>
            </div>
            <Ban className="h-8 w-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Recent Moderation Actions */}
      <div className="bg-white dark:bg-gray-700 rounded-lg p-6 shadow">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Moderation Actions
          </h3>
          <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover bg-red-700 transition-colors">
            <Plus className="h-4 w-4 mr-2 inline" />
  New Action
          </button>
        </div>

        <div className="space-y-4">
          {moderationActions.map((action) => (
            <div key={action.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${action.type === 'warning' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' :action.type === 'trade_review' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' :
                      'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300'
                    }`}>
                      {action.type.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {action.user}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {action.date}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <strong>Reason:</strong> {action.reason}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Action:</strong> {action.action}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full font-medium ${action.status === 'resolved' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
                }`}>
                  {action.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reported Issues */}
      <div className="bg-white dark:bg-gray-700 rounded-lg p-6 shadow">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
  Reported Issues
        </h3>

        <div className="space-y-4">
          {reportedIssues.map((issue) => (
            <div key={issue.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${issue.severity === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' :issue.severity === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {issue.severity.toUpperCase()}
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {issue.category}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {issue.date}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <strong>Reported:</strong> {issue.reported} by {issue.reporter}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {issue.description}
                  </p>
                  <div className="flex items-center space-x-2">
                    <button className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700">
                      <CheckCircle className="h-3 w-3 mr-1 inline" />
                      Resolve
                    </button>
                    <button className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">
                      <Eye className="h-3 w-3 mr-1 inline" />
                      Investigate
                    </button>
                    <button className="px-3 py-1 bg-red-600 text-white text-xs rounded hover bg-red-700">
                      <Ban className="h-3 w-3 mr-1 inline" />
  Take Action
                    </button>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full font-medium ${issue.status === 'under_review' 
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
                    : 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300'
                }`}>
                  {issue.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Moderation Tools */}
      <div className="bg-white dark:bg-gray-700 rounded-lg p-6 shadow">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">,
    Moderation Tools
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center justify-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors">
            <AlertTriangle className="h-4 w-4 mr-2" />
  Issue Warning
          </button>
          <button className="flex items-center justify-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
            <UserCheck className="h-4 w-4 mr-2" />
            Review User Activity
          </button>
          <button className="flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover bg-red-700 transition-colors">
            <Ban className="h-4 w-4 mr-2" />
  Suspend User
          </button>
        </div>
      </div>
    </div>
  );
}

// Automation Tab Component
function AutomationTab({  leagueId   }: {  leagueId:string   }) { const [automationRules] = useState([
    {
      id: '1',
  name: 'Auto-approve small FAAB claims',
      description: 'Automatically approve waiver claims under $5 FAAB',
  enabled: true,
type: 'transaction',
  conditions: 'FAAB amount < $5 AND no objections within 24 hours',
      lastTriggered: '2024-11-20'
     },
    {
      id: '2',
  name: 'Lineup reminder notifications',
      description: 'Send reminders to teams with incomplete lineups',
  enabled: true,
type: 'notification',
  conditions: 'Thursday 6 PM if lineup not set',
      lastTriggered: '2024-11-21'
    },
    {
      id: '3',
  name: 'Suspicious activity alerts',
      description: 'Alert commissioner of potential collusion',
  enabled: true,
type: 'monitoring',
  conditions: 'Multiple beneficial trades between same teams',
      lastTriggered: 'Never'
    }
  ]);

  const [scheduledTasks] = useState([
    {
      id: '1',
  task: 'Process weekly waivers',
      schedule: 'Wednesday 3: 00 AM', nextRun: '2024-11-27 03:00:00',
      status: 'active'
    },
    {
      id: '2',
  task: 'Generate weekly reports',
      schedule: 'Tuesday 9: 00 AM', nextRun: '2024-11-26 09:00:00',
      status: 'active'
    },
    {
      id: '3',
  task: 'Backup league data',
      schedule: 'Daily 2: 00 AM', nextRun: '2024-11-25 02:00:00',
      status: 'active'
    }
  ]);

  return (
    <div className="space-y-8">
      {/* Automation Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">7</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Rules</p>
            </div>
            <Zap className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">23</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Tasks This Week</p>
            </div>
            <Clock className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">156</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Hours Saved</p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">98.5%</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Success Rate</p>
            </div>
            <CheckCircle className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Automation Rules */}
      <div className="bg-white dark:bg-gray-700 rounded-lg p-6 shadow">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">,
    Automation Rules
          </h3>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover bg-blue-700 transition-colors">
            <Plus className="h-4 w-4 mr-2 inline" />
  Create Rule
          </button>
        </div>

        <div className="space-y-4">
          {automationRules.map((rule) => (
            <div key={rule.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {rule.name}
                    </h4>
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${rule.type === 'transaction' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' :rule.type === 'notification' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' :
                      'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300'
                    }`}>
                      {rule.type}
                    </span>
                    <div className="flex items-center">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={rule.enabled}
                          className="sr-only peer"
                          readOnly
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checke,
  d, afte, r:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checke,
  d:bg-blue-600" />
                      </label>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {rule.description}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mb-2">
                    <strong>Conditions:</strong> {rule.conditions}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-600">
                    Last triggered: {rule.lastTriggered}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button className="p-1 text-gray-400 hover:text-red-600 dark:hover text-red-400">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scheduled Tasks */}
      <div className="bg-white dark:bg-gray-700 rounded-lg p-6 shadow">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">,
    Scheduled Tasks
        </h3>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Task
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Schedule
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">,
    Next Run
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              {scheduledTasks.map((task) => (
                <tr key={task.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {task.task}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {task.schedule}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    { new Date(task.nextRun).toLocaleString() }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${task.status === 'active' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {task.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-900 dark:text-green-400">
                        <RefreshCw className="h-4 w-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-900 dark:text-red-400">
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Automation Templates */}
      <div className="bg-white dark:bg-gray-700 rounded-lg p-6 shadow">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">,
    Automation Templates
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">,
    Trade Processing
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Auto-process trades after review period
            </p>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">,
    Use Template
            </button>
          </div>

          <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">,
    Injury Notifications
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Alert owners when their players get injured
            </p>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">,
    Use Template
            </button>
          </div>

          <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">,
    Weekly Reports
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Generate and send weekly league summaries
            </p>
            <button className="text-blue-600 hover text-blue-700 text-sm font-medium">
  Use Template
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}