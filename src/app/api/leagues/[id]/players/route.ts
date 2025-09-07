import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Comprehensive NFL player database for realistic display
const nflPlayers = [
  // Quarterbacks
  {
    id: "qb1",
    name: "Josh Allen",
    position: "QB",
    team: "BUF",
    available: false,
    ownedBy: "Team A",
    percentOwned: 99,
    percentStarted: 95,
    seasonStats: { passYards: 4306, passTDs: 29, rushYards: 523, rushTDs: 15 },
    last3Games: [28.5, 21.2, 31.8],
    projection: 24.2,
    adp: 1.2,
  },
  {
    id: "qb2",
    name: "Patrick Mahomes",
    position: "QB",
    team: "KC",
    available: false,
    ownedBy: "Team B",
    percentOwned: 99,
    percentStarted: 94,
    seasonStats: { passYards: 4183, passTDs: 27, rushYards: 389, rushTDs: 4 },
    last3Games: [26.1, 19.8, 24.5],
    projection: 23.8,
    adp: 1.8,
  },
  {
    id: "qb3",
    name: "Lamar Jackson",
    position: "QB",
    team: "BAL",
    available: false,
    ownedBy: "Team C",
    percentOwned: 98,
    percentStarted: 92,
    seasonStats: { passYards: 3678, passTDs: 24, rushYards: 821, rushTDs: 3 },
    last3Games: [22.4, 15.6, 27.9],
    projection: 22.1,
    adp: 2.1,
  },
  {
    id: "qb4",
    name: "Joe Burrow",
    position: "QB",
    team: "CIN",
    available: true,
    ownedBy: null,
    percentOwned: 87,
    percentStarted: 78,
    seasonStats: { passYards: 2952, passTDs: 18, rushYards: 45, rushTDs: 1 },
    last3Games: [18.2, 24.6, 16.8],
    projection: 19.5,
    adp: 3.2,
  },
  {
    id: "qb5",
    name: "Tua Tagovailoa",
    position: "QB",
    team: "MIA",
    available: true,
    ownedBy: null,
    percentOwned: 73,
    percentStarted: 65,
    seasonStats: { passYards: 2867, passTDs: 17, rushYards: 38, rushTDs: 0 },
    last3Games: [16.4, 22.1, 13.7],
    projection: 17.8,
    adp: 8.5,
  },

  // Running Backs
  {
    id: "rb1",
    name: "Christian McCaffrey",
    position: "RB",
    team: "SF",
    available: false,
    ownedBy: "Team D",
    percentOwned: 100,
    percentStarted: 98,
    seasonStats: { rushYards: 1459, rushTDs: 14, recYards: 564, recTDs: 7 },
    last3Games: [24.8, 31.2, 18.7],
    projection: 22.5,
    adp: 1.1,
  },
  {
    id: "rb2",
    name: "Derrick Henry",
    position: "RB",
    team: "BAL",
    available: false,
    ownedBy: "Team E",
    percentOwned: 99,
    percentStarted: 92,
    seasonStats: { rushYards: 1325, rushTDs: 13, recYards: 169, recTDs: 1 },
    last3Games: [19.3, 16.8, 25.4],
    projection: 18.9,
    adp: 2.8,
  },
  {
    id: "rb3",
    name: "Saquon Barkley",
    position: "RB",
    team: "PHI",
    available: false,
    ownedBy: "Team F",
    percentOwned: 98,
    percentStarted: 89,
    seasonStats: { rushYards: 1838, rushTDs: 13, recYards: 278, recTDs: 2 },
    last3Games: [22.1, 14.6, 28.3],
    projection: 19.8,
    adp: 1.8,
  },
  {
    id: "rb4",
    name: "Kyren Williams",
    position: "RB",
    team: "LAR",
    available: true,
    ownedBy: null,
    percentOwned: 89,
    percentStarted: 76,
    seasonStats: { rushYards: 1144, rushTDs: 12, recYards: 206, recTDs: 3 },
    last3Games: [15.7, 18.2, 12.4],
    projection: 16.1,
    adp: 4.2,
  },
  {
    id: "rb5",
    name: "Aaron Jones",
    position: "RB",
    team: "MIN",
    available: true,
    ownedBy: null,
    percentOwned: 84,
    percentStarted: 71,
    seasonStats: { rushYards: 1138, rushTDs: 5, recYards: 408, recTDs: 2 },
    last3Games: [13.8, 20.5, 11.2],
    projection: 15.3,
    adp: 5.1,
  },
  {
    id: "rb6",
    name: "Rachaad White",
    position: "RB",
    team: "TB",
    available: true,
    ownedBy: null,
    percentOwned: 67,
    percentStarted: 54,
    seasonStats: { rushYards: 990, rushTDs: 4, recYards: 549, recTDs: 1 },
    last3Games: [11.4, 16.8, 9.7],
    projection: 12.8,
    adp: 7.3,
  },
  {
    id: "rb7",
    name: "Rico Dowdle",
    position: "RB",
    team: "DAL",
    available: true,
    ownedBy: null,
    percentOwned: 45,
    percentStarted: 32,
    seasonStats: { rushYards: 876, rushTDs: 4, recYards: 144, recTDs: 1 },
    last3Games: [14.2, 8.6, 19.3],
    projection: 11.5,
    adp: 12.8,
  },

  // Wide Receivers
  {
    id: "wr1",
    name: "Tyreek Hill",
    position: "WR",
    team: "MIA",
    available: false,
    ownedBy: "Team G",
    percentOwned: 100,
    percentStarted: 97,
    seasonStats: { recYards: 1200, recTDs: 7, rushYards: 38, rushTDs: 1 },
    last3Games: [18.5, 22.1, 14.8],
    projection: 18.2,
    adp: 1.5,
  },
  {
    id: "wr2",
    name: "CeeDee Lamb",
    position: "WR",
    team: "DAL",
    available: false,
    ownedBy: "Team H",
    percentOwned: 99,
    percentStarted: 94,
    seasonStats: { recYards: 1194, recTDs: 5, rushYards: 24, rushTDs: 0 },
    last3Games: [16.2, 19.8, 12.4],
    projection: 17.1,
    adp: 1.8,
  },
  {
    id: "wr3",
    name: "Amon-Ra St. Brown",
    position: "WR",
    team: "DET",
    available: false,
    ownedBy: "Team I",
    percentOwned: 98,
    percentStarted: 91,
    seasonStats: { recYards: 1263, recTDs: 8, rushYards: 15, rushTDs: 1 },
    last3Games: [20.3, 15.7, 24.1],
    projection: 18.8,
    adp: 2.2,
  },
  {
    id: "wr4",
    name: "A.J. Brown",
    position: "WR",
    team: "PHI",
    available: true,
    ownedBy: null,
    percentOwned: 89,
    percentStarted: 78,
    seasonStats: { recYards: 1456, recTDs: 5, rushYards: 0, rushTDs: 0 },
    last3Games: [17.8, 13.2, 21.5],
    projection: 16.9,
    adp: 3.1,
  },
  {
    id: "wr5",
    name: "Puka Nacua",
    position: "WR",
    team: "LAR",
    available: true,
    ownedBy: null,
    percentOwned: 86,
    percentStarted: 74,
    seasonStats: { recYards: 832, recTDs: 3, rushYards: 7, rushTDs: 0 },
    last3Games: [14.6, 18.9, 11.3],
    projection: 15.2,
    adp: 4.5,
  },
  {
    id: "wr6",
    name: "Cooper Kupp",
    position: "WR",
    team: "LAR",
    available: true,
    ownedBy: null,
    percentOwned: 82,
    percentStarted: 69,
    seasonStats: { recYards: 710, recTDs: 6, rushYards: 0, rushTDs: 0 },
    last3Games: [15.4, 12.8, 17.2],
    projection: 14.8,
    adp: 5.2,
  },
  {
    id: "wr7",
    name: "Ladd McConkey",
    position: "WR",
    team: "LAC",
    available: true,
    ownedBy: null,
    percentOwned: 68,
    percentStarted: 52,
    seasonStats: { recYards: 815, recTDs: 4, rushYards: 23, rushTDs: 0 },
    last3Games: [12.7, 16.4, 9.8],
    projection: 12.9,
    adp: 8.7,
  },
  {
    id: "wr8",
    name: "Rome Odunze",
    position: "WR",
    team: "CHI",
    available: true,
    ownedBy: null,
    percentOwned: 34,
    percentStarted: 28,
    seasonStats: { recYards: 629, recTDs: 1, rushYards: 8, rushTDs: 0 },
    last3Games: [8.4, 11.7, 6.2],
    projection: 9.1,
    adp: 15.3,
  },

  // Tight Ends
  {
    id: "te1",
    name: "Travis Kelce",
    position: "TE",
    team: "KC",
    available: false,
    ownedBy: "Team J",
    percentOwned: 100,
    percentStarted: 96,
    seasonStats: { recYards: 823, recTDs: 3, rushYards: 0, rushTDs: 0 },
    last3Games: [14.2, 18.6, 11.8],
    projection: 14.9,
    adp: 2.8,
  },
  {
    id: "te2",
    name: "Brock Bowers",
    position: "TE",
    team: "LV",
    available: false,
    ownedBy: "Team K",
    percentOwned: 98,
    percentStarted: 89,
    seasonStats: { recYards: 1067, recTDs: 5, rushYards: 0, rushTDs: 0 },
    last3Games: [16.8, 13.4, 20.1],
    projection: 15.8,
    adp: 4.2,
  },
  {
    id: "te3",
    name: "Trey McBride",
    position: "TE",
    team: "ARI",
    available: true,
    ownedBy: null,
    percentOwned: 87,
    percentStarted: 76,
    seasonStats: { recYards: 992, recTDs: 1, rushYards: 0, rushTDs: 0 },
    last3Games: [12.9, 15.7, 8.3],
    projection: 12.4,
    adp: 6.1,
  },
  {
    id: "te4",
    name: "George Kittle",
    position: "TE",
    team: "SF",
    available: true,
    ownedBy: null,
    percentOwned: 84,
    percentStarted: 71,
    seasonStats: { recYards: 560, recTDs: 4, rushYards: 0, rushTDs: 0 },
    last3Games: [11.6, 8.9, 14.2],
    projection: 11.8,
    adp: 7.3,
  },
  {
    id: "te5",
    name: "Cade Otton",
    position: "TE",
    team: "TB",
    available: true,
    ownedBy: null,
    percentOwned: 56,
    percentStarted: 43,
    seasonStats: { recYards: 642, recTDs: 4, rushYards: 0, rushTDs: 0 },
    last3Games: [9.8, 12.4, 7.6],
    projection: 9.9,
    adp: 12.5,
  },

  // Kickers
  {
    id: "k1",
    name: "Chris Boswell",
    position: "K",
    team: "PIT",
    available: true,
    ownedBy: null,
    percentOwned: 78,
    percentStarted: 65,
    seasonStats: { fgMade: 40, fgAtt: 41, xpMade: 35, xpAtt: 36 },
    last3Games: [15.0, 8.0, 12.0],
    projection: 9.5,
    adp: 16.2,
  },
  {
    id: "k2",
    name: "Justin Tucker",
    position: "K",
    team: "BAL",
    available: true,
    ownedBy: null,
    percentOwned: 65,
    percentStarted: 52,
    seasonStats: { fgMade: 24, fgAtt: 29, xpMade: 33, xpAtt: 35 },
    last3Games: [6.0, 11.0, 9.0],
    projection: 8.2,
    adp: 15.8,
  },
  {
    id: "k3",
    name: "Ka'imi Fairbairn",
    position: "K",
    team: "HOU",
    available: true,
    ownedBy: null,
    percentOwned: 43,
    percentStarted: 38,
    seasonStats: { fgMade: 30, fgAtt: 35, xpMade: 40, xpAtt: 42 },
    last3Games: [14.0, 7.0, 10.0],
    projection: 8.8,
    adp: 18.4,
  },

  // Defenses
  {
    id: "dst1",
    name: "Pittsburgh DST",
    position: "DST",
    team: "PIT",
    available: true,
    ownedBy: null,
    percentOwned: 67,
    percentStarted: 58,
    seasonStats: { sacks: 44, ints: 18, fumRec: 8, tds: 3 },
    last3Games: [14.0, 8.0, 11.0],
    projection: 9.2,
    adp: 14.8,
  },
  {
    id: "dst2",
    name: "Denver DST",
    position: "DST",
    team: "DEN",
    available: true,
    ownedBy: null,
    percentOwned: 54,
    percentStarted: 47,
    seasonStats: { sacks: 57, ints: 20, fumRec: 6, tds: 4 },
    last3Games: [12.0, 15.0, 6.0],
    projection: 8.9,
    adp: 16.1,
  },
  {
    id: "dst3",
    name: "Minnesota DST",
    position: "DST",
    team: "MIN",
    available: true,
    ownedBy: null,
    percentOwned: 41,
    percentStarted: 35,
    seasonStats: { sacks: 42, ints: 16, fumRec: 7, tds: 2 },
    last3Games: [9.0, 13.0, 7.0],
    projection: 7.8,
    adp: 18.7,
  },
];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const url = new URL(request.url);

    // Query parameters
    const position = url.searchParams.get("position");
    const availability = url.searchParams.get("availability"); // 'all', 'available', 'taken'
    const team = url.searchParams.get("team");
    const search = url.searchParams.get("search");
    const sortBy = url.searchParams.get("sortBy") || "projection"; // 'projection', 'points', 'owned', 'adp'
    const sortOrder = url.searchParams.get("sortOrder") || "desc";
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "50");

    // Verify league exists
    const leagueResult = await db.query(
      "SELECT id FROM leagues WHERE id = $1 AND is_active = true",
      [id],
    );

    if (leagueResult.rows.length === 0) {
      return NextResponse.json({ error: "League not found" }, { status: 404 });
    }

    // Filter players based on query parameters
    let filteredPlayers = nflPlayers;

    if (position && position !== "all") {
      filteredPlayers = filteredPlayers.filter(
        (player) => player.position === position,
      );
    }

    if (availability) {
      switch (availability) {
        case "available":
          filteredPlayers = filteredPlayers.filter(
            (player) => player.available,
          );
          break;
        case "taken":
          filteredPlayers = filteredPlayers.filter(
            (player) => !player.available,
          );
          break;
        // 'all' includes both available and taken players
      }
    }

    if (team && team !== "all") {
      filteredPlayers = filteredPlayers.filter(
        (player) => player.team === team,
      );
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filteredPlayers = filteredPlayers.filter(
        (player) =>
          player.name.toLowerCase().includes(searchLower) ||
          player.team.toLowerCase().includes(searchLower),
      );
    }

    // Sort players
    filteredPlayers.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case "points":
          aValue = a.last3Games.reduce((sum, game) => sum + game, 0) / 3;
          bValue = b.last3Games.reduce((sum, game) => sum + game, 0) / 3;
          break;
        case "owned":
          aValue = a.percentOwned;
          bValue = b.percentOwned;
          break;
        case "adp":
          aValue = a.adp;
          bValue = b.adp;
          break;
        case "projection":
        default:
          aValue = a.projection;
          bValue = b.projection;
          break;
      }

      if (sortBy === "adp") {
        // For ADP, lower is better, so we flip the sort order
        return sortOrder === "asc" ? bValue - aValue : aValue - bValue;
      } else {
        return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
      }
    });

    // Paginate results
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedPlayers = filteredPlayers.slice(startIndex, endIndex);

    // Get trending players (mock data)
    const trendingPlayers = [
      {
        ...nflPlayers.find((p) => p.id === "rb7"),
        trend: "up",
        addedPercent: 23,
      },
      {
        ...nflPlayers.find((p) => p.id === "wr7"),
        trend: "up",
        addedPercent: 18,
      },
      {
        ...nflPlayers.find((p) => p.id === "te5"),
        trend: "up",
        addedPercent: 15,
      },
      {
        ...nflPlayers.find((p) => p.id === "wr8"),
        trend: "down",
        addedPercent: -12,
      },
      {
        ...nflPlayers.find((p) => p.id === "qb5"),
        trend: "down",
        addedPercent: -8,
      },
    ].filter((p): p is any => p && 'id' in p); // Remove any undefined players

    return NextResponse.json({
      players: paginatedPlayers,
      total: filteredPlayers.length,
      page,
      limit,
      hasNextPage: endIndex < filteredPlayers.length,
      hasPreviousPage: page > 1,
      trending: trendingPlayers,
      filters: {
        positions: ["QB", "RB", "WR", "TE", "K", "DST"],
        teams: [
          "BUF",
          "KC",
          "BAL",
          "CIN",
          "MIA",
          "SF",
          "PHI",
          "LAR",
          "MIN",
          "TB",
          "DAL",
          "LAC",
          "DET",
          "CHI",
          "LV",
          "ARI",
          "PIT",
          "HOU",
          "DEN",
        ],
        availabilityOptions: [
          { value: "all", label: "All Players" },
          { value: "available", label: "Available" },
          { value: "taken", label: "Taken" },
        ],
      },
    });
  } catch (error) {
    console.error("Error fetching players:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, playerId, dropPlayerId } = body; // action: 'add' or 'drop' or 'claim'

    // Verify league exists
    const leagueResult = await db.query(
      "SELECT id FROM leagues WHERE id = $1 AND is_active = true",
      [id],
    );

    if (leagueResult.rows.length === 0) {
      return NextResponse.json({ error: "League not found" }, { status: 404 });
    }

    // Mock response for player transactions
    // In a real app, this would update the database
    let message = "";
    switch (action) {
      case "add":
        message = `Successfully added player ${playerId} to your roster`;
        break;
      case "drop":
        message = `Successfully dropped player ${playerId} from your roster`;
        break;
      case "claim":
        message = `Waiver claim submitted for player ${playerId}`;
        if (dropPlayerId) {
          message += ` (dropping ${dropPlayerId})`;
        }
        break;
      default:
        throw new Error("Invalid action");
    }

    return NextResponse.json({
      success: true,
      message,
    });
  } catch (error) {
    console.error("Error processing player action:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
