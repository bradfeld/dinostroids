/**
 * Game Controller
 * 
 * This controller manages the game state, initialization,
 * and the main game loop.
 */

import { initCanvas, resizeToWindow, getCanvas, clear, getDimensions } from '../canvas.js';
import { fetchGamesPlayed, fetchLeaderboard, submitScore, incrementGamesPlayed } from '../services/api.js';
import { preloadImages } from '../services/images.js';
import { initInput, onStart, onHelp, isKeyPressed, onEscape, onDifficulty } from './input.js';
import { GAME_SETTINGS, PLAYER_SETTINGS, ASTEROID_SETTINGS, DIFFICULTY_SETTINGS } from '../constants.js';
import Player from '../entities/player.js';
import Asteroid from '../entities/asteroid.js';
import Bullet from '../entities/bullet.js';
import { drawGameStatus } from '../ui/gameStatus.js';
import { drawGameOver, handleGameOverKeyInput, activateInput, onSubmitScore, onRestart } from '../ui/gameOver.js';
import { drawLeaderboard } from '../ui/leaderboard.js';
import { formatTime, randomInt } from '../utils.js';
import { drawStartScreen } from '../ui/startScreen.js';

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
let currentTime = 0;
let startTime = 0;
let gameLoopId = null;
let currentDifficulty = 'medium'; // Default difficulty

// Game entities
let player = null;
let asteroids = [];
let bullets = [];

// Animation frame ID for cancellation
let animationFrameId = null;

// Game settings
let playerAcceleration;
let shootCooldown;
let asteroidSpeed;
let initialAsteroids;
let playerLives;

/**
 * Draw the start screen
 */
function showStartScreen() {
    const { ctx } = getCanvas();
    
    // Clear the canvas
    clear('black');
    
    // Draw start screen with current difficulty and game data
    drawStartScreen(ctx, currentDifficulty, leaderboardData, gamesPlayedCount);
}

/**
 * End the current game and go to the game over screen
 */
function endGame() {
    console.log("Game ended by user (ESC key)");
    
    // Set game over state but don't reset everything yet
    // We need to preserve the score, level, and other data for the game over screen
    isGameStarted = false;
    isGameOver = true;
    gameRunning = false;
    
    // Cancel the animation frame
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    
    // Instead of going to start screen, call handleGameOver to properly show score
    // and check for high score entry
    handleGameOver();
}

/**
 * Draw the help screen
 */
function drawHelpScreen() {
    const { ctx, width, height } = getCanvas();
    
    // Draw semi-transparent background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, width, height);
    
    // Draw title
    ctx.fillStyle = 'white';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('HOW TO PLAY', width / 2, 80);
    
    // Draw instructions
    const instructions = [
        '',
        'CONTROLS:',
        '• Arrow Keys: Move ship',
        '• Space: Fire',
        '• ?: Toggle help screen',
        '• ESC: End game and return to menu',
        '',
        'OBJECTIVE:',
        '• Destroy all dinosaur asteroids',
        '• Avoid collisions',
        '• Score as many points as possible',
        '',
        'DIFFICULTY:',
        '• Press E: Easy mode',
        '• Press M: Medium mode',
        '• Press D: Difficult mode',
        '',
        'START GAME:',
        '• Press RETURN to begin'
    ];
    
    // Draw each instruction line
    ctx.font = '18px Arial';
    ctx.textAlign = 'left';
    
    const startY = 130;
    const lineHeight = 24;
    
    instructions.forEach((line, index) => {
        ctx.fillText(line, width / 2 - 180, startY + index * lineHeight);
    });
    
    // Draw back button
    ctx.textAlign = 'center';
    ctx.font = '20px Arial';
    ctx.fillText('Press ? to return', width / 2, height - 50);
}

/**
 * Initialize input handlers
 */
function setupInputHandlers() {
    onStart(() => {
        if (!isHelpScreenVisible && !isGameStarted && !isGameOver) {
            startGame();
        } else if (isGameOver) {
            // Reset game state for new game
            isGameOver = false;
            startGame();
        }
    });
    
    onHelp(toggleHelpScreen);
    
    onEscape(() => {
        // Only end the game if we're actually playing
        if (isGameStarted && !isGameOver) {
            endGame();
        }
    });
    
    onDifficulty((difficulty) => {
        if (!isGameStarted || isGameOver) {
            currentDifficulty = difficulty;
            showStartScreen();
        }
    });
}

/**
 * Start a new game with current difficulty settings
 */
