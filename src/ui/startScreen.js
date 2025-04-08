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
    ctx.fillText('SELECT DIFFICULTY:', width * 0.5, height * 0.25);

    // Difficulty buttons
    const difficulties = ['EASY', 'MEDIUM', 'DIFFICULT'];
    const buttonHeight = height * 0.08;
    const buttonSpacing = height * 0.02;
    const buttonWidth = Math.min(width * 0.8, 400); // Cap the button width
    const startY = height * 0.3;

    // Log button dimensions for debugging
    console.log(`Button dimensions - height: ${buttonHeight}, width: ${buttonWidth}, startY: ${startY}`);

    difficulties.forEach((diff, index) => {
        const y = startY + (buttonHeight + buttonSpacing) * index;
        const isSelected = diff.toLowerCase() === currentDifficulty;
        const buttonX = (width - buttonWidth) * 0.5;

        // Log button position for debugging
        console.log(`${diff} button - x: ${buttonX}, y: ${y}, selected: ${isSelected}`);

        // Button background
        ctx.fillStyle = isSelected ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(buttonX, y, buttonWidth, buttonHeight);

        // Button border
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1;
        ctx.strokeRect(buttonX, y, buttonWidth, buttonHeight);

        // Button text
        ctx.fillStyle = 'white';
        ctx.font = `${Math.floor(height * 0.03)}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(diff, width * 0.5, y + buttonHeight * 0.6);
    });

    // Instructions
    ctx.fillStyle = 'white';
    ctx.font = `${Math.floor(height * 0.025)}px Arial`;
    ctx.textAlign = 'center';
    const instructionsY = height * 0.65;
    ctx.fillText('TAP DIFFICULTY TO SELECT', width * 0.5, instructionsY);
    ctx.fillText('TAP ANYWHERE ELSE TO START', width * 0.5, instructionsY + height * 0.04);

    // Draw game stats at the bottom if available
    if (gamesPlayed > 0) {
        ctx.font = `${Math.floor(height * 0.02)}px Arial`;
        ctx.fillText(`Games Played: ${gamesPlayed}`, width * 0.5, height * 0.8);
    }
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
    
    // Games played info
    if (gamesPlayed > 0) {
        ctx.font = '16px Arial';
        ctx.fillText(`Games Played: ${gamesPlayed}`, width / 2, height - 80);
    }
    
    // Copyright text
    ctx.font = '14px Arial';
    ctx.fillText('© 2023 Dinostroids', width / 2, height - 40);
} 