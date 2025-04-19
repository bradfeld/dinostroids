/**
 * Images Service
 * 
 * This service handles loading and caching of images used in the game.
 * With vector graphics for dinosaurs, this service is simplified.
 */

/**
 * Preload all images needed for the game
 * This is now a placeholder that resolves immediately since we use vector graphics
 * @param {Function} [callback] - Optional callback function when all images are loaded
 * @returns {Promise} - Promise that resolves immediately
 */
export function preloadImages(callback) {
    console.log("Using vector graphics, no image preloading needed");
    
    // Call the callback immediately if provided
    if (callback) callback();
    
    // Return a resolved promise
    return Promise.resolve();
}

/**
 * Get a loaded image by key - replaced by vector graphics
 * This is now just a placeholder function for backward compatibility
 * @param {string} key - Key of the image (bront, steg, trex)
 * @returns {null} - Always returns null as we're using vector graphics
 */
export function getImageByKey(key) {
    return null;
}

/**
 * Check if all required images are loaded
 * With vector graphics, we always return true
 * @returns {boolean} - Always returns true
 */
export function areImagesLoaded() {
    return true;
} 