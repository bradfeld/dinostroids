/**
 * Mobile Game Over Screen
 * 
 * Simplified handler for mobile game over screen.
 * Shows game over screen, waits for touch, then returns to start screen.
 */

import { getCanvas } from '../canvas.js';
import { resetGameControllerRef, initInput } from '../controllers/input.js';
import { handleGameOverKeyInput } from './gameOver.js';

// Store the current game controller reference globally
let currentGameController = null;

/**
 * Touch handler for game over screen
 * Defined outside of setup function to maintain consistent reference
 */
function handleTouchRestart(event) {
  // Prevent default behavior
  event.preventDefault();
  
  // Only proceed if we have a valid controller
  if (currentGameController) {
    // Remove event listeners to prevent multiple calls
    const { canvas } = getCanvas();
    canvas.removeEventListener('touchstart', handleTouchRestart, { capture: true });
    document.body.removeEventListener('touchstart', handleBodyTouchRestart, { capture: true });
    
    // Reset and return to start screen
    resetToStartScreen(currentGameController);
  }
}

/**
 * Alternative touch handler attached to body as fallback
 */
function handleBodyTouchRestart(event) {
  // If this is triggered and we have a valid controller in game over state
  if (currentGameController && currentGameController.isGameOver) {
    // Prevent default
    event.preventDefault();
    
    // Remove all event listeners
    const { canvas } = getCanvas();
    canvas.removeEventListener('touchstart', handleTouchRestart, { capture: true });
    document.body.removeEventListener('touchstart', handleBodyTouchRestart, { capture: true });
    
    // Reset and return to start screen
    resetToStartScreen(currentGameController);
  }
}

/**
 * Set up the mobile game over screen with touch-to-restart behavior
 * @param {Object} gameController - Reference to the game controller
 */
export function setupMobileGameOver(gameController) {
  // Store the controller reference globally
  currentGameController = gameController;
  
  // Set up touch events with a small delay to ensure DOM is ready
  setTimeout(() => {
    const { canvas } = getCanvas();
    
    // Clean up any existing touch events
    canvas.removeEventListener('touchstart', handleTouchRestart, { capture: true });
    document.body.removeEventListener('touchstart', handleBodyTouchRestart, { capture: true });
    
    // Add new event listeners with capture to ensure they get priority
    canvas.addEventListener('touchstart', handleTouchRestart, { 
      passive: false,
      capture: true 
    });
    
    // Add a fallback listener to document.body
    document.body.addEventListener('touchstart', handleBodyTouchRestart, {
      passive: false,
      capture: true
    });
    
    // Add a fallback click handler (helps on some devices)
    canvas.addEventListener('click', function clickHandler() {
      if (currentGameController && currentGameController.isGameOver) {
        canvas.removeEventListener('click', clickHandler);
        resetToStartScreen(currentGameController);
      }
    }, { capture: true });
  }, 100);
}

/**
 * Reset game state and return to start screen
 * Matches the desktop flow more closely
 * @param {Object} gameController - Reference to the game controller
 */
function resetToStartScreen(gameController) {
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
  
  // Clear the global reference
  currentGameController = null;
  
  // Use the game controller's showStartScreen method for consistency
  gameController.showStartScreen();
} 