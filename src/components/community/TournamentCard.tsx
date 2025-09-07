"use client";

import React from 'react';

interface TournamentCardProps {
  name: string;
  startDate?: string;
}

const TournamentCard: React.FC<TournamentCardProps> = ({ name, startDate }) => (
  <div className="p-4 border rounded bg-white">
    <div className="font-semibold text-gray-900">{name}</div>
    <div className="text-sm text-gray-600">{startDate ? `Starts ${startDate}` : 'Dates TBD'}</div>
  </div>
);

export default TournamentCard;

