/**
 * Game Controller
 * 
 * This controller manages the game state, initialization,
 * and the main game loop.
 */

import { initCanvas, resizeToWindow, getCanvas, clear, getDimensions } from '../canvas.js';
import { fetchGamesPlayed, fetchLeaderboard, submitScore, incrementGamesPlayed } from '../services/api.js';
import { preloadImages } from '../services/images.js';
import { initInput, onStart, onHelp, isKeyPressed, onEscape } from './input.js';
import { GAME_SETTINGS, PLAYER_SETTINGS, ASTEROID_SETTINGS } from '../constants.js';
import Player from '../entities/player.js';
import Asteroid from '../entities/asteroid.js';
import Bullet from '../entities/bullet.js';
import { drawGameStatus } from '../ui/gameStatus.js';
import { drawGameOver, handleGameOverKeyInput, activateInput, onSubmitScore, onRestart } from '../ui/gameOver.js';
import { drawLeaderboard } from '../ui/leaderboard.js';

// Game state variables
let gameRunning = false;
let isGameStarted = false;
let isGameOver = false;
let isHelpScreenVisible = false;
let isPaused = false;
let lastFrameTime = 0;
let score = 0;
let lives = GAME_SETTINGS.INITIAL_LIVES;
let level = 1;
let gamesPlayedCount = 0;
let leaderboardData = [];

// Game entities
let player = null;
let asteroids = [];
let bullets = [];

// Animation frame ID for cancellation
let animationFrameId = null;

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
    
    // Copyright text
    ctx.font = '14px Arial';
    ctx.fillText('© Intensity Ventures, 2025', canvas.width / 2, canvas.height - 20);
    
    // Draw leaderboard if data is available
    if (leaderboardData && leaderboardData.length > 0) {
        drawLeaderboard(ctx, leaderboardData, canvas.width - 200, 50);
    }
}

/**
 * End the current game and go back to the start screen
 */
function endGame() {
    console.log("Game ended by user (ESC key)");
    
    // Reset game state
    isGameStarted = false;
    isGameOver = false;
    gameRunning = false;
    
    // Cancel the animation frame
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    
    // Clear entities
    player = null;
    asteroids = [];
    bullets = [];
    
    // Show the start screen
    drawStartScreen();
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
        '• ESC: End game and return to menu',
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
 * Start a new game
 */
function startGame() {
    if (isHelpScreenVisible || isGameStarted || isGameOver) return;
    
    console.log("Starting game...");
    isGameStarted = true;
    isGameOver = false;
    gameRunning = true;
    
    // Reset game state
    score = 0;
    lives = GAME_SETTINGS.INITIAL_LIVES;
    level = 1;
    
    // Create player
    player = new Player();
    
    // Create initial asteroids
    createAsteroids(GAME_SETTINGS.INITIAL_ASTEROIDS);
    
    // Clear bullets
    bullets = [];
    
    // Track games played on the server
    incrementGamesPlayed().catch(err => console.error('Failed to increment games played:', err));
    
    // Start the game loop
    lastFrameTime = performance.now();
    animationFrameId = requestAnimationFrame(gameLoop);
}

/**
 * Create a set of asteroids for the current level
 * @param {number} count - Number of asteroids to create
 */
function createAsteroids(count) {
    const { width, height } = getDimensions();
    asteroids = [];
    
    for (let i = 0; i < count; i++) {
        // Create asteroid at a safe distance from the player
        let x, y, distanceFromPlayer;
        
        do {
            x = Math.random() * width;
            y = Math.random() * height;
            
            // Calculate distance from player
            const dx = player ? player.x - x : width / 2 - x;
            const dy = player ? player.y - y : height / 2 - y;
            distanceFromPlayer = Math.sqrt(dx * dx + dy * dy);
        } while (distanceFromPlayer < ASTEROID_SETTINGS.SPAWN_DISTANCE_MIN);
        
        // Create a random asteroid
        const asteroid = new Asteroid(null, 1, x, y);
        asteroids.push(asteroid);
    }
}

/**
 * Main game loop
 * @param {number} timestamp - Current timestamp from requestAnimationFrame
 */
function gameLoop(timestamp) {
    // Calculate delta time in seconds
    const deltaTime = (timestamp - lastFrameTime) / 1000;
    lastFrameTime = timestamp;
    
    // Skip if game is paused or not running
    if (isPaused || !gameRunning) {
        animationFrameId = requestAnimationFrame(gameLoop);
        return;
    }
    
    // Clear the canvas
    clear('black');
    
    const { ctx, canvas } = getCanvas();
    
    // Update player
    if (player) {
        const newBullet = player.update(deltaTime);
        
        // Add new bullet if player fired
        if (newBullet) {
            bullets.push(new Bullet(newBullet.x, newBullet.y, newBullet.rotation));
        }
        
        // Draw player
        player.draw(ctx);
    }
    
    // Update and draw bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        
        // Remove bullets that are no longer active
        if (!bullet.update(deltaTime)) {
            bullets.splice(i, 1);
            continue;
        }
        
        // Draw the bullet
        bullet.draw(ctx);
        
        // Check for collisions with asteroids
        for (let j = asteroids.length - 1; j >= 0; j--) {
            const asteroid = asteroids[j];
            
            if (bullet.isCollidingWith(asteroid)) {
                // Remove bullet
                bullet.deactivate();
                bullets.splice(i, 1);
                
                // Break asteroid and add score
                const newAsteroids = asteroid.break();
                score += ASTEROID_SETTINGS.SCORE_VALUES[asteroid.size] || 100;
                
                // Add new smaller asteroids
                asteroids.push(...newAsteroids);
                
                // Remove the hit asteroid
                asteroids.splice(j, 1);
                
                // Break out of the inner loop since bullet is now gone
                break;
            }
        }
    }
    
    // Update and draw asteroids
    asteroids.forEach(asteroid => {
        asteroid.update(deltaTime);
        asteroid.draw(ctx);
    });
    
    // Check for collisions between player and asteroids
    if (player && !player.isDestroyed) {
        for (let i = asteroids.length - 1; i >= 0; i--) {
            const asteroid = asteroids[i];
            
            if (player.isCollidingWith(asteroid)) {
                // Player is hit
                player.destroy();
                lives -= ASTEROID_SETTINGS.COLLISION_DAMAGE;
                
                if (lives <= 0) {
                    // Game over
                    handleGameOver();
                } else {
                    // Respawn player after a delay
                    setTimeout(() => {
                        player.reset();
                    }, 1000);
                }
                
                break;
            }
        }
    }
    
    // Check if level is complete (all asteroids destroyed)
    if (asteroids.length === 0 && isGameStarted && !isGameOver) {
        // Move to next level
        level++;
        
        // Calculate new asteroid count based on level
        const newAsteroidCount = Math.min(
            GAME_SETTINGS.INITIAL_ASTEROIDS + (level - 1) * GAME_SETTINGS.ASTEROID_INCREMENT_PER_LEVEL,
            20 // Cap at 20 asteroids
        );
        
        // Create new asteroids
        createAsteroids(newAsteroidCount);
    }
    
    // Draw game status
    drawGameStatus(ctx, score, lives, level);
    
    // Continue the game loop
    animationFrameId = requestAnimationFrame(gameLoop);
}

