import { kv } from '@vercel/kv';

// Constants
const MAX_ENTRIES = 10;
const LEADERBOARD_KEY = 'leaderboard';

// Export a standard Vercel serverless function (no Next.js dependencies)
export default async function handler(request, response) {
  // Set CORS headers to allow requests from dinostroids.com
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight OPTIONS request
  if (request.method === 'OPTIONS') {
    response.status(200).end();
    return;
  }
  
  // GET request - retrieve leaderboard
  if (request.method === 'GET') {
    try {
      // Retrieve leaderboard entries as JSON array
      let entries = await kv.get(LEADERBOARD_KEY);
      
      // Initialize if not exists
      if (!entries) {
        entries = [];
      }
      
      // Sort by score (highest first)
      entries.sort((a, b) => b.score - a.score);
      
      // Return sorted entries
      return response.status(200).json(entries);
      
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      return response.status(500).json({ 
        error: 'Failed to retrieve leaderboard',
        message: error.message
      });
    }
  }
  
  // POST request - add new score
  if (request.method === 'POST') {
    try {
      // Parse body
      const { initials, score } = request.body;
      
      // Validate input
      if (!initials || typeof score !== 'number' || score < 0) {
        return response.status(400).json({ 
          error: 'Invalid input. Requires initials (string) and score (positive number).'
        });
      }
      
      // Sanitize initials - uppercase, max 3 chars, alphanumeric
      const sanitizedInitials = initials.toString().toUpperCase().substring(0, 3);
      
      // Get existing entries
      let entries = await kv.get(LEADERBOARD_KEY) || [];
      
      // Add new entry
      const newEntry = {
        initials: sanitizedInitials,
        score: score,
        createdAt: new Date().toISOString()
      };
      
      entries.push(newEntry);
      
      // Sort by score (highest first)
      entries.sort((a, b) => b.score - a.score);
      
      // Trim to max entries
      if (entries.length > MAX_ENTRIES) {
        entries = entries.slice(0, MAX_ENTRIES);
      }
      
      // Save back to KV
      await kv.set(LEADERBOARD_KEY, entries);
      
      return response.status(200).json({ 
        message: 'Score added to leaderboard',
        entry: newEntry
      });
      
    } catch (error) {
      console.error('Error adding to leaderboard:', error);
      return response.status(500).json({ 
        error: 'Failed to add score to leaderboard',
        message: error.message
      });
    }
  }
  
  // Method not allowed
  return response.status(405).json({ error: 'Method not allowed' });
} 