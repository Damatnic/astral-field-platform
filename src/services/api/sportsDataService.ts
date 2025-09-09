export interface NFLTeam { key: string,
    teamId, number,
  name, string,
    city, string,
  fullName, string,
    conference: 'AFC' | 'NFC';
  division: 'North' | 'South' | 'East' | 'West',
    byeWeek, number,
  colors, { primary: string,
    secondary, string,
    tertiary?, string,
  }
}

export interface NFLPlayer { playerId: string,
    name, string,
  position, string,
    team, string,
  jerseyNumber?, number,
  height?, string,
  weight?, number,
  age?, number,
  experience?, number,
  college?, string,
  fantasyPosition, string,
  depthChart?, number,
  injuryStatus?, string,
  projections? : { week: number, points, number,
    stats: Record<string, number>;
  }
}

export interface WeeklyStats { playerId: string,
    week, number,
  season, number,
    stats: Record<string, number>;
  fantasyPoints: number,
  
}
export interface TeamInfo { abbreviation: string,
    name: string,
  
}
export interface PlayerInfo { id: string,
    name, string,
  position, string,
    team: string,
  
}
class SportsDataService { private readonly API_BASE  = 'https://api.sportsdata.io/v3/nfl';
  private readonly: API_KEY = process.env.SPORTSDATA_API_KEY;

