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

// Track whether a touch is currently being processed
let processingTouch = false;

/**
 * Initialize keyboard input handlers
 */
export function initInput(canvas, gameController = null) {
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
    
    // Reset touch processing flag
    processingTouch = false;
    
    // Create new handlers
    touchStartHandler = function(e) {
        e.preventDefault();
        
        // Prevent multiple rapid touches
        if (processingTouch) {
            console.log("Ignoring touch - already processing another touch");
            return;
        }
        
        processingTouch = true;
        console.log("Touch start detected");
        
        try {
            // Get touch coordinates
            const touch = e.touches[0];
            const rect = canvas.getBoundingClientRect();
            const x = (touch.clientX - rect.left) * (canvas.width / rect.width);
            const y = (touch.clientY - rect.top) * (canvas.height / rect.height);
            
            // Calculate button dimensions
            const height = canvas.height;
            const width = canvas.width;
            const buttonHeight = height * 0.08;
            const buttonSpacing = height * 0.02;
            const buttonWidth = Math.min(width * 0.8, 400);
            const startY = height * 0.3;
            const buttonX = (width - buttonWidth) * 0.5;
    
            // Check if a difficulty button was pressed
            const difficulties = ['easy', 'medium', 'difficult'];
            for (let i = 0; i < difficulties.length; i++) {
                const diff = difficulties[i];
                const buttonY = startY + (buttonHeight + buttonSpacing) * i;
                
                if (x >= buttonX && x <= buttonX + buttonWidth &&
                    y >= buttonY && y <= buttonY + buttonHeight) {
                    
                    console.log("Difficulty selected:", diff);
                    
                    // Just change the difficulty, don't start the game yet
                    if (difficultyCallback) {
                        difficultyCallback(diff);
                    }
                    
                    // Release touch processing lock after a short delay
                    setTimeout(() => {
                        processingTouch = false;
                    }, 100);
                    
                    return;
                }
            }
            
            // If no difficulty button was tapped, start the game
            console.log("Starting game (tap outside difficulty buttons)");
            if (onStartCallback) {
                onStartCallback();
            }
            
        } catch (err) {
            console.error("Error in touch handler:", err);
        }
        
        // Release touch processing lock
        setTimeout(() => {
            processingTouch = false;
        }, 100);
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