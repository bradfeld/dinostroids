/**
 * Help Screen UI Component
 * 
 * Displays the help/instructions screen for the game.
 */

import { getCanvas, getDimensions, clear } from '../canvas.js';
import { isMobilePhone } from '../utils/device.js';

/**
 * Draw the help screen with game instructions
 * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
 */
export function drawHelpScreen() {
    const { canvas, ctx } = getCanvas();
    
    // Clear the canvas
    clear('black');
    
    if (isMobilePhone()) {
        // Mobile help screen
        ctx.fillStyle = 'white';
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('HOW TO PLAY', canvas.width / 2, canvas.height * 0.1);
        
        ctx.font = '18px Arial';
        const instructions = [
            'CONTROLS:',
            '• Left/Right buttons to rotate',
            '• THRUST button to move forward',
            '• SHOOT button to fire',
            '• HYPER button for random teleport',
            '',
            'OBJECTIVE:',
            '• Destroy all dinosaur asteroids',
            '• Avoid collisions',
            '• Score points to earn extra ships',
            '',
            'TAP ? TO RETURN'
        ];
        
        const startY = canvas.height * 0.2;
        const lineHeight = canvas.height * 0.05;
        
        instructions.forEach((line, index) => {
            if (line.startsWith('•')) {
                ctx.textAlign = 'left';
                ctx.fillText(line, canvas.width * 0.15, startY + (index * lineHeight));
            } else {
                ctx.textAlign = 'center';
                ctx.fillText(line, canvas.width / 2, startY + (index * lineHeight));
            }
        });
    } else {
        // Desktop help screen
        ctx.fillStyle = 'white';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('HOW TO PLAY', canvas.width / 2, 100);
        
        ctx.font = '20px Arial';
        ctx.textAlign = 'left';
        const instructions = [
            'CONTROLS:',
            '• Arrow Keys: Move ship',
            '• Space: Fire',
            '• H: Hyperspace jump (random teleport)',
            '• P: Pause/Resume game',
            '• ?: Toggle help screen',
            '• ESC: End game and return to menu',
            '',
            'OBJECTIVE:',
            '• Destroy all dinosaur asteroids',
            '• Avoid collisions',
            '• Score as many points as possible',
            '',
            'TIPS:',
            '• Use hyperspace to escape danger',
            '• You\'re invincible for 3 seconds after hyperspace'
        ];
        
        const startY = 150;
        const lineHeight = 30;
        
        instructions.forEach((line, index) => {
            ctx.fillText(line, canvas.width / 4, startY + (index * lineHeight));
        });
        
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Press ? to return', canvas.width / 2, canvas.height - 50);
    }
} 