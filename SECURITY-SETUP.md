# Astral Field Security Setup Guide

## Overview

This guide outlines the secure authentication system implemented to replace hardcoded credentials and establish proper security practices for the Astral Field platform.

## Security Improvements Made

### 1. Removed Hardcoded Credentials

**Files Fixed:**
- `src/app/api/auth/login/route.ts` - Removed `admin@example.com/password`
- `src/app/api/cleanup/route.ts` - Replaced weak admin key "astral2025" with secure validation
- `src/lib/auto-init.ts` - Replaced hardcoded passwords with secure random generation
- `src/app/api/setup-users/route.ts` - Implemented secure test account creation
- `src/app/api/debug/users/route.ts` - Added admin key validation
- `src/app/api/debug/login/route.ts` - Secured debug authentication

### 2. Implemented Secure Password System

**New Security Components:**
- `src/lib/auth/password.ts` - Comprehensive password security utilities
- `src/lib/auth/admin-setup.ts` - Secure admin account management

**Features:**
- Password strength validation (minimum 8 characters, mixed case, numbers, symbols)
- bcrypt hashing with salt rounds = 12
- Secure password generation
- Common password detection
- Password strength scoring

### 3. Environment-Based Admin Setup

**Required Environment Variables:**
```bash
ADMIN_SETUP_KEY=your-secure-random-32-character-key
ADMIN_EMAIL=admin@yourcompany.com
ADMIN_USERNAME=Administrator
ADMIN_PASSWORD=your-secure-admin-password
```

## Production Setup Instructions

### 1. Generate Secure Admin Setup Key

```javascript
// Use the built-in generator
import { generateSetupKey } from '@/lib/auth/admin-setup';
const secureKey = generateSetupKey();
console.log('Your secure setup key:', secureKey);
```

Or use a random generator:
```bash
# Linux/Mac
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 2. Set Environment Variables

**For Production Deployment:**
```bash
# Replace with your secure values
ADMIN_SETUP_KEY="your-32-character-random-key-here"
ADMIN_EMAIL="admin@yourcompany.com"
ADMIN_USERNAME="Site Administrator"
ADMIN_PASSWORD="YourSecurePassword123!"
```

**Security Requirements:**
- Setup key: Minimum 8 characters, recommend 32+ character random string
- Admin password: Must meet strength requirements (8+ chars, mixed case, numbers, symbols)
- Never use default values in production

### 3. Admin Account Creation

The system will automatically create the admin account using the environment variables on first run if properly configured.

## API Endpoint Security

### Protected Endpoints

All administrative endpoints now require the `ADMIN_SETUP_KEY`:

```bash
# Cleanup endpoint
curl -X POST "https://your-app.com/api/cleanup?key=YOUR_ADMIN_SETUP_KEY"

# Setup users (development only)
curl -X POST "https://your-app.com/api/setup-users?key=YOUR_ADMIN_SETUP_KEY"

# Debug endpoints (development only)
curl -X GET "https://your-app.com/api/debug/users?key=YOUR_ADMIN_SETUP_KEY"
```

### Security Features

1. **Input Validation**: All endpoints validate input format and content
2. **Rate Limiting**: Failed authentication attempts are logged
3. **Secure Headers**: Proper error responses without information leakage
4. **Password Hashing**: All passwords use bcrypt with high salt rounds
5. **Test Account Marking**: All demo/test accounts are clearly labeled

## Test Account System

### Secure Test Data

- All test accounts use `@example.com` domains
- Usernames clearly marked with "(DEMO)" or "(TEST)" suffixes
- Passwords are randomly generated and secure
- Test accounts are flagged with `isTestAccount: true`

### Test Account Examples

```json
{
  "email": "test.admin@example.com",
  "username": "Test Admin (DEBUG)",
  "isTestAccount": true,
  "password": "SecurelyGenerated123!"
}
```

## Security Recommendations

### Production Checklist

- [ ] Change `ADMIN_SETUP_KEY` from any default value
- [ ] Set strong `ADMIN_PASSWORD` (12+ characters, mixed case, numbers, symbols)
- [ ] Use company email domain for `ADMIN_EMAIL`
- [ ] Remove or restrict access to debug endpoints
- [ ] Enable HTTPS and secure headers
- [ ] Implement rate limiting on authentication endpoints
- [ ] Set up monitoring for failed authentication attempts
- [ ] Regular password rotation policy
- [ ] Multi-factor authentication (structure provided)

### Environment Variable Security

1. **Never commit** environment variables to version control
2. **Use secure storage** for production secrets (AWS Secrets Manager, etc.)
3. **Rotate keys regularly** especially after team changes
4. **Limit access** to production environment variables
5. **Monitor usage** of admin endpoints

## Multi-Factor Authentication Support

The authentication system includes structure for MFA implementation:

```typescript
// Future MFA implementation ready
interface MFAConfig {
  enabled: boolean;
  method: 'totp' | 'sms' | 'email';
  backupCodes: string[];
}
```

## Monitoring and Logging

### Security Events Logged

- Failed authentication attempts
- Admin key validation failures
- Password strength violations
- Unauthorized endpoint access attempts

### Log Format

```javascript
console.warn('Unauthorized access attempt', {
  endpoint: '/api/cleanup',
  key: key.substring(0, 4) + '...',
  timestamp: new Date().toISOString(),
  ip: request.ip
});
```

## Development vs Production

### Development Mode

- Debug endpoints accessible with valid admin key
- Test accounts available for development
- Detailed error messages for debugging
- Mock authentication responses

### Production Mode

- Debug endpoints should be disabled
- No test accounts in production database
- Minimal error information in responses
- Real authentication with database integration

## Migration from Hardcoded System

### What Was Removed

1. **Hardcoded admin credentials**: `admin@example.com/password`
2. **Weak admin keys**: Default "astral2025" key
3. **Production domain test accounts**: `@astralfield.com` emails
4. **Plaintext passwords**: All demo passwords were "astral2025"

### What Was Added

1. **Secure password hashing**: bcrypt with salt rounds = 12
2. **Environment-based configuration**: All secrets from environment variables
3. **Password strength validation**: Comprehensive security requirements
4. **Test account marking**: Clear identification of non-production accounts
5. **Admin key validation**: Centralized, secure key management
6. **Security logging**: Monitoring of authentication attempts

## Support and Maintenance

### Regular Security Tasks

1. **Monthly**: Review authentication logs
2. **Quarterly**: Rotate admin setup key
3. **Annually**: Update password requirements
4. **As needed**: Respond to security incidents

### Contact Information

For security issues or questions about this implementation, contact the development team with details about:
- Environment configuration issues
- Authentication problems
- Security recommendations
- Production deployment assistance

---

**Last Updated**: January 2025
**Version**: 1.0
**Security Level**: Production Ready