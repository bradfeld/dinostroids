/**
 * Input Controller
 * 
 * This controller handles user input for the game.
 */

import { isMobilePhone } from '../utils/device.js';

// Track pressed keys
const keys = {};

// Input event handlers
let onStartCallback = null;
let onHelpCallback = null;
let onEscapeCallback = null;
let difficultyCallback = null;

// Touch handler references for cleanup
let touchStartHandler = null;
let touchMoveHandler = null;
let touchEndHandler = null;

// Game controller reference for direct access
let gameControllerRef = null;

/**
 * Initialize keyboard input handlers
 */
export function initInput(canvas, gameController = null) {
    console.log("Initializing input with game controller:", gameController ? "provided" : "not provided");
    
    // Store game controller reference if provided
    if (gameController) {
        gameControllerRef = gameController;
        console.log("Game controller reference stored successfully");
    } else {
        console.warn("No game controller provided to initInput");
    }
    
    // Remove any existing event listeners first
    cleanupInput();
    
    // Add event listeners for keyboard input
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    if (isMobilePhone()) {
        console.log("Mobile device detected, setting up touch handlers");
        setupTouchHandlers(canvas);
    } else {
        console.log("Desktop device detected, using keyboard controls only");
    }
}

/**
 * Handle keydown events
 * @param {KeyboardEvent} event - The keyboard event
 */
function handleKeyDown(event) {
    keys[event.code] = true;
    
    // Handle Enter key for starting game
    if ((event.code === 'Enter' || event.code === 'NumpadEnter') && onStartCallback) {
        onStartCallback();
    }
    
    // Handle ? key for help screen (Slash key with Shift)
    if ((event.key === '?' || (event.code === 'Slash' && event.shiftKey)) && onHelpCallback) {
        onHelpCallback();
        // Prevent browser from showing its own search dialog with ?
        event.preventDefault();
    }
    
    // Handle Escape key to end game and return to start screen
    if (event.code === 'Escape' && onEscapeCallback) {
        onEscapeCallback();
    }
    
    // Handle difficulty selection keys (E, M, D)
    if (difficultyCallback) {
        if (event.code === 'KeyE') {
            difficultyCallback('easy');
        } else if (event.code === 'KeyM') {
            difficultyCallback('medium');
        } else if (event.code === 'KeyD') {
            difficultyCallback('difficult');
        }
    }
}

/**
 * Handle keyup events
 * @param {KeyboardEvent} event - The keyboard event
 */
function handleKeyUp(event) {
    keys[event.code] = false;
}

/**
 * Set up touch event handlers for mobile
 * @param {HTMLCanvasElement} canvas - The game canvas
 */
function setupTouchHandlers(canvas) {
    console.log("⭐ Setting up simplified touch handlers for mobile");
    
    // Clean up any existing touch handlers first
    if (touchStartHandler) {
        canvas.removeEventListener('touchstart', touchStartHandler);
        canvas.removeEventListener('touchmove', touchMoveHandler);
        canvas.removeEventListener('touchend', touchEndHandler);
    }
    
    // Create a simple touch handler that detects any touch on the screen
    // and starts the game with medium difficulty
    touchStartHandler = function(e) {
        e.preventDefault();
        
        console.log("⭐ Touch detected - Starting game with medium difficulty");
        
        // Check if game controller exists
        if (!gameControllerRef) {
            console.error("No game controller reference available");
            return;
        }
        
        // Start game with medium difficulty (ignoring touch position)
        if (typeof gameControllerRef.startGame === 'function') {
            gameControllerRef.startGame('medium');
        } else {
            console.error("startGame is not a function on gameControllerRef");
        }
    };
    
    touchMoveHandler = function(e) {
        e.preventDefault();
    };
    
    touchEndHandler = function(e) {
        e.preventDefault();
    };
    
    // Add event listeners with passive: false to prevent scrolling
    console.log("Adding simplified touch event listeners");
    canvas.addEventListener('touchstart', touchStartHandler, { passive: false });
    canvas.addEventListener('touchmove', touchMoveHandler, { passive: false });
    canvas.addEventListener('touchend', touchEndHandler, { passive: false });
    console.log("Touch handlers successfully set up");
}

/**
 * Check if a key is currently pressed
 * @param {string} code - The key code to check
 * @returns {boolean} - Whether the key is pressed
 */
export function isKeyPressed(code) {
    return keys[code] === true;
}

/**
 * Register a callback for when the start button (Enter) is pressed
 * @param {Function|null} callback - The function to call when start is pressed, or null to clear
 */
export function onStart(callback) {
    onStartCallback = callback;
}

/**
 * Register a callback for when the help button (?) is pressed
 * @param {Function|null} callback - The function to call when help is pressed, or null to clear
 */
export function onHelp(callback) {
    onHelpCallback = callback;
}

/**
 * Register a callback for when the escape key is pressed
 * @param {Function|null} callback - The function to call when escape is pressed, or null to clear
 */
export function onEscape(callback) {
    onEscapeCallback = callback;
}

/**
 * Set callback for difficulty change
 * @param {Function} callback - Callback function
 */
export function onDifficulty(callback) {
    difficultyCallback = callback;
}

/**
 * Clean up event listeners
 */
export function cleanupInput() {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
}