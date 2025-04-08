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
    }
    
    // Remove any existing event listeners first
    cleanupInput();
    
    // Add event listeners for keyboard input
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    if (isMobilePhone()) {
        setupTouchHandlers(canvas);
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
    // Clean up any existing touch handlers first
    if (touchStartHandler) {
        canvas.removeEventListener('touchstart', touchStartHandler);
        canvas.removeEventListener('touchmove', touchMoveHandler);
        canvas.removeEventListener('touchend', touchEndHandler);
    }
    
    // Very simple touch handler - no complex state tracking
    touchStartHandler = function(e) {
        // Prevent default to avoid scrolling
        e.preventDefault();
        
        console.log("Touch detected");
        
        // Get touch coordinates
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const x = (touch.clientX - rect.left) * (canvas.width / rect.width);
        const y = (touch.clientY - rect.top) * (canvas.height / rect.height);
        
        console.log(`Touch position: (${x}, ${y})`);
        
        // Calculate button dimensions
        const height = canvas.height;
        const width = canvas.width;
        const buttonHeight = height * 0.08;
        const buttonSpacing = height * 0.02;
        const buttonWidth = Math.min(width * 0.8, 400);
        const startY = height * 0.3;
        const buttonX = (width - buttonWidth) * 0.5;
        
        console.log(`Button positions: Easy y=${startY}, Medium y=${startY + buttonHeight + buttonSpacing}, Difficult y=${startY + 2 * (buttonHeight + buttonSpacing)}`);

        // Handle difficulty buttons
        if (x >= buttonX && x <= buttonX + buttonWidth) {
            // Easy button
            if (y >= startY && y <= startY + buttonHeight) {
                console.log("Easy button pressed");
                if (gameControllerRef) {
                    gameControllerRef.startGame('easy');
                }
                return;
            }
            
            // Medium button
            if (y >= startY + buttonHeight + buttonSpacing && 
                y <= startY + 2 * buttonHeight + buttonSpacing) {
                console.log("Medium button pressed");
                if (gameControllerRef) {
                    gameControllerRef.startGame('medium');
                }
                return;
            }
            
            // Difficult button
            if (y >= startY + 2 * (buttonHeight + buttonSpacing) && 
                y <= startY + 3 * buttonHeight + 2 * buttonSpacing) {
                console.log("Difficult button pressed");
                if (gameControllerRef) {
                    gameControllerRef.startGame('difficult');
                }
                return;
            }
        }
        
        console.log("Touch detected but not on a difficulty button");
    };
    
    touchMoveHandler = function(e) {
        e.preventDefault();
    };
    
    touchEndHandler = function(e) {
        e.preventDefault();
    };
    
    // Add event listeners with passive: false to prevent scrolling
    canvas.addEventListener('touchstart', touchStartHandler, { passive: false });
    canvas.addEventListener('touchmove', touchMoveHandler, { passive: false });
    canvas.addEventListener('touchend', touchEndHandler, { passive: false });
    
    console.log("Touch handlers set up");
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