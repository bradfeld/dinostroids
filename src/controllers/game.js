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
import { drawGameOver, handleGameOverKeyInput, activateInput, onRestart, setRedrawCallback } from '../ui/gameOver.js';
import { drawLeaderboard } from '../ui/leaderboard.js';
import { formatTime, randomInt } from '../utils.js';
import { drawStartScreen } from '../ui/startScreen.js';
import { MobileControls } from '../ui/mobileControls.js';
import { isMobilePhone } from '../utils/device.js';

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
let lastExtraLifeScore = 0; // Track when the last extra life was awarded

// Visual effect for extra life
let extraLifeAnimation = {
    active: false,
    text: "+1 SHIP",
    x: 0,
    y: 0,
    alpha: 0,
    duration: 2000, // 2 seconds
    startTime: 0
};

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

export class GameController {
    constructor() {
        // Remove mobile controls initialization from constructor
        this.mobileControls = null;
        
        // Bind methods to preserve this context
        this.gameLoop = this.gameLoop.bind(this);
        this.toggleHelpScreen = this.toggleHelpScreen.bind(this);
    }

    /**
     * Draw the start screen
     */
    showStartScreen() {
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
        this.cleanupInputHandlers();
        this.setupInputHandlers();
        
        // Clear the canvas
        clear('black');
        
        // Draw start screen with current difficulty and game data
        drawStartScreen(ctx, currentDifficulty, leaderboardData, gamesPlayedCount);
    }

    /**
     * End the current game and go back to the start screen
     */
    endGame(showStartScreen = true) {
        console.log("Game ended");
        
        // Stop game loop
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        
        // Clean up mobile controls if they exist
        if (this.mobileControls) {
            this.mobileControls.cleanup();
            this.mobileControls = null;
        }
        
        // Update games played count
        gamesPlayedCount++;
        updateGamesPlayed(gamesPlayedCount);
        
        // Check if score is high enough for leaderboard
        if (score > 0) {
            this.checkHighScore(score);
        }
        
        // Reset game state
        isGameStarted = false;
        isPaused = false;
        isGameOver = false;
        
        // Clear entities
        player = null;
        asteroids = [];
        bullets = [];
        
        // Show start screen if requested
        if (showStartScreen) {
            this.showStartScreen();
        }
    }

    /**
     * Draw the help screen
     */
    drawHelpScreen() {
        const { canvas, ctx } = getCanvas();
        
        // Clear the canvas
        clear('black');
        
        if (isMobilePhone()) {
            // Mobile help screen
            ctx.fillStyle = 'white';
            ctx.font = 'bold 28px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('HOW TO PLAY', canvas.width / 2, canvas.height * 0.1);
            
            ctx.font = '18px Arial';
            const instructions = [
                'CONTROLS:',
                '• Left/Right buttons to rotate',
                '• THRUST button to move forward',
                '• SHOOT button to fire',
                '• HYPER button for random teleport',
                '',
                'OBJECTIVE:',
                '• Destroy all dinosaur asteroids',
                '• Avoid collisions',
                '• Score points to earn extra ships',
                '',
                'TAP ? TO RETURN'
            ];
            
            const startY = canvas.height * 0.2;
            const lineHeight = canvas.height * 0.05;
            
            instructions.forEach((line, index) => {
                if (line.startsWith('•')) {
                    ctx.textAlign = 'left';
                    ctx.fillText(line, canvas.width * 0.15, startY + (index * lineHeight));
                } else {
                    ctx.textAlign = 'center';
                    ctx.fillText(line, canvas.width / 2, startY + (index * lineHeight));
                }
            });
        } else {
            // Desktop help screen
            ctx.fillStyle = 'white';
            ctx.font = 'bold 36px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('HOW TO PLAY', canvas.width / 2, 100);
            
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
            
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Press ? to return', canvas.width / 2, canvas.height - 50);
        }
    }

