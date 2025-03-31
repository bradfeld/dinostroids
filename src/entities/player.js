/**
 * Player Entity
 * 
 * Represents the player's ship in the game.
 */

import { getDimensions } from '../canvas.js';
import { PLAYER_SETTINGS, GAME_SETTINGS, DIFFICULTY_SETTINGS } from '../constants.js';
import { isKeyPressed } from '../controllers/input.js';

class Player {
  /**
   * Create a new player ship
   * @param {string} difficulty - Optional difficulty setting ('easy', 'medium', 'difficult')
   */
  constructor(difficulty = 'medium') {
    const { width, height } = getDimensions();
    
    // Position in the center of the screen
    this.x = width / 2;
    this.y = height / 2;
    
    // Size and collision radius
    this.radius = PLAYER_SETTINGS.RADIUS;
    
    // Apply difficulty-specific settings
    const difficultySettings = DIFFICULTY_SETTINGS[difficulty];
    
    // Movement properties
    this.rotation = 0; // Rotation in radians
    this.thrustPower = 0; // Current thrust
    this.velocityX = 0;
    this.velocityY = 0;
    this.rotationSpeed = PLAYER_SETTINGS.ROTATION_SPEED;
    this.acceleration = difficultySettings.playerAcceleration;
    this.friction = PLAYER_SETTINGS.FRICTION;
    
    // Weapon properties
    this.canShoot = true;
    this.shootCooldown = difficultySettings.shootCooldown;
    this.lastShot = 0;
    
    // State
    this.isThrusting = false;
    this.isDestroyed = false;
    this.invincible = false;
    this.invincibilityTime = 0;
  }
  
  /**
   * Update the player's state
   * @param {number} deltaTime - Time since last update in seconds
   * @returns {Object|null} - New bullet or null
   */
  update(deltaTime) {
    // Skip if destroyed
    if (this.isDestroyed) return null;
    
    // Handle invincibility timer
    if (this.invincible) {
      // Log invincibility time every second for debugging
      if (Math.floor(this.invincibilityTime / 1000) !== Math.floor((this.invincibilityTime - deltaTime * 1000) / 1000)) {
        console.log(`Invincibility remaining: ${(this.invincibilityTime / 1000).toFixed(1)}s, deltaTime: ${deltaTime.toFixed(3)}s`);
      }
      
      // deltaTime is in seconds, but invincibilityTime is in milliseconds
      this.invincibilityTime -= deltaTime * 1000;
      
      // Make sure invincibility turns off when timer expires
      if (this.invincibilityTime <= 0) {
        console.log('Invincibility ended, setting invincible to false');
        this.invincible = false;
        this.invincibilityTime = 0;
      }
    }
    
    // Check input for rotation
    if (isKeyPressed('ArrowLeft')) {
      this.rotation -= this.rotationSpeed * deltaTime;
    }
    if (isKeyPressed('ArrowRight')) {
      this.rotation += this.rotationSpeed * deltaTime;
    }
    
    // Check input for thrust
    this.isThrusting = isKeyPressed('ArrowUp');
    
    // Apply thrust if key is pressed
    if (this.isThrusting) {
      // Calculate thrust vector based on rotation
      const thrustX = Math.cos(this.rotation) * this.acceleration * deltaTime;
      const thrustY = Math.sin(this.rotation) * this.acceleration * deltaTime;
      
      // Apply thrust to velocity
      this.velocityX += thrustX;
      this.velocityY += thrustY;
    }
    
    // Apply friction to slow down when not thrusting
    this.velocityX *= (1 - this.friction * deltaTime);
    this.velocityY *= (1 - this.friction * deltaTime);
    
    // Update position
    this.x += this.velocityX;
    this.y += this.velocityY;
    
    // Screen wrapping
    const { width, height } = getDimensions();
    
    if (this.x < 0) this.x = width;
    if (this.x > width) this.x = 0;
    if (this.y < 0) this.y = height;
    if (this.y > height) this.y = 0;
    
    // Handle shooting
    let newBullet = null;
    if (isKeyPressed('Space') && this.canShoot && !this.isDestroyed) {
      const now = Date.now();
      if (now - this.lastShot > this.shootCooldown) {
        // Create a new bullet
        newBullet = {
          x: this.x + Math.cos(this.rotation) * this.radius,
          y: this.y + Math.sin(this.rotation) * this.radius,
          rotation: this.rotation
        };
        
        this.lastShot = now;
      }
    }
    
    return newBullet;
  }
  
  /**
   * Set the player's shoot cooldown
   * @param {number} cooldown - New cooldown time in milliseconds
   */
  setShootCooldown(cooldown) {
    this.shootCooldown = cooldown;
  }
  
  /**
   * Set the player's acceleration
   * @param {number} acceleration - New acceleration value
   */
  setAcceleration(acceleration) {
    this.acceleration = acceleration;
  }
  
  /**
   * Draw the player's ship
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   */
  draw(ctx) {
    if (this.isDestroyed) return;
    
    // Skip drawing every other frame when invincible for blinking effect
    if (this.invincible && Math.floor(Date.now() / 100) % 2 === 0) return;
    
    ctx.save();
    
    // Move to ship's position and rotate
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    
    // Draw the ship
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    // Draw triangular ship
    ctx.moveTo(this.radius, 0); // Nose
    ctx.lineTo(-this.radius * 0.7, -this.radius * 0.7); // Left wing
    ctx.lineTo(-this.radius * 0.5, 0); // Back indent
    ctx.lineTo(-this.radius * 0.7, this.radius * 0.7); // Right wing
    ctx.closePath();
    ctx.stroke();
    
    // Draw thrust flame when thrusting
    if (this.isThrusting) {
      ctx.beginPath();
      ctx.moveTo(-this.radius * 0.5, 0);
      ctx.lineTo(-this.radius * 1.5, 0);
      
      // Randomize flame length for effect
      const flicker = Math.random() * 0.5 + 0.5;
      ctx.lineTo(-this.radius * (1 + flicker), 0.5 * this.radius * flicker);
      ctx.lineTo(-this.radius * 0.5, 0);
      ctx.fillStyle = 'orange';
      ctx.fill();
    }
    
    ctx.restore();
  }
  
  /**
   * Destroy the player's ship
   */
  destroy() {
    this.isDestroyed = true;
  }
  
  /**
   * Reset the player to the center of the screen with invincibility
   */
  reset() {
    const { width, height } = getDimensions();
    
    this.x = width / 2;
    this.y = height / 2;
    this.velocityX = 0;
    this.velocityY = 0;
    this.rotation = 0;
    this.isDestroyed = false;
    
    // Make player temporarily invincible
    this.invincible = true;
    
    // Ensure we're using the correct invincibility time value
    this.invincibilityTime = PLAYER_SETTINGS.INVINCIBILITY_TIME;
    console.log(`Player reset with ${this.invincibilityTime}ms invincibility time`);
  }
  
  /**
   * Check if player is colliding with an entity
   * @param {Object} entity - The entity to check collision with
   * @returns {boolean} Whether a collision occurred
   */
  isCollidingWith(entity) {
    // Skip collision check if destroyed or invincible
    if (this.isDestroyed) {
      return false;
    }
    
    // Check actual collision
    const dx = this.x - entity.x;
    const dy = this.y - entity.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const isColliding = distance < this.radius + entity.radius;
    
    // If we are colliding but invincible, log it
    if (isColliding && this.invincible) {
      console.log('Collision ignored due to invincibility');
      return false;
    }
    
    return isColliding;
  }
}

export default Player; 