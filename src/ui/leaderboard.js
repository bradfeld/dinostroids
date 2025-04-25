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
 * @param {boolean} useSmallFont - Whether to use smaller font sizes
 */
export function drawLeaderboard(x, y, leaderboardData, ctx, useSmallFont = false) {
    // Log leaderboard data keys for debugging
    if (leaderboardData && leaderboardData.length > 0) {
        console.log("Leaderboard data keys:", Object.keys(leaderboardData[0]));
        console.log("Sample entry:", leaderboardData[0]);
    }
    
    // Sort data by score and take top 20
    const top20Scores = [...leaderboardData]
        .sort((a, b) => b.score - a.score)
        .slice(0, 20); // Show up to 20 scores
    
    // Calculate how many scores can fit on screen
    const maxVisibleScores = Math.min(
        top20Scores.length, 
        20, // Never show more than 20
        Math.floor((ctx.canvas.height - y - 50) / (useSmallFont ? 18 : 25)) // Based on available space
    );
    
    // Calculate wider background for more columns
    const bgWidth = useSmallFont ? 400 : 500;
    
    // Draw semi-transparent background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(
        x - bgWidth/2, 
        y, 
        bgWidth, 
        maxVisibleScores * (useSmallFont ? 18 : 25) + (useSmallFont ? 40 : 50)
    );
    
    // Draw title - centered relative to the background
    ctx.fillStyle = 'white';
    ctx.font = `bold ${useSmallFont ? '18px' : '24px'} Arial`;
    ctx.textAlign = 'center';
    ctx.fillText('High Scores', x, y + (useSmallFont ? 22 : 30));
    
    // Calculate the usable width inside the background for columns
    const contentWidth = bgWidth * 0.9; // Leave some margin on both sides
    const contentLeft = x - contentWidth/2;
    
    // Define column positions - centered and evenly distributed
    // For a more balanced look, allocate relative widths to each column
    const columnWidths = {
        rank: 0.1,      // 10% of content width
        score: 0.2,     // 20% of content width 
        initials: 0.2,  // 20% of content width
        level: 0.1,     // 10% of content width
        date: 0.2,      // 20% of content width
        time: 0.2       // 20% of content width
    };
    
    // Calculate actual positions based on proportional widths
    const rankCol = contentLeft + contentWidth * columnWidths.rank / 2;
    const scoreCol = rankCol + contentWidth * (columnWidths.rank + columnWidths.score) / 2;
    const initialsCol = scoreCol + contentWidth * (columnWidths.score + columnWidths.initials) / 2;
    const levelCol = initialsCol + contentWidth * (columnWidths.initials + columnWidths.level) / 2;
    const dateCol = levelCol + contentWidth * (columnWidths.level + columnWidths.date) / 2;
    const timeCol = dateCol + contentWidth * (columnWidths.date + columnWidths.time) / 2;
    
    // Draw column headers
    ctx.font = useSmallFont ? '12px Arial' : '16px Arial';
    ctx.textAlign = 'center'; // Center all headers for consistent look
    ctx.fillText('Rank', rankCol, y + (useSmallFont ? 45 : 60));
    ctx.fillText('Score', scoreCol, y + (useSmallFont ? 45 : 60));
    ctx.fillText('Initials', initialsCol, y + (useSmallFont ? 45 : 60));
    ctx.fillText('Level', levelCol, y + (useSmallFont ? 45 : 60));
    ctx.fillText('Date', dateCol, y + (useSmallFont ? 45 : 60));
    ctx.fillText('Time', timeCol, y + (useSmallFont ? 45 : 60));
    
    // Draw scores
    ctx.font = useSmallFont ? '12px Arial' : '16px Arial';
    for (let i = 0; i < maxVisibleScores; i++) {
        const score = top20Scores[i];
        const yPos = y + (useSmallFont ? 65 : 85) + (i * (useSmallFont ? 18 : 25));
        
        // Highlight current score
        if (score.isCurrent) {
            ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
            ctx.fillRect(x - bgWidth/2 + 10, yPos - (useSmallFont ? 12 : 15), bgWidth - 20, useSmallFont ? 16 : 20);
            ctx.fillStyle = 'white';
        }
        
        // Draw all score data with center alignment for consistency
        ctx.textAlign = 'center';
        
        // Rank number
        ctx.fillText(`${i + 1}`, rankCol, yPos);
        
        // Score value
        ctx.fillText(`${score.score}`, scoreCol, yPos);
        
        // Initials
        ctx.fillText(score.initials || '---', initialsCol, yPos);
        
        // Level
        ctx.fillText(`${score.level || '1'}`, levelCol, yPos);
        
        // Date (if available)
        const dateField = score.date || score.createdAt || score.created_at;
        if (dateField) {
            try {
                const date = new Date(dateField);
                if (!isNaN(date.getTime())) { // Check if date is valid
                    // Date in mm/dd/yy format with leading zeros
                    const month = (date.getMonth() + 1).toString().padStart(2, '0');
                    const day = date.getDate().toString().padStart(2, '0');
                    const year = date.getFullYear().toString().substr(2);
                    const dateStr = `${month}/${day}/${year}`;
                    ctx.fillText(dateStr, dateCol, yPos);
                    
                    // Time in AM/PM format
                    const hours = date.getHours();
                    const minutes = date.getMinutes();
                    const ampm = hours >= 12 ? 'PM' : 'AM';
                    const displayHours = hours % 12 || 12; // Convert 0 to 12 for 12 AM
                    const timeStr = `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
                    ctx.fillText(timeStr, timeCol, yPos);
                } else {
                    // Invalid date
                    ctx.fillText('--/--/--', dateCol, yPos);
                    ctx.fillText('--:--', timeCol, yPos);
                }
            } catch (e) {
                console.error("Error parsing date:", e, "for score:", score);
                ctx.fillText('--/--/--', dateCol, yPos);
                ctx.fillText('--:--', timeCol, yPos);
            }
        } else {
            ctx.fillText('--/--/--', dateCol, yPos);
            ctx.fillText('--:--', timeCol, yPos);
        }
    }
    
    // Show total count if there are more scores than visible
    if (leaderboardData.length > maxVisibleScores) {
        ctx.textAlign = 'center';
        ctx.font = useSmallFont ? '10px Arial' : '14px Arial';
        ctx.fillText(
            `Showing ${maxVisibleScores} of ${leaderboardData.length} scores`, 
            x, 
            y + maxVisibleScores * (useSmallFont ? 18 : 25) + (useSmallFont ? 30 : 40)
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
    if (entry.createdAt || entry.date) {
        try {
            const date = new Date(entry.createdAt || entry.date);
            if (!isNaN(date.getTime())) {
                const month = (date.getMonth() + 1).toString().padStart(2, '0');
                const day = date.getDate().toString().padStart(2, '0');
                const year = date.getFullYear().toString().substr(2);
                dateStr = `${month}/${day}/${year}`;
            }
        } catch (e) {
            // Ignore date parsing errors
        }
    }
    
    return `${entry.initials || '???'} - ${entry.score} ${dateStr ? `(${dateStr})` : ''}`;
} 