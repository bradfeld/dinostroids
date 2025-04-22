/**
 * Vector Dinosaur Graphics
 * 
 * This module provides functions to draw vector-based dinosaur graphics
 * as replacements for the PNG images.
 */

/**
 * Draw a Brontosaurus (long-necked dinosaur)
 * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
 * @param {number} x - Center x position
 * @param {number} y - Center y position
 * @param {number} size - Size of the dinosaur
 * @param {string} color - Stroke color (default: bright white)
 */
export function drawBrontosaurus(ctx, x, y, size, color = '#FFFFFF') {
    const scale = size / 100; // Normalize to a 100px base size
    
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = color;
    ctx.lineWidth = 3 * scale; // Increased line width for better visibility
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    
    // Draw body
    ctx.beginPath();
    ctx.moveTo(-40 * scale, 0); // Start at the back of the body
    ctx.lineTo(0, -5 * scale); // Top of the body
    ctx.lineTo(20 * scale, 0); // Front of the body
    ctx.lineTo(0, 15 * scale); // Bottom of the body
    ctx.closePath();
    ctx.stroke();
    
    // Draw tail
    ctx.beginPath();
    ctx.moveTo(-40 * scale, 0); // Connect to the back of the body
    ctx.lineTo(-60 * scale, -10 * scale); // Tail curves up
    ctx.lineTo(-80 * scale, 0); // Tail end
    ctx.stroke();
    
    // Draw neck and head
    ctx.beginPath();
    ctx.moveTo(20 * scale, 0); // Connect to the front of the body
    ctx.lineTo(35 * scale, -25 * scale); // Neck goes up
    ctx.lineTo(50 * scale, -30 * scale); // Top of the neck
    
    // Head
    ctx.lineTo(60 * scale, -25 * scale); // Front of the head
    ctx.lineTo(55 * scale, -20 * scale); // Mouth
    ctx.lineTo(45 * scale, -20 * scale); // Bottom of the head
    ctx.stroke();
    
    // Draw legs
    // Front legs
    ctx.beginPath();
    ctx.moveTo(10 * scale, 10 * scale); // Front leg attachment point
    ctx.lineTo(15 * scale, 30 * scale); // Front leg
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(20 * scale, 5 * scale); // Front leg attachment point
    ctx.lineTo(25 * scale, 25 * scale); // Front leg
    ctx.stroke();
    
    // Back legs
    ctx.beginPath();
    ctx.moveTo(-20 * scale, 10 * scale); // Back leg attachment point
    ctx.lineTo(-25 * scale, 30 * scale); // Back leg
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(-30 * scale, 5 * scale); // Back leg attachment point
    ctx.lineTo(-35 * scale, 25 * scale); // Back leg
    ctx.stroke();
    
    ctx.restore();
}

/**
 * Draw a Stegosaurus (spiked back dinosaur)
 * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
 * @param {number} x - Center x position
 * @param {number} y - Center y position
 * @param {number} size - Size of the dinosaur
 * @param {string} color - Stroke color (default: bright white)
 */
export function drawStegosaurus(ctx, x, y, size, color = '#FFFFFF') {
    const scale = size / 100; // Normalize to a 100px base size
    
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = color;
    ctx.lineWidth = 3 * scale; // Increased line width for better visibility
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    
    // Draw body
    ctx.beginPath();
    ctx.moveTo(-40 * scale, 0); // Back of the body
    ctx.lineTo(-20 * scale, -15 * scale); // Top back of the body
    ctx.lineTo(10 * scale, -10 * scale); // Top middle of the body
    ctx.lineTo(30 * scale, 0); // Front of the body
    ctx.lineTo(10 * scale, 15 * scale); // Bottom front of the body
    ctx.lineTo(-30 * scale, 15 * scale); // Bottom back of the body
    ctx.closePath();
    ctx.stroke();
    
    // Draw back plates (spikes)
    for (let i = -20; i <= 10; i += 10) {
        ctx.beginPath();
        ctx.moveTo(i * scale, -10 * scale); // Base of the spike
        ctx.lineTo(i * scale, -30 * scale); // Tip of the spike
        ctx.stroke();
    }
    
    // Draw tail with spikes
    ctx.beginPath();
    ctx.moveTo(-40 * scale, 0); // Connect to the back of the body
    ctx.lineTo(-70 * scale, 0); // Tail end
    ctx.stroke();
    
    // Tail spikes
    ctx.beginPath();
    ctx.moveTo(-60 * scale, 0); // Spike attachment point
    ctx.lineTo(-70 * scale, -15 * scale); // Top spike
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(-60 * scale, 0); // Spike attachment point
    ctx.lineTo(-70 * scale, 15 * scale); // Bottom spike
    ctx.stroke();
    
    // Draw head
    ctx.beginPath();
    ctx.moveTo(30 * scale, 0); // Connect to the front of the body
    ctx.lineTo(50 * scale, -5 * scale); // Top of the head
    ctx.lineTo(60 * scale, 0); // Front of the head
    ctx.lineTo(50 * scale, 5 * scale); // Bottom of the head
    ctx.closePath();
    ctx.stroke();
    
    // Draw legs
    // Front legs
    ctx.beginPath();
    ctx.moveTo(20 * scale, 15 * scale); // Front leg attachment point
    ctx.lineTo(20 * scale, 35 * scale); // Front leg
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(10 * scale, 15 * scale); // Front leg attachment point
    ctx.lineTo(5 * scale, 35 * scale); // Front leg
    ctx.stroke();
    
    // Back legs
    ctx.beginPath();
    ctx.moveTo(-20 * scale, 15 * scale); // Back leg attachment point
    ctx.lineTo(-20 * scale, 35 * scale); // Back leg
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(-30 * scale, 15 * scale); // Back leg attachment point
    ctx.lineTo(-35 * scale, 35 * scale); // Back leg
    ctx.stroke();
    
    ctx.restore();
}

