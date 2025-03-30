/**
 * Dinostroids - Main Entry Point
 * 
 * This file is the main entry point for the game.
 * It imports and coordinates all modules.
 */

import { inject } from '@vercel/analytics';
import { initGame } from './controllers/game.js';

// Initialize Vercel analytics
inject();

// Start the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
  // Initialize the game when the DOM is fully loaded
  initGame();
}); 