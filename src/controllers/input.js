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
    
    // Create new handlers
    touchStartHandler = function(e) {
        e.preventDefault();
        
        console.log("Touch start detected");
        
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const x = (touch.clientX - rect.left) * (canvas.width / rect.width);
        const y = (touch.clientY - rect.top) * (canvas.height / rect.height);
        
        const height = canvas.height;
        const width = canvas.width;
        const buttonHeight = height * 0.08;
        const buttonSpacing = height * 0.02;
        const buttonWidth = Math.min(width * 0.8, 400);
        const startY = height * 0.3;
        const buttonX = (width - buttonWidth) * 0.5;

        const difficulties = ['easy', 'medium', 'difficult'];
        let buttonPressed = false;

        for (let index = 0; index < difficulties.length; index++) {
            const diff = difficulties[index];
            const buttonY = startY + (buttonHeight + buttonSpacing) * index;
            
            if (x >= buttonX && x <= buttonX + buttonWidth &&
                y >= buttonY && y <= buttonY + buttonHeight) {
                
                console.log(`Difficulty button pressed: ${diff}`);
                buttonPressed = true;
                
                // Use direct startGame call if game controller is available
                if (gameControllerRef) {
                    console.log("Starting game directly with difficulty:", diff);
                    setTimeout(() => gameControllerRef.startGame(diff), 0);
                } else if (difficultyCallback) {
                    // Fallback to callback if no direct reference
                    console.log("Using callback for difficulty:", diff);
                    setTimeout(() => difficultyCallback(diff), 0);
                }
                
                // Exit the loop once we found a button
                break;
            }
        }

        // If no difficulty button was pressed, start the game
        if (!buttonPressed) {
            console.log('No difficulty button pressed, starting game with current difficulty');
            
            if (gameControllerRef) {
                // Start game with current difficulty
                setTimeout(() => gameControllerRef.startGame(), 0);
            } else if (onStartCallback) {
                // Fallback to callback
                setTimeout(() => onStartCallback(), 0);
            }
        }
    };
    
    touchMoveHandler = function(e) {
        e.preventDefault();
    };
    
    touchEndHandler = function(e) {
        e.preventDefault();
    };
    
    // Add event listeners
    canvas.addEventListener('touchstart', touchStartHandler, { passive: false });
    canvas.addEventListener('touchmove', touchMoveHandler, { passive: false });
    canvas.addEventListener('touchend', touchEndHandler, { passive: false });
    
    console.log("Touch handlers set up successfully");
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