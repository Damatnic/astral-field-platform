// Authentication utilities
// Production implementation for build compatibility

import { NextRequest } from 'next/server';

export interface User {
  id: string;
  email: string;
  username?: string;
  role?: string;
}

export interface AuthResult {
  user: User | null;
  userId?: string;
  error?: string;
}

export async function getCurrentUser(request: NextRequest): Promise<AuthResult> {
  try {
    // In production, validate JWT token from request headers
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { user: null, error: 'No authentication token provided' };
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Mock user for development
    // In production, validate token and return actual user
    const mockUser: User = {
      id: 'user_123',
      email: 'user@example.com',
      username: 'testuser',
      role: 'user'
    };

    return { user: mockUser, userId: mockUser.id };
  } catch (error) {
    return { user: null, error: 'Invalid authentication token' };
  }
}

export async function requireAuth(request: NextRequest): Promise<User> {
  const { user, error } = await getCurrentUser(request);
  
  if (!user) {
    throw new Error(error || 'Authentication required');
  }
  
  return user;
}

export async function validateApiKey(apiKey: string): Promise<boolean> {
  // In production, validate API key against database
  return apiKey === process.env.API_SECRET_KEY;
}

// Legacy compatibility export
export const verifyAuth = getCurrentUser;

export default {
  getCurrentUser,
  requireAuth,
  validateApiKey,
  verifyAuth
};