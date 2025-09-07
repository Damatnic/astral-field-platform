"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Settings, Save, RotateCcw, AlertTriangle, 
  Trophy, Users, DollarSign, Shield, Calendar,
  Target, Award, Crown, Info, Lock, 
  ChevronDown, ChevronRight, Toggle, Check
} from "lucide-react";
import LeagueNavigation from "@/components/league/LeagueNavigation";

interface LeagueSettingsPageProps {
  params: Promise<{ id: string }>;
}

interface LeagueSettings {
  // Basic Info
  leagueName: string;
  maxTeams: number;
  currentWeek: number;
  seasonYear: number;
  
  // Scoring Settings
  scoringType: 'standard' | 'ppr' | 'half_ppr' | 'custom';
  passingYards: number;
  passingTds: number;
  passingInterceptions: number;
  rushingYards: number;
  rushingTds: number;
  receivingYards: number;
  receivingTds: number;
  receptions: number;
  fumbleLost: number;
  
  // Bonus Scoring
  bonuses: {
    longTd: boolean;
    longTdYards: number;
    longTdPoints: number;
    bigPlay: boolean;
    bigPlayYards: number;
    bigPlayPoints: number;
    milestone: boolean;
    milestoneYards: number;
    milestonePoints: number;
  };
  
  // Roster Settings
  roster: {
    qb: number;
    rb: number;
    wr: number;
    te: number;
    flex: number;
    superflex: number;
    k: number;
    dst: number;
    bench: number;
    ir: number;
  };
  
  // Waiver Settings
  waivers: {
    type: 'faab' | 'rolling' | 'reverse';
    faabBudget: number;
    processTime: string;
    processDay: string;
    waiverPeriod: number;
    minimumBid: number;
  };
  
  // Trade Settings
  trades: {
    enabled: boolean;
    reviewPeriod: number;
    vetoThreshold: number;
    commissionerApproval: boolean;
    tradeCutoff: string;
    allowBenchTrades: boolean;
  };
  
  // Playoff Settings
  playoffs: {
    teams: number;
    weeks: number;
    startWeek: number;
    reseeding: boolean;
    byeWeeks: number;
    tiebreaker: 'h2h' | 'points' | 'bench';
  };
  
  // Division Settings
  divisions: {
    enabled: boolean;
    count: number;
    names: string[];
    playoffFormat: 'division' | 'overall';
  };
  
  // Keeper/Dynasty Settings
  keepers: {
    enabled: boolean;
    count: number;
    years: number;
    rounds: number;
    tradeable: boolean;
  };
}

