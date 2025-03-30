/**
 * Bullet Entity
 * 
 * This class represents a bullet fired by the player.
 */

import { BULLET_RADIUS, BULLET_SPEED, BULLET_LIFESPAN } from '../constants.js';
import { getCanvas } from '../canvas.js';

export class Bullet {
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
        this.speed = BULLET_SPEED;
        this.radius = BULLET_RADIUS;
        this.size = this.radius; // for collision check consistency
        this.lifespan = BULLET_LIFESPAN;
    }

    /**
     * Draw the bullet on the canvas
     */
    draw() {
        const { ctx, canvas } = getCanvas();
        
        // Don't draw if outside canvas boundaries
        if (this.x < -this.radius || this.x > canvas.width + this.radius ||
            this.y < -this.radius || this.y > canvas.height + this.radius) {
            return;
        }
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
    }

    /**
     * Update the bullet's position and lifespan
     * @returns {boolean} False if the bullet should be removed
     */
    update() {
        const { canvas } = getCanvas();
        
        // Update position
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
        
        // Decrease lifespan
        this.lifespan--;
        
        // Return true if bullet should be kept (within canvas bounds and alive)
        return this.lifespan > 0 &&
               this.x >= -this.radius &&
               this.x <= canvas.width + this.radius &&
               this.y >= -this.radius &&
               this.y <= canvas.height + this.radius;
    }
} 