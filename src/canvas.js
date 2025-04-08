/**
 * Canvas Module
 * 
 * This module handles the canvas and its context,
 * including initialization and resize functionality.
 */

import { isMobilePhone } from './utils/device.js';

// Canvas and context
let canvas = null;
let ctx = null;

/**
 * Initialize the canvas
 * @returns {Object} The canvas and context
 */
export function initCanvas() {
  canvas = document.createElement('canvas');
  ctx = canvas.getContext('2d');
  document.body.appendChild(canvas);
  
  // Set initial canvas size
  resizeToWindow();
  
  return { canvas, ctx };
}

/**
 * Get the canvas and context
 * @returns {Object} The canvas and context
 */
export function getCanvas() {
  return { canvas, ctx };
}

/**
 * Resize the canvas to fit the window
 */
export function resizeToWindow() {
  if (!canvas) return;
  
  console.log("Resizing canvas to fit window...");
  
  if (isMobilePhone()) {
    // Get the actual viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Set canvas size to match viewport
    canvas.width = viewportWidth;
    canvas.height = viewportHeight;
    
    // Prevent scrolling/bouncing on mobile
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    
    // Set viewport meta tag for mobile
    let viewport = document.querySelector('meta[name=viewport]');
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.name = 'viewport';
      document.head.appendChild(viewport);
    }
    viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
    
    // Position canvas
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    
    console.log(`Mobile canvas size set to: ${canvas.width}x${canvas.height}`);
  } else {
    // On desktop, maintain the 16:9 aspect ratio with max dimensions
    const maxWidth = Math.min(1920, window.innerWidth - 40);
    const maxHeight = Math.min(1080, window.innerHeight - 40);
    
    // Calculate dimensions maintaining aspect ratio
    let width = maxWidth;
    let height = width * (9/16);
    
    if (height > maxHeight) {
      height = maxHeight;
      width = height * (16/9);
    }
    
    canvas.width = width;
    canvas.height = height;
    
    // Center the canvas
    canvas.style.position = 'absolute';
    canvas.style.left = '50%';
    canvas.style.top = '50%';
    canvas.style.transform = 'translate(-50%, -50%)';
  }
  
  // Set canvas background
  canvas.style.backgroundColor = 'black';
}

/**
 * Clear the canvas with a background color
 * @param {string} color - The background color
 */
export function clear(color = 'black') {
  if (!ctx || !canvas) return;
  
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

/**
 * Get the canvas dimensions
 * @returns {Object} The width and height
 */
export function getDimensions() {
  return { width: canvas.width, height: canvas.height };
} 