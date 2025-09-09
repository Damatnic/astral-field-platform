/**
 * Enterprise Multi-Factor Authentication API
 * Complete MFA management with setup, verification, and backup codes
 */

import { NextRequest, NextResponse } from 'next/server';
import { securityMiddleware } from '@/lib/auth/security-middleware';
import { enhancedMFA } from '@/lib/auth/enhanced-mfa';
import { auditLogger } from '@/lib/auth/audit-logger';
import { rbacManager } from '@/lib/auth/rbac';
import { verifyJWT } from '@/lib/auth/jwt-config';

interface MFASetupRequest {
  action: 'setup' | 'enable' | 'disable' | 'verify' | 'regenerate_backup_codes' | 'status';
  verificationToken?: string;
  challengeId?: string;
  method?: 'totp' | 'sms' | 'email' | 'backup_codes';
}

export async function POST(request: NextRequest) {
  try {
    // Security validation
    const securityCheck = await securityMiddleware.validateRequest(request, '/api/auth/enterprise/mfa');
    if (securityCheck) {
      return securityCheck;
    }

    // Authentication check
    const authResult = await securityMiddleware.validateAuthentication(request);
    if (!authResult.valid) {
      return NextResponse.json({
        success: false,
        error: authResult.error
      }, { status: 401 });
    }

    const user = authResult.user!;
    const requestBody: MFASetupRequest = await request.json();
    const { action, verificationToken, challengeId, method } = requestBody;

    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || '';

    switch (action) {
      case 'setup':
        return await handleMFASetup(user, ip, userAgent);
        
      case 'enable':
        return await handleMFAEnable(user, verificationToken, ip, userAgent);
        
      case 'disable':
        return await handleMFADisable(user, verificationToken, ip, userAgent);
        
      case 'verify':
        return await handleMFAVerification(user, challengeId, verificationToken, method, ip, userAgent);
        
      case 'regenerate_backup_codes':
        return await handleRegenerateBackupCodes(user, verificationToken, ip, userAgent);
        
      case 'status':
        return await handleMFAStatus(user.id);
        
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('MFA API error:', error);
    return NextResponse.json({
      success: false,
      error: 'MFA operation failed'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const authResult = await securityMiddleware.validateAuthentication(request);
    if (!authResult.valid) {
      return NextResponse.json({
        success: false,
        error: authResult.error
      }, { status: 401 });
    }

    const user = authResult.user!;
    return await handleMFAStatus(user.id);

  } catch (error) {
    console.error('MFA status error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get MFA status'
    }, { status: 500 });
  }
}

async function handleMFASetup(user: any, ip: string, userAgent: string) {
  try {
    // Check if MFA is already enabled
    if (user.mfa_enabled) {
      return NextResponse.json({
        success: false,
        error: 'MFA is already enabled for this account'
      }, { status: 400 });
    }

    // Generate MFA setup
    const mfaSetup = await enhancedMFA.generateMFASetup({
      id: user.id,
      email: user.email,
      phoneNumber: user.phone_number
    });

    // Log MFA setup initiation
    await auditLogger.logEvent({
      userId: user.id,
      eventType: 'authentication',
      eventCategory: 'mfa_setup',
      severity: 'medium',
      action: 'mfa_setup_initiated',
      description: 'MFA setup process started',
      metadata: {
        availableMethods: mfaSetup.methods,
        ip,
        userAgent
      },
      ipAddress: ip,
      userAgent,
      success: true,
      complianceRelevant: true
    });

    return NextResponse.json({
      success: true,
      message: 'MFA setup information generated',
      setup: {
        totpSecret: mfaSetup.totpSecret,
        qrCodeUri: mfaSetup.qrCodeUri,
        qrCodeDataUrl: mfaSetup.qrCodeDataUrl,
        manualEntryKey: mfaSetup.manualEntryKey,
        backupCodes: mfaSetup.backupCodes,
        availableMethods: mfaSetup.methods
      },
      instructions: {
        totp: 'Scan the QR code with your authenticator app or enter the manual key',
        backupCodes: 'Save these backup codes in a secure location. Each can only be used once.',
        nextStep: 'Verify your setup by providing a code from your authenticator app'
      }
    });

  } catch (error) {
    console.error('MFA setup error:', error);
    throw error;
  }
}

async function handleMFAEnable(user: any, verificationToken: string | undefined, ip: string, userAgent: string) {
  try {
    if (!verificationToken) {
      return NextResponse.json({
        success: false,
        error: 'Verification token is required'
      }, { status: 400 });
    }

    if (user.mfa_enabled) {
      return NextResponse.json({
        success: false,
        error: 'MFA is already enabled'
      }, { status: 400 });
    }

    // This would typically come from a setup session
    // For now, we'll simulate enabling MFA
    const success = await enhancedMFA.enableMFA(
      user.id,
      'temp_secret', // This should come from setup session
      verificationToken,
      [], // Backup codes from setup
      user.phone_number
    );

    if (!success) {
      await auditLogger.logEvent({
        userId: user.id,
        eventType: 'authentication',
        eventCategory: 'mfa_setup',
        severity: 'medium',
        action: 'mfa_enable_failed',
        description: 'Failed to enable MFA - invalid verification token',
        ipAddress: ip,
        userAgent,
        success: false,
        errorMessage: 'Invalid verification token'
      });

      return NextResponse.json({
        success: false,
        error: 'Invalid verification token'
      }, { status: 400 });
    }

    // Log successful MFA enablement
    await auditLogger.logEvent({
      userId: user.id,
      eventType: 'authentication',
      eventCategory: 'mfa_setup',
      severity: 'high',
      action: 'mfa_enabled',
      description: 'MFA successfully enabled for user account',
      ipAddress: ip,
      userAgent,
      success: true,
      complianceRelevant: true
    });

    return NextResponse.json({
      success: true,
      message: 'MFA has been successfully enabled',
      mfaEnabled: true,
      availableMethods: ['totp', 'backup_codes', 'email']
    });

  } catch (error) {
    console.error('MFA enable error:', error);
    throw error;
  }
}

async function handleMFADisable(user: any, verificationToken: string | undefined, ip: string, userAgent: string) {
  try {
    if (!verificationToken) {
      return NextResponse.json({
        success: false,
        error: 'Verification token is required to disable MFA'
      }, { status: 400 });
    }

    if (!user.mfa_enabled) {
      return NextResponse.json({
        success: false,
        error: 'MFA is not currently enabled'
      }, { status: 400 });
    }

    const success = await enhancedMFA.disableMFA(user.id, verificationToken);

    if (!success) {
      await auditLogger.logEvent({
        userId: user.id,
        eventType: 'authentication',
        eventCategory: 'mfa_setup',
        severity: 'high',
        action: 'mfa_disable_failed',
        description: 'Failed attempt to disable MFA',
        ipAddress: ip,
        userAgent,
        success: false,
        errorMessage: 'Invalid verification token'
      });

      return NextResponse.json({
        success: false,
        error: 'Invalid verification token'
      }, { status: 400 });
    }

    // Log MFA disablement
    await auditLogger.logEvent({
      userId: user.id,
      eventType: 'authentication',
      eventCategory: 'mfa_setup',
      severity: 'critical',
      action: 'mfa_disabled',
      description: 'MFA disabled for user account',
      ipAddress: ip,
      userAgent,
      success: true,
      complianceRelevant: true
    });

    return NextResponse.json({
      success: true,
      message: 'MFA has been disabled',
      mfaEnabled: false,
      warning: 'Your account security has been reduced. Consider re-enabling MFA.'
    });

  } catch (error) {
    console.error('MFA disable error:', error);
    throw error;
  }
}

async function handleMFAVerification(
  user: any,
  challengeId: string | undefined,
  verificationToken: string | undefined,
  method: string | undefined,
  ip: string,
  userAgent: string
) {
  try {
    if (!challengeId || !verificationToken || !method) {
      return NextResponse.json({
        success: false,
        error: 'Challenge ID, verification token, and method are required'
      }, { status: 400 });
    }

    const result = await enhancedMFA.verifyMFAChallenge({
      challengeId,
      method: method as any,
      token: verificationToken,
      userAgent,
      ipAddress: ip
    });

    if (result.success) {
      await auditLogger.logEvent({
        userId: user.id,
        eventType: 'authentication',
        eventCategory: 'mfa_verification',
        severity: 'info',
        action: 'mfa_verification_success',
        description: `MFA verification successful using ${method}`,
        metadata: {
          method,
          challengeId,
          backupCodeUsed: result.backupCodeUsed
        },
        ipAddress: ip,
        userAgent,
        success: true,
      complianceRelevant: true
      });

      return NextResponse.json({
        success: true,
        message: 'MFA verification successful',
        method: result.method,
        backupCodeUsed: !!result.backupCodeUsed
      });
    } else {
      await auditLogger.logEvent({
        userId: user.id,
        eventType: 'authentication',
        eventCategory: 'mfa_verification',
        severity: 'medium',
        action: 'mfa_verification_failed',
        description: `MFA verification failed using ${method}`,
        metadata: {
          method,
          challengeId,
          remainingAttempts: result.remainingAttempts
        },
        ipAddress: ip,
        userAgent,
        success: false,
        errorMessage: result.error
      });

      return NextResponse.json({
        success: false,
        error: result.error,
        remainingAttempts: result.remainingAttempts
      }, { status: 400 });
    }

  } catch (error) {
    console.error('MFA verification error:', error);
    throw error;
  }
}

async function handleRegenerateBackupCodes(user: any, verificationToken: string | undefined, ip: string, userAgent: string) {
  try {
    if (!verificationToken) {
      return NextResponse.json({
        success: false,
        error: 'Verification token is required'
      }, { status: 400 });
    }

    if (!user.mfa_enabled) {
      return NextResponse.json({
        success: false,
        error: 'MFA must be enabled to regenerate backup codes'
      }, { status: 400 });
    }

    const newBackupCodes = await enhancedMFA.regenerateBackupCodes(user.id, verificationToken);

    if (!newBackupCodes) {
      return NextResponse.json({
        success: false,
        error: 'Invalid verification token'
      }, { status: 400 });
    }

    // Log backup codes regeneration
    await auditLogger.logEvent({
      userId: user.id,
      eventType: 'authentication',
      eventCategory: 'mfa_setup',
      severity: 'medium',
      action: 'backup_codes_regenerated',
      description: 'MFA backup codes regenerated',
      metadata: {
        codesCount: newBackupCodes.length
      },
      ipAddress: ip,
      userAgent,
      success: true,
      complianceRelevant: true
    });

    return NextResponse.json({
      success: true,
      message: 'New backup codes generated',
      backupCodes: newBackupCodes,
      warning: 'Save these codes securely. Your old backup codes are no longer valid.'
    });

  } catch (error) {
    console.error('Regenerate backup codes error:', error);
    throw error;
  }
}

async function handleMFAStatus(userId: string) {
  try {
    const status = await enhancedMFA.getMFAStatus(userId);

    return NextResponse.json({
      success: true,
      mfa: {
        enabled: status.enabled,
        availableMethods: status.methods,
        backupCodesRemaining: status.backupCodesRemaining,
        recommendedActions: status.backupCodesRemaining < 3 ? 
          ['Consider regenerating backup codes'] : []
      }
    });

  } catch (error) {
    console.error('MFA status error:', error);
    throw error;
  }
}