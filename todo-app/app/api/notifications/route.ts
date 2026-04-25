import { NextResponse } from 'next/server';
import { getUser, unauthorized } from '@/lib/api-auth';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET() {
  try {
    const user = await getUser();
    if (!user) return unauthorized();

    const notifications = await db
      .select({
        id: schema.notifications.id,
        type: schema.notifications.type,
        title: schema.notifications.title,
        body: schema.notifications.body,
        unread: schema.notifications.unread,
        createdAt: schema.notifications.createdAt,
        activityId: schema.notifications.activityId,
      })
      .from(schema.notifications)
      .where(eq(schema.notifications.userId, user.id!))
      .orderBy(desc(schema.notifications.createdAt))
      .limit(50);

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error('GET /api/notifications error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
