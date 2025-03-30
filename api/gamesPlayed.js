// api/gamesPlayed.js
import { kv } from '@vercel/kv';

// Export a standard Vercel serverless function (no Next.js dependencies)
export default async function handler(request, response) {
  // Set CORS headers to allow requests from dinostroids.com
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight OPTIONS request
  if (request.method === 'OPTIONS') {
    response.status(200).end();
    return;
  }
  
  // Only allow GET requests
  if (request.method !== 'GET') {
    response.status(405).json({ error: 'Method not allowed' });
    return;
  }
  
  const key = 'gamesPlayed';
  try {
    // Retrieve the count from KV
    let count = await kv.get(key);

    // Initialize count if it doesn't exist in KV yet
    if (count === null || count === undefined) {
      console.log('Initializing gamesPlayed count in KV to 50.');
      count = 50;
      // Set the initial value explicitly
      await kv.set(key, 50);
    }

    // Ensure the count is treated as a number before returning
    return response.status(200).json({ count: Number(count) });

  } catch (error) {
    console.error('KV Error getting gamesPlayed count:', error);
    // Return 50 in case of error so the frontend doesn't break, but log server-side
    return response.status(500).json({ 
      count: 50, 
      error: 'Internal Server Error: Failed to retrieve count',
      message: error.message 
    });
  }
}