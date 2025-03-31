/**
 * Game Status UI Component
 * 
 * Displays the player's score, lives, and level during gameplay.
 */

import { getDimensions } from '../canvas.js';

/**
 * Draw the game status (score, lives, level)
 * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
 * @param {number} score - Current score
 * @param {number} lives - Remaining lives
 * @param {number} level - Current level
 * @param {string} difficulty - Current difficulty level (not displayed during gameplay)
 */
export function drawGameStatus(ctx, score, lives, level, difficulty) {
    const { width, height } = getDimensions();
    
    // Set text properties
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    
    // Draw score (top left)
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 20, 30);
    
    // Draw level (top center)
    ctx.textAlign = 'center';
    ctx.fillText(`Level: ${level}`, width / 2, 30);
    
    // Draw lives (top right)
    drawLives(ctx, lives, width - 20, 30);
    
    // Note: Difficulty is no longer displayed during active gameplay
}

/**
 * Format the difficulty name for display
 * @param {string} difficulty - The difficulty string ('easy', 'medium', 'difficult')
 * @returns {string} - Formatted difficulty with first letter capitalized
 */
function formatDifficulty(difficulty) {
    return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
}

/**
 * Draw the player's remaining lives
 * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
 * @param {number} lives - Number of lives remaining
 * @param {number} x - Right-aligned x position
 * @param {number} y - Y position
 */
function drawLives(ctx, lives, x, y) {
    // Draw text
    ctx.textAlign = 'right';
    ctx.fillText(`Lives: `, x - 30, y);
    
    // Draw ship icons for each life
    for (let i = 0; i < lives; i++) {
        drawShipIcon(ctx, x - (i * 25), y - 5, 10);
    }
}

/**
 * Draw a small ship icon for lives display
 * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
 * @param {number} x - Center x position
 * @param {number} y - Center y position
 * @param {number} size - Size of the ship icon
 */
function drawShipIcon(ctx, x, y, size) {
    ctx.save();
    
    ctx.translate(x, y);
    
    // Draw triangular ship
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(size, 0);
    ctx.lineTo(-size * 0.7, -size * 0.7);
    ctx.lineTo(-size * 0.4, 0);
    ctx.lineTo(-size * 0.7, size * 0.7);
    ctx.closePath();
    ctx.stroke();
    
    ctx.restore();
} 