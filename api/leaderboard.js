import { kv } from '@vercel/kv';

const LEADERBOARD_KEY = 'dinostroids_leaderboard';
const MAX_ENTRIES = 20;

export default async function handler(request, response) {
    try {
        if (request.method === 'GET') {
            // Fetch leaderboard
            let leaderboard = await kv.get(LEADERBOARD_KEY);
            leaderboard = leaderboard || []; // Initialize if null
            // Ensure it's sorted (though POST should maintain order)
            leaderboard.sort((a, b) => b.score - a.score);
            return response.status(200).json(leaderboard);
        }
        else if (request.method === 'POST') {
            // Add score to leaderboard
            const { initials, score } = request.body;

            if (!initials || typeof initials !== 'string' || initials.length > 3 || initials.length === 0 || typeof score !== 'number') {
                return response.status(400).json({ message: 'Invalid input: initials (string, 1-3 chars) and score (number) required.' });
            }

            const newEntry = {
                initials: initials.toUpperCase(),
                score: score,
                createdAt: new Date().toISOString() // Store as ISO string
            };

            let leaderboard = await kv.get(LEADERBOARD_KEY);
            leaderboard = leaderboard || [];

            // Add new score and sort
            leaderboard.push(newEntry);
            leaderboard.sort((a, b) => b.score - a.score);

            // Keep only top MAX_ENTRIES
            const updatedLeaderboard = leaderboard.slice(0, MAX_ENTRIES);

            // Save back to KV
            await kv.set(LEADERBOARD_KEY, updatedLeaderboard);

            return response.status(200).json({ message: 'Score submitted successfully.' });

        } else {
            // Handle unsupported methods
            response.setHeader('Allow', ['GET', 'POST']);
            return response.status(405).end(`Method ${request.method} Not Allowed`);
        }
    } catch (error) {
        console.error("Leaderboard API Error:", error);
        return response.status(500).json({ message: 'Internal Server Error' });
    }
} 