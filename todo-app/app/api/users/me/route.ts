import { NextResponse, NextRequest } from 'next/server';
import { getUser, unauthorized } from '@/lib/api-auth';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const user = await getUser();
    if (!user) return unauthorized();

    const profile = await db.query.users.findFirst({
      where: eq(schema.users.id, user.id!),
    });

    if (!profile) {
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({ user, profile }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) return unauthorized();

    const body = await request.json();
    const { name, preferences } = body;

    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (preferences !== undefined) updates.preferences = preferences;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    updates.updatedAt = new Date();

    const [profile] = await db
      .update(schema.users)
      .set(updates)
      .where(eq(schema.users.id, user.id!))
      .returning();

    return NextResponse.json({ profile }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
