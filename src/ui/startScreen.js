/**
 * Start Screen UI Component
 * 
 * Displays the game title, difficulty options, and start instructions.
 */

import { getDimensions } from '../canvas.js';

/**
 * Draw the start screen with difficulty selection
 * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
 * @param {string} currentDifficulty - Current selected difficulty ('easy', 'medium', 'difficult')
 */
export function drawStartScreen(ctx, currentDifficulty) {
    const { width, height } = getDimensions();
    
    // Draw title
    ctx.fillStyle = 'white';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('DINOSTROIDS', width / 2, height / 3);
    
    // Draw subtitle
    ctx.font = '24px Arial';
    ctx.fillText('Select Difficulty:', width / 2, height / 2 - 30);
    
    // Draw difficulty options
    const options = [
        { key: 'E', label: 'Easy', value: 'easy' },
        { key: 'M', label: 'Medium', value: 'medium' },
        { key: 'D', label: 'Difficult', value: 'difficult' }
    ];
    
    const diffY = height / 2 + 30;
    options.forEach((option, index) => {
        const x = width / 2 - 150 + (index * 150);
        const isSelected = currentDifficulty === option.value;
        
        // Draw selection background if this option is selected
        if (isSelected) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.fillRect(x - 65, diffY - 30, 130, 40);
        }
        
        // Draw option text
        ctx.fillStyle = isSelected ? '#ffff00' : 'white';
        ctx.fillText(`${option.key}: ${option.label}`, x, diffY);
    });
    
    // Reset fill style to white
    ctx.fillStyle = 'white';
    
    // Draw instructions
    ctx.font = '24px Arial';
    ctx.fillText('Press SPACE to start', width / 2, height * 2/3 + 20);
    ctx.fillText('Press ? for help', width / 2, height * 2/3 + 60);
    
    // Draw key hints
    ctx.font = '16px Arial';
    ctx.fillText('Press E, M, or D to change difficulty', width / 2, height - 50);
}

/**
 * Handle key input for difficulty selection
 * @param {KeyboardEvent} event - The keyboard event
 * @param {string} currentDifficulty - Current selected difficulty
 * @returns {string|null} - New difficulty if changed, null otherwise
 */
export function handleDifficultySelection(event, currentDifficulty) {
    if (event.code === 'KeyE') return 'easy';
    if (event.code === 'KeyM') return 'medium'; 
    if (event.code === 'KeyD') return 'difficult';
    return null;
} 