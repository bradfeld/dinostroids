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
        Math.floor((ctx.canvas.height - y - 50) / 25) // Based on available space
    );
    
    // Calculate wider background for more columns
    const bgWidth = 500;
    
    // Draw semi-transparent background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(
        x - bgWidth/2, 
        y, 
        bgWidth, 
        maxVisibleScores * 25 + 50
    );
    
    // Draw title
    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('High Scores', x, y + 30);
    
    // Draw column headers
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Rank', x - bgWidth/2 + 20, y + 60);
    ctx.fillText('Score', x - bgWidth/2 + 80, y + 60);
    ctx.fillText('Initials', x - bgWidth/2 + 160, y + 60);
    ctx.fillText('Level', x - bgWidth/2 + 230, y + 60);
    ctx.fillText('Date', x - bgWidth/2 + 300, y + 60);
    ctx.fillText('Time', x - bgWidth/2 + 380, y + 60);
    
    // Draw scores
    ctx.font = '16px Arial';
    for (let i = 0; i < maxVisibleScores; i++) {
        const score = top20Scores[i];
        const yPos = y + 85 + (i * 25);
        
        // Highlight current score
        if (score.isCurrent) {
            ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
            ctx.fillRect(x - bgWidth/2 + 10, yPos - 15, bgWidth - 20, 20);
            ctx.fillStyle = 'white';
        }
        
        // Rank number
        ctx.textAlign = 'left';
        ctx.fillText(`${i + 1}.`, x - bgWidth/2 + 20, yPos);
        
        // Score
        ctx.fillText(`${score.score}`, x - bgWidth/2 + 80, yPos);
        
        // Initials
        ctx.fillText(score.initials || '---', x - bgWidth/2 + 160, yPos);
        
        // Level
        ctx.fillText(score.level || '1', x - bgWidth/2 + 230, yPos);
        
        // Date (if available)
        if (score.date) {
            const date = new Date(score.date);
            const dateStr = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear().toString().substr(2)}`;
            ctx.fillText(dateStr, x - bgWidth/2 + 300, yPos);
            
            // Time
            const timeStr = `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
            ctx.fillText(timeStr, x - bgWidth/2 + 380, yPos);
        } else {
            ctx.fillText('--/--/--', x - bgWidth/2 + 300, yPos);
            ctx.fillText('--:--', x - bgWidth/2 + 380, yPos);
        }
    }
    
    // Show total count if there are more scores than visible
    if (leaderboardData.length > maxVisibleScores) {
        ctx.textAlign = 'center';
        ctx.font = '14px Arial';
        ctx.fillText(
            `Showing ${maxVisibleScores} of ${leaderboardData.length} scores`, 
            x, 
            y + maxVisibleScores * 25 + 40
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
    if (entry.createdAt) {
        try {
            const date = new Date(entry.createdAt);
            dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
        } catch (e) {
            // Ignore date parsing errors
        }
    }
    
    return `${entry.initials || '???'} - ${entry.score} ${dateStr ? `(${dateStr})` : ''}`;
} 