export default function LeagueSettingsPage({ params }: LeagueSettingsPageProps) {
  const [leagueId, setLeagueId] = useState<string>("");
  const [settings, setSettings] = useState<LeagueSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState("scoring");
  const [hasChanges, setHasChanges] = useState(false);
  const [isCommissioner] = useState(true); // Mock - Nicholas D'Amato is commissioner

  useEffect(() => {
    params.then((resolved) => {
      setLeagueId(resolved.id);
      loadLeagueSettings(resolved.id);
    });
  }, [params]);

  const loadLeagueSettings = async (id: string) => {
    // Mock settings data - in production, fetch from API
    const mockSettings: LeagueSettings = {
      leagueName: "Astral Field Champions",
      maxTeams: 10,
      currentWeek: 8,
      seasonYear: 2024,
      scoringType: 'half_ppr',
      passingYards: 0.04,
      passingTds: 4,
      passingInterceptions: -2,
      rushingYards: 0.1,
      rushingTds: 6,
      receivingYards: 0.1,
      receivingTds: 6,
      receptions: 0.5,
      fumbleLost: -2,
      bonuses: {
        longTd: true,
        longTdYards: 40,
        longTdPoints: 2,
        bigPlay: false,
        bigPlayYards: 20,
        bigPlayPoints: 1,
        milestone: true,
        milestoneYards: 100,
        milestonePoints: 3
      },
      roster: {
        qb: 1,
        rb: 2,
        wr: 2,
        te: 1,
        flex: 2,
        superflex: 0,
        k: 1,
        dst: 1,
        bench: 6,
        ir: 2
      },
      waivers: {
        type: 'faab',
        faabBudget: 100,
        processTime: '10:00 AM',
        processDay: 'Wednesday',
        waiverPeriod: 2,
        minimumBid: 1
      },
      trades: {
        enabled: true,
        reviewPeriod: 24,
        vetoThreshold: 4,
        commissionerApproval: false,
        tradeCutoff: '2024-11-15',
        allowBenchTrades: true
      },
      playoffs: {
        teams: 6,
        weeks: 3,
        startWeek: 15,
        reseeding: false,
        byeWeeks: 2,
        tiebreaker: 'h2h'
      },
      divisions: {
        enabled: true,
        count: 2,
        names: ['Cosmic Division', 'Stellar Division'],
        playoffFormat: 'division'
      },
      keepers: {
        enabled: false,
        count: 2,
        years: 3,
        rounds: 2,
        tradeable: true
      }
    };
    setSettings(mockSettings);
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    // Mock save - in production, call API
    await new Promise(resolve => setTimeout(resolve, 1000));
    setHasChanges(false);
    setSaving(false);
  };

  const handleInputChange = (field: string, value: any) => {
    if (!settings) return;
    
    // Handle nested object updates
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setSettings({
        ...settings,
        [parent]: {
          ...(settings as any)[parent],
          [child]: value
        }
      });
    } else {
      setSettings({ ...settings, [field]: value });
    }
    setHasChanges(true);
  };

  const settingSections = [
    { id: "scoring", label: "Scoring System", icon: Target },
    { id: "roster", label: "Roster Format", icon: Users },
    { id: "waivers", label: "Waivers & FAAB", icon: DollarSign },
    { id: "trades", label: "Trade Settings", icon: Shield },
    { id: "playoffs", label: "Playoffs", icon: Trophy },
    { id: "divisions", label: "Divisions", icon: Award },
    { id: "keepers", label: "Keepers/Dynasty", icon: Crown }
  ];

  const scoringPresets = [
    { id: 'standard', name: 'Standard', description: 'No PPR, traditional scoring' },
    { id: 'ppr', name: 'Full PPR', description: '1 point per reception' },
    { id: 'half_ppr', name: 'Half PPR', description: '0.5 points per reception' },
    { id: 'custom', name: 'Custom', description: 'Create your own scoring rules' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <LeagueNavigation leagueId={leagueId} />
        <div className="animate-pulse max-w-6xl mx-auto px-4 py-8">
          <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded mb-4 w-1/3"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-8 w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!isCommissioner) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <LeagueNavigation leagueId={leagueId} />
        <div className="max-w-6xl mx-auto px-4 py-8 text-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow">
            <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Commissioner Access Required
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Only the league commissioner can modify league settings.
            </p>
            <Link
              href={`/leagues/${leagueId}`}
              className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
            >
              Back to League Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <LeagueNavigation leagueId={leagueId} />
        <div className="max-w-6xl mx-auto px-4 py-8 text-center">
          <div className="text-red-600 dark:text-red-400 text-lg mb-4">
            Unable to load league settings
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <LeagueNavigation leagueId={leagueId} />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                League Settings
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Configure your league rules and scoring system
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {hasChanges && (
                <div className="flex items-center space-x-2 text-sm text-orange-600 dark:text-orange-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Unsaved changes</span>
                </div>
              )}
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !hasChanges}
                className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Changes
              </button>
            </div>
          </div>
        </div>

        {/* Warning Banner */}
        <div className="mb-8 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-800 dark:text-yellow-200">
                Important Notice
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                Changes to league settings may affect existing scores, standings, and player eligibility. 
                Some changes cannot be undone once the season has started.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Settings Navigation */}
          <div className="lg:w-64">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-4 border-b dark:border-gray-700">
                <h2 className="font-semibold text-gray-900 dark:text-white">
                  Settings Categories
                </h2>
              </div>
              <nav className="p-2">
                {settingSections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        activeSection === section.id
                          ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{section.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Settings Content */}
          <div className="flex-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              {/* Scoring Settings */}
              {activeSection === "scoring" && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                    Scoring System
                  </h2>
                  
                  {/* Scoring Presets */}
                  <div className="mb-8">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      Scoring Type
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {scoringPresets.map((preset) => (
                        <div
                          key={preset.id}
                          className={`relative p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                            settings.scoringType === preset.id
                              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                          }`}
                          onClick={() => handleInputChange('scoringType', preset.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-white">
                                {preset.name}
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {preset.description}
                              </p>
                            </div>
                            {settings.scoringType === preset.id && (
                              <Check className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Detailed Scoring */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                        Passing Points
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Yards (per yard)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={settings.passingYards}
                            onChange={(e) => handleInputChange('passingYards', parseFloat(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Touchdowns
                          </label>
                          <input
                            type="number"
                            value={settings.passingTds}
                            onChange={(e) => handleInputChange('passingTds', parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Interceptions
                          </label>
                          <input
                            type="number"
                            value={settings.passingInterceptions}
                            onChange={(e) => handleInputChange('passingInterceptions', parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                        Rushing Points
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Yards (per yard)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={settings.rushingYards}
                            onChange={(e) => handleInputChange('rushingYards', parseFloat(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Touchdowns
                          </label>
                          <input
                            type="number"
                            value={settings.rushingTds}
                            onChange={(e) => handleInputChange('rushingTds', parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Fumbles Lost
                          </label>
                          <input
                            type="number"
                            value={settings.fumbleLost}
                            onChange={(e) => handleInputChange('fumbleLost', parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                        Receiving Points
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Yards (per yard)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={settings.receivingYards}
                            onChange={(e) => handleInputChange('receivingYards', parseFloat(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Touchdowns
                          </label>
                          <input
                            type="number"
                            value={settings.receivingTds}
                            onChange={(e) => handleInputChange('receivingTds', parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Receptions (PPR)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            value={settings.receptions}
                            onChange={(e) => handleInputChange('receptions', parseFloat(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Roster Settings */}
              {activeSection === "roster" && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                    Roster Format
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Quarterbacks (QB)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="3"
                        value={settings.roster.qb}
                        onChange={(e) => handleInputChange('roster.qb', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Running Backs (RB)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="4"
                        value={settings.roster.rb}
                        onChange={(e) => handleInputChange('roster.rb', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Wide Receivers (WR)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="4"
                        value={settings.roster.wr}
                        onChange={(e) => handleInputChange('roster.wr', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Tight Ends (TE)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="3"
                        value={settings.roster.te}
                        onChange={(e) => handleInputChange('roster.te', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Flex (RB/WR/TE)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="3"
                        value={settings.roster.flex}
                        onChange={(e) => handleInputChange('roster.flex', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        SuperFlex (QB/RB/WR/TE)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="2"
                        value={settings.roster.superflex}
                        onChange={(e) => handleInputChange('roster.superflex', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Kickers (K)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="2"
                        value={settings.roster.k}
                        onChange={(e) => handleInputChange('roster.k', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Defense/ST (DST)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="2"
                        value={settings.roster.dst}
                        onChange={(e) => handleInputChange('roster.dst', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Bench Spots
                      </label>
                      <input
                        type="number"
                        min="3"
                        max="10"
                        value={settings.roster.bench}
                        onChange={(e) => handleInputChange('roster.bench', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Injured Reserve (IR)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="5"
                        value={settings.roster.ir}
                        onChange={(e) => handleInputChange('roster.ir', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-800 dark:text-blue-200">
                          Roster Size Calculator
                        </h4>
                        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                          Current roster size: {Object.values(settings.roster).reduce((a, b) => a + b, 0)} players per team
                        </p>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          Starting lineup: {settings.roster.qb + settings.roster.rb + settings.roster.wr + settings.roster.te + settings.roster.flex + settings.roster.superflex + settings.roster.k + settings.roster.dst} players
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Add more sections here... */}
              {activeSection === "waivers" && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                    Waiver & FAAB Settings
                  </h2>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Waiver System
                      </label>
                      <select
                        value={settings.waivers.type}
                        onChange={(e) => handleInputChange('waivers.type', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="faab">FAAB (Free Agent Acquisition Budget)</option>
                        <option value="rolling">Rolling Waivers</option>
                        <option value="reverse">Reverse Standings Order</option>
                      </select>
                    </div>

                    {settings.waivers.type === 'faab' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            FAAB Budget ($)
                          </label>
                          <input
                            type="number"
                            min="50"
                            max="1000"
                            value={settings.waivers.faabBudget}
                            onChange={(e) => handleInputChange('waivers.faabBudget', parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Minimum Bid ($)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="10"
                            value={settings.waivers.minimumBid}
                            onChange={(e) => handleInputChange('waivers.minimumBid', parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Process Day
                        </label>
                        <select
                          value={settings.waivers.processDay}
                          onChange={(e) => handleInputChange('waivers.processDay', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="Tuesday">Tuesday</option>
                          <option value="Wednesday">Wednesday</option>
                          <option value="Thursday">Thursday</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Process Time
                        </label>
                        <select
                          value={settings.waivers.processTime}
                          onChange={(e) => handleInputChange('waivers.processTime', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="12:00 AM">12:00 AM</option>
                          <option value="6:00 AM">6:00 AM</option>
                          <option value="10:00 AM">10:00 AM</option>
                          <option value="12:00 PM">12:00 PM</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Waiver Period (days)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="7"
                        value={settings.waivers.waiverPeriod}
                        onChange={(e) => handleInputChange('waivers.waiverPeriod', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                      />
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        How many days a dropped player stays on waivers before becoming a free agent
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Additional sections would continue here... */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}