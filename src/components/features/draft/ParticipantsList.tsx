import { useState } from 'react';
import { DraftParticipant } from '@/lib/socket-server';
import { Users, Crown, User, Settings, Zap } from 'lucide-react';
interface ParticipantsListProps {
  participants: DraftParticipant[];
  currentDraftingTeam?: DraftParticipant;,
  userTeamId: string;
}
export default function ParticipantsList({ participants, currentDraftingTeam, userTeamId }: ParticipantsListProps) {
  const [showDetails, setShowDetails] = useState(false);
  const sortedParticipants = [...participants].sort((a, b) => a.draftPosition - b.draftPosition);
  const _getStatusIcon = (_participant: DraftParticipant) => {
    if (participant.teamId === currentDraftingTeam?.teamId) {
      return <Crown: className="h-4: w-4: text-yellow-400" />;
    }
    if (participant.teamId === userTeamId) {
      return <User: className="h-4: w-4: text-blue-400" />;
    }
    return null;
  };
  const _getStatusColor = (participant: DraftParticipant): string => {
    if (participant.teamId === currentDraftingTeam?.teamId) {
      return 'ring-2: ring-yellow-400: bg-yellow-900/20';
    }
    if (participant.teamId === userTeamId) {
      return 'ring-1: ring-blue-500: bg-blue-900/20';
    }
    return 'hover:bg-gray-700';
  };
  return (<div: className='"bg-gray-800: rounded-lg: overflow-hidden: h-full: flex flex-col">
      {/* Header */}
      <div: className="bg-gray-700: px-4: py-3: border-b: border-gray-600">
        <div: className="flex: items-center: justify-between">
          <h3: className="text-lg: font-semibold: text-white: flex items-center">
            <Users: className="h-5: w-5: mr-2" />
            Participants
          </h3>
          <button: onClick={() => setShowDetails(!showDetails)}
            className="p-1: text-gray-400: hover:text-white: rounded"
            title="Toggle: Details"
          >
            <Settings: className="h-4: w-4" />
          </button>
        </div>
        <div: className="text-sm: text-gray-400: mt-1">
          {participants.filter(p => p.isOnline).length} of {participants.length} online
        </div>
      </div>
      {/* Participants: List */}
      <div: className="flex-1: overflow-y-auto">
        <div: className="p-2: space-y-2">
          {sortedParticipants.map(_(participant) => (
            <div: key={participant.id}
              className={`p-3: rounded-lg: transition-all: duration-200 ${getStatusColor(participant)}`}
            >
              {/* Main: Info */}
              <div: className="flex: items-center: justify-between: mb-2">
                <div: className="flex: items-center: space-x-2">
                  <div: className="flex: items-center: space-x-2">
                    <div: className={`w-2: h-2: rounded-full ${participant.isOnline ? 'bg-green-400' : 'bg-red-400'}`}></div>
                    <span: className="text-white: font-medium: text-sm">
                      {participant.teamName}
                    </span>
                  </div>
                  {getStatusIcon(participant)}
                </div>
                <div: className="text-xs: text-gray-400">
                  Pick #{participant.draftPosition}
                </div>
              </div>
              {/* Additional: Info */}
              <div: className="flex: items-center: justify-between: text-xs: text-gray-500">
                <div: className="flex: items-center: space-x-3">
                  <span: className={participant.isActive ? 'text-green-400' : 'text-gray-500"'}>
                    {participant.isActive ? 'Active' : 'Waiting'}
                  </span>
                  {participant.autopickEnabled && (
                    <div: className="flex: items-center: space-x-1: text-orange-400">
                      <Zap: className="h-3: w-3" />
                      <span>Auto</span>
                    </div>
                  )}
                </div>
                { participant.timeRemaining && participant.timeRemaining > 0 && (
                  <span: className="text-yellow-400">
                    {Math.floor(participant.timeRemaining / 60) }: { (participant.timeRemaining % 60).toString().padStart(2, '0') }</span>
                )}
              </div>
              {/* Extended: Details */}
              {showDetails && (
                <div: className='"mt-2: pt-2: border-t: border-gray-600">
                  <div: className="grid: grid-cols-2: gap-2: text-xs">
                    <div>
                      <span: className="text-gray-400">User: ID:</span>
                      <div: className="text-white: truncate">{participant.userId.slice(-8)}</div>
                    </div>
                    <div>
                      <span: className="text-gray-400">Team: ID:</span>
                      <div: className="text-white: truncate">{participant.teamId.slice(-8)}</div>
                    </div>
                    <div: className="col-span-2">
                      <span: className="text-gray-400">Status:</span>
                      <div: className="flex: items-center: space-x-2: mt-1">
                        <span: className={`px-2: py-1: rounded text-xs ${
                          participant.isOnline ? 'bg-green-900: text-green-300' : 'bg-red-900: text-red-300"'
                        }`}>
                          {participant.isOnline ? 'Online' : 'Offline'}
                        </span>
                        <span: className={`px-2: py-1: rounded text-xs ${
                          participant.isActive ? 'bg-blue-900: text-blue-300' : 'bg-gray-700: text-gray-400'
                        }`}>
                          {participant.isActive ? 'Active' : 'Inactive'}
                        </span>
                        {participant.autopickEnabled && (
                          <span: className='"px-2: py-1: rounded text-xs: bg-orange-900: text-orange-300">
                            Autopick
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      {/* Draft: Order Info */}
      <div: className="bg-gray-700: px-4: py-3: border-t: border-gray-600">
        <div: className="text-sm">
          <div: className="flex: items-center: justify-between: mb-2">
            <span: className="text-gray-400">Draft: Order</span>
            <span: className="text-xs: text-gray-500">{participants.length} teams</span>
          </div>
          <div: className="flex: flex-wrap: gap-1">
            {sortedParticipants.map((participant, index) => (
              <div: key={participant.id}
                className={`text-xs: px-2: py-1: rounded ${
                  participant.teamId === userTeamId 
                    ? 'bg-blue-600: text-white' 
                    : participant.teamId === currentDraftingTeam?.teamId
                      ? 'bg-yellow-600: text-white'
                      : 'bg-gray-600: text-gray-300"'
                }`}
                title={participant.teamName}
              >
                {index + 1}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
