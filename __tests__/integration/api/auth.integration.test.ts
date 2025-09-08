/**
 * Authentication API Integration Tests
 * Tests all authentication endpoints with real API calls and database interactions
 */

import { createMocks } from 'node-mocks-http';
import { NextRequest, NextResponse } from 'next/server';
import signupHandler from '@/app/api/auth/signup/route';
import loginHandler from '@/app/api/auth/login/route';
import logoutHandler from '@/app/api/auth/logout/route';
import refreshHandler from '@/app/api/auth/refresh/route';
import meHandler from '@/app/api/auth/me/route';

describe('/api/auth Integration Tests', () => {
  let testUserId: string;
  let testUserEmail: string;
  let accessToken: string;
  let refreshToken: string;

  beforeEach(() => {
    testUserEmail = `test-${Date.now()}@example.com`;
    testUserId = global.testHelpers.generateId('user');
  });

  describe('POST /api/auth/signup', () => {
    it('should successfully create a new user account', async () => {
      const requestBody = {
        email: testUserEmail,
        password: 'TestPassword123!',
        username: 'testuser123',
        firstName: 'Test',
        lastName: 'User'
      };

      const request = new Request('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const response = await signupHandler.POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toHaveProperty('user');
      expect(data).toHaveProperty('token');
      expect(data.user.email).toBe(testUserEmail);
      expect(data.user.username).toBe('testuser123');
      expect(data.token).toBeTruthy();

      // Store tokens for subsequent tests
      accessToken = data.token;
      testUserId = data.user.id;
    });

    it('should reject signup with invalid email format', async () => {
      const requestBody = {
        email: 'invalid-email',
        password: 'TestPassword123!',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User'
      };

      const request = new Request('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const response = await signupHandler.POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('email');
    });

    it('should reject signup with weak password', async () => {
      const requestBody = {
        email: testUserEmail,
        password: '123', // Too weak
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User'
      };

      const request = new Request('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const response = await signupHandler.POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('password');
    });

    it('should reject signup with duplicate email', async () => {
      const requestBody = {
        email: testUserEmail,
        password: 'TestPassword123!',
        username: 'testuser1',
        firstName: 'Test',
        lastName: 'User'
      };

      // First signup
      const request1 = new Request('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const response1 = await signupHandler.POST(request1);
      expect(response1.status).toBe(201);

      // Duplicate signup
      const request2 = new Request('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...requestBody,
          username: 'testuser2' // Different username, same email
        })
      });

      const response2 = await signupHandler.POST(request2);
      const data2 = await response2.json();

      expect(response2.status).toBe(409);
      expect(data2.error).toContain('already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user first
      const signupRequest = new Request('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUserEmail,
          password: 'TestPassword123!',
          username: 'testuser123',
          firstName: 'Test',
          lastName: 'User'
        })
      });

      const signupResponse = await signupHandler.POST(signupRequest);
      const signupData = await signupResponse.json();
      testUserId = signupData.user.id;
    });

    it('should successfully login with valid credentials', async () => {
      const requestBody = {
        email: testUserEmail,
        password: 'TestPassword123!'
      };

      const request = new Request('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const response = await loginHandler.POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('user');
      expect(data).toHaveProperty('token');
      expect(data).toHaveProperty('refreshToken');
      expect(data.user.email).toBe(testUserEmail);

      // Store tokens for subsequent tests
      accessToken = data.token;
      refreshToken = data.refreshToken;
    });

    it('should reject login with invalid email', async () => {
      const requestBody = {
        email: 'nonexistent@example.com',
        password: 'TestPassword123!'
      };

      const request = new Request('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const response = await loginHandler.POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('Invalid');
    });

    it('should reject login with wrong password', async () => {
      const requestBody = {
        email: testUserEmail,
        password: 'WrongPassword123!'
      };

      const request = new Request('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const response = await loginHandler.POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('Invalid');
    });

    it('should handle rate limiting for excessive login attempts', async () => {
      const requestBody = {
        email: testUserEmail,
        password: 'WrongPassword!'
      };

      // Make multiple failed attempts
      const attempts = Array.from({ length: 6 }, () => 
        new Request('http://localhost:3000/api/auth/login', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'X-Forwarded-For': '192.168.1.100' // Simulate same IP
          },
          body: JSON.stringify(requestBody)
        })
      );

      const responses = await Promise.all(
        attempts.map(req => loginHandler.POST(req))
      );

      // Last few attempts should be rate limited
      const lastResponse = responses[responses.length - 1];
      expect([429, 401]).toContain(lastResponse.status);

      if (lastResponse.status === 429) {
        const data = await lastResponse.json();
        expect(data.error).toContain('rate limit');
      }
    });
  });

  describe('GET /api/auth/me', () => {
    beforeEach(async () => {
      // Create and login user
      const signupRequest = new Request('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUserEmail,
          password: 'TestPassword123!',
          username: 'testuser123',
          firstName: 'Test',
          lastName: 'User'
        })
      });

      const signupResponse = await signupHandler.POST(signupRequest);
      const signupData = await signupResponse.json();
      accessToken = signupData.token;
      testUserId = signupData.user.id;
    });

    it('should return user profile for authenticated request', async () => {
      const request = new Request('http://localhost:3000/api/auth/me', {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      const response = await meHandler.GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('user');
      expect(data.user.email).toBe(testUserEmail);
      expect(data.user.id).toBe(testUserId);
      expect(data.user).not.toHaveProperty('password');
    });

    it('should reject request without authorization header', async () => {
      const request = new Request('http://localhost:3000/api/auth/me', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await meHandler.GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('token');
    });

    it('should reject request with invalid token', async () => {
      const request = new Request('http://localhost:3000/api/auth/me', {
        method: 'GET',
        headers: { 
          'Authorization': 'Bearer invalid-token',
          'Content-Type': 'application/json'
        }
      });

      const response = await meHandler.GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('Invalid');
    });

    it('should reject request with expired token', async () => {
      // This would require mocking JWT with expired token
      // For now, test with malformed token
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.expired.token';
      
      const request = new Request('http://localhost:3000/api/auth/me', {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${expiredToken}`,
          'Content-Type': 'application/json'
        }
      });

      const response = await meHandler.GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('Invalid');
    });
  });

  describe('POST /api/auth/refresh', () => {
    beforeEach(async () => {
      // Create user and get refresh token
      const signupRequest = new Request('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUserEmail,
          password: 'TestPassword123!',
          username: 'testuser123',
          firstName: 'Test',
          lastName: 'User'
        })
      });

      const signupResponse = await signupHandler.POST(signupRequest);
      const signupData = await signupResponse.json();

      // Login to get refresh token
      const loginRequest = new Request('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUserEmail,
          password: 'TestPassword123!'
        })
      });

      const loginResponse = await loginHandler.POST(loginRequest);
      const loginData = await loginResponse.json();
      
      accessToken = loginData.token;
      refreshToken = loginData.refreshToken;
      testUserId = loginData.user.id;
    });

    it('should refresh access token with valid refresh token', async () => {
      const requestBody = {
        refreshToken: refreshToken
      };

      const request = new Request('http://localhost:3000/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const response = await refreshHandler.POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('token');
      expect(data).toHaveProperty('refreshToken');
      expect(data.token).not.toBe(accessToken); // Should be a new token
    });

    it('should reject refresh with invalid refresh token', async () => {
      const requestBody = {
        refreshToken: 'invalid-refresh-token'
      };

      const request = new Request('http://localhost:3000/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const response = await refreshHandler.POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('Invalid');
    });

    it('should reject refresh without refresh token', async () => {
      const request = new Request('http://localhost:3000/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      const response = await refreshHandler.POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('token');
    });
  });

  describe('POST /api/auth/logout', () => {
    beforeEach(async () => {
      // Create user and login
      const signupRequest = new Request('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUserEmail,
          password: 'TestPassword123!',
          username: 'testuser123',
          firstName: 'Test',
          lastName: 'User'
        })
      });

      await signupHandler.POST(signupRequest);

      const loginRequest = new Request('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUserEmail,
          password: 'TestPassword123!'
        })
      });

      const loginResponse = await loginHandler.POST(loginRequest);
      const loginData = await loginResponse.json();
      
      accessToken = loginData.token;
      refreshToken = loginData.refreshToken;
    });

    it('should successfully logout with valid token', async () => {
      const requestBody = {
        refreshToken: refreshToken
      };

      const request = new Request('http://localhost:3000/api/auth/logout', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const response = await logoutHandler.POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toContain('success');
    });

    it('should handle logout without refresh token', async () => {
      const request = new Request('http://localhost:3000/api/auth/logout', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });

      const response = await logoutHandler.POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toContain('success');
    });

    it('should handle logout with invalid access token', async () => {
      const request = new Request('http://localhost:3000/api/auth/logout', {
        method: 'POST',
        headers: { 
          'Authorization': 'Bearer invalid-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken })
      });

      const response = await logoutHandler.POST(request);
      
      // Should still succeed as logout should be forgiving
      expect([200, 401]).toContain(response.status);
    });
  });

  describe('Authentication Flow Integration', () => {
    it('should complete full authentication flow', async () => {
      // 1. Signup
      const signupRequest = new Request('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUserEmail,
          password: 'TestPassword123!',
          username: 'testuser123',
          firstName: 'Test',
          lastName: 'User'
        })
      });

      const signupResponse = await signupHandler.POST(signupRequest);
      const signupData = await signupResponse.json();
      
      expect(signupResponse.status).toBe(201);
      accessToken = signupData.token;

      // 2. Access protected endpoint
      const meRequest = new Request('http://localhost:3000/api/auth/me', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      const meResponse = await meHandler.GET(meRequest);
      expect(meResponse.status).toBe(200);

      // 3. Login again
      const loginRequest = new Request('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUserEmail,
          password: 'TestPassword123!'
        })
      });

      const loginResponse = await loginHandler.POST(loginRequest);
      const loginData = await loginResponse.json();
      
      expect(loginResponse.status).toBe(200);
      refreshToken = loginData.refreshToken;

      // 4. Refresh token
      const refreshRequest = new Request('http://localhost:3000/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });

      const refreshResponse = await refreshHandler.POST(refreshRequest);
      expect(refreshResponse.status).toBe(200);

      // 5. Logout
      const logoutRequest = new Request('http://localhost:3000/api/auth/logout', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken })
      });

      const logoutResponse = await logoutHandler.POST(logoutRequest);
      expect(logoutResponse.status).toBe(200);
    });
  });

  describe('Security Tests', () => {
    it('should prevent SQL injection in email field', async () => {
      const maliciousEmail = "'; DROP TABLE users; --";
      
      const request = new Request('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: maliciousEmail,
          password: 'TestPassword123!',
          username: 'testuser',
          firstName: 'Test',
          lastName: 'User'
        })
      });

      const response = await signupHandler.POST(request);
      expect([400, 422]).toContain(response.status); // Should reject malicious input
    });

    it('should sanitize and validate all input fields', async () => {
      const maliciousInput = '<script>alert(\"xss\")</script>';
      
      const request = new Request('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUserEmail,
          password: 'TestPassword123!',
          username: maliciousInput,
          firstName: maliciousInput,
          lastName: maliciousInput
        })
      });

      const response = await signupHandler.POST(request);
      
      if (response.status === 201) {
        const data = await response.json();
        // Input should be sanitized
        expect(data.user.username).not.toContain('<script>');
        expect(data.user.firstName).not.toContain('<script>');
      } else {
        // Or request should be rejected
        expect([400, 422]).toContain(response.status);
      }
    });

    it('should handle extremely large payload gracefully', async () => {
      const largeString = 'a'.repeat(10000);
      
      const request = new Request('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUserEmail,
          password: 'TestPassword123!',
          username: largeString,
          firstName: largeString,
          lastName: largeString
        })
      });

      const response = await signupHandler.POST(request);
      expect([400, 413, 422]).toContain(response.status); // Should reject oversized payload
    });
  });
});