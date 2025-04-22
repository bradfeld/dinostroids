/**
 * Asteroid Entity
 * 
 * Represents the dinosaur-themed asteroids in the game.
 */

import { getDimensions } from '../canvas.js';
import { ASTEROID_SETTINGS, DIFFICULTY_SETTINGS } from '../constants.js';
import { randomFloatBetween, randomInt } from '../utils.js';
import { drawDinosaur } from '../services/vectorDinos.js';

class Asteroid {
  /**
   * Create a new asteroid
   * @param {string} type - The type of asteroid ('bront', 'steg', or 'trex')
   * @param {number} size - Size category (1: large, 2: medium, 3: small)
   * @param {number} x - Initial x position (optional)
   * @param {number} y - Initial y position (optional) 
   * @param {string} difficulty - Difficulty level ('easy', 'medium', 'difficult')
   * @param {number} speedMultiplier - Speed multiplier from current level (optional)
   * @param {number} fixedBaseSpeed - Fixed base speed to use for all asteroids (optional)
   */
  constructor(type, size, x, y, difficulty = 'medium', speedMultiplier = 1.0, fixedBaseSpeed = null) {
    const { width, height } = getDimensions();
    
    // Debug inputs
    console.log(`Asteroid constructor called with type=${type}, size=${size}, difficulty=${difficulty}, speedMultiplier=${speedMultiplier}, fixedBaseSpeed=${fixedBaseSpeed}`);
    
    this.type = type || this.getRandomType();
    this.size = size || 1; // Default is large (1)
    this.difficulty = difficulty;
    this.speedMultiplier = speedMultiplier; // Store for child asteroids
    this.fixedBaseSpeed = fixedBaseSpeed; // Store the fixed base speed for child asteroids
    
    // Set radius based on size
    this.radius = ASTEROID_SETTINGS.BASE_RADIUS / this.size;
    
    // Set position, random if not provided
    this.x = x !== undefined ? x : randomFloatBetween(0, width);
    this.y = y !== undefined ? y : randomFloatBetween(0, height);
    
    // Debug the asteroid creation
    console.log(`Creating asteroid: type=${this.type}, size=${this.size}, at (${this.x.toFixed(1)}, ${this.y.toFixed(1)})`);
    
    // Determine the speed to use
    let baseSpeed;
    
    if (fixedBaseSpeed !== null) {
      // Use the provided fixed base speed for consistency
      baseSpeed = fixedBaseSpeed;
      console.log(`Using fixed base speed: ${baseSpeed.toFixed(2)}`);
    } else {
      // If no fixed speed provided, fall back to the difficulty settings
      const sizeCategory = this.getSizeCategory();
      console.log(`No fixed speed, using size category: ${sizeCategory}`);
      
      const speedRange = DIFFICULTY_SETTINGS[difficulty].asteroidSpeed.medium; // Always use medium speed
      baseSpeed = (speedRange.min + speedRange.max) / 2;
    }
    
    // Apply the level speed multiplier 
    const speed = baseSpeed * speedMultiplier;
    console.log(`Final speed with multiplier: ${speed.toFixed(2)}`);
    
    // Set velocity based on a random angle to ensure all directions are covered
    const angle = Math.random() * Math.PI * 2; // Random angle between 0 and 2π
    this.velocityX = Math.cos(angle) * speed;
    this.velocityY = Math.sin(angle) * speed;
    console.log(`Velocity: (${this.velocityX.toFixed(2)}, ${this.velocityY.toFixed(2)})`);
    
    // Rotation properties
    this.rotation = 0;
    this.rotationSpeed = randomFloatBetween(-1, 1) * ASTEROID_SETTINGS.ROTATION_SPEED;
    
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
    
    // Draw the vector dinosaur
    drawDinosaur(ctx, this.type, 0, 0, this.radius * 2, '#FFFFFF');
    
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
    // Calculate parent's direction angle
    const parentAngle = Math.atan2(this.velocityY, this.velocityX);
    console.log(`Parent asteroid direction angle: ${(parentAngle * 180 / Math.PI).toFixed(2)} degrees`);
    
    for (let i = 0; i < count; i++) {
      // Add some variation to position and velocity
      const offsetAngle = parentAngle + randomFloatBetween(-Math.PI/4, Math.PI/4);
      
      // Create child offset from parent position
      const offsetDistance = this.radius * 0.8;
      const childX = this.x + Math.cos(offsetAngle) * offsetDistance;
      const childY = this.y + Math.sin(offsetAngle) * offsetDistance;
      
      // Create new asteroid with same characteristics but different size
      try {
        const newAsteroid = new Asteroid(
          this.type,
          size,
          childX,
          childY,
          this.difficulty,
          this.speedMultiplier * 1.2, // Make children slightly faster
          this.fixedBaseSpeed
        );
        
        // Add to target array
        targetArray.push(newAsteroid);
      } catch (err) {
        console.error(`Error creating child asteroid: ${err.message}`);
      }
    }
  }
  
  /**
   * Check if this asteroid is colliding with another entity
   * @param {Object} entity - The entity to check collision with
   * @returns {boolean} - Whether there is a collision
   */
  isCollidingWith(entity) {
    // Calculate distance between centers
    const dx = this.x - entity.x;
    const dy = this.y - entity.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Collision if distance is less than the sum of radii
    return distance < this.radius + entity.radius;
  }
}

export default Asteroid; 