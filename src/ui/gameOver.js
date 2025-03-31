/**
 * Game Over Screen
 * 
 * Displays game over information including score.
 */

import { clear, getDimensions } from '../canvas.js';
import { submitScore } from '../services/api.js';

// Track the player's initials input
let initials = ['', '', ''];
let currentInitialIndex = 0;
let inputActive = false;
let submitCallback = null;
let restartCallback = null;
let lastBlinkTime = 0;
let showCursor = true;

/**
 * Draw the game over screen
 * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
 * @param {number} score - The player's final score
 * @param {Array} leaderboard - The current leaderboard data (used only to check high score)
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
        // Blink cursor every 500ms for active field
        if (Date.now() - lastBlinkTime > 500) {
            showCursor = !showCursor;
            lastBlinkTime = Date.now();
        }
        
        ctx.font = '24px Arial';
        ctx.fillText('New High Score!', width / 2, height / 4 + 130);
        ctx.fillText('Enter your initials:', width / 2, height / 4 + 165);
        
        // Draw three separate initial boxes
        const boxWidth = 40;
        const boxHeight = 40;
        const boxY = height / 4 + 180;
        const spacing = 10;
        
        for (let i = 0; i < 3; i++) {
            const boxX = width / 2 - (boxWidth * 1.5) - spacing + i * (boxWidth + spacing);
            
            // Draw box with highlight if current
            ctx.strokeStyle = currentInitialIndex === i && inputActive ? '#ffff00' : 'white';
            ctx.lineWidth = currentInitialIndex === i && inputActive ? 3 : 2;
            ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
            
            // Draw initial letter with blinking cursor for active field
            ctx.fillStyle = 'white';
            ctx.font = '32px Arial';
            ctx.textAlign = 'center';
            
            let displayText = initials[i];
            
            // Add blinking cursor to current field if it's empty or at the end if it has content
            if (currentInitialIndex === i && inputActive && showCursor) {
                displayText = displayText || '_';
            }
            
            ctx.fillText(displayText, boxX + boxWidth / 2, boxY + 30);
        }
        
        // Information about auto-return after third initial
        ctx.font = '18px Arial';
        ctx.fillText('Will return to start screen after third initial', width / 2, height / 2 + 50);
    } else {
        // Draw restart prompt
        ctx.font = '24px Arial';
        ctx.fillText('Press RETURN to return to start screen', width / 2, height / 2 + 50);
    }
    
    // Request animation frame to keep cursor blinking
    if (inputActive) {
        requestAnimationFrame(() => drawGameOver(ctx, score, leaderboard, level, time));
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
    
    // If leaderboard has fewer than 20 entries, any score qualifies
    if (leaderboard.length < 20) return true;
    
    // Check if score is higher than the lowest score in the top 20
    const sortedScores = [...leaderboard].sort((a, b) => b.score - a.score);
    return score > sortedScores[19].score;
}

/**
 * Handle keyboard input for the game over screen
 * @param {KeyboardEvent} event - The keyboard event
 */
export function handleGameOverKeyInput(event) {
    if (inputActive) {
        // Handle initials input
        if (event.key.length === 1 && /[A-Za-z]/.test(event.key)) {
            // Set current letter and move to next field
            initials[currentInitialIndex] = event.key.toUpperCase();
            
            // Move to next field or submit if this was the last field
            if (currentInitialIndex < 2) {
                currentInitialIndex++;
            } else if (currentInitialIndex === 2) {
                // All three initials are now entered, submit automatically
                if (submitCallback) {
                    submitCallback(initials.join(''));
                }
                resetInput();
                
                // Return to start screen
                if (restartCallback) {
                    restartCallback();
                }
            }
        } else if (event.key === 'Backspace') {
            // Handle backspace - clear current field and move back
            initials[currentInitialIndex] = '';
            if (currentInitialIndex > 0 && !initials[currentInitialIndex]) {
                currentInitialIndex--;
            }
        } else if (event.key === 'ArrowLeft') {
            // Move to previous field
            if (currentInitialIndex > 0) {
                currentInitialIndex--;
            }
        } else if (event.key === 'ArrowRight') {
            // Move to next field if it's not the last one
            if (currentInitialIndex < 2) {
                currentInitialIndex++;
            }
        }
    } else {
        // Handle return to start screen
        if ((event.code === 'Enter' || event.code === 'NumpadEnter') && restartCallback) {
            restartCallback();
        }
    }
}

/**
 * Reset the initials input state
 */
function resetInput() {
    initials = ['', '', ''];
    currentInitialIndex = 0;
    inputActive = false;
}

/**
 * Activate the initials input
 */
export function activateInput() {
    initials = ['', '', ''];
    currentInitialIndex = 0;
    inputActive = true;
    lastBlinkTime = Date.now();
    showCursor = true;
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