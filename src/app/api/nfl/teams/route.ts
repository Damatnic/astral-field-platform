import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Mock NFL teams data
    const teams = [
      {
        key: "BUF",
        name: "Bills",
        city: "Buffalo",
        conference: "AFC",
        division: "East",
        fullName: "Buffalo Bills",
        byeWeek: 12,
        colors: {
          primary: "#00338D",
          secondary: "#C60C30",
          tertiary: "#FFFFFF",
        },
      },
      {
        key: "MIA",
        name: "Dolphins",
        city: "Miami",
        conference: "AFC",
        division: "East",
        fullName: "Miami Dolphins",
        byeWeek: 6,
        colors: {
          primary: "#008E97",
          secondary: "#FC4C02",
          tertiary: "#005778",
        },
      },
      {
        key: "NE",
        name: "Patriots",
        city: "New England",
        conference: "AFC",
        division: "East",
        fullName: "New England Patriots",
        byeWeek: 14,
        colors: {
          primary: "#002244",
          secondary: "#C60C30",
          tertiary: "#B0B7BC",
        },
      },
      {
        key: "NYJ",
        name: "Jets",
        city: "New York",
        conference: "AFC",
        division: "East",
        fullName: "New York Jets",
        byeWeek: 12,
        colors: {
          primary: "#125740",
          secondary: "#FFFFFF",
          tertiary: "#000000",
        },
      },
    ];

    return NextResponse.json({
      teams,
      count: teams.length,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch NFL teams" },
      { status: 500 },
    );
  }
}
