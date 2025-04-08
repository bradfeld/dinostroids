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
        this.buttonRadius = 40;
        this.buttonPadding = 20;
        
        // Define control buttons
        this.buttons = {
            left: {
                x: this.buttonPadding + this.buttonRadius,
                y: canvas.height - (this.buttonPadding + this.buttonRadius),
                label: '←'
            },
            right: {
                x: 3 * this.buttonPadding + 3 * this.buttonRadius,
                y: canvas.height - (this.buttonPadding + this.buttonRadius),
                label: '→'
            },
            shoot: {
                x: canvas.width - (3 * this.buttonPadding + 3 * this.buttonRadius),
                y: canvas.height - (this.buttonPadding + this.buttonRadius),
                label: 'SHOOT'
            },
            thrust: {
                x: canvas.width - (this.buttonPadding + this.buttonRadius),
                y: canvas.height - (this.buttonPadding + this.buttonRadius),
                label: 'THRUST'
            },
            hyperspace: {
                x: canvas.width - (2 * this.buttonPadding + 2 * this.buttonRadius),
                y: canvas.height - (3 * this.buttonPadding + 3 * this.buttonRadius),
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
            const distance = Math.sqrt(
                Math.pow(canvasX - button.x, 2) + 
                Math.pow(canvasY - button.y, 2)
            );
            if (distance <= this.buttonRadius) {
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
        
        // Set up styles for buttons
        this.ctx.globalAlpha = 0.3;
        this.ctx.strokeStyle = '#00ff00';
        this.ctx.lineWidth = 2;
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        // Draw each button
        for (const [buttonName, button] of Object.entries(this.buttons)) {
            const isActive = Array.from(this.activeTouches.values()).includes(buttonName);
            
            // Draw button circle
            this.ctx.beginPath();
            this.ctx.arc(button.x, button.y, this.buttonRadius, 0, Math.PI * 2);
            this.ctx.fillStyle = isActive ? '#00ff00' : '#003300';
            this.ctx.fill();
            this.ctx.stroke();

            // Draw button label
            this.ctx.fillStyle = '#00ff00';
            this.ctx.globalAlpha = 0.8;
            this.ctx.fillText(button.label, button.x, button.y);
        }

        this.ctx.restore();
    }
} 