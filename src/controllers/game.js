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
let levelSpeedMultiplier = 1.0; // Base speed multiplier that increases per level

/**
 * Draw the start screen
 */
function showStartScreen() {
    const { ctx } = getCanvas();
    
    console.log("Showing start screen");
    
    // Make sure game state is reset
    isGameStarted = false;
    isHelpScreenVisible = false;
    gameRunning = false;
    isGameOver = false;
    
    // Clean up any frame animation
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    
    // Clean up event handlers that might be left over
    document.removeEventListener('keydown', handleGameOverKeyInput);
    
    // Reset all input handlers
    cleanupInputHandlers();
    setupInputHandlers();
    
    // Clear the canvas
    clear('black');
    
    // Draw start screen with current difficulty and game data
    drawStartScreen(ctx, currentDifficulty, leaderboardData, gamesPlayedCount);
}

/**
 * End the current game and go back to the start screen
 */
function endGame() {
    console.log("Game ended by user (ESC key)");
    
    // Reset game state
    isGameStarted = false;
    isGameOver = true;
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
    showStartScreen();
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
        '• H: Hyperspace jump (random teleport)',
        '• ?: Toggle help screen',
        '• ESC: End game and return to menu',
        '',
        'OBJECTIVE:',
        '• Destroy all dinosaur asteroids',
        '• Avoid collisions',
        '• Score as many points as possible',
        '',
        'TIPS:',
        '• Use hyperspace to escape danger',
        '• You\'re invincible for 3 seconds after hyperspace'
    ];
    
    const startY = 150;
    const lineHeight = 30;
    
    instructions.forEach((line, index) => {
        ctx.fillText(line, canvas.width / 4, startY + (index * lineHeight));
    });
    
    // Back button
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Press ? to return', canvas.width / 2, canvas.height - 50);
}

/**
 * Initialize input handlers
 */
function setupInputHandlers() {
    // First, clear any existing handlers from previous instances
    cleanupInputHandlers();
    
    onStart(() => {
        console.log("Start key pressed");
        
        if (!isHelpScreenVisible && !isGameStarted) {
            // Start a new game if we're on the start screen
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
            updateDifficultySettings();
            showStartScreen();
        }
    });
}

/**
 * Clean up any existing input handlers to prevent duplicates
 */
