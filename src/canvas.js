/**
 * Canvas Module
 * 
 * This module handles the canvas and its context,
 * including initialization and resize functionality.
 */

// Canvas and context
let canvas;
let ctx;

/**
 * Initialize the canvas and context
 * @returns {Object} The canvas and context
 */
export function initCanvas() {
  canvas = document.getElementById('gameCanvas');
  ctx = canvas.getContext('2d');
  
  // Set initial dimensions
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
 * Resize the canvas to fill the window
 */
export function resizeToWindow() {
  if (!canvas) return;
  
  console.log("Resizing canvas to fit window...");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

/**
 * Clear the canvas with a background color
 * @param {string} color - Background color (default: black)
 */
export function clear(color = 'black') {
  if (!ctx || !canvas) return;
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

/**
 * Get current canvas dimensions
 * @returns {Object} Width and height of the canvas
 */
export function getDimensions() {
  if (!canvas) return { width: 0, height: 0 };
  return { width: canvas.width, height: canvas.height };
} 