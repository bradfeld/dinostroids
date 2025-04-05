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
   * @param {number} speedMultiplier - Speed multiplier from current level (optional)
   */
  constructor(type, size, x, y, difficulty = 'medium', speedMultiplier = 1.0) {
    const { width, height } = getDimensions();
    
    // Debug inputs
    console.log(`Asteroid constructor called with type=${type}, size=${size}, difficulty=${difficulty}, speedMultiplier=${speedMultiplier}`);
    
    this.type = type || this.getRandomType();
    this.size = size || 1; // Default is large (1)
    this.difficulty = difficulty;
    this.speedMultiplier = speedMultiplier; // Store for child asteroids
    
    // Set radius based on size
    this.radius = ASTEROID_SETTINGS.BASE_RADIUS / this.size;
    
    // Set position, random if not provided
    this.x = x !== undefined ? x : randomFloatBetween(0, width);
    this.y = y !== undefined ? y : randomFloatBetween(0, height);
    
    // Debug the asteroid creation
    console.log(`Creating asteroid: type=${this.type}, size=${this.size}, at (${this.x.toFixed(1)}, ${this.y.toFixed(1)})`);
    
    // Get the appropriate speed based on difficulty and size
    const sizeCategory = this.getSizeCategory();
    console.log(`Size category: ${sizeCategory}, Difficulty settings: ${JSON.stringify(DIFFICULTY_SETTINGS[difficulty])}`);
    
    const speedRange = DIFFICULTY_SETTINGS[difficulty].asteroidSpeed[sizeCategory];
    const baseSpeed = randomFloatBetween(speedRange.min, speedRange.max);
    
    // Apply the level speed multiplier 
    const speed = baseSpeed * speedMultiplier;
    console.log(`Base speed: ${baseSpeed.toFixed(2)}, Final speed with multiplier: ${speed.toFixed(2)}`);
    
    // Set velocity based on a random angle to ensure all directions are covered
    const angle = Math.random() * Math.PI * 2; // Random angle between 0 and 2π
    this.velocityX = Math.cos(angle) * speed;
    this.velocityY = Math.sin(angle) * speed;
    console.log(`Velocity: (${this.velocityX.toFixed(2)}, ${this.velocityY.toFixed(2)})`);
    
    // Rotation properties
    this.rotation = 0;
    this.rotationSpeed = randomFloatBetween(-1, 1) * ASTEROID_SETTINGS.ROTATION_SPEED;
    
    // Load the image for this asteroid type
    const imageKey = this.getImageKey();
    console.log(`Loading asteroid image: ${imageKey}`);
    this.image = getImageByKey(imageKey);
    
    if (!this.image) {
      console.error(`Failed to load image for asteroid type: ${imageKey}`);
    }
    
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
    console.log('Getting random asteroid type from:', ASTEROID_SETTINGS.TYPES);
    if (!ASTEROID_SETTINGS.TYPES || ASTEROID_SETTINGS.TYPES.length === 0) {
      console.warn('No asteroid types defined, defaulting to "bront"');
      return 'bront';
    }
    const index = randomInt(0, ASTEROID_SETTINGS.TYPES.length - 1);
    const type = ASTEROID_SETTINGS.TYPES[index];
    console.log(`Selected random asteroid type: ${type} at index ${index}`);
    return type;
  }
  
  /**
   * Get the image key for this asteroid type
   * @returns {string} Image key
   */
  getImageKey() {
    // Debug the asteroid type
    console.log(`Getting image key for type: ${this.type}`);
    
    // Make sure we have a valid type, defaulting to a known one if not
    if (!this.type || !ASTEROID_SETTINGS.TYPES.includes(this.type)) {
      console.warn(`Invalid asteroid type: ${this.type}, defaulting to 'bront'`);
      this.type = 'bront';
    }
    
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
    
    const newAsteroids = [];
    
    // Different breaking patterns based on asteroid size
    if (this.size === 1) {
      // Large asteroid - multiple possible outcomes
      const breakPattern = Math.random();
      
      if (breakPattern < 0.25) {
        // Two medium asteroids (25% chance)
        this.createChildAsteroids(2, 2, newAsteroids);
      } else if (breakPattern < 0.45) {
        // Two small asteroids (20% chance)
        this.createChildAsteroids(2, 3, newAsteroids);
      } else if (breakPattern < 0.75) {
        // One medium and one small asteroid (30% chance)
        this.createChildAsteroids(1, 2, newAsteroids);
        this.createChildAsteroids(1, 3, newAsteroids);
      } else if (breakPattern < 0.90) {
        // One medium asteroid (15% chance)
        this.createChildAsteroids(1, 2, newAsteroids);
      } else {
        // One small asteroid (10% chance)
        this.createChildAsteroids(1, 3, newAsteroids);
      }
    } else if (this.size === 2) {
      // Medium asteroid - can become two smalls or one small
      if (Math.random() < 0.7) {
        // Two small asteroids (70% chance)
        this.createChildAsteroids(2, 3, newAsteroids);
      } else {
        // One small asteroid (30% chance)
        this.createChildAsteroids(1, 3, newAsteroids);
      }
    }
    
    return newAsteroids;
  }
  
  /**
   * Create a specified number of child asteroids of a specific size
   * @param {number} count - Number of asteroids to create
   * @param {number} size - Size of the asteroids (2=medium, 3=small)
   * @param {Array} targetArray - Array to add the new asteroids to
   */
  createChildAsteroids(count, size, targetArray) {
    for (let i = 0; i < count; i++) {
      // Add some variation to position and velocity
      const offsetX = randomFloatBetween(-10, 10);
      const offsetY = randomFloatBetween(-10, 10);
      
      // Calculate parent's current speed
      const parentSpeed = Math.sqrt(this.velocityX * this.velocityX + this.velocityY * this.velocityY);
      console.log(`Parent asteroid speed: ${parentSpeed.toFixed(2)}`);
      
      const asteroid = new Asteroid(
        this.type,
        size,
        this.x + offsetX,
        this.y + offsetY,
        this.difficulty, // Pass the same difficulty to child asteroids
        this.speedMultiplier // Pass the same speed multiplier to child asteroids
      );
      
      // Generate a random angle for velocity direction
      const angle = Math.random() * Math.PI * 2; // Random angle between 0 and 2π
      
      // Use the PARENT'S exact speed instead of recalculating from the speed range
      // This ensures consistent speed within a level
      const speed = parentSpeed;
      console.log(`Child asteroid using parent's speed: ${speed.toFixed(2)}`);
      
      // Set velocity based on the random angle
      asteroid.velocityX = Math.cos(angle) * speed;
      asteroid.velocityY = Math.sin(angle) * speed;
      
      targetArray.push(asteroid);
    }
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