import { NextRequest, NextResponse } from 'next/server';

// Define 10 profiles with their PINs and data
const profiles = [
  { id: 1, name: 'Nicholas D\'Amato', email: 'nicholas.damato@astralfield.com', pin: '1234', icon: '👤' },
  { id: 2, name: 'Brittany Bergum', email: 'brittany.bergum@astralfield.com', pin: '1234', icon: '👥' },
  { id: 3, name: 'Cason Minor', email: 'cason.minor@astralfield.com', pin: '1234', icon: '🏈' },
  { id: 4, name: 'David Jarvey', email: 'david.jarvey@astralfield.com', pin: '1234', icon: '⭐' },
  { id: 5, name: 'Demo User 1', email: 'demo1@astralfield.com', pin: '1234', icon: '🏆' },
  { id: 6, name: 'Demo User 2', email: 'demo2@astralfield.com', pin: '1234', icon: '🎯' },
  { id: 7, name: 'Demo User 3', email: 'demo3@astralfield.com', pin: '1234', icon: '🚀' },
  { id: 8, name: 'Demo User 4', email: 'demo4@astralfield.com', pin: '1234', icon: '🔥' },
  { id: 9, name: 'Demo User 5', email: 'demo5@astralfield.com', pin: '1234', icon: '💎' },
  { id: 10, name: 'Admin User', email: 'admin@astralfield.com', pin: '1234', icon: '👑', role: 'admin' }
];

export async function POST(req: NextRequest) {
  try {
    const { profileId, pin } = await req.json();
    
    // Validate profile ID
    if (typeof profileId !== 'number' || profileId < 1 || profileId > 10) {
      return NextResponse.json(
        { error: 'Invalid profile selected' },
        { status: 400 }
      );
    }

    // Validate PIN format
    if (typeof pin !== 'string' || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      return NextResponse.json(
        { error: 'PIN must be 4 digits' },
        { status: 400 }
      );
    }

    // Find the profile
    const profile = profiles.find(p => p.id === profileId);
    
    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Check PIN
    if (profile.pin !== pin) {
      return NextResponse.json(
        { error: 'Invalid PIN', success: false },
        { status: 401 }
      );
    }

    // Generate mock token and session
    const token = `token_${profile.id}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const userId = `user_${profile.id}`;
    
    // Get team name for this profile
    const teamNames = [
      'The Commanders',
      'Purple Reign', 
      'Minor Threat',
      'Jarvey\'s Giants',
      'Dynasty Builders',
      'Trophy Hunters',
      'Rocket Squad',
      'Fire Starters',
      'Diamond Dogs',
      'Crown Royale'
    ];
    
    // Successful login response
    const loginResult = {
      success: true,
      user: {
        id: profile.id,
        userId: userId,
        name: profile.name,
        email: profile.email,
        role: profile.role || 'user',
        icon: profile.icon,
        profileId: profile.id,
        teamName: teamNames[profile.id - 1],
        leagueId: 1, // All users are in league ID 1
        avatar: null,
        createdAt: new Date().toISOString()
      },
      token: token,
      userId: userId,
      leagueId: 1,
      expiresIn: '24h',
      message: `Welcome back, ${profile.name}!`
    };

    return NextResponse.json(loginResult);
  } catch (error) {
    console.error('Quick login error:', error);
    return NextResponse.json(
      { error: 'Authentication failed. Please try again.', success: false },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve available profiles (without PINs for security)
export async function GET() {
  try {
    const publicProfiles = profiles.map(profile => ({
      id: profile.id,
      name: profile.name,
      icon: profile.icon,
      role: profile.role || 'user'
    }));

    return NextResponse.json({
      success: true,
      profiles: publicProfiles,
      message: 'Use profile ID and 4-digit PIN to authenticate'
    });
  } catch (error) {
    console.error('Error fetching profiles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profiles', success: false },
      { status: 500 }
    );
  }
}