function startGame() {
    if (isHelpScreenVisible || isGameStarted || isGameOver) return;
    
    console.log(`Starting game with ${currentDifficulty} difficulty...`);
    isGameStarted = true;
    isGameOver = false;
    gameRunning = true;
    
    // Reset game state
    score = 0;
    currentTime = 0; // Reset game time
    
    // Apply settings based on current difficulty
    const difficultySettings = DIFFICULTY_SETTINGS[currentDifficulty];
    lives = difficultySettings.lives;
    level = 1;
    
    // Create player with appropriate difficulty settings
    player = new Player(currentDifficulty);
    
    // Create initial asteroids
    createAsteroids(difficultySettings.initialAsteroids);
    
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
        
        // Create a random asteroid with the current difficulty
        const asteroid = new Asteroid(null, 1, x, y, currentDifficulty);
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
    
    // Update total game time
    currentTime += deltaTime * 1000; // Convert to milliseconds
    
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
    drawGameStatus(ctx, score, lives, level, currentDifficulty);
    
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
    
    // Calculate game time (in milliseconds)
    const gameTime = currentTime;
    
    // Cancel the animation frame
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    
    // Clean up entities (important when ESC is pressed)
    if (player) {
        player = null;
    }
    asteroids = [];
    bullets = [];
    
    // Draw game over screen with level and time information
    const { ctx } = getCanvas();
    drawGameOver(ctx, score, leaderboardData, level, gameTime);
    
    // Check if this is a high score
    const isHighScore = isNewHighScore();
    if (isHighScore) {
        activateInput();
        
        // Set up the score submission handler
        onSubmitScore(async (initials) => {
            try {
                // Submit score with level and time information
                await submitScore(initials, score, gameTime, level, currentDifficulty);
                
                // Refresh leaderboard after submitting
                leaderboardData = await fetchLeaderboard();
                
                // Draw updated game over screen with level and time
                drawGameOver(ctx, score, leaderboardData, level, gameTime);
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
    
    // If leaderboard has fewer than 20 entries, any score qualifies
    if (leaderboardData.length < 20) return true;
    
    // Check if score is higher than the lowest score in the top 20
    const sortedLeaderboard = [...leaderboardData].sort((a, b) => b.score - a.score);
    return score > sortedLeaderboard[19].score;
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
        showStartScreen();
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
                showStartScreen();
            }
        } else if (isGameOver) {
            const { ctx } = getCanvas();
            drawGameOver(ctx, score, leaderboardData, level, currentTime);
        }
    });
    
    // Initialize input handling
    initInput();
    
    // Set up input callbacks
    setupInputHandlers();
    
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
            showStartScreen();
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

/**
 * Update the game settings based on the current difficulty
 */
function updateDifficultySettings() {
    const settings = DIFFICULTY_SETTINGS[currentDifficulty];
    playerAcceleration = settings.playerAcceleration;
    shootCooldown = settings.shootCooldown;
    asteroidSpeed = settings.asteroidSpeed;
    initialAsteroids = settings.initialAsteroids;
    playerLives = settings.lives;
}

/**
 * Change the difficulty level
 * @param {string} difficulty - The difficulty level to set ('easy', 'medium', 'difficult')
 */
function changeDifficulty(difficulty) {
    if (!isGameStarted || isGameOver) {
        currentDifficulty = difficulty;
        updateDifficultySettings();
        // Force redraw of the start screen to show updated difficulty
        if (!isHelpScreenVisible) {
            showStartScreen();
        }
    }
}

/**
 * Draw the heads-up display (HUD)
 */
function drawHUD() {
    // Draw score
    const { ctx } = getCanvas();
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 20, 30);
    
    // Draw time
    const formattedTime = formatTime(currentTime);
    ctx.fillText(`Time: ${formattedTime}`, 20, 60);
    
    // Draw lives
    ctx.font = '24px Arial';
    ctx.fillText(`Lives: ${lives}`, 20, 90);
    
    // Difficulty is no longer displayed during active gameplay
}

/**
 * Draw the game over screen
 */
function drawGameOverScreen() {
    const { ctx } = getCanvas();
    
    // Format time for display
    const formattedTime = formatTime(currentTime);
    
    // Draw title
    ctx.fillStyle = 'white';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', ctx.canvas.width / 2, 80);
    
    // Draw score, level, time and difficulty
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Score: ${score}`, ctx.canvas.width / 2, 150);
    ctx.fillText(`Level: ${level}`, ctx.canvas.width / 2, 190);
    ctx.fillText(`Time: ${formattedTime}`, ctx.canvas.width / 2, 230);
    ctx.fillText(`Difficulty: ${currentDifficulty.charAt(0).toUpperCase() + currentDifficulty.slice(1)}`, ctx.canvas.width / 2, 270);
    
    // Draw instructions to restart
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Press RETURN to play again', ctx.canvas.width / 2, ctx.canvas.height - 100);
    
    // Draw leaderboard
    drawLeaderboard(ctx.canvas.width / 2, ctx.canvas.height - 80);
}

/**
 * Clean up game resources
 */
export function cleanupGame() {
    if (gameLoopId) {
        cancelAnimationFrame(gameLoopId);
    }
}

/**
 * Custom asteroid speed based on current difficulty
 * @param {string} size - The asteroid size ('large', 'medium', 'small')
 * @returns {number} - The random speed for this asteroid
 */
function getAsteroidSpeed(size) {
    const speedRange = DIFFICULTY_SETTINGS[currentDifficulty].asteroidSpeed[size];
    return speedRange.min + Math.random() * (speedRange.max - speedRange.min);
}

/**
 * Update the game HUD with current information
 */
function updateHUD() {
    const { ctx } = getCanvas();
    
    // Draw game status with current settings (difficulty is passed but not displayed)
    drawGameStatus(ctx, score, lives, level, currentDifficulty);
} 