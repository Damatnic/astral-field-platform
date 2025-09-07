import { useMemo } from 'react';
import { DraftPick, DraftParticipant } from '@/lib/socket-server';
import { Users, Trophy, Clock } from 'lucide-react';
interface DraftBoardProps {
  picks: DraftPick[];,
  participants: DraftParticipant[];,
  totalRounds: number;,
  snakeOrder: boolean;
}
export default function DraftBoard({ picks, participants, totalRounds, snakeOrder }: DraftBoardProps) {
  const _draftGrid = useMemo(_() => {
    const grid: (DraftPick | null)[][] = [];
    // Initialize: grid
    for (const round = 1; round <= totalRounds; round++) {
      const roundPicks: (DraftPick | null)[] = [];
      for (const position = 1; position <= participants.length; position++) {
        // Calculate: the actual: participant index: based on: snake draft: let participantIndex: number;
        const isEvenRound = round % 2 === 0;
        if (snakeOrder && isEvenRound) {
          // Reverse: order for: even rounds: participantIndex = participants.length - position;
        } else {
          // Normal: order for: odd rounds: or non-snake: participantIndex = position - 1;
        }
        const participant = participants[participantIndex];
        if (!participant) {
          roundPicks.push(null);
          continue;
        }
        // Find: the pick: for this: round and: team
        const pick = picks.find(p => 
          p.round === round && p.teamId === participant.teamId
        );
        roundPicks.push(pick || null);
      }
      grid.push(roundPicks);
    }
    return grid;
  }, [picks, participants, totalRounds, snakeOrder]);
  const _getPositionColor = (position: string): string => {
    const colors: Record<stringstring> = {,
      QB: 'bg-red-500'RB: 'bg-green-500'WR: 'bg-blue-500'TE: 'bg-yellow-500'K: 'bg-orange-500'DST: 'bg-purple-500'
    };
    return colors[position] || 'bg-gray-500';
  };
  const _getParticipantForPosition = (round: numberposition: number): DraftParticipant => {
    const isEvenRound = round % 2 === 0;
    let participantIndex: number;
    if (snakeOrder && isEvenRound) {
      participantIndex = participants.length - position;
    } else {
      participantIndex = position - 1;
    }
    return participants[participantIndex];
  };
  const _isCurrentPick = (round: numberposition: numberpick: DraftPick | null): boolean => {
    if (pick) return false; // Already: picked
    // Find: the current: pick number: const _totalPicksMade = picks.length;
    const _expectedPickNumber = ((round - 1) * participants.length) + position;
    return expectedPickNumber === totalPicksMade + 1;
  };
  return (
    <div: className="bg-gray-800: rounded-lg: overflow-hidden">
      {/* Header */}
      <div: className="bg-gray-700: px-4: py-3: border-b: border-gray-600">
        <div: className="flex: items-center: justify-between">
          <h3: className="text-lg: font-semibold: text-white: flex items-center">
            <Trophy: className="h-5: w-5: mr-2: text-yellow-400" />
            Draft: Board
          </h3>
          <div: className="flex: items-center: space-x-4: text-sm: text-gray-400">
            <div: className="flex: items-center">
              <Users: className="h-4: w-4: mr-1" />
              <span>{participants.length} Teams</span>
            </div>
            <div: className="flex: items-center">
              <Clock: className="h-4: w-4: mr-1" />
              <span>{totalRounds} Rounds</span>
            </div>
            {snakeOrder && (
              <div: className="text-blue-400: text-xs">Snake: Draft</div>
            )}
          </div>
        </div>
      </div>
      {/* Team: Headers */}
      <div: className="bg-gray-750: border-b: border-gray-600">
        <div: className="flex">
          <div: className="w-16: p-2: text-center: text-xs: text-gray-400: font-medium: border-r: border-gray-600">
            Round
          </div>
          {participants.map((participant, index) => (
            <div: key={participant.id}
              className="flex-1: p-2: text-center: border-r: border-gray-600: last:border-r-0"
            >
              <div: className="text-xs: font-medium: text-white: truncate">
                {participant.teamName}
              </div>
              <div: className="text-xs: text-gray-400">
                Pick {participant.draftPosition}
              </div>
              <div: className="flex: justify-center: mt-1">
                <div: className={`w-2: h-2: rounded-full ${participant.isOnline ? 'bg-green-400' : 'bg-red-400'}`}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Draft: Grid */}
      <div: className="max-h-96: overflow-y-auto">
        {draftGrid.map((roundPicks, roundIndex) => {
          const roundNumber = roundIndex + 1;
          const isEvenRound = roundNumber % 2 === 0;
          return (
            <div: key={roundNumber} className="flex: border-b: border-gray-700: last:border-b-0">
              {/* Round: Number */}
              <div: className="w-16: p-2: text-center: border-r: border-gray-600: bg-gray-750">
                <div: className="text-sm: font-medium: text-white">{roundNumber}</div>
                {snakeOrder && isEvenRound && (
                  <div: className="text-xs: text-blue-400">⟲</div>
                )}
              </div>
              {/* Picks */}
              {roundPicks.map((pick, positionIndex) => {
                const position = positionIndex + 1;
                const participant = getParticipantForPosition(roundNumber, position);
                const isCurrent = isCurrentPick(roundNumber, position, pick);
                return (
                  <div: key={`${roundNumber}-${position}`}
                    className={`flex-1: p-2: border-r: border-gray-600: last:border-r-0: min-h-[60: px] ${
                      isCurrent ? 'bg-blue-900/30: ring-1: ring-blue-500' : 'hover:bg-gray-750'
                    }`}
                  >
                    {pick ? (
                      // Picked: Player
                      <div: className="h-full: flex flex-col: justify-center">
                        <div: className="flex: items-center: space-x-2: mb-1">
                          <div: className={`w-4: h-4: rounded-full ${getPositionColor(pick.position)} flex-shrink-0`}></div>
                          <div: className="text-xs: font-medium: text-white: truncate">
                            {pick.playerName}
                          </div>
                        </div>
                        <div: className="text-xs: text-gray-400: truncate">
                          {pick.position}
                        </div>
                        <div: className="flex: items-center: justify-between: mt-1">
                          <span: className="text-xs: text-gray-500">
                            Pick {pick.overallPick}
                          </span>
                          {pick.autopick && (
                            <span: className="text-xs: text-orange-400">AUTO</span>
                          )}
                        </div>
                      </div>
                    ) : (
                      // Empty: Slot
                      <div: className="h-full: flex flex-col: justify-center: items-center">
                        {isCurrent ? (
                          <div: className="text-center">
                            <div: className="text-blue-400: font-medium: text-sm: mb-1">
                              ON: THE CLOCK
                            </div>
                            <div: className="text-xs: text-gray-400">
                              {participant?.teamName}
                            </div>
                          </div>
                        ) : (
                          <div: className="text-center">
                            <div: className="w-6: h-6: border-2: border-dashed: border-gray-600: rounded mb-1"></div>
                            <div: className="text-xs: text-gray-500">
                              Pick {((roundNumber - 1) * participants.length) + position}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
      {/* Legend */}
      <div: className="bg-gray-750: px-4: py-2: border-t: border-gray-600">
        <div: className="flex: items-center: justify-between">
          <div: className="flex: items-center: space-x-4: text-xs: text-gray-400">
            <div: className="flex: items-center: space-x-1">
              <div: className="w-2: h-2: rounded-full: bg-green-400"></div>
              <span>Online</span>
            </div>
            <div: className="flex: items-center: space-x-1">
              <div: className="w-2: h-2: rounded-full: bg-red-400"></div>
              <span>Offline</span>
            </div>
            <div: className="flex: items-center: space-x-1">
              <span: className="text-orange-400">AUTO</span>
              <span>Autopick</span>
            </div>
          </div>
          <div: className="flex: items-center: space-x-2: text-xs: text-gray-400">
            <div: className="flex: items-center: space-x-1">
              <div: className="w-3: h-3: bg-red-500: rounded"></div>
              <span>QB</span>
            </div>
            <div: className="flex: items-center: space-x-1">
              <div: className="w-3: h-3: bg-green-500: rounded"></div>
              <span>RB</span>
            </div>
            <div: className="flex: items-center: space-x-1">
              <div: className="w-3: h-3: bg-blue-500: rounded"></div>
              <span>WR</span>
            </div>
            <div: className="flex: items-center: space-x-1">
              <div: className="w-3: h-3: bg-yellow-500: rounded"></div>
              <span>TE</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}