/**
 * Draw a T-Rex (Tyrannosaurus Rex)
 * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
 * @param {number} x - Center x position
 * @param {number} y - Center y position
 * @param {number} size - Size of the dinosaur
 * @param {string} color - Stroke color (default: bright white)
 */
export function drawTRex(ctx, x, y, size, color = '#FFFFFF') {
    const scale = size / 100; // Normalize to a 100px base size
    
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = color;
    ctx.lineWidth = 3 * scale; // Increased line width for better visibility
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    
    // Draw body
    ctx.beginPath();
    ctx.moveTo(-30 * scale, 0); // Back of the body
    ctx.lineTo(0, -15 * scale); // Top of the body
    ctx.lineTo(30 * scale, 0); // Front of the body
    ctx.lineTo(0, 20 * scale); // Bottom of the body
    ctx.closePath();
    ctx.stroke();
    
    // Draw tail
    ctx.beginPath();
    ctx.moveTo(-30 * scale, 0); // Connect to the back of the body
    ctx.lineTo(-70 * scale, 0); // Tail end
    ctx.stroke();
    
    // Draw head
    ctx.beginPath();
    ctx.moveTo(30 * scale, 0); // Connect to the front of the body
    ctx.lineTo(40 * scale, -20 * scale); // Top of the neck
    ctx.lineTo(70 * scale, -15 * scale); // Top of the head
    ctx.lineTo(80 * scale, -5 * scale); // Front of the head
    ctx.lineTo(80 * scale, 5 * scale); // Bottom of the mouth
    ctx.lineTo(65 * scale, 0); // Jaw line
    ctx.lineTo(40 * scale, 0); // Throat
    ctx.stroke();
    
    // Draw eye
    ctx.beginPath();
    ctx.arc(65 * scale, -10 * scale, 2 * scale, 0, Math.PI * 2);
    ctx.stroke();
    
    // Draw arms (tiny)
    ctx.beginPath();
    ctx.moveTo(20 * scale, 0); // Arm attachment point
    ctx.lineTo(25 * scale, 10 * scale); // Small arm
    ctx.stroke();
    
    // Draw legs (powerful)
    // Back leg
    ctx.beginPath();
    ctx.moveTo(-15 * scale, 10 * scale); // Back leg attachment point
    ctx.lineTo(-20 * scale, 35 * scale); // Back leg
    ctx.stroke();
    
    // Front leg
    ctx.beginPath();
    ctx.moveTo(10 * scale, 10 * scale); // Front leg attachment point
    ctx.lineTo(15 * scale, 35 * scale); // Front leg
    ctx.stroke();
    
    // Draw teeth (small detail)
    for (let i = 70; i < 80; i += 3) {
        ctx.beginPath();
        ctx.moveTo(i * scale, 0); // Top of tooth
        ctx.lineTo(i * scale, 5 * scale); // Bottom of tooth
        ctx.stroke();
    }
    
    ctx.restore();
}

/**
 * Draw the specified dinosaur type
 * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
 * @param {string} type - Dinosaur type ('bront', 'steg', or 'trex')
 * @param {number} x - Center x position
 * @param {number} y - Center y position
 * @param {number} size - Size of the dinosaur
 * @param {string} color - Stroke color (default: bright white)
 */
export function drawDinosaur(ctx, type, x, y, size, color = '#FFFFFF') {
    switch (type) {
        case 'bront':
            drawBrontosaurus(ctx, x, y, size, color);
            break;
        case 'steg':
            drawStegosaurus(ctx, x, y, size, color);
            break;
        case 'trex':
            drawTRex(ctx, x, y, size, color);
            break;
        default:
            // Fallback to brontosaurus
            drawBrontosaurus(ctx, x, y, size, color);
    }
} 