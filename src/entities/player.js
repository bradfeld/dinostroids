/**
 * Player Entity
 * 
 * Represents the player's ship in the game.
 */

import { getDimensions } from '../canvas.js';
import { PLAYER_SETTINGS, GAME_SETTINGS } from '../constants.js';
import { isKeyPressed } from '../controllers/input.js';

class Player {
  constructor() {
    const { width, height } = getDimensions();
    
    // Position in the center of the screen
    this.x = width / 2;
    this.y = height / 2;
    
    // Size and collision radius
    this.radius = PLAYER_SETTINGS.RADIUS;
    
    // Movement properties
    this.rotation = 0; // Rotation in radians
    this.thrustPower = 0; // Current thrust
    this.velocityX = 0;
    this.velocityY = 0;
    this.rotationSpeed = PLAYER_SETTINGS.ROTATION_SPEED;
    this.acceleration = PLAYER_SETTINGS.ACCELERATION;
    this.friction = PLAYER_SETTINGS.FRICTION;
    
    // Weapon properties
    this.canShoot = true;
    this.shootCooldown = PLAYER_SETTINGS.SHOOT_COOLDOWN;
    this.lastShot = 0;
    
    // State
    this.isThrusting = false;
    this.isDestroyed = false;
    this.invincible = false;
    this.invincibilityTime = 0;
    
    // Explosion animation properties
    this.explosionParticles = [];
    this.explosionDuration = 2000; // 2 seconds in milliseconds
    this.explosionElapsed = 0; 
    this.exploding = false;
  }
  
  /**
   * Update the player's state
   * @param {number} deltaTime - Time since last update in milliseconds
   * @returns {Object|null} - New bullet or null
   */
  update(deltaTime) {
    // Update explosion animation if exploding
    if (this.exploding) {
      this.explosionElapsed += deltaTime * 1000; // Convert seconds to milliseconds
      
      // Get screen dimensions for wrapping
      const { width, height } = getDimensions();
      
      // Update explosion particles
      for (let i = 0; i < this.explosionParticles.length; i++) {
        const particle = this.explosionParticles[i];
        particle.x += particle.vx * deltaTime;
        particle.y += particle.vy * deltaTime;
        
        // Screen wrapping for particles
        if (particle.x < 0) particle.x = width;
        if (particle.x > width) particle.x = 0;
        if (particle.y < 0) particle.y = height;
        if (particle.y > height) particle.y = 0;
        
        // Update rotation for debris particles
        if (particle.isDebris) {
          particle.rotation += particle.rotationSpeed * deltaTime;
        }
        
        // Fade out over time
        particle.alpha = 1 - (this.explosionElapsed / this.explosionDuration);
      }
      
      // End explosion when duration is complete
      if (this.explosionElapsed >= this.explosionDuration) {
        this.exploding = false;
        this.explosionParticles = [];
        console.log("Explosion animation complete");
      }
      
      // Return null since we don't want to create new bullets during explosion
      return null;
    }
    
    // Skip if destroyed but not exploding
    if (this.isDestroyed) return null;
    
    // Handle invincibility timer
    if (this.invincible) {
      this.invincibilityTime -= deltaTime * 1000; // Convert seconds to milliseconds
      if (this.invincibilityTime <= 0) {
        this.invincible = false;
        this.invincibilityTime = 0; // Reset to prevent negative values
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
      const thrustX = Math.cos(this.rotation) * this.acceleration;
      const thrustY = Math.sin(this.rotation) * this.acceleration;
      
      // Apply thrust to velocity
      this.velocityX += thrustX * deltaTime;
      this.velocityY += thrustY * deltaTime;
    }
    
    // Apply more friction to make the ship easier to control
    const frictionFactor = 1 - (1 - this.friction) * Math.min(1, deltaTime * 5);
    this.velocityX *= frictionFactor;
    this.velocityY *= frictionFactor;
    
    // Cap maximum velocity to prevent excessive speed
    const maxSpeed = 300;
    const currentSpeed = Math.sqrt(this.velocityX * this.velocityX + this.velocityY * this.velocityY);
    if (currentSpeed > maxSpeed) {
      const scaleFactor = maxSpeed / currentSpeed;
      this.velocityX *= scaleFactor;
      this.velocityY *= scaleFactor;
    }
    
    // Update position
    this.x += this.velocityX * deltaTime;
    this.y += this.velocityY * deltaTime;
    
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
   * Draw the player's ship
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   */
  draw(ctx) {
    // Draw explosion if exploding
    if (this.exploding && this.explosionParticles.length > 0) {
      // Draw each explosion particle
      for (let i = 0; i < this.explosionParticles.length; i++) {
        const particle = this.explosionParticles[i];
        
        ctx.save();
        ctx.globalAlpha = particle.alpha;
        
        if (particle.isDebris) {
          // Draw ship debris (small lines)
          ctx.translate(particle.x, particle.y);
          ctx.rotate(particle.rotation);
          
          ctx.strokeStyle = 'white';
          ctx.lineWidth = 2;
          ctx.beginPath();
          
          // Draw a random shape for debris
          const debrisSize = particle.size * 2;
          ctx.moveTo(-debrisSize, -debrisSize);
          ctx.lineTo(debrisSize, debrisSize);
          
          ctx.stroke();
        } else {
          // Draw regular particle (circle)
          ctx.fillStyle = particle.color;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fill();
        }
        
        ctx.restore();
      }
      return;
    }
    
    // Skip drawing ship if destroyed and not exploding
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
    console.log("Player destroy method called!");
    this.isDestroyed = true;
    
    // Create explosion effect
    this.createExplosion();
    console.log("After createExplosion, exploding flag:", this.exploding);
  }
  
  /**
   * Create explosion particles when ship is destroyed
   */
  createExplosion() {
    console.log("Creating ship explosion animation!");
    this.exploding = true;
    this.explosionElapsed = 0;
    this.explosionParticles = [];
    
    // Number of particles for explosion
    const particleCount = 40;
    
    // Colors for explosion (white, yellow, orange, red)
    const colors = ['#ffffff', '#ffff00', '#ffa500', '#ff4500', '#ff0000'];
    
    for (let i = 0; i < particleCount; i++) {
      // Random velocity in all directions
      const angle = Math.random() * Math.PI * 2;
      const speed = 20 + Math.random() * 80; // pixels per second
      
      // Decide if this is a particle or ship debris
      const isDebris = Math.random() > 0.7; // 30% chance to be debris
      
      this.explosionParticles.push({
        x: this.x,
        y: this.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 1 + Math.random() * 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1.0,
        isDebris: isDebris,
        // Add rotation for debris
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 5
      });
    }
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
    this.exploding = false;
    this.explosionParticles = [];
    
    // Make player temporarily invincible
    this.invincible = true;
    this.invincibilityTime = PLAYER_SETTINGS.INVINCIBILITY_TIME;
  }
  
  /**
   * Check if player is colliding with an entity
   * @param {Object} entity - The entity to check collision with
   * @returns {boolean} Whether a collision occurred
   */
  isCollidingWith(entity) {
    if (this.isDestroyed || this.invincible) return false;
    
    const dx = this.x - entity.x;
    const dy = this.y - entity.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    return distance < this.radius + entity.radius;
  }
}

export default Player; 