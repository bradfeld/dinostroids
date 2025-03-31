/**
 * Leaderboard UI Component
 * 
 * Handles displaying the leaderboard during gameplay.
 */

import { getDimensions } from '../canvas.js';

/**
 * Draw scores
 * @param {Array} scores - Array of score objects
 * @param {number} x - X-coordinate center
 * @param {number} y - Y-coordinate start
 * @param {number} maxVisibleScores - Maximum number of scores to display
 * @param {Object} positions - Object with x-positions for each column
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 */
function drawScores(scores, x, y, maxVisibleScores, positions, ctx) {
    ctx.font = '16px Arial';
    
    for (let i = 0; i < maxVisibleScores; i++) {
        const score = scores[i];
        const yPos = y + 85 + (i * 30);
        
        // Highlight current score
        if (score.isCurrent) {
            ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
            ctx.fillRect(x - 240, yPos - 15, 480, 20);
            ctx.fillStyle = 'white';
        }
        
        // Rank number
        ctx.textAlign = 'center';
        ctx.fillText(`${i + 1}`, positions.rankX, yPos);
        
        // Score
        ctx.fillText(`${score.score}`, positions.scoreX, yPos);
        
        // Level
        ctx.fillText(`${score.level || '-'}`, positions.levelX, yPos);
        
        // Initials
        ctx.fillText(`${score.initials || '???'}`, positions.initialsX, yPos);
        
        // Format and display date
        const dateStr = formatDate(score);
        ctx.fillText(dateStr, positions.dateX, yPos);
        
        // Format and display time
        const timeStr = formatTime(score.time);
        ctx.fillText(timeStr, positions.timeX, yPos);
    }
}

/**
 * Format date from score entry
 * @param {Object} score - The score object
 * @returns {string} Formatted date string
 */
function formatDate(score) {
    // Try different possible date fields
    const dateValue = score.date || score.createdAt || score.timestamp;
    
    if (!dateValue) {
        return '--/--/--';
    }
    
    try {
        const date = new Date(dateValue);
        
        // Check if date is valid
        if (isNaN(date.getTime())) {
            return '--/--/--';
        }
        
        return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear().toString().substr(2)}`;
    } catch (e) {
        console.warn('Error formatting date:', e);
        return '--/--/--';
    }
}

/**
 * Format time from milliseconds
 * @param {number} ms - Time in milliseconds
 * @returns {string} Formatted time string
 */
function formatTime(ms) {
    if (!ms || typeof ms !== 'number') {
        return '--:--';
    }
    
    try {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    } catch (e) {
        console.warn('Error formatting time:', e);
        return '--:--';
    }
}

/**
 * Draw the leaderboard
 * @param {number} x - X position for the leaderboard center
 * @param {number} y - Y position for the leaderboard top
 * @param {Array} leaderboardData - The leaderboard data
 * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
 */
export function drawLeaderboard(x, y, leaderboardData, ctx) {
    // Sort data by score and take top 20
    const top20Scores = [...leaderboardData]
        .sort((a, b) => b.score - a.score)
        .slice(0, 20); // Show up to 20 scores
    
    // Calculate how many scores can fit on screen
    const maxVisibleScores = Math.min(
        top20Scores.length, 
        20, // Never show more than 20
        Math.floor((ctx.canvas.height - y - 50) / 30) // Increased row height for more data
    );
    
    // Draw semi-transparent background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(
        x - 250, 
        y, 
        500, // Wider to accommodate more columns
        maxVisibleScores * 30 + 60
    );
    
    // Draw title
    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('LEADERBOARD', x, y + 30);
    
    // Draw column headers
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    
    // Horizontal positions for each column
    const positions = {
        rankX: x - 220,
        scoreX: x - 160,
        levelX: x - 80,
        initialsX: x,
        dateX: x + 100,
        timeX: x + 190
    };
    
    // Draw column headers
    ctx.fillText('RANK', positions.rankX, y + 55);
    ctx.fillText('SCORE', positions.scoreX, y + 55);
    ctx.fillText('LEVEL', positions.levelX, y + 55);
    ctx.fillText('PLAYER', positions.initialsX, y + 55);
    ctx.fillText('DATE', positions.dateX, y + 55);
    ctx.fillText('TIME', positions.timeX, y + 55);
    
    // Draw separator line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.moveTo(x - 240, y + 60);
    ctx.lineTo(x + 240, y + 60);
    ctx.stroke();
    
    // Draw scores
    drawScores(top20Scores, x, y, maxVisibleScores, positions, ctx);
    
    // Show total count if there are more scores than visible
    if (leaderboardData.length > maxVisibleScores) {
        ctx.textAlign = 'center';
        ctx.font = '14px Arial';
        ctx.fillText(
            `Showing ${maxVisibleScores} of ${leaderboardData.length} scores`, 
            x, 
            y + maxVisibleScores * 30 + 45
        );
    }
}

/**
 * Format a leaderboard entry for display
 * @param {Object} entry - Leaderboard entry
 * @returns {string} Formatted entry
 */
export function formatLeaderboardEntry(entry) {
    if (!entry) return '';
    
    // Format date
    const dateStr = formatDate(entry).split('/').slice(0, 2).join('/'); // Just month/day
    
    // Format time
    const timeStr = formatTime(entry.time);
    
    return `${entry.initials || '???'} - ${entry.score} (L${entry.level || '-'}) ${dateStr}${timeStr !== '--:--' ? ` ${timeStr}` : ''}`;
} 