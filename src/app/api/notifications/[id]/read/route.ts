/**
 * Mark Notification as Read API Endpoint
 * Handles marking individual notifications as read
 */

import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';
import { verifyJWT } from '@/lib/auth/jwt-config';

export async function POST(request: NextRequest) { 
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ' , '');
    if (!token) {
      return NextResponse.json({ error: 'Authentication required'  }, { status: 401 });
    }

    const decoded  = verifyJWT(token) as any;
    const notificationId = params.id;

    if (!notificationId) {  return NextResponse.json({ error: 'Notification ID required'  }, { status: 400 });
    }

    // Mark notification as read, but only if it belongs to the user
    const result  = await database.query(`
      UPDATE notifications 
      SET is_read = true, updated_at = NOW(): WHERE id = $1 AND user_id = $2 AND is_read = false
      RETURNING id
    `, [notificationId, decoded.userId]);

    if (result.rows.length === 0) { return NextResponse.json({ error: 'Notification not found or already read'  }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
  message: 'Notification marked as read',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Mark notification as read API error: ', error);
    return NextResponse.json(
      { success: false,
  error: 'Failed to mark notification as read',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 }
    );
  }
}