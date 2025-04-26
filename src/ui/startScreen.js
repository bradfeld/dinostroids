/**
 * Start Screen UI Component
 * 
 * Displays the game title, difficulty options, and start instructions.
 */

import { getDimensions } from '../canvas.js';
import { drawLeaderboard } from './leaderboard.js';
import { isMobilePhone } from '../utils/device.js';

/**
 * Draw the start screen
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 * @param {string} currentDifficulty - Current difficulty setting
 * @param {Array} leaderboardData - Leaderboard data
 * @param {number} gamesPlayed - Number of games played
 */
export function drawStartScreen(ctx, currentDifficulty, leaderboardData, gamesPlayed) {
    const { width, height } = ctx.canvas;

    // Clear the canvas
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);

    // Log current difficulty for debugging
    console.log(`Start Screen - Current difficulty: ${currentDifficulty}`);

    if (isMobilePhone()) {
        // Mobile layout
        drawMobileStartScreen(ctx, currentDifficulty, leaderboardData, gamesPlayed);
    } else {
        // Desktop layout
        drawDesktopStartScreen(ctx, currentDifficulty, leaderboardData, gamesPlayed);
    }
}

/**
 * Draw the mobile version of the start screen
 */
function drawMobileStartScreen(ctx, currentDifficulty, leaderboardData, gamesPlayed) {
    const { width, height } = ctx.canvas;
    
    console.log(`Drawing mobile start screen at ${width}x${height}`);
    
    // Title
    ctx.fillStyle = 'white';
    ctx.font = `bold ${Math.floor(height * 0.05)}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText('DINOSTROIDS', width * 0.5, height * 0.15);

    // Difficulty selection
    ctx.font = `${Math.floor(height * 0.03)}px Arial`;
    ctx.fillText('TAP DIFFICULTY TO START:', width * 0.5, height * 0.25);

    // Difficulty buttons
    const difficulties = ['EASY', 'MEDIUM', 'DIFFICULT'];
    const buttonHeight = height * 0.08;
    const buttonSpacing = height * 0.02;
    const buttonWidth = Math.min(width * 0.8, 400); // Cap the button width
    const startY = height * 0.3;

    difficulties.forEach((diff, index) => {
        const y = startY + (buttonHeight + buttonSpacing) * index;
        const isSelected = diff.toLowerCase() === currentDifficulty;
        const buttonX = (width - buttonWidth) * 0.5;

        // Button background - make it more visible
        ctx.fillStyle = isSelected ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(buttonX, y, buttonWidth, buttonHeight);

        // Button border
        ctx.strokeStyle = 'white';
        ctx.lineWidth = isSelected ? 2 : 1; // Thicker border for selected difficulty
        ctx.strokeRect(buttonX, y, buttonWidth, buttonHeight);

        // Button text
        ctx.fillStyle = 'white';
        ctx.font = `${isSelected ? 'bold ' : ''}${Math.floor(height * 0.03)}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(diff, width * 0.5, y + buttonHeight * 0.6);
    });

    // Calculate position for the high scores section, below difficulty buttons
    const highScoresY = startY + (buttonHeight + buttonSpacing) * difficulties.length + buttonSpacing * 2;
    
    // Display top 5 high scores if data is available
    if (leaderboardData && leaderboardData.length > 0) {
        // Sort scores and get top 5
        const topScores = [...leaderboardData]
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);
            
        // Background for high scores
        const scoreBoxWidth = Math.min(width * 0.9, 350);
        const rowHeight = Math.floor(height * 0.028);
        const scoreBoxHeight = rowHeight * (topScores.length + 2); // +2 for header and title
        
        // Draw semi-transparent background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(
            (width - scoreBoxWidth) / 2,
            highScoresY,
            scoreBoxWidth,
            scoreBoxHeight
        );
        
        // Draw title
        ctx.fillStyle = 'white';
        ctx.font = `bold ${Math.floor(height * 0.025)}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText('High Scores', width * 0.5, highScoresY + rowHeight);
        
        // Define column positions
        const rankX = width * 0.5 - scoreBoxWidth * 0.35;
        const scoreX = width * 0.5;
        const initialsX = width * 0.5 + scoreBoxWidth * 0.35;
        
        // Draw column headers
        ctx.font = `${Math.floor(height * 0.02)}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText('Rank', rankX, highScoresY + rowHeight * 2);
        ctx.fillText('Score', scoreX, highScoresY + rowHeight * 2);
        ctx.fillText('Initials', initialsX, highScoresY + rowHeight * 2);
        
        // Draw scores
        ctx.font = `${Math.floor(height * 0.02)}px Arial`;
        topScores.forEach((score, i) => {
            const rowY = highScoresY + rowHeight * (i + 3);
            
            // Rank
            ctx.textAlign = 'center';
            ctx.fillText(`${i + 1}`, rankX, rowY);
            
            // Score value
            ctx.fillText(`${score.score}`, scoreX, rowY);
            
            // Initials
            ctx.fillText(score.initials || '---', initialsX, rowY);
        });
    }

    // Draw game stats at the bottom if available
    if (gamesPlayed > 0) {
        ctx.font = `${Math.floor(height * 0.02)}px Arial`;
        ctx.textAlign = 'center'; // Ensure text is center-aligned
        ctx.fillText(`Games Played: ${gamesPlayed}`, width * 0.5, height * 0.9);
    }
    
    // Copyright text
    ctx.font = `${Math.floor(height * 0.015)}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText('(c) 2025 Intensity Ventures', width * 0.5, height * 0.95);
}

/**
 * Draw the desktop version of the start screen
 */
function drawDesktopStartScreen(ctx, currentDifficulty, leaderboardData, gamesPlayed) {
    const { width, height } = ctx.canvas;
    
    // Draw title
    ctx.fillStyle = 'white';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('DINOSTROIDS', width / 2, height / 3);
    
    // Draw subtitle
    ctx.font = '24px Arial';
    ctx.fillText('Select Difficulty:', width / 2, height / 2 - 30);
    
    // Draw difficulty options
    const options = [
        { key: 'E', label: 'Easy', value: 'easy' },
        { key: 'M', label: 'Medium', value: 'medium' },
        { key: 'D', label: 'Difficult', value: 'difficult' }
    ];
    
    const diffY = height / 2 + 30;
    options.forEach((option, index) => {
        const x = width / 2 - 150 + (index * 150);
        const isSelected = currentDifficulty === option.value;
        
        // Draw selection background if this option is selected
        if (isSelected) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.fillRect(x - 65, diffY - 30, 130, 40);
            // Use bold font for selected option
            ctx.font = 'bold 24px Arial';
        } else {
            ctx.font = '24px Arial';
        }
        
        // Draw option text
        ctx.fillStyle = isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.8)';
        ctx.fillText(`${option.key}: ${option.label}`, x, diffY);
    });
    
    // Reset font and fill style
    ctx.font = '24px Arial';
    ctx.fillStyle = 'white';
    
    // Draw instructions
    ctx.font = '24px Arial';
    ctx.fillText('Press RETURN to start', width / 2, height * 2/3 + 20);
    ctx.fillText('Press ? for help', width / 2, height * 2/3 + 60);
    
    // Draw leaderboard if data is available
    if (leaderboardData && leaderboardData.length > 0) {
        // Draw the leaderboard in the top right corner
        const leaderboardX = width * 0.86; // Position at 86% of screen width (moved left from 90%)
        const leaderboardY = height * 0.1; // Position at 10% from the top
        
        // Set a smaller font size flag for the leaderboard
        const useSmallFont = true;
        drawLeaderboard(leaderboardX, leaderboardY, leaderboardData, ctx, useSmallFont);
    }
    
    // Games played info - centered horizontally
    if (gamesPlayed > 0) {
        ctx.font = '16px Arial';
        ctx.textAlign = 'center'; // Ensure text is center-aligned
        ctx.fillText(`Games Played: ${gamesPlayed}`, width / 2, height - 80);
    }
    
    // Copyright text - centered horizontally
    ctx.font = '14px Arial';
    ctx.textAlign = 'center'; // Ensure text is center-aligned
    ctx.fillText('(c) 2025 Intensity Ventures', width / 2, height - 40);
} 