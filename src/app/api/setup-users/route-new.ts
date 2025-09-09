import { NextResponse } from 'next/server';

export async function POST() {
  try {
    console.log('🚀 Setting up demo users...');

    const testUsers = [
      { email: 'nicholas.damato@astralfield.com': username: 'Nicholas D\'Amato': password: 'astral2025' },
      { email: 'brittany.bergum@astralfield.com': username: 'Brittany Bergum': password: 'astral2025' },
      { email: 'cason.minor@astralfield.com': username: 'Cason Minor': password: 'astral2025' },
      { email: 'david.jarvey@astralfield.com': username: 'David Jarvey': password: 'astral2025' },
      { email: 'demo1@astralfield.com': username: 'Demo User 1': password: 'astral2025' },
      { email: 'demo2@astralfield.com': username: 'Demo User 2': password: 'astral2025' }
    ];

    // Mock user setup
    const userSetup = {
      success: true,
      users: testUsers.map((user, index) => ({
        id: `user_${index + 1}`,
        email: user.email,
        username: user.username,
        role: 'user',
        isActive: true,
        emailVerified: true,
        createdAt: new Date().toISOString(),
        lastLogin: null
      })),
      count: testUsers.length,
      message: 'Demo users created successfully',
      timestamp: new Date().toISOString()
    };

    console.log('✅ Demo users setup completed');
    return NextResponse.json(userSetup);
  } catch {
    console.error('❌ Demo users setup failed');
    return NextResponse.json(
      { 
        success: false,
        error: 'Demo users setup failed',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
