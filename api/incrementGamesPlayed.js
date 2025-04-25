// api/incrementGamesPlayed.js
import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server'; // Using Next.js structure

export const runtime = 'edge'; // Use Edge Runtime for speed

// This function will handle POST requests to /api/incrementGamesPlayed
export async function POST(request) {
  const key = 'gamesPlayed'; // The key we use in Vercel KV
  try {
    // Log the current value before incrementing for debugging
    const currentValue = await kv.get(key);
    console.log(`[IncrementGamesPlayed API] Current value before incrementing: ${currentValue}`);
    
    // Atomically increment the counter in KV.
    // kv.incr initializes the key to 0 if it doesn't exist, then increments.
    const newCount = await kv.incr(key);
    console.log(`[IncrementGamesPlayed API] Incremented count from ${currentValue} to ${newCount}`);

    // We don't strictly need to return the new count, but it's good practice/useful
    return NextResponse.json({ 
      message: 'Counter incremented successfully', 
      previousCount: currentValue,
      newCount: newCount 
    }, { status: 200 });

  } catch (error) {
    console.error('KV Error incrementing gamesPlayed count:', error);
    // Return an error response if KV fails
    return NextResponse.json({ message: 'Error incrementing counter' }, { status: 500, statusText: 'Internal Server Error' });
  }
}