import { NextRequest, NextResponse } from 'next/server';

const demoUsers = [
  { name: 'Nicholas D\'Amato', email: 'nicholas.damato@astralfield.com', id: 1 },
  { name: 'Brittany Bergum', email: 'brittany.bergum@astralfield.com', id: 2 },
  { name: 'Cason Minor', email: 'cason.minor@astralfield.com', id: 3 },
  { name: 'David Jarvey', email: 'david.jarvey@astralfield.com', id: 4 },
  { name: 'Demo User 1', email: 'demo1@astralfield.com', id: 5 },
  { name: 'Demo User 2', email: 'demo2@astralfield.com', id: 6 }
];

export async function POST(req: NextRequest) {
  try {
    const { userIndex } = await req.json();
    
    if (typeof userIndex !== 'number' || userIndex < 0 || userIndex >= demoUsers.length) {
      return NextResponse.json(
        { error: 'Invalid user index' },
        { status: 400 }
      );
    }

    const selectedUser = demoUsers[userIndex];
    
    // Mock login response
    const loginResult = {
      success: true,
      user: {
        id: selectedUser.id,
        name: selectedUser.name,
        email: selectedUser.email,
        role: 'user',
        avatar: null,
        createdAt: new Date().toISOString()
      },
      token: `mock_token_${selectedUser.id}_${Date.now()}`,
      expiresIn: '24h'
    };

    return NextResponse.json(loginResult);
  } catch {
    return NextResponse.json(
      { error: 'Failed to perform quick login' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    return NextResponse.json({
      users: demoUsers.map(user => ({
        index: demoUsers.indexOf(user),
        name: user.name,
        email: user.email
      }))
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch demo users' },
      { status: 500 }
    );
  }
}