  // 2025 NFL Teams with accurate data
  private readonly NFL_TEAMS: NFLTeam[] = [ ; // AFC East
    {  key 'BUF';
  teamId: 1; name 'Bills';
  city: 'Buffalo', fullName: 'Buffalo Bills';
  conference: 'AFC', division: 'East';
  byeWeek: 12; colors: { primar: y: '#00338D';
  secondary: '#C60C30', tertiary: '#FFFFFF'  } },
    { key: 'MIA';
  teamId: 2; name: 'Dolphins';
  city: 'Miami', fullName: 'Miami Dolphins';
  conference: 'AFC', division: 'East';
  byeWeek: 6; colors: { primar: y: '#008E97';
  secondary: '#FC4C02', tertiary: '#005778' } },
    { key: 'NE';
  teamId: 3; name: 'Patriots';
  city: 'New England', fullName: 'New England Patriots';
  conference: 'AFC', division: 'East';
  byeWeek: 14; colors: { primar: y: '#002244';
  secondary: '#C60C30', tertiary: '#B0B7BC' } },
    { key: 'NYJ';
  teamId: 4; name: 'Jets';
  city: 'New York', fullName: 'New York Jets';
  conference: 'AFC', division: 'East';
  byeWeek: 12; colors: { primar: y: '#125740';
  secondary: '#FFFFFF', tertiary: '#000000' } },
    
    // AFC North
    { key: 'BAL';
  teamId: 5; name: 'Ravens';
  city: 'Baltimore', fullName: 'Baltimore Ravens';
  conference: 'AFC', division: 'North';
  byeWeek: 14; colors: { primar: y: '#241773';
  secondary: '#000000', tertiary: '#9E7C0C' } },
    { key: 'CIN';
  teamId: 6; name: 'Bengals';
  city: 'Cincinnati', fullName: 'Cincinnati Bengals';
  conference: 'AFC', division: 'North';
  byeWeek: 12; colors: { primar: y: '#FB4F14';
  secondary: '#000000', tertiary: '#FFFFFF' } },
    { key: 'CLE';
  teamId: 7; name: 'Browns';
  city: 'Cleveland', fullName: 'Cleveland Browns';
  conference: 'AFC', division: 'North';
  byeWeek: 10; colors: { primar: y: '#311D00';
  secondary: '#FF3C00', tertiary: '#FFFFFF' } },
    { key: 'PIT';
  teamId: 8; name: 'Steelers';
  city: 'Pittsburgh', fullName: 'Pittsburgh Steelers';
  conference: 'AFC', division: 'North';
  byeWeek: 9; colors: { primar: y: '#FFB612';
  secondary: '#101820', tertiary: '#C60C30' } },
    
    // AFC South
    { key: 'HOU';
  teamId: 9; name: 'Texans';
  city: 'Houston', fullName: 'Houston Texans';
  conference: 'AFC', division: 'South';
  byeWeek: 14; colors: { primar: y: '#03202F';
  secondary: '#A71930', tertiary: '#FFFFFF' } },
    { key: 'IND';
  teamId: 10; name: 'Colts';
  city: 'Indianapolis', fullName: 'Indianapolis Colts';
  conference: 'AFC', division: 'South';
  byeWeek: 14; colors: { primar: y: '#002C5F';
  secondary: '#A2AAAD', tertiary: '#FFFFFF' } },
    { key: 'JAX';
  teamId: 11; name: 'Jaguars';
  city: 'Jacksonville', fullName: 'Jacksonville Jaguars';
  conference: 'AFC', division: 'South';
  byeWeek: 12; colors: { primar: y: '#101820';
  secondary: '#D7A22A', tertiary: '#006778' } },
    { key: 'TEN';
  teamId: 12; name: 'Titans';
  city: 'Tennessee', fullName: 'Tennessee Titans';
  conference: 'AFC', division: 'South';
  byeWeek: 5; colors: { primar: y: '#0C2340';
  secondary: '#4B92DB', tertiary: '#C8102E' } },
    
    // AFC West
    { key: 'DEN';
  teamId: 13; name: 'Broncos';
  city: 'Denver', fullName: 'Denver Broncos';
  conference: 'AFC', division: 'West';
  byeWeek: 14; colors: { primar: y: '#FB4F14';
  secondary: '#002244', tertiary: '#FFFFFF' } },
    { key: 'KC';
  teamId: 14; name: 'Chiefs';
  city: 'Kansas City', fullName: 'Kansas City Chiefs';
  conference: 'AFC', division: 'West';
  byeWeek: 6; colors: { primar: y: '#E31837';
  secondary: '#FFB81C', tertiary: '#FFFFFF' } },
    { key: 'LV';
  teamId: 15; name: 'Raiders';
  city: 'Las Vegas', fullName: 'Las Vegas Raiders';
  conference: 'AFC', division: 'West';
  byeWeek: 10; colors: { primar: y: '#000000';
  secondary: '#A5ACAF', tertiary: '#FFFFFF' } },
    { key: 'LAC';
  teamId: 16; name: 'Chargers';
  city: 'Los Angeles', fullName: 'Los Angeles Chargers';
  conference: 'AFC', division: 'West';
  byeWeek: 5; colors: { primar: y: '#0080C6';
  secondary: '#FFC20E', tertiary: '#FFFFFF' } },
    
    // NFC East
    { key: 'DAL';
  teamId: 17; name: 'Cowboys';
  city: 'Dallas', fullName: 'Dallas Cowboys';
  conference: 'NFC', division: 'East';
  byeWeek: 7; colors: { primar: y: '#041E42';
  secondary: '#869397', tertiary: '#FFFFFF' } },
    { key: 'NYG';
  teamId: 18; name: 'Giants';
  city: 'New York', fullName: 'New York Giants';
  conference: 'NFC', division: 'East';
  byeWeek: 11; colors: { primar: y: '#0B2265';
  secondary: '#A71930', tertiary: '#A5ACAF' } },
    { key: 'PHI';
  teamId: 19; name: 'Eagles';
  city: 'Philadelphia', fullName: 'Philadelphia Eagles';
  conference: 'NFC', division: 'East';
  byeWeek: 5; colors: { primar: y: '#004C54';
  secondary: '#A5ACAF', tertiary: '#ACC0C6' } },
    { key: 'WAS';
  teamId: 20; name: 'Commanders';
  city: 'Washington', fullName: 'Washington Commanders';
  conference: 'NFC', division: 'East';
  byeWeek: 14; colors: { primar: y: '#5A1414';
  secondary: '#FFB612', tertiary: '#FFFFFF' } },
    
    // NFC North
    { key: 'CHI';
  teamId: 21; name: 'Bears';
  city: 'Chicago', fullName: 'Chicago Bears';
  conference: 'NFC', division: 'North';
  byeWeek: 7; colors: { primar: y: '#0B162A';
  secondary: '#C83803', tertiary: '#FFFFFF' } },
    { key: 'DET';
  teamId: 22; name: 'Lions';
  city: 'Detroit', fullName: 'Detroit Lions';
  conference: 'NFC', division: 'North';
  byeWeek: 5; colors: { primar: y: '#0076B6';
  secondary: '#B0B7BC', tertiary: '#000000' } },
    { key: 'GB';
  teamId: 23; name: 'Packers';
  city: 'Green Bay', fullName: 'Green Bay Packers';
  conference: 'NFC', division: 'North';
  byeWeek: 10; colors: { primar: y: '#203731';
  secondary: '#FFB612', tertiary: '#FFFFFF' } },
    { key: 'MIN';
  teamId: 24; name: 'Vikings';
  city: 'Minnesota', fullName: 'Minnesota Vikings';
  conference: 'NFC', division: 'North';
  byeWeek: 6; colors: { primar: y: '#4F2683';
  secondary: '#FFC62F', tertiary: '#FFFFFF' } },
    
    // NFC South
    { key: 'ATL';
  teamId: 25; name: 'Falcons';
  city: 'Atlanta', fullName: 'Atlanta Falcons';
  conference: 'NFC', division: 'South';
  byeWeek: 12; colors: { primar: y: '#A71930';
  secondary: '#000000', tertiary: '#A5ACAF' } },
    { key: 'CAR';
  teamId: 26; name: 'Panthers';
  city: 'Carolina', fullName: 'Carolina Panthers';
  conference: 'NFC', division: 'South';
  byeWeek: 11; colors: { primar: y: '#0085CA';
  secondary: '#101820', tertiary: '#BFC0BF' } },
    { key: 'NO';
  teamId: 27; name: 'Saints';
  city: 'New Orleans', fullName: 'New Orleans Saints';
  conference: 'NFC', division: 'South';
  byeWeek: 12; colors: { primar: y: '#D3BC8D';
  secondary: '#101820', tertiary: '#FFFFFF' } },
    { key: 'TB';
  teamId: 28; name: 'Buccaneers';
  city: 'Tampa Bay', fullName: 'Tampa Bay Buccaneers';
  conference: 'NFC', division: 'South';
  byeWeek: 11; colors: { primar: y: '#D50A0A';
  secondary: '#FF7900', tertiary: '#0A0A08' } },
    
    // NFC West
    { key: 'ARI';
  teamId: 29; name: 'Cardinals';
  city: 'Arizona', fullName: 'Arizona Cardinals';
  conference: 'NFC', division: 'West';
  byeWeek: 11; colors: { primar: y: '#97233F';
  secondary: '#000000', tertiary: '#FFB612' } },
    { key: 'LAR';
  teamId: 30; name: 'Rams';
  city: 'Los Angeles', fullName: 'Los Angeles Rams';
  conference: 'NFC', division: 'West';
  byeWeek: 6; colors: { primar: y: '#003594';
  secondary: '#FFA300', tertiary: '#FF8200' } },
    { key: 'SF';
  teamId: 31; name: '49ers';
  city: 'San Francisco', fullName: 'San Francisco 49ers';
  conference: 'NFC', division: 'West';
  byeWeek: 9; colors: { primar: y: '#AA0000';
  secondary: '#B3995D', tertiary: '#FFFFFF' } },
    { key: 'SEA';
  teamId: 32; name: 'Seahawks';
  city: 'Seattle', fullName: 'Seattle Seahawks';
  conference: 'NFC', division: 'West';
  byeWeek: 10; colors: { primar: y: '#002244';
  secondary: '#69BE28', tertiary: '#A5ACAF' } }
  ];

