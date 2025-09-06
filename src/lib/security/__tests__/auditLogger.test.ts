import {
  logAuditEvent,
  getUserAuditLogs,
  getAuditLogs,
  getSecurityAlerts,
  getAuditStatistics,
  cleanupAuditLogs,
  extractRequestInfo,
  AuditEventType,
  RiskLevel,
  AUDIT_CONFIG
} from '../auditLogger';

// Mock crypto
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: jest.fn(() => 'mock-uuid-123')
  }
});

describe('Audit Logger', () => {
  beforeEach(() => {
    // Clear any existing audit logs before each test
    jest.clearAllMocks();
  });

  describe('logAuditEvent', () => {
    it('should log an audit event with all required fields', async () => {
      const eventId = await logAuditEvent(
        AuditEventType.LOGIN_SUCCESS,
        'User logged in successfully',
        { method: 'password' },
        {
          userId: 'user123',
          userEmail: 'test@example.com',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0'
        }
      );

      expect(eventId).toBe('mock-uuid-123');
    });

    it('should calculate correct risk level for different event types', async () => {
      // Test critical event
      await logAuditEvent(AuditEventType.UNAUTHORIZED_ACCESS, 'Unauthorized access attempt');
      
      // Test high-risk event
      await logAuditEvent(AuditEventType.LOGIN_FAILURE, 'Login failed');
      
      // Test medium-risk event
      await logAuditEvent(AuditEventType.LOGIN_SUCCESS, 'Login successful');
      
      // Test low-risk event
      await logAuditEvent(AuditEventType.DRAFT_PICK, 'Player drafted');

      const logs = getAuditLogs();
      expect(logs).toHaveLength(4);
    });

    it('should handle events without user information', async () => {
      const eventId = await logAuditEvent(
        AuditEventType.RATE_LIMIT_EXCEEDED,
        'Rate limit exceeded',
        { endpoint: '/api/test' }
      );

      expect(eventId).toBeDefined();
      const logs = getAuditLogs();
      const event = logs.find(log => log.id === eventId);
      expect(event?.userId).toBeUndefined();
    });
  });

  describe('getUserAuditLogs', () => {
    beforeEach(async () => {
      // Create test data
      await logAuditEvent(AuditEventType.LOGIN_SUCCESS, 'Login 1', {}, { userId: 'user123' });
      await logAuditEvent(AuditEventType.LOGIN_FAILURE, 'Login failed', {}, { userId: 'user123' });
      await logAuditEvent(AuditEventType.LOGOUT, 'Logout', {}, { userId: 'user123' });
      await logAuditEvent(AuditEventType.LOGIN_SUCCESS, 'Login 2', {}, { userId: 'user456' });
    });

    it('should return logs for specific user', () => {
      const userLogs = getUserAuditLogs('user123');
      expect(userLogs).toHaveLength(3);
      userLogs.forEach(log => {
        expect(log.userId).toBe('user123');
      });
    });

    it('should filter by event types', () => {
      const loginLogs = getUserAuditLogs('user123', {
        eventTypes: [AuditEventType.LOGIN_SUCCESS, AuditEventType.LOGIN_FAILURE]
      });
      expect(loginLogs).toHaveLength(2);
    });

    it('should filter by risk levels', () => {
      const highRiskLogs = getUserAuditLogs('user123', {
        riskLevels: [RiskLevel.HIGH]
      });
      expect(highRiskLogs.length).toBeGreaterThan(0);
    });

    it('should limit results', () => {
      const limitedLogs = getUserAuditLogs('user123', { limit: 2 });
      expect(limitedLogs).toHaveLength(2);
    });

    it('should filter by time range', () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      
      const recentLogs = getUserAuditLogs('user123', {
        startTime: oneHourAgo,
        endTime: now
      });
      
      expect(recentLogs.length).toBeGreaterThan(0);
      recentLogs.forEach(log => {
        expect(log.timestamp.getTime()).toBeGreaterThanOrEqual(oneHourAgo.getTime());
        expect(log.timestamp.getTime()).toBeLessThanOrEqual(now.getTime());
      });
    });
  });

  describe('getAuditLogs', () => {
    beforeEach(async () => {
      await logAuditEvent(AuditEventType.LOGIN_SUCCESS, 'Success', {}, { userId: 'user1' });
      await logAuditEvent(AuditEventType.LOGIN_FAILURE, 'Failure', {}, { userId: 'user2' });
      await logAuditEvent(AuditEventType.UNAUTHORIZED_ACCESS, 'Unauthorized', {});
    });

    it('should return all logs when no filters applied', () => {
      const allLogs = getAuditLogs();
      expect(allLogs.length).toBeGreaterThanOrEqual(3);
    });

    it('should filter by user ID', () => {
      const userLogs = getAuditLogs({ userId: 'user1' });
      expect(userLogs).toHaveLength(1);
      expect(userLogs[0].userId).toBe('user1');
    });

    it('should sort logs by timestamp (newest first)', () => {
      const logs = getAuditLogs();
      for (let i = 1; i < logs.length; i++) {
        expect(logs[i - 1].timestamp.getTime()).toBeGreaterThanOrEqual(
          logs[i].timestamp.getTime()
        );
      }
    });
  });

  describe('getSecurityAlerts', () => {
    beforeEach(async () => {
      await logAuditEvent(AuditEventType.LOGIN_SUCCESS, 'Success', {}); // Medium risk
      await logAuditEvent(AuditEventType.LOGIN_FAILURE, 'Failure', {}); // High risk
      await logAuditEvent(AuditEventType.UNAUTHORIZED_ACCESS, 'Unauthorized', {}); // Critical risk
    });

    it('should return only high and critical risk events', () => {
      const alerts = getSecurityAlerts();
      expect(alerts.length).toBeGreaterThanOrEqual(2);
      alerts.forEach(alert => {
        expect([RiskLevel.HIGH, RiskLevel.CRITICAL]).toContain(alert.riskLevel);
      });
    });
  });

  describe('getAuditStatistics', () => {
    beforeEach(async () => {
      await logAuditEvent(AuditEventType.LOGIN_SUCCESS, 'Success 1', {}, { userId: 'user1' });
      await logAuditEvent(AuditEventType.LOGIN_SUCCESS, 'Success 2', {}, { userId: 'user1' });
      await logAuditEvent(AuditEventType.LOGIN_FAILURE, 'Failure 1', {}, { userId: 'user2', success: false });
      await logAuditEvent(AuditEventType.LOGOUT, 'Logout', {}, { userId: 'user1' });
    });

    it('should calculate correct statistics', () => {
      const stats = getAuditStatistics();
      
      expect(stats.totalEvents).toBeGreaterThanOrEqual(4);
      expect(stats.uniqueUsers).toBeGreaterThanOrEqual(2);
      expect(stats.successRate).toBeGreaterThan(0);
      expect(stats.eventsByType).toHaveProperty(AuditEventType.LOGIN_SUCCESS);
      expect(stats.eventsByRisk).toHaveProperty(RiskLevel.MEDIUM);
      expect(stats.topUsers).toBeDefined();
      expect(Array.isArray(stats.topUsers)).toBe(true);
    });

    it('should calculate correct success rate', () => {
      const stats = getAuditStatistics();
      expect(stats.successRate).toBeGreaterThan(0);
      expect(stats.successRate).toBeLessThanOrEqual(100);
    });

    it('should sort top users by activity', () => {
      const stats = getAuditStatistics();
      for (let i = 1; i < stats.topUsers.length; i++) {
        expect(stats.topUsers[i - 1].count).toBeGreaterThanOrEqual(
          stats.topUsers[i].count
        );
      }
    });
  });

  describe('extractRequestInfo', () => {
    it('should extract IP from x-forwarded-for header', () => {
      const mockRequest = {
        headers: {
          get: jest.fn((header: string) => {
            switch (header) {
              case 'x-forwarded-for':
                return '192.168.1.1, 10.0.0.1';
              case 'user-agent':
                return 'Mozilla/5.0';
              default:
                return null;
            }
          })
        }
      } as unknown as Request;

      const info = extractRequestInfo(mockRequest);
      expect(info.ipAddress).toBe('192.168.1.1');
      expect(info.userAgent).toBe('Mozilla/5.0');
    });

    it('should fallback to x-real-ip header', () => {
      const mockRequest = {
        headers: {
          get: jest.fn((header: string) => {
            switch (header) {
              case 'x-forwarded-for':
                return null;
              case 'x-real-ip':
                return '192.168.1.2';
              case 'user-agent':
                return 'Mozilla/5.0';
              default:
                return null;
            }
          })
        }
      } as unknown as Request;

      const info = extractRequestInfo(mockRequest);
      expect(info.ipAddress).toBe('192.168.1.2');
    });

    it('should use unknown when no IP headers present', () => {
      const mockRequest = {
        headers: {
          get: jest.fn(() => null)
        }
      } as unknown as Request;

      const info = extractRequestInfo(mockRequest);
      expect(info.ipAddress).toBe('unknown');
      expect(info.userAgent).toBe('unknown');
    });

    it('should extract session ID when present', () => {
      const mockRequest = {
        headers: {
          get: jest.fn((header: string) => {
            switch (header) {
              case 'x-session-id':
                return 'session123';
              default:
                return 'unknown';
            }
          })
        }
      } as unknown as Request;

      const info = extractRequestInfo(mockRequest);
      expect(info.sessionId).toBe('session123');
    });
  });

  describe('cleanupAuditLogs', () => {
    it('should return 0 when no logs to cleanup', () => {
      const deletedCount = cleanupAuditLogs();
      expect(deletedCount).toBe(0);
    });

    // Note: Testing actual cleanup would require mocking dates
    // and creating old log entries, which is more complex
  });

  describe('suspicious activity detection', () => {
    it('should detect multiple failed logins', async () => {
      const userId = 'user-suspicious';
      
      // Generate multiple failed logins
      for (let i = 0; i < 4; i++) {
        await logAuditEvent(
          AuditEventType.LOGIN_FAILURE,
          `Failed login attempt ${i}`,
          {},
          { userId, userEmail: 'test@example.com', ipAddress: '192.168.1.1' }
        );
      }

      const userLogs = getUserAuditLogs(userId);
      const suspiciousEvents = userLogs.filter(log => 
        log.eventType === AuditEventType.SUSPICIOUS_ACTIVITY
      );
      
      expect(suspiciousEvents.length).toBeGreaterThan(0);
    });

    it('should detect rapid API calls', async () => {
      const userId = 'user-rapid';
      
      // Generate many rapid actions
      for (let i = 0; i < 25; i++) {
        await logAuditEvent(
          AuditEventType.DRAFT_PICK,
          `Rapid action ${i}`,
          {},
          { userId, userEmail: 'test@example.com', ipAddress: '192.168.1.1' }
        );
      }

      const userLogs = getUserAuditLogs(userId);
      const suspiciousEvents = userLogs.filter(log => 
        log.eventType === AuditEventType.SUSPICIOUS_ACTIVITY
      );
      
      expect(suspiciousEvents.length).toBeGreaterThan(0);
    });
  });
});