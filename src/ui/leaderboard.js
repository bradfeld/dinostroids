/**
 * Leaderboard UI Component
 * 
 * Handles displaying the leaderboard during gameplay.
 */

/**
 * Draw the leaderboard
 * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
 * @param {Array} leaderboardData - Leaderboard entries
 * @param {number} x - X position to draw the leaderboard
 * @param {number} y - Y position to draw the leaderboard
 */
export function drawLeaderboard(ctx, leaderboardData, x, y) {
    if (!leaderboardData || leaderboardData.length === 0) return;
    
    // Sort the leaderboard by score
    const sortedData = [...leaderboardData]
        .sort((a, b) => b.score - a.score)
        .slice(0, 5); // Only show top 5
    
    // Set up styling
    ctx.font = '16px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'left';
    
    // Draw title
    ctx.font = 'bold 18px Arial';
    ctx.fillText('HIGH SCORES', x, y);
    
    // Draw entries
    const lineHeight = 22;
    sortedData.forEach((entry, index) => {
        const entryY = y + 25 + (index * lineHeight);
        
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
        ctx.fillText(`${index + 1}. ${entry.initials || '???'}`, x, entryY);
        
        // Draw score (right-aligned)
        ctx.textAlign = 'right';
        ctx.fillText(`${entry.score}`, x + 120, entryY);
        
        // Draw date if available
        if (dateStr) {
            ctx.font = '12px Arial';
            ctx.fillText(dateStr, x + 160, entryY);
            ctx.font = '16px Arial';
        }
    });
    
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