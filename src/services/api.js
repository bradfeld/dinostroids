/**
 * API Service
 * 
 * This service handles all API calls to the server.
 */

/**
 * Fetch the global games played count
 * @returns {Promise<number>} The count of games played
 */
export async function fetchGamesPlayed() {
    console.log("Fetching global games played count...");
    try {
        // Add a timeout to the fetch to prevent long hangs
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3-second timeout
        
        const response = await fetch('/api/gamesPlayed', {
            signal: controller.signal,
            cache: 'no-store' // Prevent caching issues
        });
        
        // Clear the timeout
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            console.warn(`API returned error status: ${response.status}`);
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        if (typeof data.count === 'number') {
            console.log(`Global games played count: ${data.count}`);
            return data.count;
        } else {
            console.warn('Received invalid count from API.');
            return 50; // Default fallback value
        }
    } catch (error) {
        // More detailed error logging
        if (error.name === 'AbortError') {
            console.error("API request timed out after 3 seconds");
        } else {
            console.error("Failed to fetch games played count:", error);
        }
        
        // Use 50 as the fallback value
        console.log("Using fallback games played count: 50");
        return 50;
    }
}

/**
 * Increment the games played count
 * @returns {Promise<boolean>} True if successful
 */
export async function incrementGamesPlayed() {
    try {
        // Add a timeout to prevent long fetch operations
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3-second timeout
        
        const response = await fetch('/api/incrementGamesPlayed', { 
            method: 'POST',
            signal: controller.signal,
            cache: 'no-store'
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            console.error(`Failed to increment games played count on server. Status: ${response.status}`);
            return false;
        }
        
        console.log('Successfully triggered server-side games played increment.');
        return true;
    } catch (error) {
        if (error.name === 'AbortError') {
            console.error("API request to increment games count timed out after 3 seconds");
        } else {
            console.error('Network error trying to increment games played count:', error);
        }
        return false;
    }
}

/**
 * Fetch the leaderboard data
 * @returns {Promise<Array>} The leaderboard entries
 */
export async function fetchLeaderboard() {
    console.log("Fetching leaderboard data...");
    
    try {
        // Add a timeout to the fetch to prevent long hangs
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5-second timeout
        
        const response = await fetch('/api/leaderboard', {
            signal: controller.signal,
            cache: 'no-store', // Prevent caching issues
            headers: {
                'Accept': 'application/json'
            }
        });
        
        // Clear the timeout
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            console.warn(`Leaderboard API returned error status: ${response.status}`);
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Leaderboard data received:", data.length ? `${data.length} entries` : "Empty array");
        
        // Debug the first entry if available
        if (data.length > 0) {
            console.log("First entry:", JSON.stringify(data[0]));
        }
        
        return data;
    } catch (error) {
        console.error("Failed to fetch leaderboard:", error);
        return []; // Return empty array on error
    } finally {
        console.log("Leaderboard fetch completed");
    }
}

/**
 * Submit a score to the leaderboard
 * @param {number} score - The player's score
 * @param {number} time - Time in milliseconds the game lasted
 * @param {string} difficulty - Difficulty level ('easy', 'medium', 'difficult')
 * @param {string} initials - Player initials (optional, 1-3 characters)
 * @returns {Promise<boolean>} True if submission was successful
 */
export async function submitScore(score, time, difficulty = 'medium', initials = '') {
    console.log(`Submitting score: ${score} points, ${time}ms, ${difficulty} difficulty`);
    try {
        const response = await fetch('/api/leaderboard', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                initials, 
                score, 
                time,
                difficulty 
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
            throw new Error(`Failed to submit score: ${response.status} ${errorData.message || ''}`);
        }

        const result = await response.json();
        console.log("Submission result:", result.message);
        return true; // Indicate success
    } catch (error) {
        console.error("Error submitting score:", error);
        return false; // Return false on error instead of re-throwing
    }
} 