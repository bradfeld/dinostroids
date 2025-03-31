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
 * @param {number} level - The level reached (optional)
 * @param {number} gameTime - The game time in milliseconds (optional)
 */
export function drawGameOver(ctx, score, leaderboard = [], level = 1, gameTime = 0) {
    const { width, height } = getDimensions();
    
    // Clear canvas with dark background
    clear('black');
    
    // Game Over title
    ctx.fillStyle = 'white';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', width / 2, height / 4);
    
    // Score display
    ctx.font = '32px Arial';
    ctx.fillText(`Score: ${score}`, width / 2, height / 4 + 60);
    
    // Enter initials prompt if high score
    const isHighScore = isNewHighScore(score, leaderboard);
    
    if (isHighScore) {
        ctx.font = '24px Arial';
        ctx.fillText('New High Score!', width / 2, height / 4 + 100);
        ctx.fillText('Enter your initials:', width / 2, height / 4 + 140);
        
        // Draw initials input boxes
        const boxWidth = 40;
        const boxHeight = 40;
        const spacing = 10;
        const totalWidth = (boxWidth * 3) + (spacing * 2);
        const startX = width / 2 - totalWidth / 2;
        const boxY = height / 4 + 160;
        
        // Draw three separate boxes for initials
        for (let i = 0; i < 3; i++) {
            const boxX = startX + (i * (boxWidth + spacing));
            
            // Draw box
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
            
            // Draw current initial or underscore
            ctx.font = '32px Arial';
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            
            if (i < playerInitials.length) {
                // Display entered initial
                ctx.fillText(playerInitials[i], boxX + boxWidth / 2, boxY + 30);
            } else {
                // Display underscore
                ctx.fillText('_', boxX + boxWidth / 2, boxY + 30);
            }
        }
    } else {
        // Draw restart prompt
        ctx.font = '24px Arial';
        ctx.fillText('Press SPACE to play again', width / 2, height / 4 + 120);
    }
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
                
                // Auto-submit when all initials are entered
                if (playerInitials.length === MAX_INITIALS_LENGTH && submitCallback) {
                    setTimeout(() => {
                        submitCallback(playerInitials);
                        resetInput();
                    }, 500); // Small delay for visual feedback
                }
            }
        } else if (event.key === 'Backspace') {
            // Handle backspace
            playerInitials = playerInitials.slice(0, -1);
        }
    } else {
        // Handle restart
        if (event.code === 'Space' && restartCallback) {
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
    playerInitials = '';
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