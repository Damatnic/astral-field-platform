import { NextRequest, NextResponse } from 'next/server';
import { 
  getAuditLogs, 
  getUserAuditLogs, 
  getSecurityAlerts, 
  getAuditStatistics,
  cleanupAuditLogs,
  AuditEventType,
  RiskLevel
} from '@/lib/security/auditLogger';
import { createRateLimit } from '@/lib/security/rateLimiter';

// Rate limit for audit log access
const auditLogsLimit = createRateLimit(50, 15 * 60 * 1000); // 50 requests per 15 minutes

// Mock admin check - replace with real admin verification
function isAdmin(request: NextRequest): boolean {
  const adminKey = request.headers.get('x-admin-key');
  return adminKey === 'admin-key-demo'; // In production, use proper admin authentication
}

// Helper function to parse query parameters
function parseQueryParams(searchParams: URLSearchParams) {
  const startTime = searchParams.get('startTime') ? new Date(searchParams.get('startTime')!) : undefined;
  const endTime = searchParams.get('endTime') ? new Date(searchParams.get('endTime')!) : undefined;
  const userId = searchParams.get('userId') || undefined;
  const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
  
  const eventTypesParam = searchParams.get('eventTypes');
  const eventTypes = eventTypesParam ? 
    eventTypesParam.split(',').filter(type => Object.values(AuditEventType).includes(type as AuditEventType)) as AuditEventType[] :
    undefined;
  
  const riskLevelsParam = searchParams.get('riskLevels');
  const riskLevels = riskLevelsParam ?
    riskLevelsParam.split(',').filter(level => Object.values(RiskLevel).includes(level as RiskLevel)) as RiskLevel[] :
    undefined;
  
  return { startTime, endTime, userId, limit, eventTypes, riskLevels };
}

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResponse = auditLogsLimit(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Admin authentication check
    if (!isAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'list';
    
    switch (action) {
      case 'list': {
        const params = parseQueryParams(searchParams);
        const logs = getAuditLogs(params);
        
        return NextResponse.json({
          success: true,
          data: {
            logs,
            total: logs.length,
            filters: params,
          }
        });
      }

      case 'user': {
        const userId = searchParams.get('userId');
        if (!userId) {
          return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        const params = parseQueryParams(searchParams);
        const logs = getUserAuditLogs(userId, params);
        
        return NextResponse.json({
          success: true,
          data: {
            logs,
            total: logs.length,
            userId,
            filters: params,
          }
        });
      }

      case 'alerts': {
        const params = parseQueryParams(searchParams);
        const alerts = getSecurityAlerts(params);
        
        return NextResponse.json({
          success: true,
          data: {
            alerts,
            total: alerts.length,
            filters: params,
          }
        });
      }

      case 'statistics': {
        const params = parseQueryParams(searchParams);
        const stats = getAuditStatistics(params);
        
        return NextResponse.json({
          success: true,
          data: stats
        });
      }

      case 'event-types': {
        return NextResponse.json({
          success: true,
          data: {
            eventTypes: Object.values(AuditEventType),
            riskLevels: Object.values(RiskLevel),
          }
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Audit logs API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResponse = auditLogsLimit(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Admin authentication check
    if (!isAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'cleanup': {
        const deletedCount = cleanupAuditLogs();
        
        return NextResponse.json({
          success: true,
          message: `Cleaned up ${deletedCount} old audit log entries`,
          data: { deletedCount }
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Audit logs cleanup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}