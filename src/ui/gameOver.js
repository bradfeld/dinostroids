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
        ctx.fillText('Enter your initials (up to 3 letters):', width / 2, height / 4 + 140);
        
        // Display the initials being typed in real time
        ctx.font = '48px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        
        // Display current initials with a cursor
        const displayText = playerInitials + (playerInitials.length < MAX_INITIALS_LENGTH ? "_" : "");
        ctx.fillText(displayText, width / 2, height / 4 + 200);
        
        // Add instructions for submission
        ctx.font = '16px Arial';
        ctx.fillText('Press ENTER when done or type up to 3 letters', width / 2, height / 4 + 240);
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
    // Always treat a score as high score if there's no leaderboard data
    if (!leaderboard || leaderboard.length === 0) return true;
    
    // If leaderboard has fewer than 20 entries, any score qualifies
    if (leaderboard.length < 20) return true;
    
    // Check if score is higher than the lowest score on the leaderboard
    const sortedScores = [...leaderboard].sort((a, b) => b.score - a.score);
    const lowestHighScore = sortedScores[sortedScores.length - 1].score;
    return score > lowestHighScore;
}

/**
 * Handle keyboard input for the game over screen
 * @param {KeyboardEvent} event - The keyboard event
 */
export function handleGameOverKeyInput(event) {
    // Check if this is for high score input
    if (inputActive) {
        console.log(`Key pressed for initials: ${event.key}`);
        
        // Handle Enter key to submit initials
        if (event.key === 'Enter') {
            if (playerInitials.length > 0 && submitCallback) {
                console.log(`Submitting initials: ${playerInitials}`);
                submitCallback(playerInitials);
                resetInput();
            }
            return;
        }
        
        // Handle initials input
        if (event.key.length === 1 && /[A-Za-z]/.test(event.key)) {
            // Only allow letters
            if (playerInitials.length < MAX_INITIALS_LENGTH) {
                playerInitials += event.key.toUpperCase();
                console.log(`Current initials: ${playerInitials}`);
                
                // Auto-submit when all initials are entered
                if (playerInitials.length === MAX_INITIALS_LENGTH && submitCallback) {
                    console.log("All initials entered, submitting in 1 second...");
                    setTimeout(() => {
                        submitCallback(playerInitials);
                        resetInput();
                    }, 1000); // Longer delay for visual feedback
                }
            }
        } else if (event.key === 'Backspace') {
            // Handle backspace
            playerInitials = playerInitials.slice(0, -1);
            console.log(`Backspace pressed, initials now: ${playerInitials}`);
        }
    } else if (event.code === 'Space' && restartCallback) {
        // Handle restart with Space key
        console.log("Space pressed for restart");
        restartCallback();
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