/**
 * Game Over Screen
 * 
 * Displays game over information including score and highscores.
 * Handles both desktop (keyboard) and mobile (touch) interactions.
 */

import { clear, getDimensions, getCanvas } from '../canvas.js';
import { submitScore } from '../services/api.js';
import { isMobilePhone } from '../utils/device.js';

// Constants
const MAX_INITIALS_LENGTH = 3;
const LETTER_BUTTONS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');
const KEYBOARD_WIDTH = 280;
const KEYBOARD_HEIGHT = 120;
const BUTTON_SIZE = 38;
const BUTTON_MARGIN = 4;
const BUTTONS_PER_ROW = 9;

// Shared state
let playerInitials = '';
let inputActive = false;
let submitCallback = null;
let restartCallback = null;
let cancelCallback = null;
let redrawCallback = null;
let redrawIntervalId = null;

// Mobile touch keyboard state
let mobileKeyboard = {
  x: 0,
  y: 0,
  width: KEYBOARD_WIDTH,
  height: KEYBOARD_HEIGHT,
  visible: false,
  buttons: [],
  submitButton: { x: 0, y: 0, width: 120, height: 40, text: "SUBMIT" },
  backspaceButton: { x: 0, y: 0, width: 80, height: 40, text: "DEL" },
  cancelButton: { x: 0, y: 0, width: 80, height: 40, text: "CANCEL" },
  restartButton: { x: 0, y: 0, width: 240, height: 60, text: "TOUCH TO PLAY AGAIN" }
};

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
    
    // Level and time display (optional)
    if (level > 1 || gameTime > 0) {
        ctx.font = '20px Arial';
        const timeStr = formatTime(gameTime);
        ctx.fillText(`Level: ${level} | Time: ${timeStr}`, width / 2, height / 4 + 95);
    }
    
    // Check if it's a high score
    const isHighScore = isNewHighScore(score, leaderboard);
    
    if (isHighScore) {
        ctx.font = '24px Arial';
        ctx.fillText('New High Score!', width / 2, height / 4 + 130);
        
        // Platform-specific instructions
        if (!isMobile) {
            // Desktop: keyboard input instructions
            ctx.fillText('Enter your initials (up to 3 letters):', width / 2, height / 4 + 160);
        } else {
            // Mobile: touch input instructions
            ctx.fillText('Enter your initials below:', width / 2, height / 4 + 160);
        }
        
        // Display the initials being typed in real time - no box, just the letters
        ctx.font = '48px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        
        // Draw underscores for initials (instead of a box)
        const underscoreSpacing = 40; // Space between underscores
        const startX = width / 2 - underscoreSpacing;
        const initialsY = height / 4 + 220;
        
        // Draw three underscores to indicate the three initials
        for (let i = 0; i < MAX_INITIALS_LENGTH; i++) {
            const x = startX + (i * underscoreSpacing);
            ctx.fillRect(x - 15, initialsY + 5, 30, 3); // Draw underline
            
            // If we have a letter for this position, draw it
            if (i < playerInitials.length) {
                ctx.fillText(playerInitials[i], x, initialsY);
            }
        }
        
        // Force a clear redraw interval to update the display after each key press
        if (inputActive && !redrawIntervalId) {
            redrawIntervalId = setInterval(() => {
                if (redrawCallback) {
                    redrawCallback();
                }
            }, 100);
        }
        
        // Platform-specific UI
        if (!isMobile) {
            // Desktop: keyboard instructions
            ctx.font = '16px Arial';
            ctx.fillText('Press ENTER when done or type up to 3 letters', width / 2, initialsY + 40);
        } else {
            // Mobile: virtual keyboard
            drawMobileKeyboard(ctx);
        }
    } else {
        // Not a high score - show restart option
        if (!isMobile) {
            // Desktop restart instructions
            ctx.font = '24px Arial';
            ctx.fillText('Press SPACE to play again', width / 2, height / 4 + 130);
        } else {
            // Mobile restart button
            drawMobileRestartButton(ctx);
        }
    }
}

/**
 * Format time in MM:SS format
 * @param {number} timeMs - Time in milliseconds
 * @returns {string} Formatted time
 */
