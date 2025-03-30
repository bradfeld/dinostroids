/**
 * Images Service
 * 
 * This service handles loading and caching of images used in the game.
 */

import { IMAGES } from '../constants.js';

// Object to store loaded images
const imageCache = {};

/**
 * Preload all images needed for the game
 * @param {Function} callback - Function to call when all images are loaded
 */
export function preloadImages(callback) {
    console.log("Preloading dinosaur images...");
    let imagesLoaded = 0;
    const totalImages = Object.keys(IMAGES).length;
    
    // Function to handle when all images are loaded
    const onAllImagesLoaded = () => {
        console.log("All dinosaur images loaded successfully!");
        if (callback) callback();
    };
    
    // Function to handle individual image load
    const onImageLoad = (key) => {
        console.log(`${key} dinosaur image loaded.`);
        imagesLoaded++;
        if (imagesLoaded === totalImages) {
            onAllImagesLoaded();
        }
    };
    
    // Function to handle load errors
    const onImageError = (key, e) => {
        console.error(`Error loading ${key} dinosaur image:`, e);
        // Continue even if an image fails to load
        imagesLoaded++;
        if (imagesLoaded === totalImages) {
            onAllImagesLoaded();
        }
    };
    
    // Load each image
    Object.entries(IMAGES).forEach(([key, path]) => {
        const img = new Image();
        img.onload = () => onImageLoad(key);
        img.onerror = (e) => onImageError(key, e);
        img.src = path;
        imageCache[key] = img;
    });
}

/**
 * Get a loaded image by key
 * @param {string} key - Key of the image (bront, steg, trex)
 * @returns {HTMLImageElement|null} - The loaded image or null if not found
 */
export function getImageByKey(key) {
    return imageCache[key] || null;
}

/**
 * Check if all required images are loaded
 * @returns {boolean} - True if all images are loaded
 */
export function areImagesLoaded() {
    return Object.values(imageCache).every(img => img && img.complete);
} 