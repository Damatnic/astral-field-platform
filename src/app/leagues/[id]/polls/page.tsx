"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LeagueNavigation from "@/components/league/LeagueNavigation";
import { 
  Vote, Plus, Clock, CheckCircle, Users, 
  TrendingUp, Calendar, Trophy, Target, X,
  BarChart2, PieChart, Lock, Eye, MessageSquare
} from "lucide-react";

interface LeaguePageProps {
  params: Promise<{ id: string }>;
}

interface PollOption {
  id: string;
  text: string;
  votes: number;
  voters: string[];
  percentage?: number;
}

interface Poll {
  id: string;
  question: string;
  description?: string;
  options: PollOption[];
  createdBy: string;
  createdByTeam: string;
  createdAt: Date;
  endsAt: Date;
  totalVotes: number;
  isActive: boolean;
  isAnonymous: boolean;
  allowMultiple: boolean;
  category: 'general' | 'trade' | 'matchup' | 'awards' | 'rules';
  hasVoted: boolean;
  userVotes?: string[];
  discussion?: {
    id: string;
    author: string;
    authorTeam: string;
    message: string;
    timestamp: Date;
  }[];
}

export default function LeaguePollsPage({ params }: LeaguePageProps) {
  const router = useRouter();
  const [leagueId, setLeagueId] = useState<string>("");
  const [polls, setPolls] = useState<Poll[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCreatePoll, setShowCreatePoll] = useState(false);
  const [newPoll, setNewPoll] = useState({
    question: '',
    description: '',
    options: ['', ''],
    category: 'general' as Poll['category'],
    isAnonymous: false,
    allowMultiple: false,
    duration: 7 // days
  });
  const [expandedPoll, setExpandedPoll] = useState<string | null>(null);

  useEffect(() => {
    params.then((resolved) => {
      setLeagueId(resolved.id);
    });
  }, [params]);

  useEffect(() => {
    if (leagueId) {
      loadPolls();
    }
  }, [leagueId]);

  const loadPolls = () => {
    // Mock data - in production, fetch from API
    const mockPolls: Poll[] = [
      {
        id: '1',
        question: 'Who will win the championship this year?',
        description: 'Cast your vote for who you think will take home the trophy!',
        options: [
          { id: 'o1', text: 'Space Cowboys', votes: 3, voters: ['Raj', 'Marcus', 'Emily'], percentage: 30 },
          { id: 'o2', text: 'Tech Titans', votes: 2, voters: ['Matt', 'Jorge'], percentage: 20 },
          { id: 'o3', text: 'Dragon Dynasty', votes: 1, voters: ['Tommy'], percentage: 10 },
          { id: 'o4', text: 'Thunder Strikes', votes: 4, voters: ['Kaity', 'Alex', 'Nicholas', 'Someone'], percentage: 40 }
        ],
        createdBy: 'Nicholas D\'Amato',
        createdByTeam: 'Space Cowboys',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        endsAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        totalVotes: 10,
        isActive: true,
        isAnonymous: false,
        allowMultiple: false,
        category: 'awards',
        hasVoted: true,
        userVotes: ['o4'],
        discussion: [
          {
            id: 'd1',
            author: 'Marcus Johnson',
            authorTeam: 'Thunder Strikes',
            message: 'Thunder Strikes have been dominant all season!',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
          },
          {
            id: 'd2',
            author: 'Tommy Thompson',
            authorTeam: 'Beer Bellies',
            message: 'Don\'t sleep on the Beer Bellies. We\'re making a late push!',
            timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000)
          }
        ]
      },
      {
        id: '2',
        question: 'Should we increase the FAAB budget to $200 next season?',
        description: 'Current budget is $100. Vote to decide if we should double it.',
        options: [
          { id: 'o5', text: 'Yes, increase to $200', votes: 6, voters: ['Anonymous'], percentage: 60 },
          { id: 'o6', text: 'No, keep at $100', votes: 3, voters: ['Anonymous'], percentage: 30 },
          { id: 'o7', text: 'Compromise at $150', votes: 1, voters: ['Anonymous'], percentage: 10 }
        ],
        createdBy: 'Nicholas D\'Amato',
        createdByTeam: 'Commissioner',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        endsAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        totalVotes: 10,
        isActive: true,
        isAnonymous: true,
        allowMultiple: false,
        category: 'rules',
        hasVoted: false,
        discussion: []
      },
      {
        id: '3',
        question: 'Best trade of the season so far?',
        description: 'Multiple choices allowed',
        options: [
          { id: 'o8', text: 'CMC for Jefferson + picks', votes: 5, voters: ['Raj', 'Matt', 'Emily', 'Jorge', 'Alex'], percentage: 45 },
          { id: 'o9', text: 'Mahomes for Lamar + RB2', votes: 3, voters: ['Tommy', 'Marcus', 'Kaity'], percentage: 27 },
          { id: 'o10', text: 'Three-team blockbuster', votes: 2, voters: ['Nicholas', 'Someone'], percentage: 18 },
          { id: 'o11', text: 'Rookie for veteran swap', votes: 1, voters: ['Emily'], percentage: 9 }
        ],
        createdBy: 'Kaity Lorbecki',
        createdByTeam: 'Glitter Bombers',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        endsAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        totalVotes: 11,
        isActive: false,
        isAnonymous: false,
        allowMultiple: true,
        category: 'trade',
        hasVoted: true,
        userVotes: ['o8', 'o9']
      },
      {
        id: '4',
        question: 'Week 10 Upset Alert: Who pulls off the surprise?',
        options: [
          { id: 'o12', text: 'Beer Bellies over Space Cowboys', votes: 4, voters: ['Tommy', 'Jorge', 'Alex', 'Emily'], percentage: 40 },
          { id: 'o13', text: 'Neon Wolves over Tech Titans', votes: 3, voters: ['Emily', 'Marcus', 'Matt'], percentage: 30 },
          { id: 'o14', text: 'No upsets this week', votes: 3, voters: ['Nicholas', 'Raj', 'Kaity'], percentage: 30 }
        ],
        createdBy: 'Jorge Silva',
        createdByTeam: 'Samba Squad',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        endsAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        totalVotes: 10,
        isActive: true,
        isAnonymous: false,
        allowMultiple: false,
        category: 'matchup',
        hasVoted: false
      }
    ];

    setPolls(mockPolls);
  };

  const handleVote = (pollId: string, optionIds: string[]) => {
    setPolls(polls.map(poll => {
      if (poll.id === pollId && !poll.hasVoted) {
        const updatedOptions = poll.options.map(option => {
          if (optionIds.includes(option.id)) {
            return {
              ...option,
              votes: option.votes + 1,
              voters: [...option.voters, 'Current User']
            };
          }
          return option;
        });

        const totalVotes = updatedOptions.reduce((sum, opt) => sum + opt.votes, 0);
        
        return {
          ...poll,
          options: updatedOptions.map(opt => ({
            ...opt,
            percentage: Math.round((opt.votes / totalVotes) * 100)
          })),
          totalVotes,
          hasVoted: true,
          userVotes: optionIds
        };
      }
      return poll;
    }));
  };

  const handleCreatePoll = () => {
    if (!newPoll.question || newPoll.options.filter(o => o).length < 2) return;

    const poll: Poll = {
      id: `poll-${Date.now()}`,
      question: newPoll.question,
      description: newPoll.description,
      options: newPoll.options
        .filter(o => o)
        .map((text, idx) => ({
          id: `opt-${idx}`,
          text,
          votes: 0,
          voters: [],
          percentage: 0
        })),
      createdBy: 'Current User',
      createdByTeam: 'My Team',
      createdAt: new Date(),
      endsAt: new Date(Date.now() + newPoll.duration * 24 * 60 * 60 * 1000),
      totalVotes: 0,
      isActive: true,
      isAnonymous: newPoll.isAnonymous,
      allowMultiple: newPoll.allowMultiple,
      category: newPoll.category,
      hasVoted: false
    };

    setPolls([poll, ...polls]);
    setShowCreatePoll(false);
    setNewPoll({
      question: '',
      description: '',
      options: ['', ''],
      category: 'general',
      isAnonymous: false,
      allowMultiple: false,
      duration: 7
    });
  };

  const addOption = () => {
    if (newPoll.options.length < 10) {
      setNewPoll({
        ...newPoll,
        options: [...newPoll.options, '']
      });
    }
  };

  const removeOption = (index: number) => {
    if (newPoll.options.length > 2) {
      setNewPoll({
        ...newPoll,
        options: newPoll.options.filter((_, i) => i !== index)
      });
    }
  };

  const updateOption = (index: number, value: string) => {
    setNewPoll({
      ...newPoll,
      options: newPoll.options.map((opt, i) => i === index ? value : opt)
    });
  };

  const getCategoryIcon = (category: Poll['category']) => {
    const icons = {
      general: <MessageSquare className="h-4 w-4" />,
      trade: <TrendingUp className="h-4 w-4" />,
      matchup: <Target className="h-4 w-4" />,
      awards: <Trophy className="h-4 w-4" />,
      rules: <Lock className="h-4 w-4" />
    };
    return icons[category];
  };

  const getCategoryColor = (category: Poll['category']) => {
    const colors = {
      general: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      trade: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      matchup: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      awards: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      rules: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    };
    return colors[category];
  };

  const filteredPolls = selectedCategory === 'all' 
    ? polls 
    : selectedCategory === 'active' 
      ? polls.filter(p => p.isActive)
      : selectedCategory === 'closed'
        ? polls.filter(p => !p.isActive)
        : polls.filter(p => p.category === selectedCategory);

  const categories = [
    { value: 'all', label: 'All Polls' },
    { value: 'active', label: 'Active' },
    { value: 'closed', label: 'Closed' },
    { value: 'general', label: 'General' },
    { value: 'trade', label: 'Trades' },
    { value: 'matchup', label: 'Matchups' },
    { value: 'awards', label: 'Awards' },
    { value: 'rules', label: 'Rules' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <LeagueNavigation leagueId={leagueId} />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            League Polls & Voting
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Vote on league decisions, trades, and predictions
          </p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Polls</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {polls.filter(p => p.isActive).length}
                </p>
              </div>
              <Vote className="h-8 w-8 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Votes Cast</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {polls.reduce((sum, p) => sum + p.totalVotes, 0)}
                </p>
              </div>
              <Users className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Your Participation</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {polls.filter(p => p.hasVoted).length}/{polls.length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Ending Soon</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {polls.filter(p => p.isActive && p.endsAt.getTime() - Date.now() < 24 * 60 * 60 * 1000).length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 p-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {categories.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === cat.value
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setShowCreatePoll(true)}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors inline-flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Poll
            </button>
          </div>
        </div>

        {/* Create Poll Modal */}
        {showCreatePoll && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Create New Poll</h2>
                  <button
                    onClick={() => setShowCreatePoll(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Question *
                    </label>
                    <input
                      type="text"
                      value={newPoll.question}
                      onChange={(e) => setNewPoll({ ...newPoll, question: e.target.value })}
                      className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="What would you like to ask?"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description (optional)
                    </label>
                    <textarea
                      value={newPoll.description}
                      onChange={(e) => setNewPoll({ ...newPoll, description: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Add more context..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Options *
                    </label>
                    <div className="space-y-2">
                      {newPoll.options.map((option, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => updateOption(index, e.target.value)}
                            className="flex-1 px-4 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder={`Option ${index + 1}`}
                          />
                          {newPoll.options.length > 2 && (
                            <button
                              onClick={() => removeOption(index)}
                              className="px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    {newPoll.options.length < 10 && (
                      <button
                        onClick={addOption}
                        className="mt-2 text-sm text-primary-600 dark:text-primary-400 hover:underline"
                      >
                        + Add option
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Category
                      </label>
                      <select
                        value={newPoll.category}
                        onChange={(e) => setNewPoll({ ...newPoll, category: e.target.value as Poll['category'] })}
                        className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="general">General</option>
                        <option value="trade">Trade</option>
                        <option value="matchup">Matchup</option>
                        <option value="awards">Awards</option>
                        <option value="rules">Rules</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Duration (days)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={newPoll.duration}
                        onChange={(e) => setNewPoll({ ...newPoll, duration: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newPoll.isAnonymous}
                        onChange={(e) => setNewPoll({ ...newPoll, isAnonymous: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Anonymous voting</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newPoll.allowMultiple}
                        onChange={(e) => setNewPoll({ ...newPoll, allowMultiple: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Allow multiple selections</span>
                    </label>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      onClick={() => setShowCreatePoll(false)}
                      className="px-4 py-2 border dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreatePoll}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      Create Poll
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Polls Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredPolls.map(poll => (
            <div key={poll.id} className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-6">
                {/* Poll Header */}
                <div className="mb-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {poll.question}
                    </h3>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${getCategoryColor(poll.category)}`}>
                      {getCategoryIcon(poll.category)}
                      {poll.category}
                    </span>
                  </div>
                  {poll.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {poll.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
                    <span>By {poll.createdBy}</span>
                    <span>•</span>
                    <span>{poll.totalVotes} votes</span>
                    <span>•</span>
                    {poll.isActive ? (
                      <span className="text-green-600 dark:text-green-400">
                        Ends {new Date(poll.endsAt).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-red-600 dark:text-red-400">Closed</span>
                    )}
                    {poll.isAnonymous && (
                      <>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          Anonymous
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Poll Options */}
                <div className="space-y-3">
                  {poll.options.map(option => {
                    const isSelected = poll.userVotes?.includes(option.id);
                    const showResults = poll.hasVoted || !poll.isActive;
                    
                    return (
                      <div key={option.id}>
                        <button
                          onClick={() => !poll.hasVoted && poll.isActive && handleVote(poll.id, [option.id])}
                          disabled={poll.hasVoted || !poll.isActive}
                          className={`w-full text-left relative overflow-hidden rounded-lg transition-all ${
                            poll.hasVoted || !poll.isActive
                              ? 'cursor-default'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                          } ${
                            isSelected
                              ? 'ring-2 ring-primary-600 dark:ring-primary-400'
                              : ''
                          }`}
                        >
                          <div className={`relative z-10 px-4 py-3 ${showResults ? '' : 'border dark:border-gray-600 rounded-lg'}`}>
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-gray-900 dark:text-white">
                                {option.text}
                              </span>
                              {showResults && (
                                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                  {option.percentage}% ({option.votes})
                                </span>
                              )}
                            </div>
                            {!poll.isAnonymous && showResults && option.voters.length > 0 && (
                              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                {option.voters.slice(0, 3).join(', ')}
                                {option.voters.length > 3 && ` +${option.voters.length - 3} more`}
                              </div>
                            )}
                          </div>
                          {showResults && (
                            <div 
                              className="absolute inset-0 bg-primary-100 dark:bg-primary-900/30"
                              style={{ width: `${option.percentage}%` }}
                            />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Poll Actions */}
                <div className="mt-4 pt-4 border-t dark:border-gray-700">
                  <button
                    onClick={() => setExpandedPoll(expandedPoll === poll.id ? null : poll.id)}
                    className="text-sm text-primary-600 dark:text-primary-400 hover:underline inline-flex items-center"
                  >
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Discussion ({poll.discussion?.length || 0})
                  </button>
                </div>

                {/* Discussion Section */}
                {expandedPoll === poll.id && poll.discussion && poll.discussion.length > 0 && (
                  <div className="mt-4 pt-4 border-t dark:border-gray-700 space-y-3">
                    {poll.discussion.map(comment => (
                      <div key={comment.id} className="text-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {comment.author}
                          </span>
                          <span className="text-xs text-gray-500">
                            {comment.authorTeam} • {new Date(comment.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300">
                          {comment.message}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredPolls.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
            <Vote className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No polls found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Be the first to create a poll for your league!
            </p>
            <button
              onClick={() => setShowCreatePoll(true)}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Create Poll
            </button>
          </div>
        )}
      </div>
    </div>
  );
}