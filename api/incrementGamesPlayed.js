// api/incrementGamesPlayed.js
import { kv } from '@vercel/kv';
// Remove Next.js specific import
// import { NextResponse } from 'next/server';

export const runtime = 'edge'; // Use Edge Runtime for speed

// This function will handle POST requests to /api/incrementGamesPlayed
export async function POST(request) {
  const key = 'gamesPlayed'; // The key we use in Vercel KV
  try {
    // Atomically increment the counter in KV.
    // kv.incr initializes the key to 0 if it doesn't exist, then increments.
    const newCount = await kv.incr(key);

    // Use standard Response object
    return new Response(JSON.stringify({ message: 'Counter incremented successfully', newCount: newCount }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('KV Error incrementing gamesPlayed count:', error);
    // Use standard Response object for error
    return new Response(JSON.stringify({ message: 'Error incrementing counter' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }
}