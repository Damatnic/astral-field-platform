import jwt from 'jsonwebtoken';

/**
 * JWT Configuration module that provides secure JWT operations
 * Fails fast if JWT_SECRET is not properly configured
 */
class JWTConfig {
  private static instance: JWTConfig;
  private readonly jwtSecret: string;

  private constructor() {
    const secret = process.env.JWT_SECRET;
    
    if (!secret) {
      throw new Error(
        'JWT_SECRET environment variable is required but not defined. ' +
        'Please set JWT_SECRET in your environment variables for secure JWT operations.'
      );
    }

    if (secret.length < 32) {
      throw new Error(
        'JWT_SECRET must be at least 32 characters long for security. ' +
        'Current length: ' + secret.length
      );
    }

    this.jwtSecret = secret;
  }

  public static getInstance(): JWTConfig {
    if (!JWTConfig.instance) {
      JWTConfig.instance = new JWTConfig();
    }
    return JWTConfig.instance;
  }

  public getSecret(): string {
    return this.jwtSecret;
  }

  /**
   * Verify a JWT token using the configured secret
   */
  public verifyToken(token: string, options?: jwt.VerifyOptions): any {
    try {
      return jwt.verify(token, this.jwtSecret, options);
    } catch (error) {
      throw new Error(`JWT verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Sign a payload to create a JWT token
   */
  public signToken(payload: object, options?: jwt.SignOptions): string {
    try {
      return jwt.sign(payload, this.jwtSecret, options);
    } catch (error) {
      throw new Error(`JWT signing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Export singleton instance
export const jwtConfig = JWTConfig.getInstance();

// Export convenience functions
export const verifyJWT = (token: string, options?: jwt.VerifyOptions) => 
  jwtConfig.verifyToken(token, options);

export const signJWT = (payload: object, options?: jwt.SignOptions) => 
  jwtConfig.signToken(payload, options);

// Export the secret for backward compatibility (use sparingly)
export const getJWTSecret = () => jwtConfig.getSecret();