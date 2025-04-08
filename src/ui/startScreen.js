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
    
    // Title
    ctx.fillStyle = 'white';
    ctx.font = `bold ${Math.floor(height * 0.06)}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText('DINOSTROIDS', width / 2, height * 0.15);

    // Difficulty selection
    ctx.font = `${Math.floor(height * 0.04)}px Arial`;
    ctx.fillText('SELECT DIFFICULTY:', width / 2, height * 0.25);

    // Difficulty buttons
    const difficulties = ['EASY', 'MEDIUM', 'DIFFICULT'];
    const buttonHeight = height * 0.1;
    const buttonSpacing = height * 0.03;
    const buttonWidth = width * 0.8;
    const startY = height * 0.3;

    difficulties.forEach((diff, index) => {
        const y = startY + (buttonHeight + buttonSpacing) * index;
        const isSelected = diff.toLowerCase() === currentDifficulty;

        // Button background
        ctx.fillStyle = isSelected ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(
            width / 2 - buttonWidth / 2,
            y,
            buttonWidth,
            buttonHeight
        );

        // Button border
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.strokeRect(
            width / 2 - buttonWidth / 2,
            y,
            buttonWidth,
            buttonHeight
        );

        // Button text
        ctx.fillStyle = 'white';
        ctx.font = `${Math.floor(height * 0.04)}px Arial`;
        ctx.fillText(diff, width / 2, y + buttonHeight / 2 + height * 0.015);
    });

    // Instructions
    ctx.fillStyle = 'white';
    ctx.font = `${Math.floor(height * 0.035)}px Arial`;
    const instructionsY = height * 0.7;
    ctx.fillText('TAP DIFFICULTY TO SELECT', width / 2, instructionsY);
    ctx.fillText('TAP SCREEN TO START', width / 2, instructionsY + height * 0.05);
    ctx.fillText('? FOR HELP', width / 2, instructionsY + height * 0.1);

    // Show top 3 scores
    if (leaderboardData && leaderboardData.length > 0) {
        ctx.font = `${Math.floor(height * 0.035)}px Arial`;
        ctx.fillText('TOP SCORES:', width / 2, height * 0.85);
        
        const topScores = leaderboardData.slice(0, 3);
        topScores.forEach((entry, index) => {
            ctx.fillText(
                `${entry.initials}: ${entry.score}`,
                width / 2,
                height * 0.85 + (index + 1) * (height * 0.04)
            );
        });
    }
}

/**
 * Draw the desktop version of the start screen
 */
function drawDesktopStartScreen(ctx, currentDifficulty, leaderboardData, gamesPlayed) {
    const { width, height } = getDimensions();
    
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
    
    // Games played info
    if (gamesPlayed > 0) {
        ctx.font = '16px Arial';
        ctx.fillText(`Games Played: ${gamesPlayed}`, width / 2, height - 80);
    }
    
    // Copyright text
    ctx.font = '14px Arial';
    ctx.fillText('© Intensity Ventures, 2025', width / 2, height - 20);
    
    // Draw leaderboard if data is available
    if (leaderboardData && leaderboardData.length > 0) {
        // Position the leaderboard on the right side with enough margin to show all columns
        // 300px from right edge to ensure the leaderboard is fully visible with all columns
        drawLeaderboard(width - 300, 50, leaderboardData, ctx);
    }
} 