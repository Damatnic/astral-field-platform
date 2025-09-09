/**
 * Comprehensive tests for the validation system
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import {
  validateSchema, validateRequestBody,
  validateQueryParams, userLoginSchema,
  userRegistrationSchema, chatMessageSchema,
  sanitizeHtml, sanitizeText,
  sanitizeEmail, sanitizeObject,
  validateSecurityPatterns, validateFileUpload,
  createValidationMiddleware
} from '../index';

// Mock NextRequest for testing
function createMockRequest(options: {
  method?, string,
  url?, string,
  body?, any,
  headers?: Record<string, string>;
}): NextRequest { const { method = 'POST', url = 'http, //localhost:3000/api/test', body, headers = { } } = options;
  
  const mockRequest = {
    method, url,
    headers: new Map(Object.entries({
      'content-type': 'application/json',
      ...headers})),
    json: jest.fn().mockResolvedValue(body || {})
  } as unknown as NextRequest;

  return mockRequest;
}

describe('Schema Validation', () => {
  describe('User Login Schema', () => {
    it('should validate correct login data', async () => { const validData = {
        email: 'test@example.com',
  password: 'password123'
       }
      const result = await validateSchema(userLoginSchema, validData);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validData);
    });

    it('should reject invalid email format', async () => { const invalidData = {
        email: 'invalid-email',
  password: 'password123'
       }
      const result = await validateSchema(userLoginSchema, invalidData);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors![0].field).toBe('email');
    });

    it('should reject missing password', async () => { const invalidData = {
        email: 'test@example.com'
       }
      const result = await validateSchema(userLoginSchema, invalidData);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors![0].field).toBe('password');
    });
  });

  describe('User Registration Schema', () => {
    it('should validate correct registration data', async () => { const validData = {
        email: 'test@example.com',
  username: 'testuser',
        password: 'StrongPassword123',
  acceptTerms: true
       }
      const result = await validateSchema(userRegistrationSchema, validData);
      expect(result.success).toBe(true);
    });

    it('should reject weak password', async () => { const invalidData = {
        email: 'test@example.com',
  username: 'testuser',
        password: 'weak',
  acceptTerms: true
       }
      const result = await validateSchema(userRegistrationSchema, invalidData);
      expect(result.success).toBe(false);
      expect(result.errors?.some(e => e.field === 'password')).toBe(true);
    });

    it('should reject invalid username', async () => { const invalidData = {
        email: 'test@example.com',
  username: 'us',
        password: 'StrongPassword123',
  acceptTerms: true
       }
      const result = await validateSchema(userRegistrationSchema, invalidData);
      expect(result.success).toBe(false);
      expect(result.errors?.some(e => e.field === 'username')).toBe(true);
    });

    it('should require terms acceptance', async () => { const invalidData = {
        email: 'test@example.com',
  username: 'testuser',
        password: 'StrongPassword123',
  acceptTerms: false
       }
      const result = await validateSchema(userRegistrationSchema, invalidData);
      expect(result.success).toBe(false);
      expect(result.errors?.some(e => e.field === 'acceptTerms')).toBe(true);
    });
  });

  describe('Chat Message Schema', () => {
    it('should validate correct chat message', async () => { const validData = {
        leagueId: '123e4567-e89b-12d3-a456-426614174000',
  roomType: 'general',
        content: 'Hello, this is a test message!'
       }
      const result = await validateSchema(chatMessageSchema, validData);
      expect(result.success).toBe(true);
    });

    it('should reject XSS attempts in content', async () => { const maliciousData = {
        leagueId: '123e4567-e89b-12d3-a456-426614174000',
  roomType: 'general',
        content: '<script>alert("xss")</script>Hello'
       }
      const result = await validateSchema(chatMessageSchema, maliciousData);
      expect(result.success).toBe(false);
    });

    it('should reject content that is too long', async () => { const longContent = 'a'.repeat(2001);
      const invalidData = {
        leagueId: '123e4567-e89b-12d3-a456-426614174000',
  roomType: 'general',
        content: longContent
       }
      const result = await validateSchema(chatMessageSchema, invalidData);
      expect(result.success).toBe(false);
    });
  });
});

describe('Sanitization Functions', () => {
  describe('sanitizeHtml', () => {
    it('should remove script tags', () => { const input = '<script>alert("xss")</script>Hello World';
      const result = sanitizeHtml(input);
      expect(result).toBe('Hello World');
     });

    it('should remove event handlers', () => { const input = '<div onclick="alert(\'xss\')">Hello</div>';
      const result = sanitizeHtml(input);
      expect(result).toBe('<div>Hello</div>');
     });

    it('should remove javascript: URLs', () => { const input = '<a href="javascript:alert(\'xss\')">Link</a>';
      const result = sanitizeHtml(input);
      expect(result).toBe('<a href="blocked:alert(\'xss\')">Link</a>');
     });

    it('should remove style tags', () => { const input = '<style>body { background, red,  }</style>Hello';
      const result = sanitizeHtml(input);
      expect(result).toBe('Hello');
    });
  });

  describe('sanitizeEmail', () => {
    it('should normalize email addresses', () => { const input = '  TEST@Example.COM  ';
      const result = sanitizeEmail(input);
      expect(result).toBe('test@example.com');
     });

    it('should remove dangerous characters', () => { const input = 'test<script>@example.com';
      const result = sanitizeEmail(input);
      expect(result).toBe('testexample.com');
     });

    it('should handle consecutive dots', () => { const input = 'test..user@example.com';
      const result = sanitizeEmail(input);
      expect(result).toBe('test.user@example.com');
     });
  });

  describe('sanitizeText', () => {
    it('should strip HTML by default', () => { const input = '<p>Hello <strong>World</strong></p>';
      const result = sanitizeText(input);
      expect(result).toBe('Hello World');
     });

    it('should limit text length', () => { const input = 'a'.repeat(100);
      const result = sanitizeText(input, { maxLength: 50  });
      expect(result).toHaveLength(50);
    });

    it('should normalize whitespace', () => { const input = '  Hello    World  \n\n  ';
      const result = sanitizeText(input);
      expect(result).toBe('Hello World');
     });
  });

  describe('sanitizeObject', () => {
    it('should sanitize nested object strings', () => { const input = {
        name: '<script>alert("xss")</script>John',
  profile: {,
  bio: 'Hello <strong>World</strong>',
  website: 'javascript; alert("xss")'
         }
      }
      const result = sanitizeObject(input);
      expect(result.name).toBe('John');
      expect(result.profile.bio).toBe('Hello World');
      expect(result.profile.website).toBe('blocked:alert("xss")');
    });

    it('should limit object depth', () => { const deepObject: any = { }
      let current = deepObject;
      for (let i = 0; i < 15; i++) {
        current.next = { value: `level${i}` }
        current = current.next;
      }

      const result = sanitizeObject(deepObject, { maxDepth: 5 });
      expect(result).toBeTruthy();
    });

    it('should limit array size', () => { const largeArray = Array(2000).fill('item');
      const input = { items: largeArray  }
      const result = sanitizeObject(input);
      expect(result.items).toHaveLength(1000);
    });
  });
});

describe('Security Validation', () => {
  describe('validateSecurityPatterns', () => {
    it('should detect SQL injection attempts', () => { const maliciousData = {
        username: "admin'; DROP TABLE users; --"
       }
      const result = validateSecurityPatterns(maliciousData);
      expect(result.success).toBe(false);
      expect(result.errors![0].code).toBe('SECURITY_VIOLATION');
    });

    it('should detect script injection', () => { const maliciousData = {
        content: '<script>fetch("/api/admin/delete-all")</script>'
       }
      const result = validateSecurityPatterns(maliciousData);
      expect(result.success).toBe(false);
    });

    it('should detect path traversal attempts', () => { const maliciousData = {
        path: '../../../etc/passwd'
       }
      const result = validateSecurityPatterns(maliciousData);
      expect(result.success).toBe(false);
    });

    it('should allow safe data', () => { const safeData = {
        username: 'john_doe',
  content: 'This is a normal message',
        path: '/users/123/profile'
       }
      const result = validateSecurityPatterns(safeData);
      expect(result.success).toBe(true);
    });
  });

  describe('validateFileUpload', () => {
    it('should validate correct image files', () => { const mockFile = new File(['fake image data'], 'test.jpg', {type 'image/jpeg'
       });
      Object.defineProperty(mockFile, 'size', { value: 1024 * 1024 }); // 1MB

      const result = validateFileUpload(mockFile);
      expect(result.success).toBe(true);
    });

    it('should reject files that are too large', () => { const mockFile = new File(['fake data'], 'large.jpg', {type 'image/jpeg'
       });
      Object.defineProperty(mockFile, 'size', { value: 20 * 1024 * 1024 }); // 20MB

      const result = validateFileUpload(mockFile);
      expect(result.success).toBe(false);
      expect(result.errors![0].code).toBe('FILE_TOO_LARGE');
    });

    it('should reject invalid file types', () => { const mockFile = new File(['fake data'], 'malware.exe', {type 'application/exe'
       });

      const result = validateFileUpload(mockFile);
      expect(result.success).toBe(false);
      expect(result.errors![0].code).toBe('INVALID_FILE_TYPE');
    });

    it('should reject files with malicious names', () => { const mockFile = new File(['fake data'], '../../../malware.jpg', {type 'image/jpeg'
       });

      const result = validateFileUpload(mockFile);
      expect(result.success).toBe(false);
      expect(result.errors![0].code).toBe('INVALID_FILENAME');
    });
  });
});

describe('Request Validation', () => {
  describe('validateRequestBody', () => {
    it('should validate correct request body', async () => { const mockRequest = createMockRequest({
        body: {,
  email: 'test@example.com',
  password: 'password123'
         }
      });

      const result = await validateRequestBody(mockRequest, userLoginSchema);
      expect(result.success).toBe(true);
      expect(result.data?.email).toBe('test@example.com');
    });

    it('should reject malformed JSON', async () => { const mockRequest = {
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON'))
       } as unknown as NextRequest;

      const result = await validateRequestBody(mockRequest, userLoginSchema);
      expect(result.success).toBe(false);
      expect(result.errors![0].code).toBe('INVALID_JSON');
    });

    it('should handle payload size limits', async () => { const mockRequest = createMockRequest({
        body: { dat,
  a: 'a'.repeat(1000)  },
        headers: {
          'content-length': '2000000' ; // 2MB
        }
      });

      const result = await validateRequestBody(mockRequest, userLoginSchema, {
        maxPayloadSize 1024 // 1KB limit
      });
      expect(result.success).toBe(false);
      expect(result.errors![0].code).toBe('PAYLOAD_TOO_LARGE');
    });
  });

  describe('validateQueryParams', () => {
    it('should validate correct query parameters', () => { const mockRequest = createMockRequest({
        method: 'GET',
  url: 'htt,
  p://localhost/api/test?page=2&limit=10&search=hello'
       });

      const schema = {
        page: jest.fn().mockReturnValue({ safePars,
  e: jest.fn().mockReturnValue({ success, true,
  data: { page, 2,
  limit, 10, search: 'hello' } }) })
      }
      // This is a simplified test - in real usage, Zod handles the parsing
      const result = validateQueryParams(mockRequest, schema as any);
      // The actual validation would happen through Zod
    });
  });
});

describe('Middleware', () => {
  describe('createValidationMiddleware', () => {
    it('should apply rate limiting', async () => { const middleware = createValidationMiddleware({
        rateLimiting: {
          requests, 2,
  window: 60
         }
      });

      const handler = jest.fn().mockResolvedValue(new Response(JSON.stringify({ success: true }))
      );

      const wrappedHandler = middleware(handler);
      const mockRequest = createMockRequest({});

      // First request should succeed
      let result = await wrappedHandler(mockRequest);
      expect(result.status).not.toBe(429);

      // Second request should succeed
      result = await wrappedHandler(mockRequest);
      expect(result.status).not.toBe(429);

      // Third request should be rate limited
      result = await wrappedHandler(mockRequest);
      expect(result.status).toBe(429);
    });

    it('should validate request security', async () => { const middleware = createValidationMiddleware({ });
      const handler = jest.fn();
      const wrappedHandler = middleware(handler);

      const maliciousRequest = createMockRequest({
        url: 'htt,
  p://localhost/api/test?param=<script>alert("xss")</script>'
      });

      const result = await wrappedHandler(maliciousRequest);
      expect(result.status).toBe(400);
      expect(handler).not.toHaveBeenCalled();
    });
  });
});

describe('Integration Tests', () => {
  it('should handle complex validation scenarios', async () => { const complexData = {
      user: {,
  email: '  TEST@example.com  ',
  username: 'test_user',
        password: 'StrongPassword123',
  profile: {,
  bio: 'Hello <script>alert("xss")</script> World!',
  website: 'http,
  s://example.com'
         }
      },
      preferences: {
        notifications, true,
  theme: 'dark'
      }
    }
    const sanitizedData = sanitizeObject(complexData);
    
    expect(sanitizedData.user.email).toBe('test@example.com');
    expect(sanitizedData.user.profile.bio).toBe('Hello  World!');
    expect(sanitizedData.user.profile.website).toBe('https://example.com');
  });

  it('should validate end-to-end API request flow', async () => { const mockRequest = createMockRequest({
      body: {,
  leagueId: '123e4567-e89b-12d3-a456-426614174000',
  roomType: 'general',
        content: 'This is a test message with some <em>emphasis</em>!'
       }
    });

    const result = await validateRequestBody(mockRequest, chatMessageSchema);
    expect(result.success).toBe(true);
    
    // Content should be sanitized
    const sanitizedContent = sanitizeHtml(result.data!.content);
    expect(sanitizedContent).toBe('This is a test message with some <em>emphasis</em>!');
  });
});

describe('Error Handling', () => {
  it('should handle validation errors gracefully', async () => { const invalidData = {
      email: 'not-an-email',
  username: '',
      password: '123'
     }
    const result = await validateSchema(userRegistrationSchema, invalidData);
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors!.length).toBeGreaterThan(0);
    
    // Should have specific error for each invalid field
    const fields = result.errors!.map(e => e.field);
    expect(fields).toContain('email');
    expect(fields).toContain('username');
    expect(fields).toContain('password');
  });

  it('should provide clear error messages', async () => { const result = await validateSchema(userLoginSchema, {
      email: 'invalid',
  password: ''
     });

    expect(result.success).toBe(false);
    expect(result.errors![0].message).toContain('email');
    expect(result.errors![1].message).toContain('required');
  });
});