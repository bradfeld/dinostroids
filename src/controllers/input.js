/**
 * Input Controller
 * 
 * This controller handles keyboard input and maintains the state of keys.
 */

// Object to store key states
const keys = {};

/**
 * Initialize input handlers
 * @param {Object} callbacks - Callback functions for specific keys
 */
export function initInputHandlers(callbacks = {}) {
    const {
        onHelpToggle,
        onDifficultySelect,
        onEscape
    } = callbacks;
    
    // Set up keydown event listener
    document.addEventListener('keydown', (event) => {
        keys[event.key] = true;
        
        // Toggle help screen on '?' press
        if (event.key === '?' && onHelpToggle) {
            onHelpToggle();
            event.preventDefault(); // Prevent browser find (?)
        }
        
        // Select difficulty
        if (event.key.toLowerCase() === 'e' && onDifficultySelect) {
            onDifficultySelect('easy');
            event.preventDefault();
        } else if (event.key.toLowerCase() === 'm' && onDifficultySelect) {
            onDifficultySelect('medium');
            event.preventDefault();
        } else if (event.key.toLowerCase() === 'd' && onDifficultySelect) {
            onDifficultySelect('difficult');
            event.preventDefault();
        }
        
        // Handle escape key
        if (event.key === 'Escape' && onEscape) {
            onEscape();
            event.preventDefault();
        }
    });
    
    // Set up keyup event listener
    document.addEventListener('keyup', (event) => {
        keys[event.key] = false;
    });
}

/**
 * Check if a key is currently pressed
 * @param {string} key - The key to check
 * @returns {boolean} - True if the key is pressed
 */
export function isKeyPressed(key) {
    return !!keys[key];
}

/**
 * Get the state of all keys
 * @returns {Object} - The current state of all keys
 */
export function getKeys() {
    return keys;
}

/**
 * Clear all key states
 */
export function clearKeys() {
    for (const key in keys) {
        keys[key] = false;
    }
} 