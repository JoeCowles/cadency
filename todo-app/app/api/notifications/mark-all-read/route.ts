import { NextResponse } from 'next/server';
import { getUser, unauthorized } from '@/lib/api-auth';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST() {
  try {
    const user = await getUser();
    if (!user) return unauthorized();

    await db
      .update(schema.notifications)
      .set({ unread: false })
      .where(
        and(
          eq(schema.notifications.userId, user.id!),
          eq(schema.notifications.unread, true)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST /api/notifications/mark-all-read error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
