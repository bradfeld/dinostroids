import { isMobilePhone } from '../utils/device.js';

/**
 * Represents the mobile controls overlay
 */
export class MobileControls {
    constructor(canvas, gameController) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.gameController = gameController;
        
        // Button dimensions and positions
        this.buttonSize = 60; // Square button size
        this.buttonPadding = 15; // Reduced padding to fit better
        
        // Calculate positions based on screen size
        const bottomY = canvas.height - (this.buttonPadding + this.buttonSize);
        const rightX = canvas.width - (this.buttonPadding + this.buttonSize);
        
        // Define control buttons
        this.buttons = {
            left: {
                x: this.buttonPadding,
                y: bottomY,
                label: '←'
            },
            right: {
                x: 2 * this.buttonPadding + this.buttonSize,
                y: bottomY,
                label: '→'
            },
            shoot: {
                x: rightX - (this.buttonSize + this.buttonPadding),
                y: bottomY,
                label: 'SHOOT'
            },
            thrust: {
                x: rightX,
                y: bottomY,
                label: 'THRUST'
            },
            hyperspace: {
                x: rightX - (this.buttonSize/2),
                y: bottomY - (this.buttonSize + this.buttonPadding),
                label: 'HYPER'
            }
        };

        // Track active touches
        this.activeTouches = new Map();
        
        if (isMobilePhone()) {
            this.setupTouchEvents();
        }
    }

    /**
     * Set up touch event listeners
     */
    setupTouchEvents() {
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            Array.from(e.touches).forEach(touch => {
                const button = this.getButtonAtPosition(touch.clientX, touch.clientY);
                if (button) {
                    this.activeTouches.set(touch.identifier, button);
                    this.handleButtonPress(button);
                }
            });
        });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            Array.from(e.changedTouches).forEach(touch => {
                const button = this.activeTouches.get(touch.identifier);
                if (button) {
                    this.handleButtonRelease(button);
                    this.activeTouches.delete(touch.identifier);
                }
            });
        });

        this.canvas.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            Array.from(e.changedTouches).forEach(touch => {
                const button = this.activeTouches.get(touch.identifier);
                if (button) {
                    this.handleButtonRelease(button);
                    this.activeTouches.delete(touch.identifier);
                }
            });
        });
    }

    /**
     * Check if a point is within a button's area
     */
    getButtonAtPosition(x, y) {
        // Adjust for canvas scaling and position
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        const canvasX = (x - rect.left) * scaleX;
        const canvasY = (y - rect.top) * scaleY;

        for (const [buttonName, button] of Object.entries(this.buttons)) {
            // Check if touch is within square button bounds
            if (canvasX >= button.x && 
                canvasX <= button.x + this.buttonSize && 
                canvasY >= button.y && 
                canvasY <= button.y + this.buttonSize) {
                return buttonName;
            }
        }
        return null;
    }

    /**
     * Handle button press events
     */
    handleButtonPress(buttonName) {
        switch (buttonName) {
            case 'left':
                this.gameController.setRotateLeft(true);
                break;
            case 'right':
                this.gameController.setRotateRight(true);
                break;
            case 'thrust':
                this.gameController.setThrusting(true);
                break;
            case 'shoot':
                this.gameController.setFiring(true);
                break;
            case 'hyperspace':
                this.gameController.activateHyperspace();
                break;
        }
    }

    /**
     * Handle button release events
     */
    handleButtonRelease(buttonName) {
        switch (buttonName) {
            case 'left':
                this.gameController.setRotateLeft(false);
                break;
            case 'right':
                this.gameController.setRotateRight(false);
                break;
            case 'thrust':
                this.gameController.setThrusting(false);
                break;
            case 'shoot':
                this.gameController.setFiring(false);
                break;
        }
    }

    /**
     * Draw the mobile controls
     */
    draw() {
        if (!isMobilePhone()) return;

        this.ctx.save();
        
        // Set up styles for buttons - black and white theme
        this.ctx.globalAlpha = 0.5;
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 1;
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        // Draw each button
        for (const [buttonName, button] of Object.entries(this.buttons)) {
            const isActive = Array.from(this.activeTouches.values()).includes(buttonName);
            
            // Draw square button
            this.ctx.fillStyle = isActive ? 'white' : 'black';
            this.ctx.fillRect(button.x, button.y, this.buttonSize, this.buttonSize);
            this.ctx.strokeRect(button.x, button.y, this.buttonSize, this.buttonSize);

            // Draw button label
            this.ctx.fillStyle = isActive ? 'black' : 'white';
            this.ctx.globalAlpha = 0.9;
            this.ctx.fillText(button.label, button.x + (this.buttonSize/2), button.y + (this.buttonSize/2));
        }

        this.ctx.restore();
    }
} 