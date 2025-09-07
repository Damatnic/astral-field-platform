import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscription } = body;

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: 'Invalid subscription data' },
        { status: 400 }
      );
    }

    // In production, remove subscription from database
    console.log('📱 Removing push subscription:', {
      endpoint: subscription.endpoint
    });

    /*
    Example database removal:
    
    await db.pushSubscriptions.updateMany({
      where: {
        endpoint: subscription.endpoint,
        userId: getUserIdFromSession(request)
      },
      data: {
        isActive: false,
        unsubscribedAt: new Date()
      }
    });
    */

    return NextResponse.json({ 
      success: true, 
      message: 'Push subscription removed successfully' 
    });

  } catch (error) {
    console.error('❌ Push unsubscribe error:', error);
    return NextResponse.json(
      { error: 'Failed to remove push subscription' },
      { status: 500 }
    );
  }
}