/**
 * Handle game over state
 */
function handleGameOver() {
    console.log("Game over!");
    isGameOver = true;
    gameRunning = false;
    
    // Cancel the animation frame
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    
    // Draw game over screen
    const { ctx } = getCanvas();
    drawGameOver(ctx, score, leaderboardData);
    
    // Check if this is a high score
    const isHighScore = isNewHighScore();
    if (isHighScore) {
        activateInput();
        
        // Set up the score submission handler
        onSubmitScore(async (initials) => {
            try {
                await submitScore(initials, score);
                
                // Refresh leaderboard after submitting
                leaderboardData = await fetchLeaderboard();
                
                // Draw updated game over screen
                drawGameOver(ctx, score, leaderboardData);
            } catch (error) {
                console.error("Failed to submit score:", error);
            }
        });
    }
    
    // Set up the restart handler
    onRestart(() => {
        startGame();
    });
    
    // Add keyboard handler for game over screen
    document.addEventListener('keydown', handleGameOverKeyInput);
}

/**
 * Check if the current score is a new high score
 * @returns {boolean} - Whether the score is a new high score
 */
function isNewHighScore() {
    if (!leaderboardData || leaderboardData.length === 0) return true;
    
    // If leaderboard has fewer than 10 entries, any score qualifies
    if (leaderboardData.length < 10) return true;
    
    // Check if score is higher than the lowest score
    const sortedLeaderboard = [...leaderboardData].sort((a, b) => b.score - a.score);
    return score > sortedLeaderboard[Math.min(9, sortedLeaderboard.length - 1)].score;
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
        } else if (isGameOver) {
            const { ctx } = getCanvas();
            drawGameOver(ctx, score, leaderboardData);
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
    
    // Register escape key to end the game
    onEscape(() => {
        // Only end the game if we're actually playing
        if (isGameStarted && !isGameOver) {
            endGame();
        }
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
        isGameOver,
        isHelpScreenVisible,
        score,
        lives,
        level,
        gamesPlayedCount,
        leaderboardData
    };
} 