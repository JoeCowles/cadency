import { NextRequest, NextResponse } from 'next/server';
import { getUser, unauthorized } from '@/lib/api-auth';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { encrypt, decrypt } from '@/lib/crypto';

// GET - check if an API key is configured (never returns the actual key)
export async function GET() {
  try {
    const user = await getUser();
    if (!user) return unauthorized();

    const profile = await db.query.users.findFirst({
      where: eq(schema.users.id, user.id!),
    });

    const prefs = (profile?.preferences ?? {}) as Record<string, unknown>;
    const hasKey = !!prefs.encryptedApiKey;
    // Return a masked hint if key exists
    let hint = '';
    if (hasKey) {
      try {
        const key = decrypt(prefs.encryptedApiKey as string);
        hint = key.slice(0, 7) + '...' + key.slice(-4);
      } catch {
        hint = 'sk-ant-...';
      }
    }

    return NextResponse.json({ hasKey, hint });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - save or update the API key (encrypted)
export async function PUT(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) return unauthorized();

    const { apiKey } = await request.json();
    if (!apiKey || typeof apiKey !== 'string' || !apiKey.startsWith('sk-')) {
      return NextResponse.json({ error: 'Invalid API key format' }, { status: 400 });
    }

    const profile = await db.query.users.findFirst({
      where: eq(schema.users.id, user.id!),
    });

    const prefs = (profile?.preferences ?? {}) as Record<string, unknown>;
    const encrypted = encrypt(apiKey);

    await db
      .update(schema.users)
      .set({
        preferences: { ...prefs, encryptedApiKey: encrypted },
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, user.id!));

    const hint = apiKey.slice(0, 7) + '...' + apiKey.slice(-4);
    return NextResponse.json({ success: true, hint });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - remove the API key
export async function DELETE() {
  try {
    const user = await getUser();
    if (!user) return unauthorized();

    const profile = await db.query.users.findFirst({
      where: eq(schema.users.id, user.id!),
    });

    const prefs = (profile?.preferences ?? {}) as Record<string, unknown>;
    delete prefs.encryptedApiKey;

    await db
      .update(schema.users)
      .set({
        preferences: prefs,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, user.id!));

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
