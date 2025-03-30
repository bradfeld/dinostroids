/**
 * Game Controller
 * 
 * This controller manages the game state, initialization,
 * and the main game loop.
 */

import { initCanvas, resizeToWindow, getCanvas, clear } from '../canvas.js';
import { fetchGamesPlayed, fetchLeaderboard } from '../services/api.js';
import { preloadImages } from '../services/images.js';
import { initInput, onStart, onHelp } from './input.js';

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
 * Draw the start screen
 */
function drawStartScreen() {
    const { canvas, ctx } = getCanvas();
    
    // Clear the canvas with a dark background
    clear('black');
    
    // Title
    ctx.fillStyle = 'white';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('DINOSTROIDS', canvas.width / 2, canvas.height / 3);
    
    // Instructions
    ctx.font = '24px Arial';
    ctx.fillText('Press SPACE to start', canvas.width / 2, canvas.height / 2);
    ctx.fillText('Press H for help', canvas.width / 2, canvas.height / 2 + 40);
    
    // Games played info
    if (gamesPlayedCount > 0) {
        ctx.font = '16px Arial';
        ctx.fillText(`Games Played: ${gamesPlayedCount}`, canvas.width / 2, canvas.height - 50);
    }
}

/**
 * Draw the help screen
 */
function drawHelpScreen() {
    const { canvas, ctx } = getCanvas();
    
    // Clear the canvas
    clear('black');
    
    // Title
    ctx.fillStyle = 'white';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('HOW TO PLAY', canvas.width / 2, 100);
    
    // Instructions
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    const instructions = [
        'CONTROLS:',
        '• Arrow Keys: Move ship',
        '• Space: Fire',
        '• H: Toggle help screen',
        '',
        'OBJECTIVE:',
        '• Destroy all dinosaur asteroids',
        '• Avoid collisions',
        '• Score as many points as possible'
    ];
    
    const startY = 150;
    const lineHeight = 30;
    
    instructions.forEach((line, index) => {
        ctx.fillText(line, canvas.width / 4, startY + (index * lineHeight));
    });
    
    // Back button
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Press H to return', canvas.width / 2, canvas.height - 50);
}

/**
 * Start the game
 */
function startGame() {
    if (isHelpScreenVisible || isGameStarted) return;
    
    console.log("Starting game...");
    isGameStarted = true;
    gameRunning = true;
    
    // In the full implementation, we would initialize game entities and start the game loop here
    // For now, just show a placeholder
    const { canvas, ctx } = getCanvas();
    clear('black');
    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Game started! (Game implementation coming soon)', canvas.width / 2, canvas.height / 2);
}

/**
 * Toggle the help screen
 */
function toggleHelpScreen() {
    if (isGameStarted) return;
    
    isHelpScreenVisible = !isHelpScreenVisible;
    
    if (isHelpScreenVisible) {
        drawHelpScreen();
    } else {
        drawStartScreen();
    }
}

/**
 * Initialize the game
 */
export function initGame() {
    console.log("Initializing game...");
    
    // Initialize canvas
    const { canvas } = initCanvas();
    
    // Set up window resize handler
    window.addEventListener('resize', () => {
        resizeToWindow();
        // Redraw the current screen when window is resized
        if (!isGameStarted) {
            if (isHelpScreenVisible) {
                drawHelpScreen();
            } else {
                drawStartScreen();
            }
        }
    });
    
    // Initialize input handling
    initInput();
    
    // Set up input callbacks
    onStart(() => {
        if (!isGameStarted && !isHelpScreenVisible) {
            startGame();
        }
    });
    
    onHelp(() => {
        toggleHelpScreen();
    });
    
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
            drawStartScreen();
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