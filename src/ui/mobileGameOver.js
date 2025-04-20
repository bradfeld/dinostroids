/**
 * Mobile Game Over Screen
 * 
 * Creates a visual touch button for restarting the game on mobile.
 */

import { getCanvas, clear } from '../canvas.js';
import { resetGameControllerRef, initInput } from '../controllers/input.js';
import { handleGameOverKeyInput } from './gameOver.js';

// Store the current game controller reference
let currentGameController = null;

// Button properties
const buttonProps = {
  x: 0,
  y: 0,
  width: 240,
  height: 80,
  text: "TOUCH TO PLAY AGAIN"
};

/**
 * Creates and displays a visual button for restarting the game
 * @param {CanvasRenderingContext2D} ctx - The canvas rendering context
 */
function drawRestartButton(ctx) {
  const { canvas } = getCanvas();
  
  // Center the button horizontally
  buttonProps.x = (canvas.width - buttonProps.width) / 2;
  // Position near bottom of screen
  buttonProps.y = canvas.height - 160;
  
  // Draw button background with glow effect
  ctx.save();
  
  // Outer glow
  const gradient = ctx.createRadialGradient(
    buttonProps.x + buttonProps.width/2, 
    buttonProps.y + buttonProps.height/2, 
    buttonProps.width/4,
    buttonProps.x + buttonProps.width/2, 
    buttonProps.y + buttonProps.height/2, 
    buttonProps.width
  );
  gradient.addColorStop(0, 'rgba(100, 100, 255, 0.7)');
  gradient.addColorStop(1, 'rgba(100, 100, 255, 0)');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(
    buttonProps.x - 20, 
    buttonProps.y - 20, 
    buttonProps.width + 40, 
    buttonProps.height + 40
  );
  
  // Button background
  ctx.fillStyle = 'rgba(50, 50, 80, 0.8)';
  ctx.strokeStyle = 'rgb(150, 150, 255)';
  ctx.lineWidth = 3;
  
  // Rounded rectangle
  const radius = 15;
  ctx.beginPath();
  ctx.moveTo(buttonProps.x + radius, buttonProps.y);
  ctx.lineTo(buttonProps.x + buttonProps.width - radius, buttonProps.y);
  ctx.quadraticCurveTo(buttonProps.x + buttonProps.width, buttonProps.y, buttonProps.x + buttonProps.width, buttonProps.y + radius);
  ctx.lineTo(buttonProps.x + buttonProps.width, buttonProps.y + buttonProps.height - radius);
  ctx.quadraticCurveTo(buttonProps.x + buttonProps.width, buttonProps.y + buttonProps.height, buttonProps.x + buttonProps.width - radius, buttonProps.y + buttonProps.height);
  ctx.lineTo(buttonProps.x + radius, buttonProps.y + buttonProps.height);
  ctx.quadraticCurveTo(buttonProps.x, buttonProps.y + buttonProps.height, buttonProps.x, buttonProps.y + buttonProps.height - radius);
  ctx.lineTo(buttonProps.x, buttonProps.y + radius);
  ctx.quadraticCurveTo(buttonProps.x, buttonProps.y, buttonProps.x + radius, buttonProps.y);
  ctx.closePath();
  
  ctx.fill();
  ctx.stroke();
  
  // Button text
  ctx.fillStyle = 'white';
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(
    buttonProps.text, 
    buttonProps.x + buttonProps.width/2, 
    buttonProps.y + buttonProps.height/2
  );
  
  ctx.restore();
}

/**
 * Checks if a touch event is within the button boundaries
 * @param {number} touchX - X coordinate of touch
 * @param {number} touchY - Y coordinate of touch
 * @returns {boolean} - Whether touch is within button
 */
function isTouchOnButton(touchX, touchY) {
  return (
    touchX >= buttonProps.x && 
    touchX <= buttonProps.x + buttonProps.width &&
    touchY >= buttonProps.y && 
    touchY <= buttonProps.y + buttonProps.height
  );
}

/**
 * Handle touch events for the restart button
 * @param {TouchEvent} event - Touch event
 */
function handleButtonTouch(event) {
  event.preventDefault();
  
  // Get first touch location
  if (event.touches && event.touches[0]) {
    const touch = event.touches[0];
    const { canvas } = getCanvas();
    
    // Get touch coordinates relative to canvas
    const rect = canvas.getBoundingClientRect();
    const touchX = touch.clientX - rect.left;
    const touchY = touch.clientY - rect.top;
    
    // Check if touch is on button
    if (isTouchOnButton(touchX, touchY)) {
      // Remove event listeners
      canvas.removeEventListener('touchstart', handleButtonTouch);
      
      // Visual feedback - redraw button in "pressed" state
      const ctx = getCanvas().ctx;
      ctx.save();
      
      // Draw pressed state
      ctx.fillStyle = 'rgba(100, 100, 150, 0.9)';
      ctx.fillRect(
        buttonProps.x, buttonProps.y, 
        buttonProps.width, buttonProps.height
      );
      
      // Draw text in slightly different position
      ctx.fillStyle = 'white';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        buttonProps.text, 
        buttonProps.x + buttonProps.width/2 + 2, 
        buttonProps.y + buttonProps.height/2 + 2
      );
      
      ctx.restore();
      
      // Reset and go to start screen with slight delay for visual feedback
      setTimeout(() => {
        if (currentGameController) {
          resetToStartScreen(currentGameController);
        }
      }, 150);
    }
  }
}

/**
 * Set up the mobile game over screen with a visual button
 * @param {Object} gameController - Reference to the game controller
 */
export function setupMobileGameOver(gameController) {
  // Store controller reference
  currentGameController = gameController;
  
  // Get canvas context
  const { canvas, ctx } = getCanvas();
  
  // Draw the restart button
  drawRestartButton(ctx);
  
  // Clean up any existing listeners
  canvas.removeEventListener('touchstart', handleButtonTouch);
  
  // Add the touch event listener for the button
  canvas.addEventListener('touchstart', handleButtonTouch, { passive: false });
}

/**
 * Reset game state and return to start screen
 * @param {Object} gameController - Reference to the game controller
 */
function resetToStartScreen(gameController) {
  // Remove any game over listeners
  document.removeEventListener('keydown', handleGameOverKeyInput);
  
  // Reset game state flags
  gameController.isGameOver = false;
  gameController.isGameStarted = false;
  
  // Clean up
  gameController.cleanupInputHandlers();
  if (gameController.animationFrameId) {
    cancelAnimationFrame(gameController.animationFrameId);
    gameController.animationFrameId = null;
  }
  
  // Reset game controller reference for input system
  resetGameControllerRef(gameController);
  
  // Re-initialize input system with the current game controller
  const { canvas } = getCanvas();
  initInput(canvas, gameController);
  
  // Clear the global reference
  currentGameController = null;
  
  // Use the game controller's showStartScreen method for consistency
  gameController.showStartScreen();
} 