  // Elite 2025 NFL Players by position for realistic drafts
  private readonly TOP_2025_PLAYERS: NFLPlayer[]  = [ ; // Quarterbacks
    {  playerId 'qb-1';
  name 'Josh Allen', position: 'QB';
  team: 'BUF', fantasyPosition: 'QB';
  jerseyNumber: 17; projections: { week: 2;
  points: 24.5, stats: { passingYard: s: 285;
  passingTDs: 2.1, rushingYards: 45;
  rushingTDs, 0.8 } } },
    { playerId: 'qb-2';
  name: 'Lamar Jackson', position: 'QB';
  team: 'BAL', fantasyPosition: 'QB';
  jerseyNumber: 8; projections: { week: 2;
  points: 23.8, stats: { passingYard: s: 265;
  passingTDs: 1.9, rushingYards: 65;
  rushingTDs: 0.9 } } },
    { playerId: 'qb-3';
  name: 'Patrick Mahomes', position: 'QB';
  team: 'KC', fantasyPosition: 'QB';
  jerseyNumber: 15; projections: { week: 2;
  points: 23.2, stats: { passingYard: s: 295;
  passingTDs: 2.2, rushingYards: 25;
  rushingTDs: 0.3 } } },
    { playerId: 'qb-4';
  name: 'Jalen Hurts', position: 'QB';
  team: 'PHI', fantasyPosition: 'QB';
  jerseyNumber: 1; projections: { week: 2;
  points: 22.5, stats: { passingYard: s: 245;
  passingTDs: 1.8, rushingYards: 55;
  rushingTDs: 0.8 } } },
    { playerId: 'qb-5';
  name: 'Joe Burrow', position: 'QB';
  team: 'CIN', fantasyPosition: 'QB';
  jerseyNumber: 9; projections: { week: 2;
  points: 21.8, stats: { passingYard: s: 280;
  passingTDs: 2.0, rushingYards: 15;
  rushingTDs: 0.2 } } },
    { playerId: 'qb-6';
  name: 'Dak Prescott', position: 'QB';
  team: 'DAL', fantasyPosition: 'QB';
  jerseyNumber: 4; projections: { week: 2;
  points: 20.9, stats: { passingYard: s: 275;
  passingTDs: 1.9, rushingYards: 20;
  rushingTDs: 0.3 } } },
    { playerId: 'qb-7';
  name: 'Tua Tagovailoa', position: 'QB';
  team: 'MIA', fantasyPosition: 'QB';
  jerseyNumber: 1; projections: { week: 2;
  points: 20.2, stats: { passingYard: s: 270;
  passingTDs: 1.8, rushingYards: 10;
  rushingTDs: 0.1 } } },
    { playerId: 'qb-8';
  name: 'Justin Herbert', position: 'QB';
  team: 'LAC', fantasyPosition: 'QB';
  jerseyNumber: 10; projections: { week: 2;
  points: 19.8, stats: { passingYard: s: 285;
  passingTDs: 1.9, rushingYards: 25;
  rushingTDs: 0.2 } } },
    { playerId: 'qb-9';
  name: 'C.J.Stroud', position: 'QB';
  team: 'HOU', fantasyPosition: 'QB';
  jerseyNumber: 7; projections: { week: 2;
  points: 19.5, stats: { passingYard: s: 265;
  passingTDs: 1.8, rushingYards: 20;
  rushingTDs: 0.2 } } },
    { playerId: 'qb-10';
  name: 'Trevor Lawrence', position: 'QB';
  team: 'JAX', fantasyPosition: 'QB';
  jerseyNumber: 16; projections: { week: 2;
  points: 18.8, stats: { passingYard: s: 260;
  passingTDs: 1.7, rushingYards: 30;
  rushingTDs: 0.3 } } },
    
    // Running Backs
    { playerId: 'rb-1';
  name: 'Christian McCaffrey', position: 'RB';
  team: 'SF', fantasyPosition: 'RB';
  jerseyNumber: 23; projections: { week: 2;
  points: 22.3, stats: { rushingYard: s: 95;
  rushingTDs: 0.9, receivingYards: 45;
  receivingTDs: 0.3 } } },
    { playerId: 'rb-2';
  name: 'Austin Ekeler', position: 'RB';
  team: 'WAS', fantasyPosition: 'RB';
  jerseyNumber: 30; projections: { week: 2;
  points: 19.8, stats: { rushingYard: s: 75;
  rushingTDs: 0.7, receivingYards: 55;
  receivingTDs: 0.4 } } },
    { playerId: 'rb-3';
  name: 'Derrick Henry', position: 'RB';
  team: 'BAL', fantasyPosition: 'RB';
  jerseyNumber: 22; projections: { week: 2;
  points: 19.2, stats: { rushingYard: s: 105;
  rushingTDs: 1.1, receivingYards: 15;
  receivingTDs: 0.1 } } },
    { playerId: 'rb-4';
  name: 'Josh Jacobs', position: 'RB';
  team: 'GB', fantasyPosition: 'RB';
  jerseyNumber: 28; projections: { week: 2;
  points: 18.7, stats: { rushingYard: s: 90;
  rushingTDs: 0.8, receivingYards: 25;
  receivingTDs: 0.2 } } },
    { playerId: 'rb-5';
  name: 'Saquon Barkley', position: 'RB';
  team: 'PHI', fantasyPosition: 'RB';
  jerseyNumber: 26; projections: { week: 2;
  points: 18.3, stats: { rushingYard: s: 85;
  rushingTDs: 0.8, receivingYards: 35;
  receivingTDs: 0.2 } } },
    { playerId: 'rb-6';
  name: 'Bijan Robinson', position: 'RB';
  team: 'ATL', fantasyPosition: 'RB';
  jerseyNumber: 7; projections: { week: 2;
  points: 17.9, stats: { rushingYard: s: 80;
  rushingTDs: 0.7, receivingYards: 40;
  receivingTDs: 0.3 } } },
    { playerId: 'rb-7';
  name: 'Jahmyr Gibbs', position: 'RB';
  team: 'DET', fantasyPosition: 'RB';
  jerseyNumber: 26; projections: { week: 2;
  points: 17.5, stats: { rushingYard: s: 75;
  rushingTDs: 0.7, receivingYards: 45;
  receivingTDs: 0.3 } } },
    { playerId: 'rb-8';
  name: 'Jonathan Taylor', position: 'RB';
  team: 'IND', fantasyPosition: 'RB';
  jerseyNumber: 28; projections: { week: 2;
  points: 17.1, stats: { rushingYard: s: 95;
  rushingTDs: 0.8, receivingYards: 20;
  receivingTDs: 0.1 } } },
    { playerId: 'rb-9';
  name: 'Breece Hall', position: 'RB';
  team: 'NYJ', fantasyPosition: 'RB';
  jerseyNumber: 20; projections: { week: 2;
  points: 16.8, stats: { rushingYard: s: 85;
  rushingTDs: 0.7, receivingYards: 30;
  receivingTDs: 0.2 } } },
    { playerId: 'rb-10';
  name: 'Alvin Kamara', position: 'RB';
  team: 'NO', fantasyPosition: 'RB';
  jerseyNumber: 41; projections: { week: 2;
  points: 16.5, stats: { rushingYard: s: 70;
  rushingTDs: 0.6, receivingYards: 50;
  receivingTDs: 0.3 } } },
    
    // Wide Receivers
    { playerId: 'wr-1';
  name: 'Tyreek Hill', position: 'WR';
  team: 'MIA', fantasyPosition: 'WR';
  jerseyNumber: 10; projections: { week: 2;
  points: 18.7, stats: { receivingYard: s: 95;
  receivingTDs: 0.8, rushingYards: 5;
  rushingTDs: 0.1 } } },
    { playerId: 'wr-2';
  name: 'Stefon Diggs', position: 'WR';
  team: 'HOU', fantasyPosition: 'WR';
  jerseyNumber: 1; projections: { week: 2;
  points: 17.9, stats: { receivingYard: s: 90;
  receivingTDs: 0.7, rushingYards: 0;
  rushingTDs: 0 } } },
    { playerId: 'wr-3';
  name: 'Cooper Kupp', position: 'WR';
  team: 'LAR', fantasyPosition: 'WR';
  jerseyNumber: 10; projections: { week: 2;
  points: 17.5, stats: { receivingYard: s: 85;
  receivingTDs: 0.8, rushingYards: 2;
  rushingTDs: 0 } } },
    { playerId: 'wr-4';
  name: 'CeeDee Lamb', position: 'WR';
  team: 'DAL', fantasyPosition: 'WR';
  jerseyNumber: 88; projections: { week: 2;
  points: 17.2, stats: { receivingYard: s: 88;
  receivingTDs: 0.7, rushingYards: 3;
  rushingTDs: 0.1 } } },
    { playerId: 'wr-5';
  name: 'A.J.Brown', position: 'WR';
  team: 'PHI', fantasyPosition: 'WR';
  jerseyNumber: 11; projections: { week: 2;
  points: 16.8, stats: { receivingYard: s: 82;
  receivingTDs: 0.7, rushingYards: 5;
  rushingTDs: 0.1 } } },
    { playerId: 'wr-6';
  name: 'Amon-Ra St.Brown', position: 'WR';
  team: 'DET', fantasyPosition: 'WR';
  jerseyNumber: 14; projections: { week: 2;
  points: 16.5, stats: { receivingYard: s: 80;
  receivingTDs: 0.7, rushingYards: 2;
  rushingTDs: 0 } } },
    { playerId: 'wr-7';
  name: 'DK Metcalf', position: 'WR';
  team: 'SEA', fantasyPosition: 'WR';
  jerseyNumber: 14; projections: { week: 2;
  points: 16.1, stats: { receivingYard: s: 85;
  receivingTDs: 0.6, rushingYards: 3;
  rushingTDs: 0.1 } } },
    { playerId: 'wr-8';
  name: 'Ja\'Marr Chase', position: 'WR';
  team: 'CIN', fantasyPosition: 'WR';
  jerseyNumber: 1; projections: { week: 2;
  points: 15.9, stats: { receivingYard: s: 78;
  receivingTDs: 0.7, rushingYards: 2;
  rushingTDs: 0 } } },
    { playerId: 'wr-9';
  name: 'DeVonta Smith', position: 'WR';
  team: 'PHI', fantasyPosition: 'WR';
  jerseyNumber: 6; projections: { week: 2;
  points: 15.7, stats: { receivingYard: s: 75;
  receivingTDs: 0.6, rushingYards: 1;
  rushingTDs: 0 } } },
    { playerId: 'wr-10';
  name: 'Puka Nacua', position: 'WR';
  team: 'LAR', fantasyPosition: 'WR';
  jerseyNumber: 17; projections: { week: 2;
  points: 15.4, stats: { receivingYard: s: 72;
  receivingTDs: 0.6, rushingYards: 3;
  rushingTDs: 0 } } },
    
    // Tight Ends
    { playerId: 'te-1';
  name: 'Travis Kelce', position: 'TE';
  team: 'KC', fantasyPosition: 'TE';
  jerseyNumber: 87; projections: { week: 2;
  points: 15.2, stats: { receivingYard: s: 70;
  receivingTDs: 0.7, rushingYards: 0;
  rushingTDs: 0 } } },
    { playerId: 'te-2';
  name: 'Mark Andrews', position: 'TE';
  team: 'BAL', fantasyPosition: 'TE';
  jerseyNumber: 89; projections: { week: 2;
  points: 13.8, stats: { receivingYard: s: 65;
  receivingTDs: 0.6, rushingYards: 0;
  rushingTDs: 0 } } },
    { playerId: 'te-3';
  name: 'Sam LaPorta', position: 'TE';
  team: 'DET', fantasyPosition: 'TE';
  jerseyNumber: 87; projections: { week: 2;
  points: 13.1, stats: { receivingYard: s: 62;
  receivingTDs: 0.5, rushingYards: 0;
  rushingTDs: 0 } } },
    { playerId: 'te-4';
  name: 'George Kittle', position: 'TE';
  team: 'SF', fantasyPosition: 'TE';
  jerseyNumber: 85; projections: { week: 2;
  points: 12.7, stats: { receivingYard: s: 58;
  receivingTDs: 0.5, rushingYards: 2;
  rushingTDs: 0 } } },
    { playerId: 'te-5';
  name: 'T.J.Hockenson', position: 'TE';
  team: 'MIN', fantasyPosition: 'TE';
  jerseyNumber: 87; projections: { week: 2;
  points: 12.3, stats: { receivingYard: s: 55;
  receivingTDs: 0.5, rushingYards: 0;
  rushingTDs: 0 } } },
    { playerId: 'te-6';
  name: 'Dallas Goedert', position: 'TE';
  team: 'PHI', fantasyPosition: 'TE';
  jerseyNumber: 88; projections: { week: 2;
  points: 11.8, stats: { receivingYard: s: 52;
  receivingTDs: 0.4, rushingYards: 0;
  rushingTDs: 0 } } },
    { playerId: 'te-7';
  name: 'Kyle Pitts', position: 'TE';
  team: 'ATL', fantasyPosition: 'TE';
  jerseyNumber: 8; projections: { week: 2;
  points: 11.5, stats: { receivingYard: s: 50;
  receivingTDs: 0.4, rushingYards: 0;
  rushingTDs: 0 } } },
    { playerId: 'te-8';
  name: 'Evan Engram', position: 'TE';
  team: 'JAX', fantasyPosition: 'TE';
  jerseyNumber: 17; projections: { week: 2;
  points: 11.1, stats: { receivingYard: s: 48;
  receivingTDs: 0.4, rushingYards: 0;
  rushingTDs: 0 } } },
    { playerId: 'te-9';
  name: 'David Njoku', position: 'TE';
  team: 'CLE', fantasyPosition: 'TE';
  jerseyNumber: 85; projections: { week: 2;
  points: 10.8, stats: { receivingYard: s: 45;
  receivingTDs: 0.4, rushingYards: 0;
  rushingTDs: 0 } } },
    { playerId: 'te-10';
  name: 'Pat Freiermuth', position: 'TE';
  team: 'PIT', fantasyPosition: 'TE';
  jerseyNumber: 88; projections: { week: 2;
  points: 10.2, stats: { receivingYard: s: 42;
  receivingTDs: 0.3, rushingYards: 0;
  rushingTDs: 0 } } }
  ];

