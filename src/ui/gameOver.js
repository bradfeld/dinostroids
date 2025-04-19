/**
 * Game Over Screen
 * 
 * Displays game over information including score and highscores.
 */

import { clear, getDimensions } from '../canvas.js';
import { submitScore } from '../services/api.js';
import { isMobilePhone } from '../utils/device.js';

// Track the player's initials input
let playerInitials = '';
const MAX_INITIALS_LENGTH = 3;
let inputActive = false;
let submitCallback = null;
let restartCallback = null;
let redrawCallback = null; // Function to redraw the screen after input changes
let redrawIntervalId = null; // Interval ID for forced redraw
let touchEventAdded = false; // Track if touch event is already added

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
    const isMobile = isMobilePhone();
    
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
        
        // Different instructions for mobile vs desktop
        if (isMobile) {
            ctx.fillText('Enter your initials (3 letters max):', width / 2, height / 4 + 140);
            // TODO: Add on-screen keyboard for mobile in the future
        } else {
            ctx.fillText('Enter your initials (up to 3 letters):', width / 2, height / 4 + 140);
        }
        
        // Display the initials being typed in real time
        ctx.font = '48px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        
        // Make sure the initials are clearly displayed
        const displayText = playerInitials ? playerInitials + (playerInitials.length < MAX_INITIALS_LENGTH ? "_" : "") : "_";
        
        // Try to force an update of the canvas
        ctx.clearRect(width / 2 - 100, height / 4 + 170, 200, 60);
        ctx.fillText(displayText, width / 2, height / 4 + 200);
        
        // Add instructions for submission
        ctx.font = '16px Arial';
        if (isMobile) {
            ctx.fillText('Tap ENTER when done or type up to 3 letters', width / 2, height / 4 + 240);
        } else {
            ctx.fillText('Press ENTER when done or type up to 3 letters', width / 2, height / 4 + 240);
        }
    } else {
        // Draw restart prompt - different for mobile vs desktop
        ctx.font = '24px Arial';
        if (isMobile) {
            ctx.fillText('Touch the screen to play again', width / 2, height / 4 + 120);
        } else {
            ctx.fillText('Press SPACE to play again', width / 2, height / 4 + 120);
        }
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
 * Set a callback for redrawing the screen
 * @param {Function} callback - Function to call to redraw the screen
 */
export function setRedrawCallback(callback) {
    redrawCallback = callback;
}

/**
 * Handle touch input for the game over screen
 * @param {TouchEvent} event - The touch event
 */
export function handleGameOverTouchInput(event) {
    // Prevent default behavior to avoid scrolling/zooming
    event.preventDefault();
    
    // If this is for high score input, we'll handle it differently in the future
    // For now, we'll just use touch for restarting the game
    if (!inputActive && restartCallback) {
        restartCallback();
    }
}

/**
 * Handle keyboard input for the game over screen
 * @param {KeyboardEvent} event - The keyboard event
 */
export function handleGameOverKeyInput(event) {
    // Check if this is for high score input
    if (inputActive) {
        // Handle Enter key to submit initials
        if (event.key === 'Enter') {
            if (playerInitials.length > 0 && submitCallback) {
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
                
                // Redraw the screen to show the updated initials
                if (redrawCallback) {
                    redrawCallback();
                }
                
                // Auto-submit when all initials are entered
                if (playerInitials.length === MAX_INITIALS_LENGTH && submitCallback) {
                    setTimeout(() => {
                        // Check if input is still active before submitting
                        // Prevents double submission if Enter was pressed quickly
                        if (inputActive && submitCallback) {
                           submitCallback(playerInitials);
                           resetInput();
                        }
                    }, 1000); // Longer delay for visual feedback
                }
            }
        } else if (event.key === 'Backspace') {
            // Handle backspace
            playerInitials = playerInitials.slice(0, -1);
            
            // Redraw the screen to show the updated initials
            if (redrawCallback) {
                redrawCallback();
            }
        }
    } else if (event.code === 'Space' && restartCallback) {
        // Handle restart with Space key
        restartCallback();
    }
}

/**
 * Reset the initials input state
 */
function resetInput() {
    playerInitials = '';
    inputActive = false;
    
    // Clear the forced redraw interval
    if (redrawIntervalId) {
        clearInterval(redrawIntervalId);
        redrawIntervalId = null;
    }
}

/**
 * Activate the initials input
 */
export function activateInput() {
    inputActive = true;
    playerInitials = '';
    
    // Set up a forced redraw every 100ms to ensure display updates
    if (redrawCallback && !redrawIntervalId) {
        redrawIntervalId = setInterval(() => {
            redrawCallback();
        }, 100);
    }
}

/**
 * Set up event listeners for the game over screen
 * @param {HTMLCanvasElement} canvas - The canvas element to attach events to
 */
export function setupGameOverEvents(canvas) {
    // Remove any existing touch event listeners to prevent duplicates
    if (touchEventAdded) {
        canvas.removeEventListener('touchstart', handleGameOverTouchInput);
        touchEventAdded = false;
    }
    
    // Add touch event listener for mobile devices
    canvas.addEventListener('touchstart', handleGameOverTouchInput, { passive: false });
    touchEventAdded = true;
    
    console.log("Game over touch events initialized");
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