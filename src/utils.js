/**
 * Utility Functions
 * 
 * This file contains utility functions used throughout the game.
 */

/**
 * Generate a random integer between min and max (inclusive)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random integer between min and max
 */
export function randomIntBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate a random float between min and max
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random float between min and max
 */
export function randomFloatBetween(min, max) {
  return Math.random() * (max - min) + min;
}

/**
 * Wraps an object around the screen boundaries
 * @param {Object} object - The object to wrap (must have x, y properties)
 * @param {number} canvasWidth - The width of the canvas
 * @param {number} canvasHeight - The height of the canvas
 */
export function wrapAround(object, canvasWidth, canvasHeight) {
  // Use object.radius if it exists (for Asteroids), otherwise use object.size (for Player)
  const size = typeof object.radius !== 'undefined' ? object.radius : object.size;
  
  if (object.x < -size) object.x = canvasWidth + size;
  if (object.x > canvasWidth + size) object.x = -size;
  if (object.y < -size) object.y = canvasHeight + size;
  if (object.y > canvasHeight + size) object.y = -size;
}

/**
 * Checks for collision between two circular objects
 * @param {Object} obj1 - First object with x, y properties and radius or size
 * @param {Object} obj2 - Second object with x, y properties and radius or size
 * @returns {boolean} - True if objects are colliding
 */
export function checkCollision(obj1, obj2) {
  const dx = obj1.x - obj2.x;
  const dy = obj1.y - obj2.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Use .radius if available, otherwise .size
  const size1 = typeof obj1.radius !== 'undefined' ? obj1.radius : obj1.size;
  const size2 = typeof obj2.radius !== 'undefined' ? obj2.radius : obj2.size;
  
  return distance < size1 + size2;
}

/**
 * Converts vertex array to SVG path data
 * @param {Array} vertices - Array of {x, y} coordinates
 * @returns {string} - SVG path data string
 */
export function verticesToPathData(vertices) {
  if (!vertices || vertices.length === 0) return "";
  
  let path = `M ${vertices[0].x} ${vertices[0].y}`;
  for (let i = 1; i < vertices.length; i++) {
      path += ` L ${vertices[i].x} ${vertices[i].y}`;
  }
  path += " Z"; // Close the path
  
  return path;
} 