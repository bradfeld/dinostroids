/**
 * Mobile Game Over Screen
 * 
 * Handles mobile-specific touch interactions for the game over screen.
 */

import { clear, getCanvas, getDimensions } from '../canvas.js';
import { drawStartScreen } from './startScreen.js';
import { MobileControls } from './mobileControls.js';
import { resetGameControllerRef, initInput, cleanupInput, onStart, onHelp, onEscape, onDifficulty, onPause } from '../controllers/input.js';

// Mobile restart callback
let mobileRestartCallback = null;
let touchEventAdded = false;

/**
 * Handle touch input for the mobile game over screen
 * @param {TouchEvent} event - The touch event
 */
export function handleMobileGameOverTouch(event) {
    // Prevent default behavior to avoid scrolling/zooming
    event.preventDefault();
    
    // Execute the restart callback if it exists
    if (mobileRestartCallback) {
        // Remove this handler immediately to prevent multiple calls
        if (event.currentTarget) {
            event.currentTarget.removeEventListener('touchstart', handleMobileGameOverTouch);
            touchEventAdded = false;
        }
        
        // Execute callback with a small delay to ensure touch is registered
        setTimeout(() => {
            mobileRestartCallback();
        }, 50);
    }
}

/**
 * Set up event listeners for the mobile game over screen
 * @param {HTMLCanvasElement} canvas - The canvas element to attach events to
 * @param {boolean} useOnce - Whether to use the {once: true} option for the event listener
 */
export function setupMobileGameOverEvents(canvas, useOnce = false) {
    // Always remove existing touch events first
    if (touchEventAdded) {
        canvas.removeEventListener('touchstart', handleMobileGameOverTouch);
        touchEventAdded = false;
    }
    
    // Add touch event listener
    if (useOnce) {
        canvas.addEventListener('touchstart', handleMobileGameOverTouch, { passive: false, once: true });
    } else {
        canvas.addEventListener('touchstart', handleMobileGameOverTouch, { passive: false });
        touchEventAdded = true;
    }
}

/**
 * Set the callback for mobile game restart
 * @param {Function} callback - Function to call when screen is touched to restart
 */
export function onMobileRestart(callback) {
    mobileRestartCallback = callback;
    
    // When restart callback is set, make sure touch events are reconnected if needed
    if (touchEventAdded && callback) {
        const canvas = getCanvas().canvas;
        if (canvas) {
            // Remove and re-add touch event to ensure it uses the new callback
            canvas.removeEventListener('touchstart', handleMobileGameOverTouch);
            canvas.addEventListener('touchstart', handleMobileGameOverTouch, { passive: false });
        }
    }
}

/**
 * Reset all game state and force show the mobile start screen
 * This is an aggressive reset function for mobile devices
 * @param {Object} gameController - Reference to the game controller
 */
export function forceShowMobileStartScreen(gameController) {
    console.log("FORCE SHOWING START SCREEN FOR MOBILE");
    
    // Get access to game controller internals via function parameters
    const {
        animationFrameId,
        mobileControls,
        cleanupInputHandlers,
        setupInputHandlers,
        isGameStarted,
        isGameOver,
        gameRunning,
        isPaused,
        isHelpScreenVisible,
        player,
        asteroids,
        bullets,
        currentDifficulty,
        leaderboardData,
        gamesPlayedCount
    } = gameController;
    
    // Cancel animation frames if they exist
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        gameController.animationFrameId = null;
    }
    
    // Kill all timers
    const highestTimeoutId = setTimeout(";");
    for (let i = 0; i < highestTimeoutId; i++) {
        clearTimeout(i);
    }
    
    // Reset game state
    gameController.isGameStarted = false;
    gameController.isGameOver = false;
    gameController.gameRunning = false;
    gameController.isPaused = false;
    gameController.isHelpScreenVisible = false;
    
    // Clear entities
    gameController.player = null;
    gameController.asteroids = [];
    gameController.bullets = [];
    
    // Clean up mobile controls if they exist
    if (gameController.mobileControls) {
        gameController.mobileControls.cleanup();
        gameController.mobileControls = null;
    }
    
    // Clean up input handlers
    gameController.cleanupInputHandlers();
    onStart(null);
    onHelp(null);
    onEscape(null);
    onDifficulty(null);
    onPause(null);
    cleanupInput();
    
    // Get a fresh canvas
    const { canvas, ctx } = getCanvas();
    
    // Clear screen
    clear('black');
    
    // Reset controller reference and input
    resetGameControllerRef(gameController);
    initInput(canvas, gameController);
    
    // Set up input handlers again
    gameController.setupInputHandlers();
    
    // Draw the start screen
    drawStartScreen(ctx, gameController.currentDifficulty, gameController.leaderboardData, gameController.gamesPlayedCount);
    
    // Create fresh mobile controls
    gameController.mobileControls = new MobileControls(canvas, gameController);
} 