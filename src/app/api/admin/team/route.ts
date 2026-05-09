import { NextResponse } from 'next/server';
import { requireRole, getTeam } from '@/lib/auth';

export async function GET() {
  try {
    await requireRole(['owner', 'admin_only']);
    const team = await getTeam();
    return NextResponse.json({ team });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'UNKNOWN';
    const status = msg === 'UNAUTHENTICATED' ? 401 : 403;
    return NextResponse.json({ error: msg }, { status });
  }
}
