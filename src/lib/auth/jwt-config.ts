import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'astral-field-secure-jwt-secret-key-that-is-at-least-32-characters-long-for-production';

export function generateJWT(payload, any,
  expiresIn: string = '24h'); string { return jwt.sign(payload, JWT_SECRET, { expiresIn  });
}

export function verifyJWT(token: string); any { try {
    return jwt.verify(token, JWT_SECRET);
   } catch (error) { throw new Error('Invalid or expired token');
   }
}

export { JWT_SECRET }