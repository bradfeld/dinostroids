/**
 * Game Over Screen
 * 
 * Displays game over information including score and highscores.
 */

import { clear, getDimensions } from '../canvas.js';
import { submitScore } from '../services/api.js';

// Track the player's initials input
let playerInitials = '';
const MAX_INITIALS_LENGTH = 3;
let inputActive = false;
let submitCallback = null;
let restartCallback = null;

/**
 * Draw the game over screen
 * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
 * @param {number} score - The player's final score
 * @param {Array} leaderboard - The current leaderboard data
 * @param {number} level - The level reached
 * @param {number} time - Time played in milliseconds
 */
export function drawGameOver(ctx, score, leaderboard = [], level = 1, time = 0) {
    const { width, height } = getDimensions();
    
    // Clear canvas with dark background
    clear('black');
    
    // Game Over title
    ctx.fillStyle = 'white';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', width / 2, height / 4);
    
    // Format time
    const minutes = Math.floor(time / 60000);
    const seconds = Math.floor((time % 60000) / 1000);
    const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    // Score and stats display
    ctx.font = '32px Arial';
    ctx.fillText(`Score: ${score}`, width / 2, height / 4 + 60);
    
    // Show level and time
    ctx.font = '24px Arial';
    ctx.fillText(`Level: ${level}  Time: ${timeStr}`, width / 2, height / 4 + 95);
    
    // Enter initials prompt if high score
    const isHighScore = isNewHighScore(score, leaderboard);
    
    if (isHighScore) {
        ctx.font = '24px Arial';
        ctx.fillText('New High Score!', width / 2, height / 4 + 130);
        ctx.fillText('Enter your initials:', width / 2, height / 4 + 165);
        
        // Draw initials input box
        const boxWidth = 120;
        const boxHeight = 40;
        const boxX = width / 2 - boxWidth / 2;
        const boxY = height / 4 + 180;
        
        // Draw box
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
        
        // Draw current initials
        ctx.font = '32px Arial';
        ctx.fillText(playerInitials + (inputActive ? '_' : ''), width / 2, boxY + 30);
        
        // Draw submit button if initials are complete
        if (playerInitials.length === MAX_INITIALS_LENGTH) {
            ctx.font = '24px Arial';
            ctx.fillText('Press ENTER to submit', width / 2, boxY + 80);
        }
    } else {
        // Draw restart prompt
        ctx.font = '24px Arial';
        ctx.fillText('Press RETURN to play again', width / 2, height / 4 + 140);
    }
    
    // Display leaderboard if available
    if (leaderboard && leaderboard.length > 0) {
        drawLeaderboard(ctx, leaderboard, width, height);
    }
}

/**
 * Draw the leaderboard section
 * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
 * @param {Array} leaderboard - The leaderboard data
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 */
function drawLeaderboard(ctx, leaderboard, width, height) {
    // Leaderboard title
    ctx.font = 'bold 32px Arial';
    ctx.fillText('TOP SCORES', width / 2, height / 2);
    
    // Sort leaderboard by score
    const sortedLeaderboard = [...leaderboard].sort((a, b) => b.score - a.score).slice(0, 5);
    
    // Leaderboard entries
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    const startX = width / 2 - 100;
    
    sortedLeaderboard.forEach((entry, index) => {
        const y = height / 2 + 40 + (index * 30);
        ctx.fillText(`${index + 1}. ${entry.initials}`, startX, y);
        
        ctx.textAlign = 'right';
        ctx.fillText(`${entry.score}`, startX + 200, y);
        ctx.textAlign = 'left';
    });
}

/**
 * Check if the current score is a new high score
 * @param {number} score - The player's score
 * @param {Array} leaderboard - The current leaderboard data
 * @returns {boolean} Whether it's a new high score
 */
function isNewHighScore(score, leaderboard) {
    if (!leaderboard || leaderboard.length === 0) return true;
    
    // If leaderboard has fewer than 5 entries, any score qualifies
    if (leaderboard.length < 5) return true;
    
    // Check if score is higher than the lowest score on the leaderboard
    const sortedScores = [...leaderboard].sort((a, b) => b.score - a.score);
    return score > sortedScores[4].score;
}

/**
 * Handle keyboard input for the game over screen
 * @param {KeyboardEvent} event - The keyboard event
 */
export function handleGameOverKeyInput(event) {
    const isHighScore = inputActive;
    
    if (isHighScore) {
        // Handle initials input
        if (event.key.length === 1 && /[A-Za-z]/.test(event.key)) {
            // Only allow letters
            if (playerInitials.length < MAX_INITIALS_LENGTH) {
                playerInitials += event.key.toUpperCase();
            }
        } else if (event.key === 'Backspace') {
            // Handle backspace
            playerInitials = playerInitials.slice(0, -1);
        } else if (event.key === 'Enter' && playerInitials.length === MAX_INITIALS_LENGTH) {
            // Submit score
            if (submitCallback) {
                submitCallback(playerInitials);
            }
            resetInput();
        }
    } else {
        // Handle restart
        if (event.code === 'Enter' && restartCallback) {
            restartCallback();
        }
    }
}

/**
 * Reset the initials input state
 */
function resetInput() {
    playerInitials = '';
    inputActive = false;
}

/**
 * Activate the initials input
 */
export function activateInput() {
    inputActive = true;
}

/**
 * Set the callback for score submission
 * @param {Function} callback - Function to call when score is submitted
 */
export function onSubmitScore(callback) {
    submitCallback = callback;
}

/**
 * Set the callback for game restart
 * @param {Function} callback - Function to call when game is restarted
 */
export function onRestart(callback) {
    restartCallback = callback;
} 