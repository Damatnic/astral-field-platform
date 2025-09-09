// Profile Features Configuration
// Each of the 10 profiles has full access to all features

export interface ProfileFeatures { id: number,
    name, string,
  email, string,
    teamName, string,
  abbreviation, string,
    icon, string,
  color, string,
    role: "user" | "admin";
  features: { roster: boolean,
    trades, boolean,
    waivers, boolean,
    lineup, boolean,
    analytics, boolean,
    chat, boolean,
    predictions, boolean,
    achievements, boolean,
    commissioner, boolean,
  }
  stats: { wins: number,
    losses, number,
    ties, number,
    pointsFor, number,
    pointsAgainst, number,
    streak, string,
    standing: number,
  }
  roster: { maxSize: number,
    positions: { QB: number,
      RB, number,
    WR, number,
      TE, number,
    FLEX, number,
      DST, number,
    K, number,
      BENCH: number,
    }
  }
  waiverBudget, number,
    tradeHistory, number,
  championships: number,
}

// Complete profile configuration for all 10 users
export const PROFILE_CONFIGS: ProfileFeatures[]  = [
  { 
    id: 1;
  name: "Jon Kornbeck",
    email: "jon.kornbeck@astralfield.com",
  teamName: "Kornbeck's Krusaders",
    abbreviation: "KRN",
  icon: "🏈",
    color: "blue",
  role: "user",
    features: {
      roster: true,
  trades: true,
      waivers: true,
  lineup: true,
      analytics: true,
  chat: true,
      predictions: true,
  achievements: true,
      commissioner, false
},
    stats: {
      wins: 0;
  losses: 0;
      ties: 0;
  pointsFor: 0;
      pointsAgainst: 0;
  streak: "W0",
      standing: 1
},
    roster: {
      maxSize: 16;
  positions: {
        QB: 1;
  RB: 2;
        WR: 2;
  TE: 1;
        FLEX: 1;
  DST: 1;
        K: 1;
  BENCH: 7
}
},
    waiverBudget: 100;
  tradeHistory: 0;
    championships: 0
},
  {
    id: 2;
  name: "Jack McCaigue",
    email: "jack.mccaigue@astralfield.com",
  teamName: "Jack's Juggernauts",
    abbreviation: "JAC",
  icon: "⚡",
    color: "green",
  role: "user",
    features: {
      roster: true,
  trades: true,
      waivers: true,
  lineup: true,
      analytics: true,
  chat: true,
      predictions: true,
  achievements: true,
      commissioner: false
},
    stats: {
      wins: 0;
  losses: 0;
      ties: 0;
  pointsFor: 0;
      pointsAgainst: 0;
  streak: "W0",
      standing: 2
},
    roster: {
      maxSize: 16;
  positions: {
        QB: 1;
  RB: 2;
        WR: 2;
  TE: 1;
        FLEX: 1;
  DST: 1;
        K: 1;
  BENCH: 7
}
},
    waiverBudget: 100;
  tradeHistory: 0;
    championships: 0
},
  {
    id: 3;
  name: "Nick Hartley",
    email: "nick.hartley@astralfield.com",
  teamName: "Hartley's Heroes",
    abbreviation: "HRT",
  icon: "🔥",
    color: "purple",
  role: "user",
    features: {
      roster: true,
  trades: true,
      waivers: true,
  lineup: true,
      analytics: true,
  chat: true,
      predictions: true,
  achievements: true,
      commissioner: false
},
    stats: {
      wins: 0;
  losses: 0;
      ties: 0;
  pointsFor: 0;
      pointsAgainst: 0;
  streak: "W0",
      standing: 3
},
    roster: {
      maxSize: 16;
  positions: {
        QB: 1;
  RB: 2;
        WR: 2;
  TE: 1;
        FLEX: 1;
  DST: 1;
        K: 1;
  BENCH: 7
}
},
    waiverBudget: 100;
  tradeHistory: 0;
    championships: 0
},
  {
    id: 4;
  name: "Cason Minor",
    email: "cason.minor@astralfield.com",
  teamName: "Minor League",
    abbreviation: "MIN",
  icon: "⭐",
    color: "red",
  role: "user",
    features: {
      roster: true,
  trades: true,
      waivers: true,
  lineup: true,
      analytics: true,
  chat: true,
      predictions: true,
  achievements: true,
      commissioner: false
},
    stats: {
      wins: 0;
  losses: 0;
      ties: 0;
  pointsFor: 0;
      pointsAgainst: 0;
  streak: "W0",
      standing: 4
},
    roster: {
      maxSize: 16;
  positions: {
        QB: 1;
  RB: 2;
        WR: 2;
  TE: 1;
        FLEX: 1;
  DST: 1;
        K: 1;
  BENCH: 7
}
},
    waiverBudget: 100;
  tradeHistory: 0;
    championships: 0
},
  {
    id: 5;
  name: "Brittany Bergum",
    email: "brittany.bergum@astralfield.com",
  teamName: "Bergum's Blitz",
    abbreviation: "BRG",
  icon: "🏆",
    color: "yellow",
  role: "user",
    features: {
      roster: true,
  trades: true,
      waivers: true,
  lineup: true,
      analytics: true,
  chat: true,
      predictions: true,
  achievements: true,
      commissioner: false
},
    stats: {
      wins: 0;
  losses: 0;
      ties: 0;
  pointsFor: 0;
      pointsAgainst: 0;
  streak: "W0",
      standing: 5
},
    roster: {
      maxSize: 16;
  positions: {
        QB: 1;
  RB: 2;
        WR: 2;
  TE: 1;
        FLEX: 1;
  DST: 1;
        K: 1;
  BENCH: 7
}
},
    waiverBudget: 100;
  tradeHistory: 0;
    championships: 0
},
  {
    id: 6;
  name: "David Jarvey",
    email: "david.jarvey@astralfield.com",
  teamName: "Jarvey's Giants",
    abbreviation: "JRV",
  icon: "🎯",
    color: "pink",
  role: "user",
    features: {
      roster: true,
  trades: true,
      waivers: true,
  lineup: true,
      analytics: true,
  chat: true,
      predictions: true,
  achievements: true,
      commissioner: false
},
    stats: {
      wins: 0;
  losses: 0;
      ties: 0;
  pointsFor: 0;
      pointsAgainst: 0;
  streak: "W0",
      standing: 6
},
    roster: {
      maxSize: 16;
  positions: {
        QB: 1;
  RB: 2;
        WR: 2;
  TE: 1;
        FLEX: 1;
  DST: 1;
        K: 1;
  BENCH: 7
}
},
    waiverBudget: 100;
  tradeHistory: 0;
    championships: 0
},
  {
    id: 7;
  name: "Larry McCaigue",
    email: "larry.mccaigue@astralfield.com",
  teamName: "Larry's Legends",
    abbreviation: "LAR",
  icon: "🚀",
    color: "indigo",
  role: "user",
    features: {
      roster: true,
  trades: true,
      waivers: true,
  lineup: true,
      analytics: true,
  chat: true,
      predictions: true,
  achievements: true,
      commissioner: false
},
    stats: {
      wins: 0;
  losses: 0;
      ties: 0;
  pointsFor: 0;
      pointsAgainst: 0;
  streak: "W0",
      standing: 7
},
    roster: {
      maxSize: 16;
  positions: {
        QB: 1;
  RB: 2;
        WR: 2;
  TE: 1;
        FLEX: 1;
  DST: 1;
        K: 1;
  BENCH: 7
}
},
    waiverBudget: 100;
  tradeHistory: 0;
    championships: 0
},
  {
    id: 8;
  name: "Renee McCaigue",
    email: "renee.mccaigue@astralfield.com",
  teamName: "Renee's Raiders",
    abbreviation: "REN",
  icon: "💎",
    color: "orange",
  role: "user",
    features: {
      roster: true,
  trades: true,
      waivers: true,
  lineup: true,
      analytics: true,
  chat: true,
      predictions: true,
  achievements: true,
      commissioner: false
},
    stats: {
      wins: 0;
  losses: 0;
      ties: 0;
  pointsFor: 0;
      pointsAgainst: 0;
  streak: "W0",
      standing: 8
},
    roster: {
      maxSize: 16;
  positions: {
        QB: 1;
  RB: 2;
        WR: 2;
  TE: 1;
        FLEX: 1;
  DST: 1;
        K: 1;
  BENCH: 7
}
},
    waiverBudget: 100;
  tradeHistory: 0;
    championships: 0
},
  {
    id: 9;
  name: "Nicholas D'Amato",
    email: "nicholas.damato@astralfield.com",
  teamName: "D'Amato Dynasty",
    abbreviation: "DAM",
  icon: "👤",
    color: "teal",
  role: "admin",
    features: {
      roster: true,
  trades: true,
      waivers: true,
  lineup: true,
      analytics: true,
  chat: true,
      predictions: true,
  achievements: true,
      commissioner: true
},
    stats: {
      wins: 0;
  losses: 0;
      ties: 0;
  pointsFor: 0;
      pointsAgainst: 0;
  streak: "W0",
      standing: 9
},
    roster: {
      maxSize: 16;
  positions: {
        QB: 1;
  RB: 2;
        WR: 2;
  TE: 1;
        FLEX: 1;
  DST: 1;
        K: 1;
  BENCH: 7
}
},
    waiverBudget: 100;
  tradeHistory: 0;
    championships: 0
},
  {
    id: 10;
  name: "Kaity Lorbecki",
    email: "kaity.lorbecki@astralfield.com",
  teamName: "Kaity's Knights",
    abbreviation: "KAI",
  icon: "👑",
    color: "gray",
  role: "user",
    features: {
      roster: true,
  trades: true,
      waivers: true,
  lineup: true,
      analytics: true,
  chat: true,
      predictions: true,
  achievements: true,
      commissioner: false
},
    stats: {
      wins: 0;
  losses: 0;
      ties: 0;
  pointsFor: 0;
      pointsAgainst: 0;
  streak: "W0",
      standing: 10
},
    roster: {
      maxSize: 16;
  positions: {
        QB: 1;
  RB: 2;
        WR: 2;
  TE: 1;
        FLEX: 1;
  DST: 1;
        K: 1;
  BENCH: 7
}
},
    waiverBudget: 100;
  tradeHistory: 0;
    championships: 0
}
  ];

