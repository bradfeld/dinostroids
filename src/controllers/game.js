/**
 * Game Controller
 * 
 * This controller manages the game state, initialization,
 * and the main game loop.
 */

import { initCanvas, resizeToWindow, getCanvas, clear, getDimensions } from '../canvas.js';
import { fetchGamesPlayed, fetchLeaderboard, submitScore, incrementGamesPlayed } from '../services/api.js';
import { preloadImages } from '../services/images.js';
import { initInput, onStart, onHelp, isKeyPressed, onEscape, onDifficulty, onPause, resetGameControllerRef } from './input.js';
import { GAME_SETTINGS, PLAYER_SETTINGS, ASTEROID_SETTINGS, DIFFICULTY_SETTINGS } from '../constants.js';
import Player from '../entities/player.js';
import Asteroid from '../entities/asteroid.js';
import Bullet from '../entities/bullet.js';
import { drawGameStatus } from '../ui/gameStatus.js';
import { drawGameOver, handleGameOverKeyInput, activateInput, onRestart, setRedrawCallback, onSubmitScore, setupGameOverEvents, cleanupGameOverEvents } from '../ui/gameOver.js';
import { drawLeaderboard } from '../ui/leaderboard.js';
import { formatTime, randomInt } from '../utils.js';
import { drawStartScreen } from '../ui/startScreen.js';
import { MobileControls } from '../ui/mobileControls.js';
import { isMobilePhone } from '../utils/device.js';
import { drawHelpScreen } from '../ui/helpScreen.js';

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
        const { ctx, canvas } = getCanvas();
        
        console.log("Showing start screen - ENHANCED");
        
        // Make sure game state is reset
        isGameStarted = false;
        isHelpScreenVisible = false;
        gameRunning = false;
        isGameOver = false;
        isPaused = false;
        
        // Clean up any frame animation
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        
        // Clean up mobile controls if they exist
        if (this.mobileControls) {
            console.log("Cleaning up existing mobile controls before start screen");
            this.mobileControls.cleanup();
            this.mobileControls = null;
        }
        
        // Enhanced cleanup: Make sure there are no touch event handlers left over
        // This helps prevent conflicts when transitioning from game over to start screen
        if (canvas) {
            console.log("Performing extra canvas event cleanup for start screen");
            // Remove all possible touch events with various options
            const noop = () => {}; // Empty function for safe removal
            canvas.removeEventListener('touchstart', noop);
            canvas.removeEventListener('touchend', noop);
            canvas.removeEventListener('touchmove', noop);
            canvas.removeEventListener('touchcancel', noop);
            
            // Remove any potential leftover game over events
            cleanupGameOverEvents(canvas);
        }
        
        // Clean up event handlers that might be left over
        document.removeEventListener('keydown', handleGameOverKeyInput);
        
        // Reset all input handlers
        this.cleanupInputHandlers();
        
        // Fetch the latest games played count to ensure display is up to date
        fetchGamesPlayed().then(count => {
            console.log("Updated games played count from server:", count);
            gamesPlayedCount = count;
            
            // Now draw the start screen with updated data
            setTimeout(() => {
                console.log("Setting up input handlers for start screen after cleanup");
                this.setupInputHandlers();
                
                // Clear the canvas
                clear('black');
                
                // Draw start screen with current difficulty and UPDATED game data
                drawStartScreen(ctx, currentDifficulty, leaderboardData, gamesPlayedCount);
                
                // Set up fresh mobile controls if on mobile with a small delay 
                // to ensure previous ones are fully cleaned up
                if (isMobilePhone()) {
                    setTimeout(() => {
                        const { canvas } = getCanvas();
                        console.log("Creating new mobile controls for start screen");
                        this.mobileControls = new MobileControls(canvas, this);
                    }, 50);
                }
            }, 50);
        })
        .catch(error => {
            console.error("Error fetching games played count:", error);
            // Continue with setup even if fetch fails
            setTimeout(() => {
                console.log("Setting up input handlers for start screen after cleanup");
                this.setupInputHandlers();
                
                // Clear the canvas
                clear('black');
                
                // Draw start screen with current difficulty and existing game data
                drawStartScreen(ctx, currentDifficulty, leaderboardData, gamesPlayedCount);
                
                // Set up fresh mobile controls if on mobile with a small delay 
                if (isMobilePhone()) {
                    setTimeout(() => {
                        const { canvas } = getCanvas();
                        console.log("Creating new mobile controls for start screen");
                        this.mobileControls = new MobileControls(canvas, this);
                    }, 50);
                }
            }, 50);
        });
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
        incrementGamesPlayed();
        
        // Check if score is high enough for leaderboard (only if we have a significant score)
        if (score > 0) {
            // Using direct check rather than calling a method
            const isHighScore = !leaderboardData || 
                                leaderboardData.length < 20 || 
                                score > [...leaderboardData].sort((a, b) => b.score - a.score)[Math.min(19, leaderboardData.length - 1)]?.score || 0;
            
            if (isHighScore) {
                console.log(`Game ended with high score: ${score}`);
            }
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
        // Call the help screen drawing function from the UI module
        drawHelpScreen();
    }

    /**
     * Clean up any existing input handlers to prevent duplicates
     */
    cleanupInputHandlers() {
        onStart(null);
        onHelp(null);
        onEscape(null);
        onDifficulty(null);
        onPause(null);
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
                // Pass the current difficulty explicitly
                console.log("Starting game with current difficulty:", currentDifficulty);
                this.startGame(currentDifficulty);
            }
        });
        
        // Use the bound method directly
        onHelp(this.toggleHelpScreen);
        
        onEscape(() => {
            // End the game when ESC is pressed - don't restrict to game state
            console.log("Escape key pressed, game state:", isGameStarted, isGameOver);
            
            // Always go back to the start screen when ESC is pressed
            console.log("Ending game due to ESC key");
            this.endGame(true);
        });
        
        onDifficulty((difficulty) => {
            if (!isGameStarted || isGameOver) {
                currentDifficulty = difficulty;
                this.updateDifficultySettings();
                this.showStartScreen();
            }
        });
        
        // Add pause handler
        onPause(() => {
            // Toggle pause state (only for desktop version)
            if (!isMobilePhone() && isGameStarted && !isGameOver) {
                this.togglePause();
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
            
            // Clean up old mobile controls if they exist
            if (this.mobileControls) {
                console.log("Cleaning up existing mobile controls");
                this.mobileControls.cleanup();
                this.mobileControls = null;
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
                        console.log("Setting EASY difficulty parameters");
                        playerAcceleration = 100;
                        shootCooldown = 0.3;
                        asteroidSpeed = 30;
                        initialAsteroids = 2;
                        playerLives = 3;
                        break;
                    case 'difficult':
                        console.log("Setting DIFFICULT difficulty parameters");
                        playerAcceleration = 140;
                        shootCooldown = 0.15;
                        asteroidSpeed = 50;
                        initialAsteroids = 4;
                        playerLives = 3;
                        break;
                    case 'medium':
                    default:
                        console.log("Setting MEDIUM difficulty parameters");
                        playerAcceleration = 120;
                        shootCooldown = 0.2;
                        asteroidSpeed = 40;
                        initialAsteroids = 3;
                        playerLives = 3;
                        currentDifficulty = 'medium';
                }
                
                console.log(`Difficulty set to: ${currentDifficulty}, Lives: ${playerLives}, Asteroids: ${initialAsteroids}`);
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
            
            // Create mobile controls if on mobile
            if (isMobilePhone()) {
                console.log("Creating mobile controls for gameplay");
                try {
                    this.mobileControls = new MobileControls(canvas, this);
                    console.log("Mobile controls created successfully");
                } catch (err) {
                    console.error("Error creating mobile controls:", err);
                }
            }
            
            // Reset input handlers for gameplay
            onHelp(this.toggleHelpScreen);
            onEscape(() => {
                console.log("ESC key pressed during gameplay, ending game");
                this.endGame(true);
            });
            onDifficulty(null);
            
            // Start game loop
            console.log("Starting game loop");
            lastFrameTime = performance.now();
            startTime = Date.now();
            gameRunning = true;
            
            // Bind the gameLoop to this instance to preserve the correct 'this' context
            const boundGameLoop = this.gameLoop.bind(this);
            
            // Start frame loop with error handling
            try {
                animationFrameId = requestAnimationFrame(boundGameLoop);
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
            
            // Clear the canvas with error handling
            try {
                clear('black');
            } catch (err) {
                console.error("Error clearing canvas:", err);
            }
            
            // If paused, draw the game objects but don't update them
            if (isPaused) {
                // Draw static game state
                this.drawStaticGameState();
                // Draw pause overlay
                this.drawPauseOverlay();
                // Request next frame
                animationFrameId = requestAnimationFrame(this.gameLoop.bind(this));
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
            
            const { ctx, canvas } = getCanvas();

            // Update player with error handling
            if (player) {
                try {
                    // Log player update call to see if it's happening
                    if (player.invincible) {
                        console.log(`Calling player.update from game loop, player invincible: ${player.invincible}, time left: ${player.invincibilityTime}`);
                    }
                    
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
                            
                            // Check if player earned an extra life
                            this.checkExtraLife(score);
                            
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
            
            // Check for player collisions with asteroids
            try {
                if (player && !player.isDestroyed && !player.exploding && !player.isInHyperspace && !player.invincible) {
                    for (let i = asteroids.length - 1; i >= 0; i--) {
                        const asteroid = asteroids[i];
                        
                        if (player.isCollidingWith(asteroid)) {
                            // Player is hit
                            console.log("Player hit by asteroid!");
                            player.destroy();
                            lives--;
                            
                            // Create child asteroids
                            const newAsteroids = asteroid.break();
                            
                            // Add score for the asteroid
                            score += ASTEROID_SETTINGS.SCORE_VALUES[asteroid.size] || 100;
                            
                            // Check for extra life
                            this.checkExtraLife(score);
                            
                            // Add new smaller asteroids
                            asteroids.push(...newAsteroids);
                            
                            // Remove the asteroid that hit the player
                            asteroids.splice(i, 1);
                            
                            if (lives <= 0) {
                                // Game over
                                setTimeout(() => {
                                    this.handleGameOver();
                                }, 2000);
                            } else {
                                // Respawn player after a delay
                                setTimeout(() => {
                                    player.reset();
                                    
                                    // Reset mobile controls state if they exist
                                    if (this.mobileControls) {
                                        // Reset all mobile controls to prevent stuck buttons
                                        this.mobileControls.resetTouchControls();
                                    }
                                    
                                    // Add a hard timeout to ensure invincibility ends
                                    // Use a fixed value of 3500ms (3s + 500ms buffer)
                                    const invincibilityDuration = 3500; // Fixed value
                                    console.log(`Setting hard timeout to end invincibility after ${invincibilityDuration}ms`);
                                    
                                    setTimeout(() => {
                                        if (player && player.invincible) {
                                            console.log('Hard timeout: Forcing invincibility to end');
                                            player.forceEndInvincibility();
                                        }
                                    }, invincibilityDuration);
                                }, 2000);
                            }
                            
                            break;
                        }
                    }
                }
            } catch (err) {
                console.error("Error checking player collisions:", err);
            }
            
            // Check if level is complete (all asteroids destroyed)
            try {
                if (asteroids.length === 0 && isGameStarted && !isGameOver) {
                    console.log("Level complete! Advancing to next level");
                    this.startNextLevel();
                }
            } catch (err) {
                console.error("Error checking level completion:", err);
            }
            
            // Draw HUD with error handling
            try {
                this.drawHUD();
            } catch (err) {
                console.error("Error drawing HUD:", err);
            }
            
            // Draw extra life animation if active
            try {
                if (extraLifeAnimation.active) {
                    this.drawExtraLifeAnimation();
                }
            } catch (err) {
                console.error("Error drawing extra life animation:", err);
            }
            
            // Draw mobile controls if on mobile
            try {
                if (this.mobileControls) {
                    this.mobileControls.draw();
                }
            } catch (err) {
                console.error("Error drawing mobile controls:", err);
            }
            
            // Request next frame if game is still running
            if (gameRunning) {
                try {
                    animationFrameId = requestAnimationFrame(this.gameLoop.bind(this));
                } catch (err) {
                    console.error("Error requesting next animation frame:", err);
                    // Try to recover
                    setTimeout(() => {
                        if (gameRunning) {
                            console.log("Attempting to recover game loop...");
                            animationFrameId = requestAnimationFrame(this.gameLoop.bind(this));
                        }
                    }, 1000);
                }
            }
        } catch (err) {
            console.error("CRITICAL ERROR IN GAME LOOP:", err);
            
            // Attempt to recover
            try {
                console.log("Attempting emergency recovery of game loop");
                animationFrameId = requestAnimationFrame(this.gameLoop.bind(this));
            } catch (recoveryErr) {
                console.error("Failed to recover game loop:", recoveryErr);
                // Last resort: try to end the game safely
                try {
                    console.error("Game loop unrecoverable - ending game");
                    this.handleGameOver();
                } catch (endGameErr) {
                    console.error("Everything failed. Game state is undefined.", endGameErr);
                }
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
        
        // Update games played count
        gamesPlayedCount++;
        console.log("About to increment games played count, current local count:", gamesPlayedCount);
        
        // Call API and handle the response for debugging
        incrementGamesPlayed()
            .then(success => {
                console.log("incrementGamesPlayed API call completed, success:", success);
            })
            .catch(error => {
                console.error("incrementGamesPlayed API call failed:", error);
            });
        
        // Clean up entities
        if (player) {
            player = null;
        }
        asteroids = [];
        bullets = [];
        
        // Clean up any existing input handlers
        cleanupGameOverEvents(getCanvas().canvas);
        
        // Check if this is a high score before drawing the screen
        const isHighScore = this.isNewHighScore();
        console.log(`Game over check - Is high score: ${isHighScore}, Score: ${score}`);
        
        // Get canvas for drawing
        const { ctx, canvas } = getCanvas();
        
        // Create a function to redraw the game over screen
        const redrawGameOver = () => {
            drawGameOver(ctx, score, leaderboardData, level, gameTime);
        };
        
        // Set up the redraw callback for initials input
        setRedrawCallback(redrawGameOver);
        
        // Draw game over screen initially
        redrawGameOver();
        
        // Set up game over event handlers - handles both desktop and mobile
        setupGameOverEvents(canvas);
                
        // Set up the restart callback for non-high score case
        onRestart(function(event) {
            console.log("Restart callback triggered - ENHANCED version for mobile");
            
            // Clean up any event handlers first
            cleanupGameOverEvents(canvas);
                    
                    // Reset game state
                    isGameOver = false;
                    isGameStarted = false;
            gameRunning = false;
            isPaused = false;
            
            // Force mobile-specific cleanup if needed
            if (isMobilePhone() && this.mobileControls) {
                console.log("Cleaning up mobile controls before restart - ENHANCED");
                try {
                    this.mobileControls.cleanup();
                    this.mobileControls = null;
                } catch (err) {
                    console.error("Error cleaning up mobile controls:", err);
                    // Continue anyway to ensure we complete the restart
                }
            }
            
            // Clean up input system
                    this.cleanupInputHandlers();
            
            // Cancel any animation frames
                    if (animationFrameId) {
                        cancelAnimationFrame(animationFrameId);
                        animationFrameId = null;
                    }
                    
                    // Reset game controller reference for input system
            try {
                    resetGameControllerRef(this);
            } catch (err) {
                console.error("Error resetting game controller:", err);
                // Continue anyway
            }
                    
            // Add a small delay before initializing the input system and showing start screen
            // This helps prevent event handler conflicts
            setTimeout(() => {
                try {
                    // Re-initialize input system with the current game controller
                    console.log("Re-initializing input system for the start screen - ENHANCED");
                    initInput(canvas, this);
                    
                    // Show the start screen after a short delay to ensure clean state
                    console.log("Showing start screen from restart callback - ENHANCED");
                    this.showStartScreen();
                } catch (err) {
                    console.error("Error during restart transition:", err);
                    // Emergency fallback - force a clean start screen
                    this.showStartScreen();
            }
            }, 100);
        }.bind(this));
        
        // If it's a high score, activate the initials input
        if (isHighScore) {
            console.log("New high score detected!");
            activateInput();
            
            // Re-render the game over screen after activating input
            setTimeout(redrawGameOver, 100);
            
            // Set up the score submission handler
            onSubmitScore(function(initials) {
                try {
                    console.log(`Submitting high score with initials: ${initials} - ENHANCED handling`);
                    // Submit score with level and time information
                    submitScore(initials, score, gameTime, level, currentDifficulty).then(() => {
                    // Refresh leaderboard after submitting
                        return fetchLeaderboard();
                    }).then(newLeaderboard => {
                        leaderboardData = newLeaderboard;
                    
                        // Clean up game over input handlers with enhanced cleanup
                        console.log("Cleaning up game over events after score submission - ENHANCED");
                        cleanupGameOverEvents(canvas);
                    
                    // Reset game state completely
                    isGameOver = false;
                    isGameStarted = false;
                    gameRunning = false;
                        isPaused = false;
                        
                        // Force mobile-specific cleanup if needed
                        if (isMobilePhone() && this.mobileControls) {
                            console.log("Cleaning up mobile controls after high score submission - ENHANCED");
                            try {
                                this.mobileControls.cleanup();
                                this.mobileControls = null;
                            } catch (err) {
                                console.error("Error cleaning up mobile controls:", err);
                                // Continue anyway to ensure we complete the transition
                            }
                        }
                    
                    // Clear any animation frames to prevent hanging
                    if (animationFrameId) {
                        cancelAnimationFrame(animationFrameId);
                        animationFrameId = null;
                    }
                    
                    // Reset game controller reference for input system
                        try {
                    resetGameControllerRef(this);
                        } catch (err) {
                            console.error("Error resetting game controller:", err);
                            // Continue anyway
                        }
                        
                        // Add delay before setting up new handlers to ensure clean state
                        setTimeout(() => {
                            try {
                                // Re-initialize input system with the current game controller
                                console.log("Re-initializing input system after score submission - ENHANCED");
                    initInput(canvas, this);
                    
                                // Show the start screen with enhanced handling
                    this.showStartScreen();
                            } catch (err) {
                                console.error("Error during post-score transition:", err);
                                // Emergency fallback - force a clean start screen
                                this.showStartScreen();
                            }
                        }, 100);
                    }).catch(error => {
                    console.error("Failed to submit score:", error);
                        handleFailedSubmission.call(this);
                    });
                } catch (error) {
                    console.error("Exception submitting score:", error);
                    handleFailedSubmission.call(this);
                }
                
                // Helper function to handle failed submission
                function handleFailedSubmission() {
                    // Even if submission fails, go back to start screen
                    cleanupGameOverEvents(canvas);
                    
                    // Reset game state
                    isGameOver = false;
                    isGameStarted = false;
                    gameRunning = false;
                    isPaused = false;
                    
                    // Force mobile-specific cleanup if needed
                    if (isMobilePhone() && this.mobileControls) {
                        console.log("Cleaning up mobile controls after failed submission - ENHANCED");
                        try {
                            this.mobileControls.cleanup();
                            this.mobileControls = null;
                        } catch (err) {
                            console.error("Error cleaning up mobile controls:", err);
                        }
                    }
                    
                    // Clear any animation frames to prevent hanging
                    if (animationFrameId) {
                        cancelAnimationFrame(animationFrameId);
                        animationFrameId = null;
                    }
                    
                    // Add delay before reinitializing
                    setTimeout(() => {
                        try {
                            // Reset game controller reference and reinitialize input
                    resetGameControllerRef(this);
                    initInput(canvas, this);
                    
                            // Show the start screen with enhanced handling
                            this.showStartScreen();
                        } catch (err) {
                            console.error("Error in emergency restart:", err);
                            // Last resort
                    this.showStartScreen();
                }
                    }, 100);
                }
            }.bind(this));
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
        console.log(`Updating game settings for difficulty: ${currentDifficulty}`);
        
        try {
            switch (currentDifficulty) {
                case 'easy':
                    console.log("Setting EASY difficulty parameters");
                    playerAcceleration = 100;
                    shootCooldown = 0.3;
                    asteroidSpeed = 30;
                    initialAsteroids = 2;
                    playerLives = 3;
                    break;
                case 'difficult':
                    console.log("Setting DIFFICULT difficulty parameters");
                    playerAcceleration = 140;
                    shootCooldown = 0.15;
                    asteroidSpeed = 50;
                    initialAsteroids = 4;
                    playerLives = 3;
                    break;
                case 'medium':
                default:
                    console.log("Setting MEDIUM difficulty parameters");
                    playerAcceleration = 120;
                    shootCooldown = 0.2;
                    asteroidSpeed = 40;
                    initialAsteroids = 3;
                    playerLives = 3;
                    break;
            }
            
            console.log(`Difficulty updated to: ${currentDifficulty}, Lives: ${playerLives}, Asteroids: ${initialAsteroids}`);
        } catch (err) {
            console.error("Error updating difficulty settings:", err);
            // Use medium settings as fallback
            playerAcceleration = 120;
            shootCooldown = 0.2;
            asteroidSpeed = 40;
            initialAsteroids = 3;
            playerLives = 3;
        }
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
        const { ctx } = getCanvas();
        const { width } = getDimensions();
        
        // Draw score on the left
        ctx.fillStyle = 'white';
        ctx.font = '24px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Score: ${score}`, 20, 30);
        
        // Draw ships graphically on the right using exactly the same graphic as the player ship
        const shipRadius = 12; // Base size for the ship icons
        const shipSpacing = 30;
        const shipY = 30;
        
        // Save context for ship drawing
        ctx.save();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1.5;
        
        // Draw each ship icon
        for (let i = 0; i < lives; i++) {
            const shipX = width - 30 - (i * shipSpacing);
            
            // Draw ship matching the exact player ship graphics
            ctx.save();
            
            // Translate to ship position
            ctx.translate(shipX, shipY);
            
            // Rotate to point up (-90 degrees from default right-facing)
            ctx.rotate(-Math.PI / 2);
            
            // Draw ship with the exact same proportions as the Player class
            ctx.beginPath();
            ctx.moveTo(shipRadius, 0); // Nose
            ctx.lineTo(-shipRadius * 0.7, -shipRadius * 0.7); // Left wing
            ctx.lineTo(-shipRadius * 0.5, 0); // Back indent
            ctx.lineTo(-shipRadius * 0.7, shipRadius * 0.7); // Right wing
            ctx.closePath();
            ctx.stroke();
            
            ctx.restore();
        }
        
        // Restore context
        ctx.restore();
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

    /**
     * Draw the extra life animation
     */
    drawExtraLifeAnimation() {
        const { ctx } = getCanvas();
        const elapsed = Date.now() - extraLifeAnimation.startTime;
        
        if (elapsed < extraLifeAnimation.duration) {
            // Calculate alpha based on time (fade in, then fade out)
            const progress = elapsed / extraLifeAnimation.duration;
            extraLifeAnimation.alpha = progress < 0.5 
                ? progress * 2 // Fade in during first half
                : 2 - progress * 2; // Fade out during second half
            
            // Move upward slightly
            extraLifeAnimation.y -= 20 * 0.016; // Using fixed deltaTime for consistent movement
            
            // Draw the text
            ctx.save();
            ctx.fillStyle = `rgba(255, 255, 255, ${extraLifeAnimation.alpha})`;
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(extraLifeAnimation.text, extraLifeAnimation.x, extraLifeAnimation.y);
            ctx.restore();
        } else {
            // Animation complete
            extraLifeAnimation.active = false;
        }
    }

    // Mobile control methods
    setRotateLeft(active) {
        if (!player) return;
        player.rotatingLeft = active;
    }
    
    setRotateRight(active) {
        if (!player) return;
        player.rotatingRight = active;
    }
    
    setThrusting(active) {
        if (!player) return;
        player.thrusting = active;
    }
    
    setFiring(active) {
        if (!player) return;
        player.shooting = active;
    }
    
    activateHyperspace() {
        if (!player || player.isDestroyed || player.exploding || player.isInHyperspace) return;
        player.enterHyperspace();
        
        // Add a hard timeout to ensure hyperspace invincibility ends
        // Use a fixed value of 3500ms (3s + 500ms buffer)
        const invincibilityDuration = 3500; // Fixed value
        console.log(`Setting hard timeout to end hyperspace invincibility after ${invincibilityDuration}ms`);
        
        setTimeout(() => {
            if (player && player.invincible) {
                console.log('Hard timeout: Forcing hyperspace invincibility to end');
                player.forceEndInvincibility();
            }
        }, invincibilityDuration);
    }

    /**
     * Start the next level after clearing all asteroids
     */
    startNextLevel() {
        // Move to next level
        level++;
        
        // Increase speed multiplier for next level
        levelSpeedMultiplier *= 1.05;
        console.log(`Level ${level}: Speed multiplier increased to ${levelSpeedMultiplier.toFixed(2)}`);
        
        // Calculate new asteroid count based on level
        const newAsteroidCount = Math.min(
            initialAsteroids + (level - 1),
            15 // Cap at 15 asteroids
        );
        
        // Create new asteroids for next level
        this.createAsteroids(newAsteroidCount);
    }

    /**
     * Toggle the pause state of the game
     */
    togglePause() {
        // Only toggle pause during active gameplay
        if (!isGameStarted || isGameOver) return;
        
        isPaused = !isPaused;
        console.log(`Game ${isPaused ? 'paused' : 'resumed'}`);
        
        // If we're resuming, reset the lastFrameTime to avoid time jumps
        if (!isPaused) {
            lastFrameTime = performance.now();
        }
    }

    /**
     * Draw pause overlay when game is paused
     */
    drawPauseOverlay() {
        const { ctx, canvas } = getCanvas();
        
        // Semi-transparent overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Pause text
        ctx.fillStyle = 'white';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GAME PAUSED', canvas.width / 2, canvas.height / 2 - 40);
        
        // Instructions
        ctx.font = '24px Arial';
        ctx.fillText('Press P to resume', canvas.width / 2, canvas.height / 2 + 20);
    }

    /**
     * Draw the current game state without updating (for pause)
     */
    drawStaticGameState() {
        const { ctx } = getCanvas();
        
        // Draw player
        if (player) {
            try {
                player.draw(ctx);
            } catch (err) {
                console.error("Error drawing player:", err);
            }
        }
        
        // Draw bullets
        try {
            bullets.forEach(bullet => bullet.draw(ctx));
        } catch (err) {
            console.error("Error drawing bullets:", err);
        }
        
        // Draw asteroids
        try {
            asteroids.forEach(asteroid => asteroid.draw(ctx));
        } catch (err) {
            console.error("Error drawing asteroids:", err);
        }
        
        // Draw HUD
        try {
            this.drawHUD();
        } catch (err) {
            console.error("Error drawing HUD:", err);
        }
        
        // Draw extra life animation if active
        if (extraLifeAnimation.active) {
            try {
                this.drawExtraLifeAnimation();
            } catch (err) {
                console.error("Error drawing extra life animation:", err);
            }
        }
        
        // Draw mobile controls if on mobile
        if (this.mobileControls) {
            try {
                this.mobileControls.draw();
            } catch (err) {
                console.error("Error drawing mobile controls:", err);
            }
        }
    }
}

// Create and export a singleton instance
const gameController = new GameController();
export const initGame = () => gameController.initGame();
export const getGameState = () => gameController.getGameState();
export const cleanupGame = () => gameController.cleanupGame(); 