/**
 * Leaderboard UI Component
 * 
 * Handles displaying the leaderboard during gameplay.
 */

import { getDimensions } from '../canvas.js';

/**
 * Draw the leaderboard
 * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
 * @param {Array} leaderboardData - Leaderboard entries
 * @param {number} x - X position to draw the leaderboard
 * @param {number} y - Y position to draw the leaderboard
 */
export function drawLeaderboard(ctx, leaderboardData, x, y) {
    if (!leaderboardData || leaderboardData.length === 0) return;
    
    const { height } = getDimensions();
    
    // Sort the leaderboard by score
    const sortedData = [...leaderboardData]
        .sort((a, b) => b.score - a.score)
        .slice(0, 20); // Show up to 20 scores
    
    // Set up styling
    ctx.font = '16px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'left';
    
    // Draw title
    ctx.font = 'bold 18px Arial';
    ctx.fillText('HIGH SCORES', x, y);
    
    // Draw entries
    const lineHeight = 22;
    const maxVisibleScores = Math.min(
        // Calculate how many scores can fit on screen
        Math.floor((height - y - 30) / lineHeight),
        // Cap at 20 scores
        20,
        // Don't try to show more scores than we have
        sortedData.length
    );
    
    // Draw a semi-transparent background for better readability
    const padding = 10;
    const bgWidth = 180;
    const bgHeight = lineHeight * maxVisibleScores + 35;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(x - padding, y - 20, bgWidth, bgHeight);
    ctx.fillStyle = 'white';
    
    // Draw scores
    for (let i = 0; i < maxVisibleScores; i++) {
        const entry = sortedData[i];
        const entryY = y + 25 + (i * lineHeight);
        
        // Format date - if available
        let dateStr = '';
        if (entry.createdAt) {
            try {
                const date = new Date(entry.createdAt);
                dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
            } catch (e) {
                // Ignore date parsing errors
            }
        }
        
        // Draw rank and initials
        ctx.textAlign = 'left';
        ctx.fillText(`${i + 1}. ${entry.initials || '???'}`, x, entryY);
        
        // Draw score (right-aligned)
        ctx.textAlign = 'right';
        ctx.fillText(`${entry.score}`, x + 120, entryY);
        
        // Draw date if available
        if (dateStr) {
            ctx.font = '12px Arial';
            ctx.fillText(dateStr, x + 160, entryY);
            ctx.font = '16px Arial';
        }
    }
    
    // If there are more scores than we can display, show an indicator
    if (sortedData.length > maxVisibleScores) {
        ctx.textAlign = 'center';
        ctx.font = '14px Arial';
        ctx.fillText('...', x + 80, y + 25 + (maxVisibleScores * lineHeight));
    }
    
    // Reset text alignment
    ctx.textAlign = 'left';
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