function formatTime(timeMs) {
    const totalSeconds = Math.floor(timeMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
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
 * Draw the mobile virtual keyboard
 * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
 */
function drawMobileKeyboard(ctx) {
    const { width, height } = getDimensions();
    
    // Center the keyboard horizontally - shift slightly left to account for screen centering
    const keyboardXOffset = -10; // Shift left to better center on screen
    mobileKeyboard.x = Math.floor((width - KEYBOARD_WIDTH) / 2) + keyboardXOffset;
    mobileKeyboard.y = height - KEYBOARD_HEIGHT - 100;
    mobileKeyboard.visible = true;
    
    // Draw keyboard background
    ctx.fillStyle = 'black';
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.fillRect(mobileKeyboard.x, mobileKeyboard.y, KEYBOARD_WIDTH, KEYBOARD_HEIGHT);
    ctx.strokeRect(mobileKeyboard.x, mobileKeyboard.y, KEYBOARD_WIDTH, KEYBOARD_HEIGHT);
    
    // Create and draw letter buttons
    mobileKeyboard.buttons = [];
    
    // Position the letter buttons in rows
    let row = 0;
    let col = 0;
    
    for (let i = 0; i < LETTER_BUTTONS.length; i++) {
        if (col >= BUTTONS_PER_ROW) {
            col = 0;
            row++;
        }
        
        const letter = LETTER_BUTTONS[i];
        const x = mobileKeyboard.x + col * (BUTTON_SIZE + BUTTON_MARGIN) + BUTTON_MARGIN;
        const y = mobileKeyboard.y + row * (BUTTON_SIZE + BUTTON_MARGIN) + BUTTON_MARGIN;
        
        // Store button data
        mobileKeyboard.buttons.push({
            letter: letter,
            x: x,
            y: y,
            width: BUTTON_SIZE,
            height: BUTTON_SIZE
        });
        
        // Draw the button - black background with white outline and text
        ctx.fillStyle = 'black';
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1.5;
        ctx.fillRect(x, y, BUTTON_SIZE, BUTTON_SIZE);
        ctx.strokeRect(x, y, BUTTON_SIZE, BUTTON_SIZE);
        
        // Draw the letter
        ctx.fillStyle = 'white';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(letter, x + BUTTON_SIZE / 2, y + BUTTON_SIZE / 2);
        
        col++;
    }
    
    // Position all controls on the same line below the keyboard
    const controlsY = mobileKeyboard.y + KEYBOARD_HEIGHT + 20;
    const delWidth = 80;
    const cancelWidth = 120;
    const submitWidth = 120;
    const spacing = 20;
    const totalWidth = delWidth + cancelWidth + submitWidth + (spacing * 2);
    const startX = Math.floor((width - totalWidth) / 2) + keyboardXOffset;
    
    // Position and draw the DEL button first
    const delX = startX;
    const delY = controlsY;
    mobileKeyboard.backspaceButton = {
        x: delX,
        y: delY,
        width: delWidth,
        height: 40,
        text: "DEL"
    };
    
    // Draw DEL button - black background with white outline and text
    ctx.fillStyle = 'black';
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.fillRect(delX, delY, delWidth, 40);
    ctx.strokeRect(delX, delY, delWidth, 40);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText("DEL", delX + delWidth/2, delY + 20);
    
    // Position and draw the CANCEL button in the middle
    const cancelX = delX + delWidth + spacing;
    const cancelY = delY;
    mobileKeyboard.cancelButton = {
        x: cancelX,
        y: cancelY,
        width: cancelWidth,
        height: 40,
        text: "CANCEL"
    };
    
    // Draw cancel button - black background with white outline and text
    ctx.fillStyle = 'black';
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.fillRect(cancelX, cancelY, cancelWidth, 40);
    ctx.strokeRect(cancelX, cancelY, cancelWidth, 40);
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.fillText("CANCEL", cancelX + cancelWidth/2, cancelY + 20);
    
    // Position and draw the SUBMIT button at the end
    const submitX = cancelX + cancelWidth + spacing;
    const submitY = delY;
    mobileKeyboard.submitButton = {
        x: submitX,
        y: submitY,
        width: submitWidth,
        height: 40,
        text: "SUBMIT"
    };
    
    // Draw submit button - black background with white outline and text
    ctx.fillStyle = 'black';
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.fillRect(submitX, submitY, submitWidth, 40);
    ctx.strokeRect(submitX, submitY, submitWidth, 40);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText("SUBMIT", submitX + submitWidth/2, submitY + 20);
}

/**
 * Draw the mobile restart button
 * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
 */
function drawMobileRestartButton(ctx) {
    const { width, height } = getDimensions();
    
    // Position the button
    const buttonWidth = 240;
    const buttonHeight = 60;
    const buttonX = Math.floor((width - buttonWidth) / 2);
    const buttonY = height - 160;
    
    // Store button position
    mobileKeyboard.restartButton = {
        x: buttonX,
        y: buttonY,
        width: buttonWidth,
        height: buttonHeight,
        text: "TOUCH TO PLAY AGAIN"
    };
    
    // Draw button with black fill and white border
    ctx.fillStyle = 'black';
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 4;
    ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
    ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);
    
    // Draw text in white
    ctx.fillStyle = 'white';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText("TOUCH TO PLAY AGAIN", buttonX + buttonWidth/2, buttonY + buttonHeight/2);
}

/**
 * Set a callback for redrawing the screen
 * @param {Function} callback - Function to call to redraw the screen
 */
export function setRedrawCallback(callback) {
    redrawCallback = callback;
}

/**
 * Handle keyboard input for the game over screen (desktop)
 * @param {KeyboardEvent} event - The keyboard event
 */
export function handleGameOverKeyInput(event) {
    // Only process keyboard input when not on mobile
    if (isMobilePhone()) return;
    
    // Check if this is for high score input
    if (inputActive) {
        // Handle Escape key to cancel high score submission
        if (event.key === 'Escape' && cancelCallback) {
            console.log("Canceling high score submission via Escape key");
            resetInput();
            cancelCallback();
            return;
        }
        
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
 * Handle touch input for the game over screen (mobile)
 * @param {TouchEvent} event - The touch event
 */
function handleMobileTouchInput(event) {
    event.preventDefault();
    event.stopPropagation(); // Prevent event bubbling
    
    // Only process touch events on mobile
    if (!isMobilePhone()) return;
    
    // Get touch coordinates
    if (!event.touches || !event.touches[0]) return;
    
    const touch = event.touches[0];
    const { canvas } = getCanvas();
    const rect = canvas.getBoundingClientRect();
    const touchX = touch.clientX - rect.left;
    const touchY = touch.clientY - rect.top;
    
    console.log(`Mobile touch at (${touchX}, ${touchY})`);
    
    // If input is active (high score entry)
    if (inputActive && mobileKeyboard.visible) {
        // Check for letter button presses
        for (const button of mobileKeyboard.buttons) {
            if (isTouchOnButton(touchX, touchY, button)) {
                if (playerInitials.length < MAX_INITIALS_LENGTH) {
                    // Add the letter to initials
                    playerInitials += button.letter;
                    console.log(`Added letter ${button.letter}. Current initials: ${playerInitials}`);
                    
                    // Visual feedback for button press (inverted colors)
                    const ctx = getCanvas().ctx;
                    ctx.fillStyle = 'white';
                    ctx.fillRect(button.x, button.y, button.width, button.height);
                    ctx.strokeStyle = 'black';
                    ctx.lineWidth = 1.5;
                    ctx.strokeRect(button.x, button.y, button.width, button.height);
                    ctx.fillStyle = 'black';
                    ctx.font = 'bold 20px Arial';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(button.letter, button.x + button.width / 2, button.y + button.height / 2);
                    
                    // Immediate redraw to update the display
                    if (redrawCallback) {
                        redrawCallback();
                    }
                    
                    // Also schedule another redraw after a moment for the button visual feedback
                    setTimeout(() => {
                        if (redrawCallback) {
                            redrawCallback();
                        }
                    }, 100);
                    
                    // Auto-submit when all initials are entered
                    if (playerInitials.length === MAX_INITIALS_LENGTH && submitCallback) {
                        setTimeout(() => {
                            if (inputActive && submitCallback) {
                                submitCallback(playerInitials);
                                resetInput();
                            }
                        }, 1000); // Longer delay for visual feedback
                    }
                }
                return;
            }
        }
        
        // Check for backspace button press
        if (isTouchOnButton(touchX, touchY, mobileKeyboard.backspaceButton)) {
            playerInitials = playerInitials.slice(0, -1);
            console.log(`Deleted letter. Current initials: ${playerInitials}`);
            
            // Visual feedback for button press (inverted colors)
            const ctx = getCanvas().ctx;
            ctx.fillStyle = 'white';
            ctx.fillRect(
                mobileKeyboard.backspaceButton.x, 
                mobileKeyboard.backspaceButton.y, 
                mobileKeyboard.backspaceButton.width, 
                mobileKeyboard.backspaceButton.height
            );
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(
                mobileKeyboard.backspaceButton.x, 
                mobileKeyboard.backspaceButton.y, 
                mobileKeyboard.backspaceButton.width, 
                mobileKeyboard.backspaceButton.height
            );
            ctx.fillStyle = 'black';
            ctx.font = 'bold 18px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(
                "DEL", 
                mobileKeyboard.backspaceButton.x + mobileKeyboard.backspaceButton.width / 2, 
                mobileKeyboard.backspaceButton.y + mobileKeyboard.backspaceButton.height / 2
            );
            
            // Immediate redraw to update the display
            if (redrawCallback) {
                redrawCallback();
            }
            
            // Schedule another redraw after a moment for the button visual feedback
            setTimeout(() => {
                if (redrawCallback) {
                    redrawCallback();
                }
            }, 100);
            return;
        }
        
        // Check for submit button press
        if (isTouchOnButton(touchX, touchY, mobileKeyboard.submitButton) && playerInitials.length > 0) {
            // Visual feedback for button press (inverted colors)
            const ctx = getCanvas().ctx;
            ctx.fillStyle = 'white';
            ctx.fillRect(
                mobileKeyboard.submitButton.x, 
                mobileKeyboard.submitButton.y, 
                mobileKeyboard.submitButton.width, 
                mobileKeyboard.submitButton.height
            );
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(
                mobileKeyboard.submitButton.x, 
                mobileKeyboard.submitButton.y, 
                mobileKeyboard.submitButton.width, 
                mobileKeyboard.submitButton.height
            );
            ctx.fillStyle = 'black';
            ctx.font = 'bold 18px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(
                "SUBMIT", 
                mobileKeyboard.submitButton.x + mobileKeyboard.submitButton.width / 2, 
                mobileKeyboard.submitButton.y + mobileKeyboard.submitButton.height / 2
            );
            
            // Submit after a short delay for visual feedback
            setTimeout(() => {
                if (submitCallback) {
                    submitCallback(playerInitials);
                    resetInput();
                }
            }, 150);
            return;
        }
        
        // Check for cancel button press
        if (isTouchOnButton(touchX, touchY, mobileKeyboard.cancelButton)) {
            // Visual feedback for button press (inverted colors)
            const ctx = getCanvas().ctx;
            ctx.fillStyle = 'white';
            ctx.fillRect(
                mobileKeyboard.cancelButton.x, 
                mobileKeyboard.cancelButton.y, 
                mobileKeyboard.cancelButton.width, 
                mobileKeyboard.cancelButton.height
            );
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(
                mobileKeyboard.cancelButton.x, 
                mobileKeyboard.cancelButton.y, 
                mobileKeyboard.cancelButton.width, 
                mobileKeyboard.cancelButton.height
            );
            ctx.fillStyle = 'black';
            ctx.font = 'bold 18px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(
                "CANCEL", 
                mobileKeyboard.cancelButton.x + mobileKeyboard.cancelButton.width / 2, 
                mobileKeyboard.cancelButton.y + mobileKeyboard.cancelButton.height / 2
            );
            
            // Cancel after a short delay for visual feedback
            setTimeout(() => {
                if (cancelCallback) {
                    resetInput();
                    cancelCallback();
                }
            }, 150);
            return;
        }
    } else if (!inputActive) {
        // Check for restart button press when not in high score entry
        if (isTouchOnButton(touchX, touchY, mobileKeyboard.restartButton)) {
            console.log("Restart button touched - ENHANCED HANDLING");
            
            // Visual feedback for button press (inverted colors)
            const ctx = getCanvas().ctx;
            ctx.fillStyle = 'white';
            ctx.fillRect(
                mobileKeyboard.restartButton.x, 
                mobileKeyboard.restartButton.y, 
                mobileKeyboard.restartButton.width, 
                mobileKeyboard.restartButton.height
            );
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 4;
            ctx.strokeRect(
                mobileKeyboard.restartButton.x, 
                mobileKeyboard.restartButton.y, 
                mobileKeyboard.restartButton.width, 
                mobileKeyboard.restartButton.height
            );
            ctx.fillStyle = 'black';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(
                mobileKeyboard.restartButton.text, 
                mobileKeyboard.restartButton.x + mobileKeyboard.restartButton.width / 2, 
                mobileKeyboard.restartButton.y + mobileKeyboard.restartButton.height / 2
            );
            
            // Immediately clean up event handlers to prevent issues during transition
            const localRestartCallback = restartCallback; // Capture current callback
            
            // Immediately disable further touches
            cleanupGameOverEvents(canvas);
            
            // Force state reset before callback
            resetInput();
            
            // Restart after a short delay for visual feedback, using the captured callback
            setTimeout(() => {
                if (localRestartCallback) {
                    console.log("Executing restart callback from mobile touch - ENHANCED");
                    localRestartCallback();
                }
            }, 150);
            
            return;
        }
    }
}

