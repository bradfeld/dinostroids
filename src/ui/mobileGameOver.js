/**
 * Mobile Game Over Screen
 * 
 * Simplified handler for mobile game over screen.
 * Shows game over screen, waits for touch, then returns to start screen.
 */

import { getCanvas } from '../canvas.js';
import { resetGameControllerRef, initInput } from '../controllers/input.js';
import { handleGameOverKeyInput } from './gameOver.js';

/**
 * Set up the mobile game over screen with a simple touch-to-restart behavior
 * @param {Object} gameController - Reference to the game controller
 */
export function setupMobileGameOver(gameController) {
  console.log("Setting up mobile game over screen");
  
  // Get canvas for touch events
  const { canvas } = getCanvas();
  
  // Clean up any existing touch events
  canvas.removeEventListener('touchstart', handleTouchRestart);
  
  // Create a handler with the game controller in closure
  function handleTouchRestart(event) {
    // Prevent default to avoid scrolling/zooming
    event.preventDefault();
    
    // Remove the event listener immediately to prevent multiple calls
    canvas.removeEventListener('touchstart', handleTouchRestart);
    
    console.log("Mobile game over screen touched - returning to start");
    
    // Reset and return to start screen (follow desktop flow)
    resetToStartScreen(gameController);
  }
  
  // Add the touch event listener
  canvas.addEventListener('touchstart', handleTouchRestart, { passive: false });
}

/**
 * Reset game state and return to start screen
 * Matches the desktop flow more closely
 * @param {Object} gameController - Reference to the game controller
 */
function resetToStartScreen(gameController) {
  console.log("Resetting game state and returning to start screen");
  
  // Remove any game over listeners (parallel to desktop version)
  document.removeEventListener('keydown', handleGameOverKeyInput);
  
  // Reset game state flags (match desktop pattern)
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
  
  // Use the game controller's showStartScreen method for consistency
  gameController.showStartScreen();
} 