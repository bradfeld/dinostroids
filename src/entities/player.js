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
    
    // Mobile control properties
    this.rotatingLeft = false;
    this.rotatingRight = false;
    this.thrusting = false;
    this.shooting = false;
    
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
    
    // Hyperspace properties
    this.isInHyperspace = false;
    this.hyperspaceTime = 0;
    this.hyperspaceCooldown = 3000; // 3 seconds cooldown
    this.lastHyperspace = 0;
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
        
        // Update rotation to make lines spin
        particle.angle += particle.rotationSpeed * deltaTime;
        
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
      // Debug log to check deltaTime value
      console.log(`Updating invincibility: current=${this.invincibilityTime}, deltaTime=${deltaTime}`);
      
      // Ensure deltaTime is a valid number
      const safeDeltaTime = (isNaN(deltaTime) || deltaTime <= 0) ? 0.016 : deltaTime;
      
      // Decrement invincibility time
      this.invincibilityTime -= safeDeltaTime * 1000; // Convert seconds to milliseconds
      
      // Debug log after decrementing
      console.log(`New invincibility time: ${this.invincibilityTime}`);
      
      if (this.invincibilityTime <= 0) {
        this.invincible = false;
        this.invincibilityTime = 0; // Reset to prevent negative values
        console.log("Invincibility deactivated - timer reached zero");
      }
      
      // Add failsafe: force invincibility to expire if it's been more than 5 seconds since the last update
      // This ensures invincibility will always end even if update isn't called properly
      if (!window._lastInvincibilityCheck) {
        window._lastInvincibilityCheck = Date.now();
      } else {
        const now = Date.now();
        const timeSinceLastCheck = now - window._lastInvincibilityCheck;
        window._lastInvincibilityCheck = now;
        
        // If more than 5 seconds passed since last check, force invincibility to end
        if (timeSinceLastCheck > 5000) {
          console.log(`Failsafe: Force-ending invincibility after ${timeSinceLastCheck}ms`);
          this.invincible = false;
          this.invincibilityTime = 0;
        }
      }
    }
    
    // Check for hyperspace jump
    const now = Date.now();
    const canHyperspace = now - this.lastHyperspace > this.hyperspaceCooldown;
    
    if (isKeyPressed('KeyH') && canHyperspace && !this.isInHyperspace) {
      this.enterHyperspace();
      return null;
    }
    
    // Check input for rotation - keyboard or mobile controls
    if (isKeyPressed('ArrowLeft') || this.rotatingLeft) {
      this.rotation -= this.rotationSpeed * deltaTime;
    }
    if (isKeyPressed('ArrowRight') || this.rotatingRight) {
      this.rotation += this.rotationSpeed * deltaTime;
    }
    
    // Check input for thrust - keyboard or mobile controls
    this.isThrusting = isKeyPressed('ArrowUp') || this.thrusting;
    
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
    
    // Handle shooting - keyboard or mobile controls
    let newBullet = null;
    if ((isKeyPressed('Space') || this.shooting) && this.canShoot && !this.isDestroyed) {
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
    // Check if invincibility should have expired by now
    // This is a backup in case the update method isn't being called
    if (this.invincible && window._lastInvincibilityCheck) {
      const now = Date.now();
      const timeSinceLastCheck = now - window._lastInvincibilityCheck;
      
      // If it's been more than 5 seconds since invincibility was checked
      // AND invincibility time should be nearly expired, force end it
      if (timeSinceLastCheck > 5000 && this.invincibilityTime < 1000) {
        this.forceEndInvincibility();
      }
    }
    
    // Draw explosion if exploding
    if (this.exploding && this.explosionParticles.length > 0) {
      // Draw each explosion particle as a line
      for (let i = 0; i < this.explosionParticles.length; i++) {
        const particle = this.explosionParticles[i];
        
        ctx.save();
        ctx.globalAlpha = particle.alpha;
        ctx.strokeStyle = particle.color;
        ctx.lineWidth = 1; // Uniform line width for all particles
        
        // Draw line starting at particle position
        ctx.beginPath();
        ctx.moveTo(particle.x, particle.y);
        
        // Calculate line end point based on angle and length
        const endX = particle.x + Math.cos(particle.angle) * particle.length;
        const endY = particle.y + Math.sin(particle.angle) * particle.length;
        ctx.lineTo(endX, endY);
        
        ctx.stroke();
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
    
    // Number of line particles for explosion
    const particleCount = 15;
    
    // All particles are white lines
    const color = '#ffffff';
    
    for (let i = 0; i < particleCount; i++) {
      // Random velocity in all directions
      const angle = Math.random() * Math.PI * 2;
      const speed = 20 + Math.random() * 80; // pixels per second
      
      // Line length varies slightly
      const lineLength = 5 + Math.random() * 10;
      
      this.explosionParticles.push({
        x: this.x,
        y: this.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        angle: angle, // Direction of the line
        length: lineLength,
        color: color,
        alpha: 1.0,
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
    
    // Reset mobile control states
    this.rotatingLeft = false;
    this.rotatingRight = false;
    this.thrusting = false;
    this.shooting = false;
    
    // Make player temporarily invincible - track values before and after
    console.log("Before reset: invincible =", this.invincible, "invincibilityTime =", this.invincibilityTime);
    
    // Get invincibility time from settings with a fallback value of 3000ms (3 seconds)
    const invincibilityTime = typeof PLAYER_SETTINGS.INVINCIBILITY_TIME !== 'undefined' 
                              ? PLAYER_SETTINGS.INVINCIBILITY_TIME 
                              : 3000;
    
    console.log("Using invincibility time:", invincibilityTime, "ms");
    
    this.invincible = true;
    this.invincibilityTime = invincibilityTime;
    
    // Reset the global invincibility check timer when resetting a player
    window._lastInvincibilityCheck = Date.now();
    
    console.log("Player reset complete, invincibility active for " + 
               (this.invincibilityTime/1000).toFixed(1) + " seconds");
    console.log("After reset: invincible =", this.invincible, "invincibilityTime =", this.invincibilityTime);
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
  
  /**
   * Hyperspace jump to a random location
   */
  enterHyperspace() {
    console.log("Hyperspace jump initiated!");
    
    // Record hyperspace use time
    this.lastHyperspace = Date.now();
    this.isInHyperspace = true;
    
    // Get screen dimensions
    const { width, height } = getDimensions();
    
    // Calculate a random position ensuring we're not too close to the edges
    const margin = 50;
    const newX = margin + Math.random() * (width - margin * 2);
    const newY = margin + Math.random() * (height - margin * 2);
    
    // Transport to new location
    this.x = newX;
    this.y = newY;
    
    // Reduce velocity to prevent immediate collisions
    this.velocityX *= 0.5;
    this.velocityY *= 0.5;
    
    // Apply invincibility - use the same safe approach as reset()
    // Get invincibility time from settings with a fallback value of 3000ms (3 seconds)
    const invincibilityTime = typeof PLAYER_SETTINGS.INVINCIBILITY_TIME !== 'undefined' 
                            ? PLAYER_SETTINGS.INVINCIBILITY_TIME 
                            : 3000;
    
    console.log("Using hyperspace invincibility time:", invincibilityTime, "ms");
    
    this.invincible = true;
    this.invincibilityTime = invincibilityTime;
    
    // Reset the global invincibility check timer when entering hyperspace
    window._lastInvincibilityCheck = Date.now();
    
    // Reset hyperspace state after a short delay
    setTimeout(() => {
      this.isInHyperspace = false;
    }, 100);
  }
  
  /**
   * Force end invincibility if it's been active too long
   * This is a safety method to prevent permanent invincibility
   */
  forceEndInvincibility() {
    if (this.invincible) {
      // Only log if we're actually turning it off
      console.log("Force ending invincibility via safety method");
      this.invincible = false;
      this.invincibilityTime = 0;
    }
  }
}

export default Player; 