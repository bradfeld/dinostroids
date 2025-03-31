/**
 * Asteroid Entity
 * 
 * Represents the dinosaur-themed asteroids in the game.
 */

import { getDimensions } from '../canvas.js';
import { ASTEROID_SETTINGS, DIFFICULTY_SETTINGS } from '../constants.js';
import { getImageByKey } from '../services/images.js';
import { randomFloatBetween, randomInt } from '../utils.js';

class Asteroid {
  /**
   * Create a new asteroid
   * @param {string} type - The type of asteroid ('bront', 'steg', or 'trex')
   * @param {number} size - Size category (1: large, 2: medium, 3: small)
   * @param {number} x - Initial x position (optional)
   * @param {number} y - Initial y position (optional) 
   * @param {string} difficulty - Difficulty level ('easy', 'medium', 'difficult')
   */
  constructor(type, size, x, y, difficulty = 'medium') {
    const { width, height } = getDimensions();
    this.type = type || this.getRandomType();
    this.size = size || 1; // Default is large (1)
    this.difficulty = difficulty;
    
    // Set radius based on size
    this.radius = ASTEROID_SETTINGS.BASE_RADIUS / this.size;
    
    // Set position, random if not provided
    this.x = x !== undefined ? x : randomFloatBetween(0, width);
    this.y = y !== undefined ? y : randomFloatBetween(0, height);
    
    // Get the appropriate speed based on difficulty and size
    const sizeCategory = this.getSizeCategory();
    const speedRange = DIFFICULTY_SETTINGS[difficulty].asteroidSpeed[sizeCategory];
    const speed = randomFloatBetween(speedRange.min, speedRange.max);
    
    // Set velocity based on difficulty-adjusted speed
    this.velocityX = randomFloatBetween(-1, 1) * speed;
    this.velocityY = randomFloatBetween(-1, 1) * speed;
    
    // Rotation properties
    this.rotation = 0;
    this.rotationSpeed = randomFloatBetween(-1, 1) * ASTEROID_SETTINGS.ROTATION_SPEED;
    
    // Load the image for this asteroid type
    const imageKey = this.getImageKey();
    this.image = getImageByKey(imageKey);
    
    // Calculate points based on size
    this.points = ASTEROID_SETTINGS.POINTS_BASE * this.size;
  }
  
  /**
   * Convert size number to category string
   * @returns {string} Size category ('large', 'medium', 'small')
   */
  getSizeCategory() {
    switch (this.size) {
      case 1: return 'large';
      case 2: return 'medium';
      case 3: return 'small';
      default: return 'large';
    }
  }
  
  /**
   * Get a random asteroid type
   * @returns {string} Random asteroid type
   */
  getRandomType() {
    const types = ['bront', 'steg', 'trex'];
    return types[randomInt(0, types.length - 1)];
  }
  
  /**
   * Get the image key for this asteroid type
   * @returns {string} Image key
   */
  getImageKey() {
    return this.type;
  }
  
  /**
   * Update the asteroid's position
   * @param {number} deltaTime - Time since last update in milliseconds
   */
  update(deltaTime) {
    // Update position based on velocity
    this.x += this.velocityX;
    this.y += this.velocityY;
    
    // Update rotation
    this.rotation += this.rotationSpeed * deltaTime;
    
    // Screen wrapping
    const { width, height } = getDimensions();
    
    if (this.x < -this.radius) this.x = width + this.radius;
    if (this.x > width + this.radius) this.x = -this.radius;
    if (this.y < -this.radius) this.y = height + this.radius;
    if (this.y > height + this.radius) this.y = -this.radius;
  }
  
  /**
   * Draw the asteroid
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   */
  draw(ctx) {
    ctx.save();
    
    // Position and rotate
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    
    if (this.image) {
      // Draw the dinosaur image with proper scaling
      const scale = (this.radius * 2) / Math.max(this.image.width, this.image.height);
      const width = this.image.width * scale;
      const height = this.image.height * scale;
      
      ctx.drawImage(
        this.image,
        -width / 2,
        -height / 2,
        width,
        height
      );
    } else {
      // Fallback if image isn't loaded
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.strokeStyle = 'gray';
      ctx.stroke();
    }
    
    ctx.restore();
  }
  
  /**
   * Break the asteroid into smaller pieces
   * @returns {Array} New asteroids (or empty array if asteroid is too small)
   */
  break() {
    // If it's already the smallest size, it's destroyed completely
    if (this.size >= 3) {
      return [];
    }
    
    // Create 2 smaller asteroids of the same type
    const newSize = this.size + 1;
    const newAsteroids = [];
    
    // Create two new asteroids at the current position
    for (let i = 0; i < 2; i++) {
      // Add some variation to position and velocity
      const offsetX = randomFloatBetween(-10, 10);
      const offsetY = randomFloatBetween(-10, 10);
      
      const asteroid = new Asteroid(
        this.type,
        newSize,
        this.x + offsetX,
        this.y + offsetY,
        this.difficulty // Pass the same difficulty to child asteroids
      );
      
      // Make the velocity direction differ from the parent
      const sizeCategory = asteroid.getSizeCategory();
      const speedRange = DIFFICULTY_SETTINGS[this.difficulty].asteroidSpeed[sizeCategory];
      const speed = randomFloatBetween(speedRange.min, speedRange.max);
      
      // Normalize and apply new speed
      const vx = this.velocityX + randomFloatBetween(-1, 1);
      const vy = this.velocityY + randomFloatBetween(-1, 1);
      const mag = Math.sqrt(vx * vx + vy * vy);
      
      asteroid.velocityX = (vx / mag) * speed;
      asteroid.velocityY = (vy / mag) * speed;
      
      newAsteroids.push(asteroid);
    }
    
    return newAsteroids;
  }
  
  /**
   * Check if this asteroid is colliding with another entity
   * @param {Object} entity - The entity to check collision with
   * @returns {boolean} Whether a collision occurred
   */
  isCollidingWith(entity) {
    const dx = this.x - entity.x;
    const dy = this.y - entity.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    return distance < this.radius + entity.radius;
  }
}

export default Asteroid; 