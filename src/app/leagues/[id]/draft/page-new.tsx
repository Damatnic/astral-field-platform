'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Play, Users, Settings, Clock } from 'lucide-react';

interface DraftPageProps {
  params: Promise<{ id: string }>;
}

export default function DraftPage({ params }: DraftPageProps) {
  const router = useRouter();
  const [leagueId, setLeagueId] = useState<string>('');
  const [draftId, setDraftId] = useState<string>('');
  const [creating, setCreating] = useState(false);
  const [draftExists, setDraftExists] = useState(false);

  useEffect(() => {
    params.then(resolved => {
      setLeagueId(resolved.id);
      setDraftId(`draft_${resolved.id}`);
    });
  }, [params]);

  useEffect(() => {
    // Mock auth check
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
    }
  }, [router]);

  useEffect(() => {
    if (leagueId) {
      // Check if draft exists
      setDraftExists(Math.random() > 0.5); // Mock check
    }
  }, [leagueId]);

  const handleCreateDraft = async () => {
    setCreating(true);
    // Mock draft creation
    setTimeout(() => {
      setDraftExists(true);
      setCreating(false);
    }, 2000);
  };

  const handleJoinDraft = () => {
    router.push(`/leagues/${leagueId}/draft/${draftId}`);
  };

  if (!leagueId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Draft Center
          </h1>
          
          <div className="bg-white shadow rounded-lg p-6">
            {!draftExists ? (
              <div className="text-center">
                <Settings className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  No Draft Created
                </h2>
                <p className="text-gray-600 mb-6">
                  Create a draft to start selecting players for your league.
                </p>
                <button
                  onClick={handleCreateDraft}
                  disabled={creating}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                >
                  {creating ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Creating Draft...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Create Draft
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="text-center">
                <Users className="mx-auto h-12 w-12 text-green-500 mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Draft Ready
                </h2>
                <p className="text-gray-600 mb-6">
                  Your league draft is ready to begin.
                </p>
                <div className="space-y-4">
                  <button
                    onClick={handleJoinDraft}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Join Draft
                  </button>
                  <div className="text-sm text-gray-500">
                    Draft ID: {draftId}
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
