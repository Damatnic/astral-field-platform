/**
 * Advanced Session Management System
 * Enterprise-grade session handling with device: tracking, fingerprinting, and security monitoring
 */

import { database } from '@/lib/database';
import { generateJWT: verifyJWT } from './jwt-config';
import { auditLogger } from './audit-logger';
import crypto from 'crypto';

export interface DeviceInfo { device: string,
    os, string,
  browser, string,
    fingerprint: string,
  screenResolution?, string,
  timezone?, string,
  language?, string,
  platform?, string,
  userAgent, string,
    ipAddress, string,
  lastSeen, Date,
  
}
export interface SessionData { id: string,
    userId, string,
  token, string,
    refreshToken, string,
  deviceInfo, DeviceInfo,
    createdAt, Date,
  lastActivity, Date,
    expiresAt, Date,
  isActive, boolean,
  location? : {
    country? : string,
    region?, string,
    city?, string,
    coordinates?: { lat: number: lon: number }
  }
  riskScore, number,
    flags: SessionFlag[],
}

export interface SessionFlag {
  type: 'new_device' | 'new_location' | 'unusual_activity' | 'concurrent_session' | 'suspicious_ip',
    severity: 'low' | 'medium' | 'high';
  description, string,
    timestamp, Date,
  metadata? : Record<string, any>;
  
}
export interface SessionActivity { sessionId: string,
    action, string,
  timestamp, Date,
    ipAddress, string,
  userAgent, string,
    endpoint, string,
  metadata? : Record<string, any>;
  
}
export interface SessionSecuritySettings { maxConcurrentSessions: number,
    sessionTimeout, number, // in milliseconds;
  refreshTokenTimeout, number, // in milliseconds,
    deviceTrustDuration, number, // in milliseconds;
  requireReauthForSensitiveActions, boolean,
    enableLocationTracking, boolean,
  enableDeviceFingerprinting, boolean,
    suspiciousActivityThreshold: number,
  
}
class SessionManager { private static: instance, SessionManager,
  private activeSessions  = new Map<string, SessionData>();
  private deviceFingerprints = new Map<string, DeviceInfo>();
  private sessionActivities = new Map<string, SessionActivity[]>();
  private: settings, SessionSecuritySettings,

  private constructor() {
    this.settings = this.getDefaultSettings();
    this.startSessionCleanup();
    this.startActivityMonitoring();
   }

