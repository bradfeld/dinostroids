/**
 * Leaderboard UI Component
 * 
 * Handles displaying the leaderboard during gameplay.
 */

import { getDimensions } from '../canvas.js';

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
    const rankX = x - 220;
    const scoreX = x - 160;
    const levelX = x - 80;
    const initialsX = x;
    const dateX = x + 100;
    const timeX = x + 190;
    
    // Draw column headers
    ctx.fillText('RANK', rankX, y + 55);
    ctx.fillText('SCORE', scoreX, y + 55);
    ctx.fillText('LEVEL', levelX, y + 55);
    ctx.fillText('PLAYER', initialsX, y + 55);
    ctx.fillText('DATE', dateX, y + 55);
    ctx.fillText('TIME', timeX, y + 55);
    
    // Draw separator line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.moveTo(x - 240, y + 60);
    ctx.lineTo(x + 240, y + 60);
    ctx.stroke();
    
    // Draw scores
    ctx.font = '16px Arial';
    for (let i = 0; i < maxVisibleScores; i++) {
        const score = top20Scores[i];
        const yPos = y + 85 + (i * 30);
        
        // Highlight current score
        if (score.isCurrent) {
            ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
            ctx.fillRect(x - 240, yPos - 15, 480, 20);
            ctx.fillStyle = 'white';
        }
        
        // Rank number
        ctx.textAlign = 'center';
        ctx.fillText(`${i + 1}`, rankX, yPos);
        
        // Score
        ctx.fillText(`${score.score}`, scoreX, yPos);
        
        // Level
        ctx.fillText(`${score.level || '-'}`, levelX, yPos);
        
        // Initials
        ctx.fillText(`${score.initials || '???'}`, initialsX, yPos);
        
        // Date (if available)
        if (score.date) {
            const date = new Date(score.date);
            const dateStr = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear().toString().substr(2)}`;
            ctx.fillText(dateStr, dateX, yPos);
        } else {
            ctx.fillText('--/--/--', dateX, yPos);
        }
        
        // Time (if available)
        if (score.time) {
            // Convert milliseconds to MM:SS format
            const minutes = Math.floor(score.time / 60000);
            const seconds = Math.floor((score.time % 60000) / 1000);
            const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            ctx.fillText(timeStr, timeX, yPos);
        } else {
            ctx.fillText('--:--', timeX, yPos);
        }
    }
    
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
    
    // Format date if available
    let dateStr = '';
    if (entry.date || entry.createdAt) {
        try {
            const date = new Date(entry.date || entry.createdAt);
            dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
        } catch (e) {
            // Ignore date parsing errors
        }
    }
    
    // Format time if available
    let timeStr = '';
    if (entry.time) {
        const minutes = Math.floor(entry.time / 60000);
        const seconds = Math.floor((entry.time % 60000) / 1000);
        timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    return `${entry.initials || '???'} - ${entry.score} (L${entry.level || '-'}) ${dateStr}${timeStr ? ` ${timeStr}` : ''}`;
} 