/**
 * Check if a touch is on a button
 * @param {number} touchX - Touch X coordinate 
 * @param {number} touchY - Touch Y coordinate
 * @param {Object} button - Button object with x, y, width, height properties
 * @returns {boolean} Whether the touch is on the button
 */
function isTouchOnButton(touchX, touchY, button) {
    return (
        touchX >= button.x && 
        touchX <= button.x + button.width &&
        touchY >= button.y && 
        touchY <= button.y + button.height
    );
}

/**
 * Reset the initials input state
 */
function resetInput() {
    console.log("Resetting high score input state");
    playerInitials = '';
    inputActive = false;
    mobileKeyboard.visible = false;
    
    // Clear the forced redraw interval
    if (redrawIntervalId) {
        console.log("Clearing redraw interval");
        clearInterval(redrawIntervalId);
        redrawIntervalId = null;
    }
    
    // Force one final redraw to ensure the screen is cleared
    if (redrawCallback) {
        console.log("Final redraw after reset");
        redrawCallback();
    }
}

/**
 * Activate the initials input
 */
export function activateInput() {
    inputActive = true;
    playerInitials = '';
    
    if (isMobilePhone()) {
        mobileKeyboard.visible = true;
    }
    
    // Set up a forced redraw every 100ms to ensure display updates
    if (redrawCallback && !redrawIntervalId) {
        redrawIntervalId = setInterval(() => {
            redrawCallback();
        }, 100);
    }
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

/**
 * Set the callback for score submission cancelation
 * @param {Function} callback - Function to call when score submission is canceled
 */
export function onCancelScoreSubmit(callback) {
    cancelCallback = callback;
}

/**
 * Set up event listeners for the game over screen
 * @param {HTMLCanvasElement} canvas - The canvas element to attach events to
 */
export function setupGameOverEvents(canvas) {
    console.log("Setting up game over events");
    
    // Clean up any existing event listeners first to prevent duplicates
    cleanupGameOverEvents(canvas);
    
    // Set up desktop keyboard handlers
    if (!isMobilePhone()) {
        console.log("Setting up desktop keyboard event handlers");
        document.addEventListener('keydown', handleGameOverKeyInput);
    } else {
        // Set up mobile touch handlers
        console.log("Setting up mobile touch event handlers");
        if (canvas) {
            // First make sure we cleanup any existing handlers
            canvas.removeEventListener('touchstart', handleMobileTouchInput);
            
            // Add our touch handler with the passive option explicitly set to false
            canvas.addEventListener('touchstart', handleMobileTouchInput, { passive: false });
            console.log("Mobile touch handler added to canvas");
        } else {
            console.warn("No canvas provided for touch events");
        }
    }
}

/**
 * Clean up event listeners for the game over screen
 * @param {HTMLCanvasElement} canvas - The canvas element to remove events from
 */
export function cleanupGameOverEvents(canvas) {
    console.log("Cleaning up game over events - ENHANCED");
    
    // Remove desktop keyboard handlers
    document.removeEventListener('keydown', handleGameOverKeyInput);
    
    // Remove mobile touch handlers - ensure multiple passes to catch any duplicate listeners
    if (canvas) {
        // Remove with all possible options combinations to ensure complete cleanup
        canvas.removeEventListener('touchstart', handleMobileTouchInput);
        canvas.removeEventListener('touchstart', handleMobileTouchInput, { passive: false });
        canvas.removeEventListener('touchstart', handleMobileTouchInput, { passive: true });
        canvas.removeEventListener('touchstart', handleMobileTouchInput, { capture: true });
        canvas.removeEventListener('touchstart', handleMobileTouchInput, { capture: false });
        canvas.removeEventListener('touchstart', handleMobileTouchInput, { capture: true, passive: false });
        canvas.removeEventListener('touchstart', handleMobileTouchInput, { capture: false, passive: false });
        
        // Also remove all other touch events just to be safe
        canvas.removeEventListener('touchend', handleMobileTouchInput);
        canvas.removeEventListener('touchmove', handleMobileTouchInput);
        canvas.removeEventListener('touchcancel', handleMobileTouchInput);
    }
    
    // Clear any scheduled callbacks by forcing a reset
    resetInput();
    
    // Reset callbacks to prevent stale references
    submitCallback = null;
    restartCallback = null;
    cancelCallback = null;
    redrawCallback = null;
    
    // Clear any intervals
    if (redrawIntervalId) {
        clearInterval(redrawIntervalId);
        redrawIntervalId = null;
    }
    
    // Reset all state variables
    playerInitials = '';
    inputActive = false;
    mobileKeyboard.visible = false;
    
    console.log("Game over events fully cleaned up - ENHANCED");
} 