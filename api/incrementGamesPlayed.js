// api/incrementGamesPlayed.js
import { kv } from '@vercel/kv';

// Export a standard Vercel serverless function (no Next.js dependencies)
export default async function handler(request, response) {
  // Set CORS headers to allow requests from dinostroids.com
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'POST');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight OPTIONS request
  if (request.method === 'OPTIONS') {
    response.status(200).end();
    return;
  }
  
  // Only allow POST requests
  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Method not allowed' });
    return;
  }
  
  const key = 'gamesPlayed'; // The key we use in Vercel KV
  try {
    // Atomically increment the counter in KV.
    // kv.incr initializes the key to 0 if it doesn't exist, then increments.
    const newCount = await kv.incr(key);

    // We don't strictly need to return the new count, but it's good practice/useful
    return response.status(200).json({ message: 'Counter incremented successfully', newCount: newCount });

  } catch (error) {
    console.error('KV Error incrementing gamesPlayed count:', error);
    // Return an error response if KV fails
    return response.status(500).json({ 
      message: 'Error incrementing counter',
      error: error.message
    });
  }
}