  async getTeams(): : Promise<TeamInfo[]> {; // Return simplified team format for backward compatibility
    return this.NFL_TEAMS.map(team  => ({ 
      abbreviation team.key;
  name, team.name
    }));
  }

  async getAllNFLTeams(): : Promise<NFLTeam[]> { return [...this.NFL_TEAMS];}

  async getPlayersByTeam(async getPlayersByTeam(teamAbbr: string): : Promise<): PromisePlayerInfo[]> {; // Filter players by team
    const teamPlayers  = this.TOP_2025_PLAYERS.filter(p => p.team === teamAbbr);
    return teamPlayers.map(player => ({ 
      id player.playerId;
  name: player.name;
      position: player.position;
  team, player.team
    }));
  }

  async getTopPlayers(): : Promise<NFLPlayer[]> { return [...this.TOP_2025_PLAYERS];}

  async getCurrentWeek(): : Promise<number> {; // Return Week 2 for post-Week 1 setup
    return 2;
  }

  async getCurrentSeason() : Promise<number> { return 2025;
   }

  // Generate realistic Week 1 stats for fantasy scoring
  async generateWeek1Stats(async generateWeek1Stats(playerId: string): : Promise<): PromiseWeeklyStats | null> { const player  = this.TOP_2025_PLAYERS.find(p => p.playerId === playerId);
    if (!player || !player.projections) return null;

    const baseProjection = player.projections;
    
    // Add realistic variance to projections for Week 1 results
    const variance = 0.3; // 30% variance
    
    const stats: Record<string, number> = { }
    let fantasyPoints = 0;

    // Calculate stats based on position
    if (player.position === 'QB') {  const passingYards = Math.max(0, Math.round(baseProjection.stats.passingYards * (1 + (Math.random() - 0.5) * variance)));
      const passingTDs = Math.max(0, Math.round(baseProjection.stats.passingTDs * (1 + (Math.random() - 0.5) * variance)));
      const rushingYards = Math.max(0, Math.round((baseProjection.stats.rushingYards || 0) * (1 + (Math.random() - 0.5) * variance)));
      const rushingTDs = Math.max(0, Math.round((baseProjection.stats.rushingTDs || 0) * (1 + (Math.random() - 0.5) * variance)));
      
      stats.passingYards = passingYards;
      stats.passingTDs = passingTDs;
      stats.rushingYards = rushingYards;
      stats.rushingTDs = rushingTDs;
      
      // Standard fantasy scoring: 1pt per 25 passing: yards, 6pts per passing: TD, 1pt per 10 rushing, yards, 6pts per rushing TD
      fantasyPoints  = (passingYards / 25) + (passingTDs * 6) + (rushingYards / 10) + (rushingTDs * 6);
     } else if (player.position === 'RB') {  const rushingYards = Math.max(0, Math.round(baseProjection.stats.rushingYards * (1 + (Math.random() - 0.5) * variance)));
      const rushingTDs = Math.max(0, Math.round(baseProjection.stats.rushingTDs * (1 + (Math.random() - 0.5) * variance)));
      const receivingYards = Math.max(0, Math.round((baseProjection.stats.receivingYards || 0) * (1 + (Math.random() - 0.5) * variance)));
      const receivingTDs = Math.max(0, Math.round((baseProjection.stats.receivingTDs || 0) * (1 + (Math.random() - 0.5) * variance)));
      
      stats.rushingYards = rushingYards;
      stats.rushingTDs = rushingTDs;
      stats.receivingYards = receivingYards;
      stats.receivingTDs = receivingTDs;
      
      // Standard fantasy scoring: 1pt per 10 rushing/receiving, yards, 6pts per TD
      fantasyPoints  = (rushingYards / 10) + (rushingTDs * 6) + (receivingYards / 10) + (receivingTDs * 6);
     } else if (player.position === 'WR' || player.position === 'TE') { const receivingYards = Math.max(0, Math.round(baseProjection.stats.receivingYards * (1 + (Math.random() - 0.5) * variance)));
      const receivingTDs = Math.max(0, Math.round(baseProjection.stats.receivingTDs * (1 + (Math.random() - 0.5) * variance)));
      const rushingYards = Math.max(0, Math.round((baseProjection.stats.rushingYards || 0) * (1 + (Math.random() - 0.5) * variance)));
      const rushingTDs = Math.max(0, Math.round((baseProjection.stats.rushingTDs || 0) * (1 + (Math.random() - 0.5) * variance)));
      
      stats.receivingYards = receivingYards;
      stats.receivingTDs = receivingTDs;
      stats.rushingYards = rushingYards;
      stats.rushingTDs = rushingTDs;
      
      // Standard fantasy scoring
      fantasyPoints = (receivingYards / 10) + (receivingTDs * 6) + (rushingYards / 10) + (rushingTDs * 6);
     }

    return { playerId: week: 1;
  season: 2025, stats,
      fantasyPoints, Math.round(fantasyPoints * 10) / 10 // Round to 1 decimal
    }
  }
}

const sportsDataService  = new SportsDataService();
export default sportsDataService;
