// api/gamesPlayed.js
import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server'; // Using Next.js structure

export const runtime = 'edge'; // Use Edge Runtime for speed

export async function GET(request) {
  const key = 'gamesPlayed';
  console.log(`[GamesPlayed API] Getting games played count using key: "${key}"`);
  
  try {
    // Retrieve the count. KV stores numbers, so await directly.
    let count = await kv.get(key);
    console.log(`[GamesPlayed API] Raw value from KV: ${count}`);

    // Initialize count if it doesn't exist in KV yet
    if (count === null || count === undefined) {
      console.log('[GamesPlayed API] Initializing gamesPlayed count in KV to 0.');
      count = 0;
      // Optionally set it explicitly, though INCR handles initialization too
      // await kv.set(key, 0);
    }

    // Ensure the count is treated as a number before returning
    console.log(`[GamesPlayed API] Returning count: ${Number(count)}`);
    return NextResponse.json({ count: Number(count) });

  } catch (error) {
    console.error('[GamesPlayed API] KV Error getting gamesPlayed count:', error);
    // Return 0 in case of error so the frontend doesn't break, but log server-side
    return NextResponse.json({ count: 0 }, { status: 500, statusText: 'Internal Server Error: Failed to retrieve count' });
  }
}