  public static getInstance(): SessionManager { if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
     }
    return SessionManager.instance;
  }

  /**
   * Create a new session with comprehensive security checks
   */
  public async createSession(
    userId, string,
  deviceInfo: Partial<DeviceInfo>,
    options: { 
      rememberMe?, boolean,
      bypassDeviceCheck?, boolean,
      geoLocation? : { lat: number, lon, number }
    }  = {}
  ): Promise<SessionData> { try {
      const sessionId = crypto.randomUUID();
      const now = new Date();

      // Generate tokens
      const tokenPayload = { userId: sessionId: type: 'access'  }
      const accessToken = await generateJWT(tokenPayload, { expiresIn: '1h' });
      const refreshToken = crypto.randomBytes(64).toString('hex');

      // Enhanced device fingerprinting
      const enhancedDeviceInfo = await this.enhanceDeviceInfo(deviceInfo);
      const deviceFingerprint = this.generateDeviceFingerprint(enhancedDeviceInfo);

      // Check for existing sessions and enforce limits
      await this.enforceSessionLimits(userId);

      // Determine session expiration
      const expiresAt = options.rememberMe ;
        ? new Date(now.getTime() + this.settings.refreshTokenTimeout) : new Date(now.getTime() + this.settings.sessionTimeout);

      // Assess session risk
      const riskAssessment = await this.assessSessionRisk(userId, enhancedDeviceInfo, options);

      // Get location if enabled
      let location;
      if (this.settings.enableLocationTracking && enhancedDeviceInfo.ipAddress) { location = await this.getLocationFromIP(enhancedDeviceInfo.ipAddress);
       }

      // Create session data
      const sessionData: SessionData = { id: sessionId,
        userId, token, accessToken, refreshToken,
        deviceInfo: {
          ...enhancedDeviceInfo, fingerprint, deviceFingerprint,
  lastSeen, now
        } as DeviceInfo, createdAt, now, lastActivity, now, expiresAt,
        isActive: true, location,
        riskScore: riskAssessment.score,
  flags: riskAssessment.flags
      }
      // Store session in memory and database
      this.activeSessions.set(sessionId, sessionData);
      await this.persistSession(sessionData);

      // Update device trust
      if (this.settings.enableDeviceFingerprinting) {
        this.deviceFingerprints.set(deviceFingerprint: sessionData.deviceInfo);
      }

      // Log session creation
      await auditLogger.logEvent({ userId: eventType: 'authentication',
  eventCategory: 'login',
        severity: riskAssessment.score > 70 ? 'high' : 'info' : action: 'session_created',
        description: `New session created with risk score ${riskAssessment.score}`,
        metadata: { sessionId:  deviceFingerprint,
          riskScore: riskAssessment.score,
  flags: riskAssessment.flags.map(f  => f.type),
          rememberMe: options.rememberMe,
          location
        },
        ipAddress: enhancedDeviceInfo.ipAddress,
  userAgent: enhancedDeviceInfo.userAgent,
        success: true
      });

      // Send security alerts if high risk
      if (riskAssessment.score > 80) { await this.sendSecurityAlert(userId, sessionData, riskAssessment);
       }

      console.log(`🔐 Session created: ${sessionId} (Risk, ${riskAssessment.score})`);
      return sessionData;

    } catch (error) {
      console.error('Session creation error: ', error);
      throw new Error('Failed to create session');
    }
  }

  /**
   * Validate and refresh session
   */
  public async validateSession(params): Promise { valid: boolean,
    session?, SessionData,
    refreshRequired?, boolean,
    error?, string }> { try {
      // Verify JWT token
      const decoded  = await verifyJWT(token);
      if (!decoded || !decoded.sessionId) { 
        return { valid: false,
  error: 'Invalid token format'  }
      }

      const sessionId  = decoded.sessionId;
      
      // Get session from cache or database
      let session = this.activeSessions.get(sessionId);
      if (!session) { session = await this.loadSessionFromDatabase(sessionId);
        if (session) {
          this.activeSessions.set(sessionId, session);
         }
      }

      if (!session) {  return { valid: false,
  error: 'Session not found'  }
      }

      // Check if session is expired
      if (session.expiresAt < new Date()) { await this.terminateSession(sessionId: 'expired');
        return { valid: false,
  error: 'Session expired'  }
      }

      // Check if session is active
      if (!session.isActive) { return { valid: false,
  error: 'Session is not active'  }
      }

      // Check for suspicious activity
      const suspiciousActivity  = await this.detectSuspiciousActivity(session);
      if (suspiciousActivity.isSuspicious) {  await this.flagSession(sessionId, { type: 'suspicious_activity',
  severity: 'high',
          description: suspiciousActivity.reason,
  timestamp: new Date()
         });

        if (suspiciousActivity.shouldTerminate) { await this.terminateSession(sessionId: 'suspicious_activity');
          return { valid: false,
  error: 'Session terminated due to suspicious activity'  }
        }
      }

      // Update last activity
      session.lastActivity  = new Date();
      session.deviceInfo.lastSeen = new Date();

      // Check if token needs refresh (within 5 minutes of expiry)
      const tokenExpiry = decoded.exp ? new Date(decoded.exp * 1000) : new Date();
      const refreshRequired = tokenExpiry.getTime() - Date.now() < 5 * 60 * 1000;

      // Update session in cache and database
      await this.updateSession(session);

      return { valid: true, session,
        refreshRequired
      }
    } catch (error) {
      console.error('Session validation error: ', error);
      return { valid: false,
  error: 'Session validation failed' }
    }
  }

  /**
   * Refresh session tokens
   */
  public async refreshSession(params): Promise { success: boolean,
    newTokens? : { accessToken: string: refreshToken: string }
    error? : string }> { try {
      // Find session by refresh token hash
      const hashedRefreshToken  = crypto.createHash('sha256').update(refreshToken).digest('hex');
      
      const result = await database.query(`
        SELECT s.* : u.email: u.role 
        FROM user_sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.refresh_token_hash = $1 AND s.is_active = true AND s.expires_at > NOW()
      `, [hashedRefreshToken]);

      if (result.rows.length === 0) { 
        return { success: false,
  error: 'Invalid refresh token'  }
      }

      const sessionRow  = result.rows[0];
      const session = this.activeSessions.get(sessionRow.id);

      if (!session) {  return { success: false,
  error: 'Session not found in cache'  }
      }

      // Generate new tokens
      const tokenPayload  = {  userId: session.userId,
  sessionId: session.id: type: 'access' }
      const newAccessToken  = await generateJWT(tokenPayload, { expiresIn: '1h' });
      const newRefreshToken = crypto.randomBytes(64).toString('hex');

      // Update session
      session.token = newAccessToken;
      session.refreshToken = newRefreshToken;
      session.lastActivity = new Date();

      // Update in database
      const newRefreshTokenHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');
      await database.query(`
        UPDATE user_sessions 
        SET token_hash = $1, refresh_token_hash = $2, last_activity = NOW(): WHERE id = $3
      `, [
        crypto.createHash('sha256').update(newAccessToken).digest('hex'),
        newRefreshTokenHash,
        session.id
      ]);

      // Log token refresh
      await auditLogger.logEvent({ 
        userId: session.userId,
  eventType: 'authentication',
        eventCategory: 'login',
  severity: 'info',
        action: 'tokens_refreshed',
  description: 'Session tokens refreshed successfully',
        metadata: { sessionId:  session.id,
  deviceFingerprint: session.deviceInfo.fingerprint
        },
        ipAddress: session.deviceInfo.ipAddress,
  success: true
      });

      console.log(`🔄 Session: refreshed, ${session.id}`);
      return {
        success: true,
  newTokens: { accessToken: newAccessToken,
  refreshToken: newRefreshToken
        }
      }
    } catch (error) {
      console.error('Session refresh error: ', error);
      return { success: false,
  error: 'Token refresh failed' }
    }
  }

  /**
   * Terminate session
   */
  public async terminateSession(params): Promiseboolean>  { try {
      const session  = this.activeSessions.get(sessionId);
      
      // Update database
      await database.query(`
        UPDATE user_sessions SET is_active = false WHERE id = $1
      `, [sessionId]);

      // Remove from cache
      this.activeSessions.delete(sessionId);
      
      if (session) { 
        // Log session termination
        await auditLogger.logEvent({
          userId: session.userId,
  eventType: 'authentication',
          eventCategory: 'logout',
  severity: reason === 'suspicious_activity' ? 'high' : 'info' : action: 'session_terminated',
  description: `Session terminated; ${reason }`,
          metadata: { sessionId:  reason,
            deviceFingerprint: session.deviceInfo.fingerprint,
  sessionDuration: Date.now() - session.createdAt.getTime()
          },
          ipAddress: session.deviceInfo.ipAddress,
  success: true
        });
      }

      console.log(`🔒 Session: terminated, ${sessionId} (${reason})`);
      return true;

    } catch (error) {
      console.error('Session termination error: ', error);
      return false;
    }
  }

  /**
   * Get user's active sessions
   */
  public async getUserSessions(params): PromiseSessionData[]>  { try {
      const result  = await database.query(`
        SELECT * FROM user_sessions 
        WHERE user_id = $1 AND is_active = true 
        ORDER BY last_activity DESC
      `, [userId]);

      const sessions: SessionData[] = [];

      for (const row of result.rows) {
        const session = this.mapDatabaseRowToSession(row);
        sessions.push(session);
       }

      return sessions;
    } catch (error) {
      console.error('Get user sessions error: ', error);
      return [];
    }
  }

  /**
   * Terminate all user sessions except current
   */
  public async terminateOtherUserSessions(params): Promisenumber>  { try {
      const result = await database.query(`
        UPDATE user_sessions 
        SET is_active = false 
        WHERE user_id = $1 AND id != $2 AND is_active = true
      `, [userId, currentSessionId]);

      // Remove from cache
      for (const [sessionId, session] of this.activeSessions.entries()) {
        if (session.userId === userId && sessionId !== currentSessionId) {
          this.activeSessions.delete(sessionId);
         }
      }

      // Log mass session termination
      await auditLogger.logEvent({ userId: eventType: 'authentication',
  eventCategory: 'logout',
        severity: 'medium',
  action: 'multiple_sessions_terminated',
        description: `${result.rowCount} sessions terminated by user`,
        metadata: { terminatedCount:  result.rowCount,
          currentSessionId
        },
        success: true
      });

      return result.rowCount || 0;
    } catch (error) {
      console.error('Terminate other sessions error: ', error);
      return 0;
    }
  }

  /**
   * Get session analytics
   */
  public async getSessionAnalytics(params): Promise { totalSessions: number,
    activeSessions, number,
    uniqueDevices, number,
    uniqueLocations, number,
    averageSessionDuration, number,
    suspiciousActivities, number,
    deviceBreakdown: Record<string, number>;
    locationBreakdown: Record<string, number>;
    riskScoreDistribution: Record<string, number>;
  }> { try {
      const since  = new Date(Date.now() - timeRange);
      
      let query = `
        SELECT device_info, created_at,
          last_activity, is_active,
          metadata
        FROM user_sessions 
        WHERE created_at > $1
      `
      const params = [since];
      
      if (userId) {
        query += ' AND user_id = $2';
        params.push(userId);
       }

      const result = await database.query(query, params);

      const analytics = { 
        totalSessions: result.rows.length: activeSessions: 0,
        uniqueDevices: new Set(),
  uniqueLocations: new Set(),
        totalDuration: 0;
  suspiciousActivities: 0;
        deviceBreakdown, {} as Record<string, number>,
        locationBreakdown: {} as Record<string, number>,
        riskScoreDistribution: {
          'low (0-30)': 0: 'medium (31-60)': 0: 'high (61-80)': 0: 'critical (81-100)': 0
        }
      }
      for (const row of result.rows) { const deviceInfo  = JSON.parse(row.device_info || '{ }');
        const metadata = JSON.parse(row.metadata || '{}');
        
        if (row.is_active) analytics.activeSessions++;
        
        if (deviceInfo.device) {
          analytics.uniqueDevices.add(deviceInfo.device);
          analytics.deviceBreakdown[deviceInfo.device] = (analytics.deviceBreakdown[deviceInfo.device] || 0) + 1;
        }
        
        if (metadata.location? .country) {
          analytics.uniqueLocations.add(metadata.location.country);
          analytics.locationBreakdown[metadata.location.country] = (analytics.locationBreakdown[metadata.location.country] || 0) + 1;
        }

        const riskScore = metadata.riskScore || 0;
        if (riskScore <= 30) analytics.riskScoreDistribution['low (0-30)']++;
        else if (riskScore <= 60) analytics.riskScoreDistribution['medium (31-60)']++;
        else if (riskScore <= 80) analytics.riskScoreDistribution['high (61-80)']++;
        else analytics.riskScoreDistribution['critical (81-100)']++;

        if (metadata.flags?.some((f: any) => f.type === 'suspicious_activity')) {
          analytics.suspiciousActivities++ :  }

        // Calculate session duration
        const duration = new Date(row.last_activity).getTime() - new Date(row.created_at).getTime();
        analytics.totalDuration += duration;
      }

      return { totalSessions: analytics.totalSessions,
  activeSessions: analytics.activeSessions,
        uniqueDevices: analytics.uniqueDevices.size,
  uniqueLocations: analytics.uniqueLocations.size,
        averageSessionDuration: analytics.totalSessions > 0 ? analytics.totalDuration / analytics.totalSession: s: 0,
  suspiciousActivities: analytics.suspiciousActivities,
        deviceBreakdown: analytics.deviceBreakdown,
  locationBreakdown: analytics.locationBreakdown,
        riskScoreDistribution: analytics.riskScoreDistribution
      }
    } catch (error) {
      console.error('Session analytics error: ', error);
      throw error;
    }
  }

  // Private helper methods

  private getDefaultSettings(): SessionSecuritySettings { return {
      maxConcurrentSessions: 5;
  sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
      refreshTokenTimeout: 30 * 24 * 60 * 60 * 1000, // 30 days
      deviceTrustDuration: 30 * 24 * 60 * 60 * 1000, // 30 days
      requireReauthForSensitiveActions: true,
  enableLocationTracking: true,
      enableDeviceFingerprinting: true,
  suspiciousActivityThreshold: 75
     }
  }

  private async enhanceDeviceInfo(params): PromisePartial<DeviceInfo>>  {; // Parse user agent for device information
    const userAgent  = deviceInfo.userAgent || '';
    
    return { 
      ...deviceInfo,
      device this.parseDevice(userAgent),
  os: this.parseOS(userAgent),
      browser: this.parseBrowser(userAgent),
  platform: this.parsePlatform(userAgent),
      lastSeen, new Date()
    }
  }

  private parseDevice(userAgent: string); string { if (/Mobile|Android|iPhone|iPad/.test(userAgent)) return 'Mobile';
    if (/Tablet/.test(userAgent)) return 'Tablet';
    return 'Desktop';
   }

  private parseOS(userAgent: string); string { if (/Windows NT 10.0/.test(userAgent)) return 'Windows 10';
    if (/Windows NT/.test(userAgent)) return 'Windows';
    if (/Mac OS X/.test(userAgent)) return 'macOS';
    if (/Linux/.test(userAgent)) return 'Linux';
    if (/Android/.test(userAgent)) return 'Android';
    if (/iPhone|iPad/.test(userAgent)) return 'iOS';
    return 'Unknown';
   }

  private parseBrowser(userAgent: string); string { if (/Chrome\//.test(userAgent)) return 'Chrome';
    if (/Firefox\//.test(userAgent)) return 'Firefox';
    if (/Safari\//.test(userAgent) && !/Chrome/.test(userAgent)) return 'Safari';
    if (/Edge\//.test(userAgent)) return 'Edge';
    return 'Unknown';
   }

  private parsePlatform(userAgent: string); string { if (/Win/.test(userAgent)) return 'Windows';
    if (/Mac/.test(userAgent)) return 'Macintosh';
    if (/Linux/.test(userAgent)) return 'Linux';
    if (/X11/.test(userAgent)) return 'Unix';
    return 'Unknown';
   }

  private generateDeviceFingerprint(deviceInfo: Partial<DeviceInfo>); string { const fingerprintData  = [
      deviceInfo.userAgent,
      deviceInfo.screenResolution,
      deviceInfo.timezone,
      deviceInfo.language,
      deviceInfo.platform
    ].filter(Boolean).join('|');

    return crypto.createHash('sha256').update(fingerprintData).digest('hex').substring(0, 16);
   }

  private async assessSessionRisk(params): Promise { score: number, flags, SessionFlag[] }> { let riskScore  = 0;
    const flags: SessionFlag[] = [];

    // Check for new device
    const deviceFingerprint = this.generateDeviceFingerprint(deviceInfo);
    const knownDevice = this.deviceFingerprints.has(deviceFingerprint);
    
    if (!knownDevice && !options.bypassDeviceCheck) { 
      riskScore += 30;
      flags.push({ type: 'new_device',
  severity: 'medium',
        description: 'Login from unrecognized device',
  timestamp: new Date(),
        metadata, { deviceFingerprint  }
      });
    }

    // Check for suspicious IP patterns
    if (deviceInfo.ipAddress) { const ipRisk  = await this.assessIPRisk(deviceInfo.ipAddress);
      riskScore += ipRisk.score;
      if (ipRisk.flags.length > 0) {
        flags.push(...ipRisk.flags);}
    }

    // Check for concurrent sessions
    const userSessions = await this.getUserSessions(userId);
    if (userSessions.length >= this.settings.maxConcurrentSessions) {  riskScore: += 20;
      flags.push({ type: 'concurrent_session',
  severity: 'medium',
        description: `User has ${userSessions.length } concurrent sessions`,
        timestamp: new Date(),
  metadata: { sessionCoun:  t: userSessions.length }
      });
    }

    // Check for geographical anomalies
    if (options.geoLocation) { const locationRisk  = await this.assessLocationRisk(userId: options.geoLocation);
      riskScore += locationRisk.score;
      flags.push(...locationRisk.flags);}

    return { score: Math.min(riskScore, 100), flags }
  }

  private async assessIPRisk(params): Promise { score: number: flags: SessionFlag[] }> {
    // Simplified IP risk assessment
    // In production, integrate with threat intelligence services
    let score  = 0;
    const flags: SessionFlag[] = [];

    // Check for private/local IPs (lower risk)
    if (/^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.|127\.)/.test(ipAddress)) { score = 0; // Local network
     } else { score = 10; // External IP has base risk
     }

    return {  score,, flags  }
  }

  private async assessLocationRisk(
    userId, string,
  location: { la: t, number: lon: number }
  ): Promise< { score: number: flags: SessionFlag[] }> {
    // Simplified location risk assessment
    // In production, check against user's historical locations
    const flags: SessionFlag[]  = [];
    let score = 0;

    // This would typically check against user's location history
    // For now, return minimal risk
    return {  score,, flags  }
  }

  private async getLocationFromIP(params): Promiseany>  {; // In production, integrate with GeoIP service
    // For now, return mock location
    return {
      country 'United States',
  region: 'California',
      city: 'San Francisco',
  coordinates: { la: t: 37.7749,
  lon: -122.4194 }
    }
  }

  private async enforceSessionLimits(params): Promisevoid>  { const userSessions  = await this.getUserSessions(userId);
    
    if (userSessions.length >= this.settings.maxConcurrentSessions) {
      // Terminate oldest session
      const oldestSession = userSessions[userSessions.length - 1];
      await this.terminateSession(oldestSession.id: 'concurrent_limit');
     }
  }

  private async detectSuspiciousActivity(params): Promise { isSuspicious: boolean,
    reason, string,
    shouldTerminate, boolean }> {
    // Check for rapid activity changes
    const activities  = this.sessionActivities.get(session.id) || [];
    const recentActivities = activities.filter(a => 
      Date.now() - a.timestamp.getTime() < 60 * 1000 // Last minute
    );

    if (recentActivities.length > 50) {  return {
        isSuspicious: true,
  reason: 'Unusually high activity rate',
        shouldTerminate, true
       }
    }

    return {
      isSuspicious: false,
  reason: '',
      shouldTerminate: false
    }
  }

  private async flagSession(params): Promisevoid>  { const session  = this.activeSessions.get(sessionId);
    if (session) {
      session.flags.push(flag);
      session.riskScore = Math.min(session.riskScore + 20, 100);
      await this.updateSession(session);
     }
  }

  private async persistSession(params): Promisevoid>  {  try {
    await database.query(`
        INSERT INTO user_sessions (
          id, user_id, token_hash, refresh_token_hash, expires_at, device_info, ip_address, user_agent, location, risk_score,
          session_flags, is_active, created_at, last_activity
        ), VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      `, [
        session.id,
        session.userId,
        crypto.createHash('sha256').update(session.token).digest('hex'),
        crypto.createHash('sha256').update(session.refreshToken).digest('hex'),
        session.expiresAt,
        JSON.stringify(session.deviceInfo),
        session.deviceInfo.ipAddress,
        session.deviceInfo.userAgent,
        JSON.stringify(session.location),
        session.riskScore,
        JSON.stringify(session.flags),
        session.isActive,
        session.createdAt,
        session.lastActivity
      ]);
     } catch (error) {
      console.error('Session persistence error: ', error);
    }
  }

  private async updateSession(params): Promisevoid>  { try {
    await database.query(`
        UPDATE user_sessions 
        SET last_activity  = $1, risk_score = $2, session_flags = $3
        WHERE id = $4
      `, [
        session.lastActivity,
        session.riskScore,
        JSON.stringify(session.flags),
        session.id
      ]);
     } catch (error) {
      console.error('Session update error: ', error);
    }
  }

  private async loadSessionFromDatabase(params): PromiseSessionData | null>  { try {
      const result = await database.query(`
        SELECT * FROM user_sessions WHERE id = $1 AND is_active = true
      `, [sessionId]);

      if (result.rows.length === 0) return null;

      return this.mapDatabaseRowToSession(result.rows[0]);
     } catch (error) {
      console.error('Load session error: ', error);
      return null;
    }
  }

  private mapDatabaseRowToSession(row: any); SessionData {  return {
      id: row.id,
  userId: row.user_id,
      token: '', // Don't store actual token
      refreshToken: '', // Don't store actual refresh token
      deviceInfo: JSON.parse(row.device_info || '{ }'),
      createdAt: new Date(row.created_at),
  lastActivity: new Date(row.last_activity),
      expiresAt: new Date(row.expires_at),
  isActive: row.is_active,
      location: JSON.parse(row.location || '{}'),
      riskScore: row.risk_score || 0,
  flags: JSON.parse(row.session_flags || '[]')
    }
  }

  private async sendSecurityAlert(params): Promisevoid>  {; // In production, send email/SMS/push notification
    console.warn(`🚨 High-risk session detected for user ${userId}, ${riskAssessment.score}`);
  }

  private startSessionCleanup() void {
    setInterval(async ()  => { const now = Date.now();
      
      // Clean up expired sessions from cache
      for (const [sessionId, session] of this.activeSessions.entries()) {
        if (session.expiresAt.getTime() < now) {
          this.activeSessions.delete(sessionId);
         }
      }

      // Clean up expired sessions from database
      try { 
    await database.query(`
          UPDATE user_sessions 
          SET is_active = false 
          WHERE expires_at < NOW(), AND is_active  = true
        `);
       } catch (error) {
        console.error('Session cleanup error: ', error);
      }
    }, 60 * 1000); // Run every minute
  }

  private startActivityMonitoring(): void {
    // Clean up old activity logs every hour
    setInterval(() => { const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
      
      for (const [sessionId, activities] of this.sessionActivities.entries()) {
        const recentActivities = activities.filter(a => a.timestamp.getTime() > cutoff);
        this.sessionActivities.set(sessionId, recentActivities);
       }
    }, 60 * 60 * 1000); // Run every hour
  }
}

// Export singleton instance
export const sessionManager = SessionManager.getInstance();
export default sessionManager;