function cleanupInputHandlers() {
    onStart(null);
    onHelp(null);
    onEscape(null);
    onDifficulty(null);
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
    
    // Apply settings based on current difficulty
    const difficultySettings = DIFFICULTY_SETTINGS[currentDifficulty];
    lives = difficultySettings.lives;
    level = 1;
    levelSpeedMultiplier = 1.0; // Reset speed multiplier for new game
    
    // Create player
    player = new Player();
    
    // Apply difficulty settings to player - with more reasonable acceleration values
    // Use a base value that's more manageable (50 instead of 200)
    player.acceleration = 50; // Base acceleration value
    if (currentDifficulty === 'medium') {
        player.acceleration = 75;  // 1.5x base for medium
    } else if (currentDifficulty === 'difficult') {
        player.acceleration = 100;  // 2.0x base for difficult
    }
    
    player.shootCooldown = difficultySettings.shootCooldown;
    
    // Log the actual acceleration value to verify
    console.log(`Player acceleration set to: ${player.acceleration}`);
    
    // Create initial asteroids
    createAsteroids(difficultySettings.initialAsteroids);
    
    // Clear bullets
    bullets = [];
    
    // Set start time for game duration tracking
    startTime = Date.now();
    currentTime = 0;
    
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
    
    console.log(`Creating ${count} asteroids with speed multiplier: ${levelSpeedMultiplier}`);
    
    for (let i = 0; i < count; i++) {
        // Random position along the edge of the screen
        let x, y;
        if (Math.random() < 0.5) {
            x = Math.random() < 0.5 ? 0 : width;
            y = Math.random() * height;
        } else {
            x = Math.random() * width;
            y = Math.random() < 0.5 ? 0 : height;
        }
        
        // Random asteroid type and size
        const type = Math.random() < 0.5 ? "detailed" : "simple";
        const size = Math.random() < 0.3 ? "small" : (Math.random() < 0.7 ? "medium" : "large");
        
        const asteroid = new Asteroid(
            type,
            size,
            x,
            y,
            currentDifficulty,
            levelSpeedMultiplier // Pass the level speed multiplier
        );
        
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
    
    // Cap deltaTime to prevent large jumps after pausing/lag
    const cappedDeltaTime = Math.min(deltaTime, 0.1);
    
    // Skip if game is paused or not running
    if (isPaused || !gameRunning) {
        animationFrameId = requestAnimationFrame(gameLoop);
        return;
    }
    
    // Update game time
    currentTime = Date.now() - startTime;
    
    // Clear the canvas
    clear('black');
    
    const { ctx, canvas } = getCanvas();
    
    // Update player
    if (player) {
        // Debug player state
        if (player.isDestroyed || player.exploding || player.isInHyperspace) {
            console.log(`Player state: destroyed=${player.isDestroyed}, exploding=${player.exploding}, hyperspace=${player.isInHyperspace}`);
        }
        
        const newBullet = player.update(cappedDeltaTime);
        
        // Add new bullet if player fired
        if (newBullet) {
            bullets.push(new Bullet(newBullet.x, newBullet.y, newBullet.rotation));
        }
        
        // Draw player (including explosion if active)
        player.draw(ctx);
    }
    
    // Update and draw bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        
        // Remove bullets that are no longer active
        if (!bullet.update(cappedDeltaTime)) {
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
        asteroid.update(cappedDeltaTime);
        asteroid.draw(ctx);
    });
    
    // Check for collisions between player and asteroids
    if (player && !player.isDestroyed && !player.exploding && !player.isInHyperspace && !player.invincible) {
        for (let i = asteroids.length - 1; i >= 0; i--) {
            const asteroid = asteroids[i];
            
            if (player.isCollidingWith(asteroid)) {
                // Player is hit
                console.log("Player hit by asteroid!");
                player.destroy();
                lives -= ASTEROID_SETTINGS.COLLISION_DAMAGE;
                
                if (lives <= 0) {
                    // Game over - wait for explosion animation to finish first
                    setTimeout(() => {
                        handleGameOver();
                    }, 2000);
                } else {
                    // Respawn player after a delay - wait for explosion animation (2 seconds)
                    setTimeout(() => {
                        player.reset();
                    }, 2000); // Changed from 1000 to 2000 to match explosion duration
                }
                
                break;
            }
        }
    }
    
    // Check if level is complete (all asteroids destroyed)
    if (asteroids.length === 0 && isGameStarted && !isGameOver) {
        // Move to next level
        level++;
        
        // Increase asteroid speed by 5% for the new level
        levelSpeedMultiplier *= 1.05;
        console.log(`Level ${level}: Speed multiplier increased to ${levelSpeedMultiplier.toFixed(2)}`);
        
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
    
    // Cancel the animation frame first to stop any ongoing game loop
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    
    // Calculate final game time (in milliseconds)
    const gameTime = currentTime;
    
    // Clean up entities
    if (player) {
        player = null;
    }
    asteroids = [];
    bullets = [];
    
    // First, clean up any existing input handlers
    document.removeEventListener('keydown', handleGameOverKeyInput);
    
    // Check if this is a high score before drawing the screen
    const isHighScore = isNewHighScore();
    
    // Draw game over screen with level and time information
    const { ctx } = getCanvas();
    drawGameOver(ctx, score, leaderboardData, level, gameTime);
    
    // Add keyboard handler for game over screen
    document.addEventListener('keydown', handleGameOverKeyInput);
    
    if (isHighScore) {
        console.log("New high score detected!");
        activateInput();
        
        // Set up the score submission handler
        onSubmitScore(async (initials) => {
            try {
                console.log(`Submitting high score with initials: ${initials}`);
                // Submit score with level and time information
                await submitScore(initials, score, gameTime, level, currentDifficulty);
                
                // Refresh leaderboard after submitting
                leaderboardData = await fetchLeaderboard();
                
                // Clean up game over input handlers
                document.removeEventListener('keydown', handleGameOverKeyInput);
                
                // Reset game state completely
                isGameOver = false;
                isGameStarted = false;
                gameRunning = false;
                
                // Clear any animation frames to prevent hanging
                if (animationFrameId) {
                    cancelAnimationFrame(animationFrameId);
                    animationFrameId = null;
                }
                
                // Show the start screen after submitting score
                showStartScreen();
            } catch (error) {
                console.error("Failed to submit score:", error);
                
                // Even if submission fails, go back to start screen
                document.removeEventListener('keydown', handleGameOverKeyInput);
                isGameOver = false;
                
                // Clear any animation frames to prevent hanging
                if (animationFrameId) {
                    cancelAnimationFrame(animationFrameId);
                    animationFrameId = null;
                }
                
                showStartScreen();
            }
        });
    } else {
        // Set up the restart handler to return to start screen (for non-high scores)
        onRestart(() => {
            console.log("Restarting game...");
            // Remove the game over keyboard handler to prevent duplicates
            document.removeEventListener('keydown', handleGameOverKeyInput);
            
            // Reset game over state
            isGameOver = false;
            isGameStarted = false;
            
            // Clear all key states
            cleanupInputHandlers();
            
            // Clear any animation frames to prevent hanging
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
            
            // Show the start screen
            showStartScreen();
        });
    }
}

/**
 * Check if the current score is a new high score
 * @returns {boolean} - Whether the score is a new high score
 */
function isNewHighScore() {
    if (!leaderboardData || leaderboardData.length === 0) return true;
    
    // If leaderboard has fewer than 20 entries, any score qualifies
    if (leaderboardData.length < 20) return true;
    
    // Check if score is higher than the lowest score
    const sortedLeaderboard = [...leaderboardData].sort((a, b) => b.score - a.score);
    return score > sortedLeaderboard[Math.min(19, sortedLeaderboard.length - 1)].score;
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
            drawGameOver(ctx, score, leaderboardData);
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
    
    // Draw current difficulty
    ctx.font = '24px Arial';
    ctx.fillText(`Difficulty: ${currentDifficulty.charAt(0).toUpperCase() + currentDifficulty.slice(1)}`, 20, 120);
}

/**
 * Draw the game over screen
 */
function drawGameOverScreen() {
    const { ctx } = getCanvas();
    
    // Draw title
    ctx.fillStyle = 'white';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', ctx.canvas.width / 2, 80);
    
    // Draw score and time
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Score: ${score}`, ctx.canvas.width / 2, 150);
    ctx.fillText(`Time: ${formatTime(currentTime)}`, ctx.canvas.width / 2, 190);
    ctx.fillText(`Difficulty: ${currentDifficulty.charAt(0).toUpperCase() + currentDifficulty.slice(1)}`, ctx.canvas.width / 2, 230);
    
    // Draw instructions to restart
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Press SPACE to play again', ctx.canvas.width / 2, ctx.canvas.height - 100);
    
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
 * Update the game HUD with difficulty information
 */
function updateHUD() {
    const { ctx } = getCanvas();
    
    // Draw game status with current settings
    drawGameStatus(ctx, score, lives, level, currentDifficulty);
} 