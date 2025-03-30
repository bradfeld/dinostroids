/**
 * Game Controller
 * 
 * This controller manages the game state, initialization,
 * and the main game loop.
 */

import { initCanvas, resizeToWindow } from '../canvas.js';
import { fetchGamesPlayed, fetchLeaderboard } from '../services/api.js';
import { preloadImages } from '../services/images.js';

// Game state variables
let gameRunning = false;
let isGameStarted = false;
let isHelpScreenVisible = false;
let score = 0;
let lives = 3;
let level = 1;
let gamesPlayedCount = 0;
let leaderboardData = [];

/**
 * Initialize the game
 */
export function initGame() {
    console.log("Initializing game...");
    
    // Initialize canvas
    const { canvas } = initCanvas();
    
    // Set up window resize handler
    window.addEventListener('resize', resizeToWindow);
    
    // Preload images before starting game
    preloadImages(() => {
        console.log("Images loaded, proceeding with game initialization...");
        
        // Load game data in parallel
        Promise.allSettled([
            // Fetch games played count
            (async () => {
                try {
                    gamesPlayedCount = await fetchGamesPlayed();
                } catch (err) {
                    console.error("Failed to fetch games played:", err);
                }
            })(),
            
            // Fetch leaderboard data
            (async () => {
                try {
                    leaderboardData = await fetchLeaderboard();
                } catch (err) {
                    console.error("Failed to fetch leaderboard:", err);
                }
            })()
        ]).then(() => {
            console.log("Game data loaded, showing start screen");
            // In a real implementation, we would display the start screen here
        });
    });
}

/**
 * Get the current game state
 * @returns {Object} - The current game state
 */
export function getGameState() {
    return {
        gameRunning,
        isGameStarted,
        isHelpScreenVisible,
        score,
        lives,
        level,
        gamesPlayedCount,
        leaderboardData
    };
} 