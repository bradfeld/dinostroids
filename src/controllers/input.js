/**
 * Input Controller
 * 
 * This controller handles user input for the game.
 */

// Track pressed keys
const keys = {};

// Input event handlers
let onStartCallback = null;
let onHelpCallback = null;

/**
 * Initialize keyboard input handlers
 */
export function initInput() {
    // Add event listeners for keyboard input
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
}

/**
 * Handle keydown events
 * @param {KeyboardEvent} event - The keyboard event
 */
function handleKeyDown(event) {
    keys[event.code] = true;
    
    // Handle space bar for starting game
    if (event.code === 'Space' && onStartCallback) {
        onStartCallback();
    }
    
    // Handle H key for help screen
    if ((event.code === 'KeyH' || event.key === 'h') && onHelpCallback) {
        onHelpCallback();
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
 * Check if a key is currently pressed
 * @param {string} code - The key code to check
 * @returns {boolean} - Whether the key is pressed
 */
export function isKeyPressed(code) {
    return keys[code] === true;
}

/**
 * Register a callback for when the start button (space) is pressed
 * @param {Function} callback - The function to call when start is pressed
 */
export function onStart(callback) {
    onStartCallback = callback;
}

/**
 * Register a callback for when the help button (H) is pressed
 * @param {Function} callback - The function to call when help is pressed
 */
export function onHelp(callback) {
    onHelpCallback = callback;
}

/**
 * Clean up event listeners
 */
export function cleanupInput() {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
} 