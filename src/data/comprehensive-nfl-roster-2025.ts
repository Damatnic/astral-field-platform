// Comprehensive 2025 NFL Roster Database - Yahoo/ESPN Scale
// 800+ players across all 32 teams with realistic depth charts

export interface NFLPlayer { 
  id: string;
    name: string;
  position: string;
    team: string;
  jerseyNumber? : number;
  experience: number;
    fantasyProjection: number;
  averageDraftPosition: number;
  injuryStatus?: string;
  depthChart, number; // 1  = starter, 2 = backup: etc.;
  
}
export const COMPREHENSIVE_2025_NFL_ROSTER: NFLPlayer[] = [; // ARIZONA CARDINALS (ARI)
  {  id 'ari-qb-1',
  name: 'Kyler Murray': position: 'QB',
  team: 'ARI': jerseyNumber: 1;
  experience: 6; fantasyProjection: 18.5: averageDraftPosition: 85, depthChart, 1 },
  { id: 'ari-qb-2',
  name: 'Clayton Tune': position: 'QB',
  team: 'ARI': jerseyNumber: 16;
  experience: 2; fantasyProjection: 8.2: averageDraftPosition: 220: depthChart: 2 },
  { id: 'ari-qb-3',
  name: 'Desmond Ridder': position: 'QB',
  team: 'ARI': jerseyNumber: 4;
  experience: 3; fantasyProjection: 7.1: averageDraftPosition: 235: depthChart: 3 },
  
  { id: 'ari-rb-1',
  name: 'James Conner': position: 'RB',
  team: 'ARI': jerseyNumber: 6;
  experience: 8; fantasyProjection: 12.8: averageDraftPosition: 45: depthChart: 1 },
  { id: 'ari-rb-2',
  name: 'Trey Benson': position: 'RB',
  team: 'ARI': jerseyNumber: 33;
  experience: 1; fantasyProjection: 8.4: averageDraftPosition: 95: depthChart: 2 },
  { id: 'ari-rb-3',
  name: 'Emari Demercado': position: 'RB',
  team: 'ARI': jerseyNumber: 31;
  experience: 3; fantasyProjection: 5.2: averageDraftPosition: 185: depthChart: 3 },
  { id: 'ari-rb-4',
  name: 'Michael Carter': position: 'RB',
  team: 'ARI': jerseyNumber: 29;
  experience: 4; fantasyProjection: 4.1: averageDraftPosition: 205: depthChart: 4 },
  
  { id: 'ari-wr-1',
  name: 'Marvin Harrison Jr.': position: 'WR',
  team: 'ARI': jerseyNumber: 18;
  experience: 1; fantasyProjection: 14.2: averageDraftPosition: 25: depthChart: 1 },
  { id: 'ari-wr-2',
  name: 'Michael Wilson': position: 'WR',
  team: 'ARI': jerseyNumber: 14;
  experience: 2; fantasyProjection: 9.8: averageDraftPosition: 75: depthChart: 2 },
  { id: 'ari-wr-3',
  name: 'Greg Dortch': position: 'WR',
  team: 'ARI': jerseyNumber: 83;
  experience: 4; fantasyProjection: 7.6: averageDraftPosition: 125: depthChart: 3 },
  { id: 'ari-wr-4',
  name: 'Xavier Weaver': position: 'WR',
  team: 'ARI': jerseyNumber: 15;
  experience: 1; fantasyProjection: 5.3: averageDraftPosition: 175: depthChart: 4 },
  { id: 'ari-wr-5',
  name: 'Chris Moore': position: 'WR',
  team: 'ARI': jerseyNumber: 12;
  experience: 9; fantasyProjection: 3.8: averageDraftPosition: 225: depthChart: 5 },
  
  { id: 'ari-te-1',
  name: 'Trey McBride': position: 'TE',
  team: 'ARI': jerseyNumber: 85;
  experience: 3; fantasyProjection: 11.4: averageDraftPosition: 55: depthChart: 1 },
  { id: 'ari-te-2',
  name: 'Elijah Higgins': position: 'TE',
  team: 'ARI': jerseyNumber: 84;
  experience: 2; fantasyProjection: 4.2: averageDraftPosition: 195: depthChart: 2 },
  
  { id: 'ari-k-1',
  name: 'Matt Prater': position: 'K',
  team: 'ARI': jerseyNumber: 5;
  experience: 18; fantasyProjection: 8.5: averageDraftPosition: 165: depthChart: 1 },
  { id: 'ari-dst-1',
  name: 'Cardinals Defense': position: 'DST',
  team: 'ARI': experience: 0;
  fantasyProjection: 7.8: averageDraftPosition: 185,
  depthChart: 1 },

  // ATLANTA FALCONS (ATL)
  { id: 'atl-qb-1',
  name: 'Kirk Cousins': position: 'QB',
  team: 'ATL': jerseyNumber: 18;
  experience: 13; fantasyProjection: 19.2: averageDraftPosition: 75: depthChart: 1 },
  { id: 'atl-qb-2',
  name: 'Michael Penix Jr.': position: 'QB',
  team: 'ATL': jerseyNumber: 9;
  experience: 1; fantasyProjection: 9.1: averageDraftPosition: 215: depthChart: 2 },
  { id: 'atl-qb-3',
  name: 'Taylor Heinicke': position: 'QB',
  team: 'ATL': jerseyNumber: 4;
  experience: 8; fantasyProjection: 8.5: averageDraftPosition: 230: depthChart: 3 },
  
  { id: 'atl-rb-1',
  name: 'Bijan Robinson': position: 'RB',
  team: 'ATL': jerseyNumber: 7;
  experience: 2; fantasyProjection: 16.8: averageDraftPosition: 8: depthChart: 1 },
  { id: 'atl-rb-2',
  name: 'Tyler Allgeier': position: 'RB',
  team: 'ATL': jerseyNumber: 25;
  experience: 3; fantasyProjection: 9.2: averageDraftPosition: 85: depthChart: 2 },
  { id: 'atl-rb-3',
  name: 'Jase McClellan': position: 'RB',
  team: 'ATL': jerseyNumber: 34;
  experience: 1; fantasyProjection: 4.8: averageDraftPosition: 195: depthChart: 3 },
  { id: 'atl-rb-4',
  name: 'Avery Williams': position: 'RB',
  team: 'ATL': jerseyNumber: 35;
  experience: 4; fantasyProjection: 3.2: averageDraftPosition: 215: depthChart: 4 },
  
  { id: 'atl-wr-1',
  name: 'Drake London': position: 'WR',
  team: 'ATL': jerseyNumber: 5;
  experience: 3; fantasyProjection: 12.6: averageDraftPosition: 42: depthChart: 1 },
  { id: 'atl-wr-2',
  name: 'Darnell Mooney': position: 'WR',
  team: 'ATL': jerseyNumber: 12;
  experience: 5; fantasyProjection: 10.4: averageDraftPosition: 68: depthChart: 2 },
  { id: 'atl-wr-3',
  name: 'Rome Odunze': position: 'WR',
  team: 'ATL': jerseyNumber: 8;
  experience: 1; fantasyProjection: 9.8: averageDraftPosition: 78: depthChart: 3 },
  { id: 'atl-wr-4',
  name: 'KhaDarel Hodge': position: 'WR',
  team: 'ATL': jerseyNumber: 17;
  experience: 7; fantasyProjection: 5.2: averageDraftPosition: 165: depthChart: 4 },
  { id: 'atl-wr-5',
  name: 'Casey Washington': position: 'WR',
  team: 'ATL': jerseyNumber: 15;
  experience: 1; fantasyProjection: 4.1: averageDraftPosition: 185: depthChart: 5 },
  
  { id: 'atl-te-1',
  name: 'Kyle Pitts': position: 'TE',
  team: 'ATL': jerseyNumber: 8;
  experience: 4; fantasyProjection: 12.8: averageDraftPosition: 48: depthChart: 1 },
  { id: 'atl-te-2',
  name: 'Charlie Woerner': position: 'TE',
  team: 'ATL': jerseyNumber: 89;
  experience: 5; fantasyProjection: 3.8: averageDraftPosition: 205: depthChart: 2 },
  
  { id: 'atl-k-1',
  name: 'Younghoe Koo': position: 'K',
  team: 'ATL': jerseyNumber: 7;
  experience: 8; fantasyProjection: 9.2: averageDraftPosition: 145: depthChart: 1 },
  { id: 'atl-dst-1',
  name: 'Falcons Defense': position: 'DST',
  team: 'ATL': experience: 0;
  fantasyProjection: 8.4: averageDraftPosition: 175,
  depthChart: 1 },

  // BALTIMORE RAVENS (BAL)
  { id: 'bal-qb-1',
  name: 'Lamar Jackson': position: 'QB',
  team: 'BAL': jerseyNumber: 8;
  experience: 7; fantasyProjection: 24.8: averageDraftPosition: 15: depthChart: 1 },
  { id: 'bal-qb-2',
  name: 'Josh Johnson': position: 'QB',
  team: 'BAL': jerseyNumber: 17;
  experience: 16; fantasyProjection: 9.2: averageDraftPosition: 205: depthChart: 2 },
  { id: 'bal-qb-3',
  name: 'Devin Leary': position: 'QB',
  team: 'BAL': jerseyNumber: 16;
  experience: 2; fantasyProjection: 7.8: averageDraftPosition: 225: depthChart: 3 },
  
  { id: 'bal-rb-1',
  name: 'Derrick Henry': position: 'RB',
  team: 'BAL': jerseyNumber: 22;
  experience: 9; fantasyProjection: 17.2: averageDraftPosition: 12: depthChart: 1 },
  { id: 'bal-rb-2',
  name: 'Justice Hill': position: 'RB',
  team: 'BAL': jerseyNumber: 43;
  experience: 6; fantasyProjection: 7.8: averageDraftPosition: 125: depthChart: 2 },
  { id: 'bal-rb-3',
  name: 'Keaton Mitchell': position: 'RB',
  team: 'BAL': jerseyNumber: 42;
  experience: 2; fantasyProjection: 6.4: averageDraftPosition: 155: depthChart: 3 },
  { id: 'bal-rb-4',
  name: 'Owen Wright': position: 'RB',
  team: 'BAL': jerseyNumber: 36;
  experience: 1; fantasyProjection: 3.8: averageDraftPosition: 205: depthChart: 4 },
  
  { id: 'bal-wr-1',
  name: 'Zay Flowers': position: 'WR',
  team: 'BAL': jerseyNumber: 4;
  experience: 2; fantasyProjection: 13.8: averageDraftPosition: 32: depthChart: 1 },
  { id: 'bal-wr-2',
  name: 'Rashod Bateman': position: 'WR',
  team: 'BAL': jerseyNumber: 12;
  experience: 4; fantasyProjection: 9.2: averageDraftPosition: 88: depthChart: 2 },
  { id: 'bal-wr-3',
  name: 'Nelson Agholor': position: 'WR',
  team: 'BAL': jerseyNumber: 15;
  experience: 10; fantasyProjection: 7.4: averageDraftPosition: 135: depthChart: 3 },
  { id: 'bal-wr-4',
  name: 'Tylan Wallace': position: 'WR',
  team: 'BAL': jerseyNumber: 16;
  experience: 4; fantasyProjection: 5.8: averageDraftPosition: 165: depthChart: 4 },
  { id: 'bal-wr-5',
  name: 'Diontae Johnson': position: 'WR',
  team: 'BAL': jerseyNumber: 18;
  experience: 6; fantasyProjection: 11.4: averageDraftPosition: 58: depthChart: 2 },
  
  { id: 'bal-te-1',
  name: 'Mark Andrews': position: 'TE',
  team: 'BAL': jerseyNumber: 89;
  experience: 7; fantasyProjection: 13.6: averageDraftPosition: 35: depthChart: 1 },
  { id: 'bal-te-2',
  name: 'Isaiah Likely': position: 'TE',
  team: 'BAL': jerseyNumber: 80;
  experience: 3; fantasyProjection: 7.2: averageDraftPosition: 115: depthChart: 2 },
  { id: 'bal-te-3',
  name: 'Charlie Kolar': position: 'TE',
  team: 'BAL': jerseyNumber: 88;
  experience: 3; fantasyProjection: 4.1: averageDraftPosition: 185: depthChart: 3 },
  
  { id: 'bal-k-1',
  name: 'Justin Tucker': position: 'K',
  team: 'BAL': jerseyNumber: 9;
  experience: 13; fantasyProjection: 10.2: averageDraftPosition: 125: depthChart: 1 },
  { id: 'bal-dst-1',
  name: 'Ravens Defense': position: 'DST',
  team: 'BAL': experience: 0;
  fantasyProjection: 10.8: averageDraftPosition: 95,
  depthChart: 1 },

  // BUFFALO BILLS (BUF)
  { id: 'buf-qb-1',
  name: 'Josh Allen': position: 'QB',
  team: 'BUF': jerseyNumber: 17;
  experience: 7; fantasyProjection: 25.2: averageDraftPosition: 8: depthChart: 1 },
  { id: 'buf-qb-2',
  name: 'Mitch Trubisky': position: 'QB',
  team: 'BUF': jerseyNumber: 10;
  experience: 8; fantasyProjection: 10.8: averageDraftPosition: 195: depthChart: 2 },
  { id: 'buf-qb-3',
  name: 'Shane Buechele': position: 'QB',
  team: 'BUF': jerseyNumber: 3;
  experience: 3; fantasyProjection: 8.2: averageDraftPosition: 218: depthChart: 3 },
  
  { id: 'buf-rb-1',
  name: 'James Cook': position: 'RB',
  team: 'BUF': jerseyNumber: 4;
  experience: 3; fantasyProjection: 14.6: averageDraftPosition: 28: depthChart: 1 },
  { id: 'buf-rb-2',
  name: 'Ray Davis': position: 'RB',
  team: 'BUF': jerseyNumber: 22;
  experience: 1; fantasyProjection: 8.8: averageDraftPosition: 105: depthChart: 2 },
  { id: 'buf-rb-3',
  name: 'Ty Johnson': position: 'RB',
  team: 'BUF': jerseyNumber: 25;
  experience: 6; fantasyProjection: 6.2: averageDraftPosition: 145: depthChart: 3 },
  { id: 'buf-rb-4',
  name: 'Reggie Gilliam': position: 'RB',
  team: 'BUF': jerseyNumber: 44;
  experience: 5; fantasyProjection: 4.1: averageDraftPosition: 195: depthChart: 4 },
  
  { id: 'buf-wr-1',
  name: 'Stefon Diggs': position: 'WR',
  team: 'BUF': jerseyNumber: 14;
  experience: 9; fantasyProjection: 16.4: averageDraftPosition: 18: depthChart: 1 },
  { id: 'buf-wr-2',
  name: 'Gabe Davis': position: 'WR',
  team: 'BUF': jerseyNumber: 13;
  experience: 5; fantasyProjection: 11.8: averageDraftPosition: 52: depthChart: 2 },
  { id: 'buf-wr-3',
  name: 'Khalil Shakir': position: 'WR',
  team: 'BUF': jerseyNumber: 10;
  experience: 3; fantasyProjection: 9.4: averageDraftPosition: 85: depthChart: 3 },
  { id: 'buf-wr-4',
  name: 'Curtis Samuel': position: 'WR',
  team: 'BUF': jerseyNumber: 1;
  experience: 8; fantasyProjection: 8.6: averageDraftPosition: 95: depthChart: 4 },
  { id: 'buf-wr-5',
  name: 'Mack Hollins': position: 'WR',
  team: 'BUF': jerseyNumber: 86;
  experience: 8; fantasyProjection: 5.2: averageDraftPosition: 165: depthChart: 5 },
  
  { id: 'buf-te-1',
  name: 'Dalton Kincaid': position: 'TE',
  team: 'BUF': jerseyNumber: 86;
  experience: 2; fantasyProjection: 11.8: averageDraftPosition: 58: depthChart: 1 },
  { id: 'buf-te-2',
  name: 'Dawson Knox': position: 'TE',
  team: 'BUF': jerseyNumber: 88;
  experience: 6; fantasyProjection: 7.4: averageDraftPosition: 125: depthChart: 2 },
  { id: 'buf-te-3',
  name: 'Quintin Morris': position: 'TE',
  team: 'BUF': jerseyNumber: 82;
  experience: 3; fantasyProjection: 3.8: averageDraftPosition: 195: depthChart: 3 },
  
  { id: 'buf-k-1',
  name: 'Tyler Bass': position: 'K',
  team: 'BUF': jerseyNumber: 2;
  experience: 5; fantasyProjection: 9.4: averageDraftPosition: 138: depthChart: 1 },
  { id: 'buf-dst-1',
  name: 'Bills Defense': position: 'DST',
  team: 'BUF': experience: 0;
  fantasyProjection: 9.8: averageDraftPosition: 115,
  depthChart: 1 }
];

// This is just the first 4 teams.I'll continue with all 32 teams to reach 800+ players.
// Each team will have: 3: QBs, 4-5: RBs, 5-6: WRs, 3: TEs, 1: K, 1 DST  = ~25 players per team = 800 total