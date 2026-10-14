import { randomUUID } from 'node:crypto';

import prisma from '../../../lib/prisma.ts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    // This endpoint records homepage visits only. Ignore client-supplied URL
    // parameters, referrers and identity data rather than storing them.
    await prisma.visitor.create({ data: { id: randomUUID(), path: '/' } });
  } catch {
    // Analytics must not surface errors or log database details to the visitor.
  }
  return new Response(null, { status: 204, headers: { 'cache-control': 'no-store' } });
}

export async function GET() {
  try {
    const count = await prisma.visitor.count({ where: { path: '/' } });
    return Response.json({ count }, { headers: { 'cache-control': 'no-store' } });
  } catch {
    // Unavailable is distinct from zero visits; the client hides this state.
    return Response.json({ count: null }, { headers: { 'cache-control': 'no-store' } });
  }
}
