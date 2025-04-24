/**
 * Bullet Entity
 * 
 * This class represents a bullet fired by the player.
 */

import { getDimensions } from '../canvas.js';
import { BULLET_SETTINGS } from '../constants.js';

class Bullet {
    /**
     * Create a new bullet
     * @param {number} x - Starting x position
     * @param {number} y - Starting y position
     * @param {number} angle - Direction angle in radians
     */
    constructor(x, y, angle) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.velocityX = Math.cos(angle) * BULLET_SETTINGS.SPEED;
        this.velocityY = Math.sin(angle) * BULLET_SETTINGS.SPEED;
        this.radius = BULLET_SETTINGS.RADIUS;
        this.lifespan = BULLET_SETTINGS.LIFESPAN;
        this.active = true;
    }

    /**
     * Update the bullet's position and lifespan
     * @param {number} deltaTime - Time since last update in milliseconds
     * @returns {boolean} Whether the bullet is still active
     */
    update(deltaTime) {
        if (!this.active) return false;
        
        // Update position
        this.x += this.velocityX * deltaTime;
        this.y += this.velocityY * deltaTime;
        
        // Decrease lifespan
        this.lifespan -= deltaTime * 1000; // Convert to ms
        
        // Check if bullet is still active based on lifespan
        if (this.lifespan <= 0) {
            this.active = false;
            return false;
        }
        
        // Screen wrapping instead of deactivating when off-screen
        const { width, height } = getDimensions();
        
        if (this.x < -this.radius) this.x = width + this.radius;
        if (this.x > width + this.radius) this.x = -this.radius;
        if (this.y < -this.radius) this.y = height + this.radius;
        if (this.y > height + this.radius) this.y = -this.radius;
        
        return true;
    }

    /**
     * Draw the bullet
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     */
    draw(ctx) {
        if (!this.active) return;
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
    }
    
    /**
     * Check if this bullet is colliding with an entity
     * @param {Object} entity - The entity to check collision with
     * @returns {boolean} Whether a collision occurred
     */
    isCollidingWith(entity) {
        if (!this.active) return false;
        
        const dx = this.x - entity.x;
        const dy = this.y - entity.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance < this.radius + entity.radius;
    }
    
    /**
     * Deactivate the bullet
     */
    deactivate() {
        this.active = false;
    }
}

export default Bullet; 