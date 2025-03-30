/**
 * Images Service
 * 
 * This service handles loading and caching of images used in the game.
 */

import { DINO_IMAGES } from '../constants.js';

// Object to store loaded images
const imageCache = {
    small: null,
    medium: null,
    large: null
};

/**
 * Preload all images needed for the game
 * @param {Function} callback - Function to call when all images are loaded
 */
export function preloadImages(callback) {
    console.log("Preloading dinosaur images...");
    let imagesLoaded = 0;
    const totalImages = Object.keys(DINO_IMAGES).length;
    
    // Function to handle when all images are loaded
    const onAllImagesLoaded = () => {
        console.log("All dinosaur images loaded successfully!");
        if (callback) callback();
    };
    
    // Function to handle individual image load
    const onImageLoad = (size) => {
        console.log(`${size} dinosaur image loaded.`);
        imagesLoaded++;
        if (imagesLoaded === totalImages) {
            onAllImagesLoaded();
        }
    };
    
    // Function to handle load errors
    const onImageError = (size, e) => {
        console.error(`Error loading ${size} dinosaur image:`, e);
        // Continue even if an image fails to load
        imagesLoaded++;
        if (imagesLoaded === totalImages) {
            onAllImagesLoaded();
        }
    };
    
    // Load each image
    Object.entries(DINO_IMAGES).forEach(([size, path]) => {
        const img = new Image();
        img.onload = () => onImageLoad(size);
        img.onerror = (e) => onImageError(size, e);
        img.src = path;
        imageCache[size] = img;
    });
}

/**
 * Get a loaded image by size
 * @param {string} size - Size of the image (small, medium, large)
 * @returns {HTMLImageElement|null} - The loaded image or null if not found
 */
export function getImage(size) {
    return imageCache[size] || null;
}

/**
 * Check if all required images are loaded
 * @returns {boolean} - True if all images are loaded
 */
export function areImagesLoaded() {
    return Object.values(imageCache).every(img => img && img.complete);
} 