// api/gamesPlayed.js
import { kv } from '@vercel/kv';
// Remove Next.js specific import
// import { NextResponse } from 'next/server'; 

export const runtime = 'edge'; // Use Edge Runtime for speed

export async function GET(request) {
  const key = 'gamesPlayed';
  try {
    // Retrieve the count. KV stores numbers, so await directly.
    let count = await kv.get(key);

    // Initialize count if it doesn't exist in KV yet
    if (count === null || count === undefined) {
      console.log('Initializing gamesPlayed count in KV to 0.');
      count = 0;
      // Optionally set it explicitly, though INCR handles initialization too
      // await kv.set(key, 0);
    }

    // Ensure the count is treated as a number before returning
    // Use standard Response object
    return new Response(JSON.stringify({ count: Number(count) }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('KV Error getting gamesPlayed count:', error);
    // Return 0 in case of error so the frontend doesn't break, but log server-side
    // Use standard Response object for error
    return new Response(JSON.stringify({ count: 0, error: 'Failed to retrieve count' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }
}