"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LeagueNavigation from "@/components/league/LeagueNavigation";
import { 
  ArrowRightLeft, UserPlus, UserMinus, DollarSign,
  Filter, Search, Calendar, Clock, ChevronDown,
  TrendingUp, AlertCircle, Shield, Star, X,
  Download, Eye, MessageSquare, Hash
} from "lucide-react";

interface LeaguePageProps {
  params: Promise<{ id: string }>;
}

interface Transaction {
  id: string;
  type: 'trade' | 'add' | 'drop' | 'waiver' | 'faab';
  timestamp: Date;
  teamName: string;
  teamOwner: string;
  status: 'completed' | 'pending' | 'vetoed' | 'processing';
  details: {
    playersAdded?: string[];
    playersDropped?: string[];
    playersTraded?: { from: string; to: string; players: string[] }[];
    faabAmount?: number;
    waiverPriority?: number;
    tradePartner?: string;
  };
  vetoes?: number;
  vetoesNeeded?: number;
  processDate?: Date;
  notes?: string;
}

export default function TransactionsPage({ params }: LeaguePageProps) {
  const router = useRouter();
  const [leagueId, setLeagueId] = useState<string>("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'type' | 'team'>('date');
  const [expandedTransaction, setExpandedTransaction] = useState<string | null>(null);

  useEffect(() => {
    params.then((resolved) => {
      setLeagueId(resolved.id);
    });
  }, [params]);

  useEffect(() => {
    if (leagueId) {
      loadTransactions();
    }
  }, [leagueId]);

  useEffect(() => {
    filterTransactions();
  }, [transactions, searchQuery, selectedTypes, selectedTeams, selectedStatus, dateRange, sortBy]);

  const loadTransactions = () => {
    // Mock data - in production, fetch from API
    const mockTransactions: Transaction[] = [
      {
        id: '1',
        type: 'trade',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        teamName: 'Space Cowboys',
        teamOwner: 'Nicholas D\'Amato',
        status: 'pending',
        details: {
          playersTraded: [
            { from: 'Space Cowboys', to: 'Tech Titans', players: ['Derrick Henry', '2024 3rd Round Pick'] },
            { from: 'Tech Titans', to: 'Space Cowboys', players: ['CeeDee Lamb'] }
          ],
          tradePartner: 'Tech Titans'
        },
        vetoes: 2,
        vetoesNeeded: 4,
        processDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        notes: 'Addressing WR needs before playoffs'
      },
      {
        id: '2',
        type: 'waiver',
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
        teamName: 'Thunder Strikes',
        teamOwner: 'Marcus Johnson',
        status: 'completed',
        details: {
          playersAdded: ['Jaylen Warren'],
          playersDropped: ['Zack Moss'],
          waiverPriority: 3
        }
      },
      {
        id: '3',
        type: 'faab',
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
        teamName: 'Glitter Bombers',
        teamOwner: 'Kaity Lorbecki',
        status: 'completed',
        details: {
          playersAdded: ['Tank Bigsby'],
          playersDropped: ['Dameon Pierce'],
          faabAmount: 37
        },
        notes: 'Lottery ticket RB with upside'
      },
      {
        id: '4',
        type: 'add',
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
        teamName: 'Dragon Dynasty',
        teamOwner: 'Matt Chen',
        status: 'completed',
        details: {
          playersAdded: ['Jake Moody'],
          playersDropped: ['Matt Gay']
        }
      },
      {
        id: '5',
        type: 'trade',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
        teamName: 'Beer Bellies',
        teamOwner: 'Tommy Thompson',
        status: 'vetoed',
        details: {
          playersTraded: [
            { from: 'Beer Bellies', to: 'Crypto Kings', players: ['Christian McCaffrey'] },
            { from: 'Crypto Kings', to: 'Beer Bellies', players: ['Rachaad White', 'Michael Pittman Jr.'] }
          ],
          tradePartner: 'Crypto Kings'
        },
        vetoes: 5,
        vetoesNeeded: 4,
        notes: 'League vetoed - unbalanced trade'
      },
      {
        id: '6',
        type: 'drop',
        timestamp: new Date(Date.now() - 36 * 60 * 60 * 1000),
        teamName: 'Samba Squad',
        teamOwner: 'Jorge Silva',
        status: 'completed',
        details: {
          playersDropped: ['Russell Wilson']
        }
      },
      {
        id: '7',
        type: 'faab',
        timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000),
        teamName: 'Neon Wolves',
        teamOwner: 'Emily Chang',
        status: 'processing',
        details: {
          playersAdded: ['Tyjae Spears'],
          playersDropped: ['Kareem Hunt'],
          faabAmount: 28
        },
        processDate: new Date(Date.now() + 12 * 60 * 60 * 1000)
      },
      {
        id: '8',
        type: 'trade',
        timestamp: new Date(Date.now() - 72 * 60 * 60 * 1000),
        teamName: 'Tech Titans',
        teamOwner: 'Raj Patel',
        status: 'completed',
        details: {
          playersTraded: [
            { from: 'Tech Titans', to: 'Lightning Legends', players: ['Travis Kelce', 'Brandin Cooks'] },
            { from: 'Lightning Legends', to: 'Tech Titans', players: ['Mark Andrews', 'DeVonta Smith'] }
          ],
          tradePartner: 'Lightning Legends'
        }
      }
    ];

    setTransactions(mockTransactions);
  };

  const filterTransactions = () => {
    let filtered = [...transactions];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(t => 
        t.teamName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.teamOwner.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.details.playersAdded?.some(p => p.toLowerCase().includes(searchQuery.toLowerCase())) ||
        t.details.playersDropped?.some(p => p.toLowerCase().includes(searchQuery.toLowerCase())) ||
        t.details.playersTraded?.some(trade => 
          trade.players.some(p => p.toLowerCase().includes(searchQuery.toLowerCase()))
        )
      );
    }

    // Type filter
    if (selectedTypes.length > 0) {
      filtered = filtered.filter(t => selectedTypes.includes(t.type));
    }

    // Team filter
    if (selectedTeams.length > 0) {
      filtered = filtered.filter(t => selectedTeams.includes(t.teamName));
    }

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(t => t.status === selectedStatus);
    }

    // Date range filter
    if (dateRange.start) {
      filtered = filtered.filter(t => t.timestamp >= dateRange.start!);
    }
    if (dateRange.end) {
      filtered = filtered.filter(t => t.timestamp <= dateRange.end!);
    }

    // Sorting
    filtered.sort((a, b) => {
      if (sortBy === 'date') return b.timestamp.getTime() - a.timestamp.getTime();
      if (sortBy === 'type') return a.type.localeCompare(b.type);
      if (sortBy === 'team') return a.teamName.localeCompare(b.teamName);
      return 0;
    });

    setFilteredTransactions(filtered);
  };

  const toggleTypeFilter = (type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const getTypeIcon = (type: Transaction['type']) => {
    const icons = {
      trade: <ArrowRightLeft className="h-4 w-4" />,
      add: <UserPlus className="h-4 w-4" />,
      drop: <UserMinus className="h-4 w-4" />,
      waiver: <Clock className="h-4 w-4" />,
      faab: <DollarSign className="h-4 w-4" />
    };
    return icons[type];
  };

  const getTypeColor = (type: Transaction['type']) => {
    const colors = {
      trade: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      add: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      drop: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      waiver: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      faab: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
    };
    return colors[type];
  };

  const getStatusColor = (status: Transaction['status']) => {
    const colors = {
      completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      vetoed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
    };
    return colors[status];
  };

  const exportTransactions = () => {
    // In production, generate CSV or JSON export
    console.log('Exporting transactions...');
  };

  // Get unique teams for filter
  const uniqueTeams = Array.from(new Set(transactions.map(t => t.teamName)));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <LeagueNavigation leagueId={leagueId} />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Transaction Log
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Complete history of all league transactions
          </p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Transactions</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {transactions.length}
                </p>
              </div>
              <Hash className="h-8 w-8 text-gray-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Trades</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {transactions.filter(t => t.type === 'trade').length}
                </p>
              </div>
              <ArrowRightLeft className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Waiver Claims</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {transactions.filter(t => t.type === 'waiver' || t.type === 'faab').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {transactions.filter(t => t.status === 'pending' || t.status === 'processing').length}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
          <div className="p-4 border-b dark:border-gray-700">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search players, teams..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Quick Filters */}
              <div className="flex gap-2">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-4 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="vetoed">Vetoed</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="px-4 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="date">ArrowUpDown by Date</option>
                  <option value="type">ArrowUpDown by Type</option>
                  <option value="team">ArrowUpDown by Team</option>
                </select>

                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-4 py-2 border dark:border-gray-600 rounded-lg transition-colors inline-flex items-center gap-2 ${
                    showFilters 
                      ? 'bg-primary-600 text-white border-primary-600' 
                      : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600'
                  }`}
                >
                  <Filter className="h-4 w-4" />
                  Filters
                  {(selectedTypes.length > 0 || selectedTeams.length > 0) && (
                    <span className="inline-flex items-center justify-center w-5 h-5 bg-white/20 rounded-full text-xs">
                      {selectedTypes.length + selectedTeams.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={exportTransactions}
                  className="px-4 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  <Download className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Transaction Types */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Transaction Types
                  </label>
                  <div className="space-y-2">
                    {['trade', 'add', 'drop', 'waiver', 'faab'].map(type => (
                      <label key={type} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedTypes.includes(type)}
                          onChange={() => toggleTypeFilter(type)}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                          {type}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Teams */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Teams
                  </label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {uniqueTeams.map(team => (
                      <label key={team} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedTeams.includes(team)}
                          onChange={() => {
                            setSelectedTeams(prev =>
                              prev.includes(team)
                                ? prev.filter(t => t !== team)
                                : [...prev, team]
                            );
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {team}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Date Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date Range
                  </label>
                  <div className="space-y-2">
                    <input
                      type="date"
                      onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value ? new Date(e.target.value) : null }))}
                      className="w-full px-3 py-1.5 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    />
                    <input
                      type="date"
                      onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value ? new Date(e.target.value) : null }))}
                      className="w-full px-3 py-1.5 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={() => {
                    setSelectedTypes([]);
                    setSelectedTeams([]);
                    setDateRange({ start: null, end: null });
                  }}
                  className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Transactions List */}
        <div className="space-y-4">
          {filteredTransactions.map(transaction => (
            <div key={transaction.id} className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Transaction Header */}
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getTypeColor(transaction.type)}`}>
                        {getTypeIcon(transaction.type)}
                        {transaction.type.toUpperCase()}
                      </span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${getStatusColor(transaction.status)}`}>
                        {transaction.status}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(transaction.timestamp).toLocaleString()}
                      </span>
                    </div>

                    {/* Transaction Details */}
                    <div className="mb-2">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {transaction.teamName}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400 ml-2">
                        ({transaction.teamOwner})
                      </span>
                    </div>

                    {/* Transaction Content */}
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      {transaction.type === 'trade' && transaction.details.playersTraded && (
                        <div className="space-y-1">
                          {transaction.details.playersTraded.map((trade, idx) => (
                            <div key={idx}>
                              <span className="font-medium">{trade.from}</span> sends{' '}
                              <span className="text-primary-600 dark:text-primary-400">
                                {trade.players.join(', ')}
                              </span>
                              {' '}to <span className="font-medium">{trade.to}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {(transaction.type === 'add' || transaction.type === 'waiver' || transaction.type === 'faab') && (
                        <div>
                          {transaction.details.playersAdded && (
                            <span>
                              Added: <span className="text-green-600 dark:text-green-400">
                                {transaction.details.playersAdded.join(', ')}
                              </span>
                            </span>
                          )}
                          {transaction.details.playersDropped && (
                            <span className="ml-4">
                              Dropped: <span className="text-red-600 dark:text-red-400">
                                {transaction.details.playersDropped.join(', ')}
                              </span>
                            </span>
                          )}
                          {transaction.details.faabAmount && (
                            <span className="ml-4">
                              FAAB: <span className="font-medium">${transaction.details.faabAmount}</span>
                            </span>
                          )}
                        </div>
                      )}

                      {transaction.type === 'drop' && transaction.details.playersDropped && (
                        <div>
                          Dropped: <span className="text-red-600 dark:text-red-400">
                            {transaction.details.playersDropped.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Additional Info */}
                    {(transaction.vetoes || transaction.processDate || transaction.notes) && (
                      <div className="mt-3 flex flex-wrap gap-4 text-sm">
                        {transaction.status === 'pending' && transaction.vetoes !== undefined && (
                          <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                            <Shield className="h-4 w-4" />
                            {transaction.vetoes}/{transaction.vetoesNeeded} vetoes
                          </div>
                        )}
                        {transaction.processDate && (
                          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                            <Clock className="h-4 w-4" />
                            Processes: {new Date(transaction.processDate).toLocaleString()}
                          </div>
                        )}
                        {transaction.notes && (
                          <button
                            onClick={() => setExpandedTransaction(
                              expandedTransaction === transaction.id ? null : transaction.id
                            )}
                            className="flex items-center gap-1 text-primary-600 dark:text-primary-400 hover:underline"
                          >
                            <MessageSquare className="h-4 w-4" />
                            View notes
                          </button>
                        )}
                      </div>
                    )}

                    {/* Expanded Notes */}
                    {expandedTransaction === transaction.id && transaction.notes && (
                      <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          <span className="font-medium">Notes:</span> {transaction.notes}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {transaction.status === 'pending' && (
                    <div className="ml-4">
                      <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredTransactions.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
            <ArrowRightLeft className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No transactions found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchQuery || selectedTypes.length > 0 || selectedTeams.length > 0
                ? 'Try adjusting your filters'
                : 'No transactions have been made yet'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}