    /**
     * Clean up any existing input handlers to prevent duplicates
     */
    cleanupInputHandlers() {
        onStart(null);
        onHelp(null);
        onEscape(null);
        onDifficulty(null);
    }

    /**
     * Initialize input handlers
     */
    setupInputHandlers() {
        // First, clear any existing handlers from previous instances
        this.cleanupInputHandlers();
        
        onStart(() => {
            console.log("Start key pressed");
            
            if (!isHelpScreenVisible && !isGameStarted) {
                // Start a new game if we're on the start screen
                this.startGame();
            }
        });
        
        // Use the bound method directly
        onHelp(this.toggleHelpScreen);
        
        onEscape(() => {
            // Only end the game if we're actually playing
            if (isGameStarted && !isGameOver) {
                this.endGame();
            }
        });
        
        onDifficulty((difficulty) => {
            if (!isGameStarted || isGameOver) {
                currentDifficulty = difficulty;
                this.updateDifficultySettings();
                this.showStartScreen();
            }
        });
    }

    /**
     * Start the game with the selected difficulty
     */
    startGame(difficulty) {
        try {
            console.log(`Beginning game start with difficulty: ${difficulty || 'medium'}`);
            
            // Use medium difficulty if none specified
            if (!difficulty) {
                difficulty = 'medium';
            }
            
            // Cancel any existing animation frame
            if (animationFrameId) {
                console.log(`Canceling animation frame: ${animationFrameId}`);
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
            
            // Basic game state reset
            isGameStarted = true;
            isPaused = false;
            isGameOver = false;
            isHelpScreenVisible = false;
            level = 1;
            score = 0;
            currentDifficulty = difficulty;
            
            // Set difficulty values - default to medium if there's an error
            console.log(`Setting game parameters for ${difficulty} difficulty`);
            try {
                switch (difficulty) {
                    case 'easy':
                        playerAcceleration = 100;
                        shootCooldown = 0.3;
                        asteroidSpeed = 30;
                        initialAsteroids = 2;
                        playerLives = 5;
                        break;
                    case 'difficult':
                        playerAcceleration = 140;
                        shootCooldown = 0.15;
                        asteroidSpeed = 50;
                        initialAsteroids = 4;
                        playerLives = 3;
                        break;
                    case 'medium':
                    default:
                        playerAcceleration = 120;
                        shootCooldown = 0.2;
                        asteroidSpeed = 40;
                        initialAsteroids = 3;
                        playerLives = 3;
                        currentDifficulty = 'medium';
                }
            } catch (err) {
                console.error("Error setting difficulty values, using medium defaults:", err);
                playerAcceleration = 120;
                shootCooldown = 0.2;
                asteroidSpeed = 40;
                initialAsteroids = 3;
                playerLives = 3;
                currentDifficulty = 'medium';
            }
            
            lives = playerLives;
            levelSpeedMultiplier = 1.0;
            extraLifeAnimation.active = false;
            
            console.log("Basic game state reset complete");
            
            // Get canvas and dimensions
            const { canvas, ctx } = getCanvas();
            const { width, height } = getDimensions();
            console.log(`Canvas dimensions: ${width}x${height}`);
            
            // Create player at center of screen
            try {
                console.log(`Creating player at ${width/2}, ${height/2} with acceleration ${playerAcceleration}`);
                player = new Player(width/2, height/2, playerAcceleration);
                console.log("Player created successfully");
            } catch (err) {
                console.error("Error creating player:", err);
                // Continue anyway - we'll check for player below
            }
            
            // Reset game entities
            bullets = [];
            asteroids = [];
            console.log("Game entities reset");
            
            // Create initial asteroids
            try {
                console.log(`Creating ${initialAsteroids} asteroids`);
                this.createAsteroids(initialAsteroids);
                console.log(`Created ${asteroids.length} asteroids`);
            } catch (err) {
                console.error("Error creating asteroids:", err);
                // Continue anyway
            }
            
            // Reset input handlers for gameplay
            onHelp(this.toggleHelpScreen);
            onEscape(() => this.endGame(true));
            onDifficulty(null);
            
            // Start game loop
            console.log("Starting game loop");
            lastFrameTime = performance.now();
            startTime = Date.now();
            gameRunning = true;
            
            // Start frame loop with error handling
            try {
                animationFrameId = requestAnimationFrame(this.gameLoop);
                console.log("Animation frame requested:", animationFrameId);
            } catch (err) {
                console.error("Error starting animation frame:", err);
            }
            
            console.log("Game started successfully");
        } catch (err) {
            console.error("CRITICAL ERROR STARTING GAME:", err);
            
            // Emergency fallback - try to reset to start screen
            try {
                console.log("Attempting emergency reset to start screen");
                isGameStarted = false;
                isPaused = false;
                isGameOver = false;
                
                if (animationFrameId) {
                    cancelAnimationFrame(animationFrameId);
                    animationFrameId = null;
                }
                
                this.showStartScreen();
            } catch (fallbackErr) {
                console.error("Even the fallback failed:", fallbackErr);
            }
        }
    }

    /**
     * Create a set of asteroids for the current level
     * @param {number} count - Number of asteroids to create
     */
    createAsteroids(count) {
        const { width, height } = getDimensions();
        console.log(`Beginning asteroid creation: ${count} asteroids with canvas dimensions ${width}x${height}`);
        
        // Clear existing asteroids first
        asteroids = [];
        
        console.log(`Creating ${count} asteroids with speed multiplier: ${levelSpeedMultiplier}`);
        
        // Use fixed base speeds for each difficulty level
        let baseSpeed;
        
        // Set base speed according to difficulty (1 for easy, 2.5 for medium, 5 for difficult)
        if (currentDifficulty === 'easy') {
            baseSpeed = 1.0;
        } else if (currentDifficulty === 'medium') {
            baseSpeed = 2.5;
        } else { // difficult
            baseSpeed = 5.0;
        }
        
        // Apply the level multiplier
        const effectiveSpeed = baseSpeed * levelSpeedMultiplier;
        
        console.log(`Base speed for ALL asteroids: ${baseSpeed.toFixed(2)}, With level multiplier: ${effectiveSpeed.toFixed(2)}`);
        
        // Define player position for safe spawning
        const playerX = player ? player.x : width / 2;
        const playerY = player ? player.y : height / 2;
        console.log(`Player position for spawning calculations: (${playerX}, ${playerY})`);
        
        for (let i = 0; i < count; i++) {
            // Create asteroid at a safe distance from the player
            let x, y, distanceFromPlayer;
            let attempts = 0;
            
            do {
                attempts++;
                // Random position along the edge of the screen to ensure they come from outside
                if (Math.random() < 0.5) {
                    x = Math.random() < 0.5 ? 0 : width;
                    y = Math.random() * height;
                } else {
                    x = Math.random() * width;
                    y = Math.random() < 0.5 ? 0 : height;
                }
                
                // Calculate distance from player
                const dx = playerX - x;
                const dy = playerY - y;
                distanceFromPlayer = Math.sqrt(dx * dx + dy * dy);
                
                // Prevent infinite loops
                if (attempts > 50) {
                    console.warn(`Could not find safe spawn location after ${attempts} attempts`);
                    break;
                }
            } while (distanceFromPlayer < ASTEROID_SETTINGS.SPAWN_DISTANCE_MIN);
            
            // Select a random type from ASTEROID_SETTINGS.TYPES
            const randomType = ASTEROID_SETTINGS.TYPES[Math.floor(Math.random() * ASTEROID_SETTINGS.TYPES.length)];
            
            // Always create large asteroids (size 1) at the beginning of a level
            const size = 1; // Large asteroid
            
            console.log(`Creating large asteroid type: ${randomType}, at (${x.toFixed(2)}, ${y.toFixed(2)})`);
            
            try {
                // Create the asteroid with the current level speed multiplier
                const asteroid = new Asteroid(
                    randomType,
                    size,
                    x,
                    y,
                    currentDifficulty,
                    levelSpeedMultiplier, // Pass the level speed multiplier
                    baseSpeed // Pass the fixed base speed
                );
                
                // Override the velocity with our single consistent speed
                const angle = Math.random() * Math.PI * 2; // Random angle between 0 and 2π
                
                // All asteroids use the same speed regardless of size
                const speed = effectiveSpeed;
                
                // Set velocity based on the random angle
                asteroid.velocityX = Math.cos(angle) * speed;
                asteroid.velocityY = Math.sin(angle) * speed;
                
                console.log(`Setting asteroid velocity to (${asteroid.velocityX.toFixed(2)}, ${asteroid.velocityY.toFixed(2)}) with speed: ${speed.toFixed(2)}`);
                
                asteroids.push(asteroid);
            } catch (err) {
                console.error(`Error creating asteroid: ${err.message}`);
            }
        }
        
        console.log(`Created ${asteroids.length} asteroids successfully`);
    }

    /**
     * Main game loop
     * @param {number} timestamp - Current timestamp from requestAnimationFrame
     */
    gameLoop(timestamp) {
        try {
            // Safety check - exit if game is not running
            if (!gameRunning) {
                console.log("Game loop called but game is not running - exiting");
                return;
            }
            
            // On first frame, log that we've entered the game loop
            if (!lastFrameTime) {
                console.log("Entered game loop for the first time");
                lastFrameTime = timestamp;
            }
            
            // Calculate delta time in seconds (with reasonable fallback)
            let deltaTime = 0.016; // Default to 60fps if calculation fails
            try {
                deltaTime = (timestamp - lastFrameTime) / 1000;
                lastFrameTime = timestamp;
            } catch (err) {
                console.error("Error calculating delta time:", err);
                lastFrameTime = timestamp;
            }
            
            // Cap deltaTime to prevent large jumps
            const cappedDeltaTime = Math.min(deltaTime, 0.1);
            
            // Skip updating if game is paused
            if (isPaused) {
                animationFrameId = requestAnimationFrame(this.gameLoop);
                return;
            }
            
            // Update game time
            try {
                currentTime = Date.now() - startTime;
            } catch (err) {
                console.error("Error updating game time:", err);
            }
            
            // Occasionally log game state for debugging
            if (currentTime % 5000 < 20) {
                console.log(`Game running - Time: ${currentTime}ms, FPS: ${(1 / deltaTime).toFixed(1)}`);
                console.log(`Entities: Player exists: ${!!player}, Asteroids: ${asteroids.length}, Bullets: ${bullets.length}`);
            }
            
            // Clear the canvas with error handling
            try {
                clear('black');
            } catch (err) {
                console.error("Error clearing canvas:", err);
            }
            
            const { ctx, canvas } = getCanvas();
            
            // Update player with error handling
            if (player) {
                try {
                    const newBullet = player.update(cappedDeltaTime);
                    
                    // Add new bullet if player fired
                    if (newBullet) {
                        bullets.push(new Bullet(newBullet.x, newBullet.y, newBullet.rotation));
                    }
                    
                    // Draw player
                    player.draw(ctx);
                } catch (err) {
                    console.error("Error updating player:", err);
                }
            }
            
            // Update bullets with error handling
            try {
                for (let i = bullets.length - 1; i >= 0; i--) {
                    const bullet = bullets[i];
                    
                    // Remove inactive bullets
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
                            
                            // Break out of inner loop
                            break;
                        }
                    }
                }
            } catch (err) {
                console.error("Error updating bullets:", err);
            }
            
            // Update asteroids with error handling
            try {
                asteroids.forEach(asteroid => {
                    asteroid.update(cappedDeltaTime);
                    asteroid.draw(ctx);
                });
            } catch (err) {
                console.error("Error updating asteroids:", err);
            }
            
            // Draw game status
            try {
                drawGameStatus(ctx, score, lives, level, currentDifficulty);
            } catch (err) {
                console.error("Error drawing game status:", err);
            }
            
            // Schedule next frame
            try {
                animationFrameId = requestAnimationFrame(this.gameLoop);
            } catch (err) {
                console.error("Error requesting animation frame:", err);
                
                // Attempt recovery by restarting the loop after a short delay
                setTimeout(() => {
                    if (gameRunning) {
                        console.log("Attempting to restart game loop");
                        animationFrameId = requestAnimationFrame(this.gameLoop);
                    }
                }, 1000);
            }
        } catch (err) {
            console.error("CRITICAL ERROR IN GAME LOOP:", err);
            
            // Attempt to recover by scheduling next frame
            try {
                animationFrameId = requestAnimationFrame(this.gameLoop);
            } catch (secondErr) {
                console.error("Could not recover from game loop error:", secondErr);
            }
        }
    }

    /**
     * Handle game over state
     */
    handleGameOver() {
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
        const isHighScore = this.isNewHighScore();
        console.log(`Game over check - Is high score: ${isHighScore}, Score: ${score}`);
        
        // Get canvas for drawing
        const { ctx } = getCanvas();
        
        // Create a function to redraw the game over screen
        const redrawGameOver = () => {
            drawGameOver(ctx, score, leaderboardData, level, gameTime);
        };
        
        // Set up the redraw callback for initials input
        setRedrawCallback(redrawGameOver);
        
        // Draw game over screen initially
        redrawGameOver();
        
        // Add keyboard handler for game over screen
        document.addEventListener('keydown', handleGameOverKeyInput);
        console.log("Added keydown event listener for game over screen");
        
        if (isHighScore) {
            console.log("New high score detected!");
            activateInput();
            
            // Re-render the game over screen after activating input
            setTimeout(redrawGameOver, 100);
            
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
                    this.showStartScreen();
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
                    
                    this.showStartScreen();
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
                this.cleanupInputHandlers();
                
                // Clear any animation frames to prevent hanging
                if (animationFrameId) {
                    cancelAnimationFrame(animationFrameId);
                    animationFrameId = null;
                }
                
                // Show the start screen
                this.showStartScreen();
            });
        }
    }

    /**
     * Check if the current score is a new high score
     * @returns {boolean} - Whether the score is a new high score
     */
    isNewHighScore() {
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
    toggleHelpScreen() {
        if (isGameStarted) return;
        
        isHelpScreenVisible = !isHelpScreenVisible;
        
        if (isHelpScreenVisible) {
            this.drawHelpScreen();
        } else {
            this.showStartScreen();
        }
    }

    /**
     * Initialize the game
     */
    initGame() {
        console.log("⭐ Initializing game...");
        
        // Initialize canvas
        const { canvas } = initCanvas();
        console.log("Canvas initialized with dimensions:", canvas.width, "x", canvas.height);
        
        // Initialize mobile controls after canvas is ready if on mobile
        if (isMobilePhone()) {
            console.log("Setting up mobile controls");
            this.mobileControls = new MobileControls(canvas, this);
        }
        
        // Set up window resize handler
        window.addEventListener('resize', () => {
            console.log("Window resize detected");
            resizeToWindow();
            
            // Redraw the current screen
            if (!isGameStarted) {
                if (isHelpScreenVisible) {
                    this.drawHelpScreen();
                } else {
                    this.showStartScreen();
                }
            }
            
            // Recreate mobile controls if needed after resize
            if (isMobilePhone()) {
                if (this.mobileControls) {
                    this.mobileControls.cleanup();
                }
                this.mobileControls = new MobileControls(canvas, this);
            }
        });
        
        // Initialize input system with canvas and this controller instance
        console.log("Initializing input system with canvas and game controller");
        initInput(canvas, this);
        
        // Load game data
        console.log("Loading game data...");
        Promise.all([
            fetchLeaderboard(),
            fetchGamesPlayed(),
            preloadImages()
        ]).then(([leaderboard, gamesPlayed]) => {
            console.log("✅ Game data loaded successfully");
            
            // Store the data
            leaderboardData = leaderboard;
            gamesPlayedCount = gamesPlayed;
            
            // Show the start screen
            this.showStartScreen();
        }).catch(error => {
            console.error("❌ Error loading game data:", error);
            // Show start screen anyway
            this.showStartScreen();
        });
    }

    /**
     * Get the current game state
     * @returns {Object} - The current game state
     */
    getGameState() {
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
    updateDifficultySettings() {
        const settings = DIFFICULTY_SETTINGS[currentDifficulty];
        shootCooldown = settings.shootCooldown;
        asteroidSpeed = settings.asteroidSpeed;
        initialAsteroids = settings.initialAsteroids;
        playerLives = settings.lives;
    }

    /**
     * Change the difficulty level
     * @param {string} difficulty - The difficulty level to set ('easy', 'medium', 'difficult')
     */
    changeDifficulty(difficulty) {
        if (!isGameStarted || isGameOver) {
            currentDifficulty = difficulty;
            this.updateDifficultySettings();
            // Force redraw of the start screen to show updated difficulty
            if (!isHelpScreenVisible) {
                this.showStartScreen();
            }
        }
    }

    /**
     * Draw the heads-up display (HUD)
     */
    drawHUD() {
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
    drawGameOverScreen() {
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
    cleanupGame() {
        if (gameLoopId) {
            cancelAnimationFrame(gameLoopId);
        }
    }

    /**
     * Custom asteroid speed based on current difficulty
     * @param {string} size - The asteroid size ('large', 'medium', 'small')
     * @returns {number} - The random speed for this asteroid
     */
    getAsteroidSpeed(size) {
        const speedRange = DIFFICULTY_SETTINGS[currentDifficulty].asteroidSpeed[size];
        return speedRange.min + Math.random() * (speedRange.max - speedRange.min);
    }

    /**
     * Update the game HUD with difficulty information
     */
    updateHUD() {
        const { ctx } = getCanvas();
        
        // Draw game status with current settings
        drawGameStatus(ctx, score, lives, level, currentDifficulty);
    }

    /**
     * Check if player should get an extra life based on score
     * @param {number} newScore - The updated score
     */
    checkExtraLife(newScore) {
        const threshold = GAME_SETTINGS.EXTRA_LIFE_SCORE_THRESHOLD;
        const lastThreshold = Math.floor(lastExtraLifeScore / threshold) * threshold;
        const newThreshold = Math.floor(newScore / threshold) * threshold;
        
        // If we've crossed a new threshold, award an extra life
        if (newThreshold > lastThreshold) {
            lives++;
            lastExtraLifeScore = newScore;
            
            // Show visual feedback
            console.log(`BONUS SHIP! Extra life awarded at ${newScore} points. Lives: ${lives}`);
            
            // Start the bonus ship animation
            this.startExtraLifeAnimation();
        }
    }

    /**
     * Start the animation for the extra life bonus
     */
    startExtraLifeAnimation() {
        const { width } = getDimensions();
        
        // Set the animation properties
        extraLifeAnimation.active = true;
        extraLifeAnimation.x = width - 100; // Position near the lives display
        extraLifeAnimation.y = 90; // Match the y-position of the lives indicator
        extraLifeAnimation.alpha = 0;
        extraLifeAnimation.startTime = Date.now();
    }
}

// Create and export a singleton instance
const gameController = new GameController();
export const initGame = () => gameController.initGame();
export const getGameState = () => gameController.getGameState();
export const cleanupGame = () => gameController.cleanupGame(); 