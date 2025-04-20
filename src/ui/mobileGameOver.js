/**
 * Mobile Game Over Screen
 * 
 * Simplified handler for mobile game over screen.
 * Shows game over screen, waits for touch, then returns to start screen.
 */

import { getCanvas } from '../canvas.js';
import { drawStartScreen } from './startScreen.js';
import { MobileControls } from './mobileControls.js';
import { resetGameControllerRef, initInput } from '../controllers/input.js';

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
    
    // Reset and return to start screen
    resetToStartScreen(gameController);
  }
  
  // Add the touch event listener
  canvas.addEventListener('touchstart', handleTouchRestart, { passive: false });
}

/**
 * Reset game state and return to start screen
 * @param {Object} gameController - Reference to the game controller
 */
function resetToStartScreen(gameController) {
  console.log("Resetting game state and returning to start screen");
  
  // Cancel animation frame if it exists
  if (gameController.animationFrameId) {
    cancelAnimationFrame(gameController.animationFrameId);
    gameController.animationFrameId = null;
  }
  
  // Reset game state
  gameController.isGameStarted = false;
  gameController.isGameOver = false;
  gameController.gameRunning = false;
  gameController.isPaused = false;
  gameController.isHelpScreenVisible = false;
  
  // Clear entities
  gameController.player = null;
  gameController.asteroids = [];
  gameController.bullets = [];
  
  // Clean up mobile controls if they exist
  if (gameController.mobileControls) {
    gameController.mobileControls.cleanup();
    gameController.mobileControls = null;
  }
  
  // Clean up input handlers
  gameController.cleanupInputHandlers();
  
  // Get canvas
  const { canvas, ctx } = getCanvas();
  
  // Reset controller reference for input system
  resetGameControllerRef(gameController);
  
  // Re-initialize input
  initInput(canvas, gameController);
  
  // Set up input handlers again
  gameController.setupInputHandlers();
  
  // Create new mobile controls
  gameController.mobileControls = new MobileControls(canvas, gameController);
  
  // Draw the start screen
  drawStartScreen(
    ctx, 
    gameController.currentDifficulty, 
    gameController.leaderboardData, 
    gameController.gamesPlayedCount
  );
} 