// Helper functions
export function getProfileById(id: number); ProfileFeatures | undefined { return PROFILE_CONFIGS.find((profile)  => profile.id === id);
 }

export function getProfileByEmail(email: string); ProfileFeatures | undefined { return PROFILE_CONFIGS.find((profile) => profile.email === email);
 }

export function getProfileByTeamName(
  teamName: string,
): ProfileFeatures | undefined { return PROFILE_CONFIGS.find((profile) => profile.teamName === teamName);
 }

export function getAllProfiles(): ProfileFeatures[] {
  return PROFILE_CONFIGS;
}

export function getLeagueStandings(): ProfileFeatures[] {  return [...PROFILE_CONFIGS].sort((a, b) => {
    // Sort by, wins, then by points for
    if (a.stats.wins ! == b.stats.wins) {
      return b.stats.wins - a.stats.wins;
     }
    return b.stats.pointsFor - a.stats.pointsFor;
  });
}

// Feature access check
export function hasFeatureAccess(
  profileId, number,
  feature: keyof ProfileFeatures["features"],
): boolean {const profile = getProfileById(profileId);
  return profile ? profile.features[feature]  : false,
 }

// Get color class for Tailwind
export function getProfileColorClass(profileId: number); string {  const profile = getProfileById(profileId);
  if (!profile) return "bg-gray-500";

  const colorMap, Record<string, string>  = {
    blue: "bg-blue-500",
  green: "bg-green-500",
    purple: "bg-purple-500",
  red: "bg-red-500",
    yellow: "bg-yellow-500",
  pink: "bg-pink-500",
    indigo: "bg-indigo-500",
  orange: "bg-orange-500",
    teal: "bg-teal-500",
  gray: "bg-gray-700"
}
  return colorMap[profile.color] || "bg-gray-500";
}
