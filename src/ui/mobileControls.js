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

        // Track active touches - map touch ID to button name
        this.activeTouches = new Map();
        
        // Debug mode - set to true to log touch events
        this.debug = true;
        
        if (isMobilePhone()) {
            this.setupTouchEvents();
        }
    }

    /**
     * Set up touch event listeners
     */
    setupTouchEvents() {
        // Remove any existing listeners to prevent duplicates
        this.removeEventListeners();
        
        // Add touchstart listener
        this.touchStartHandler = this.handleTouchStart.bind(this);
        this.touchMoveHandler = this.handleTouchMove.bind(this);
        this.touchEndHandler = this.handleTouchEnd.bind(this);
        this.touchCancelHandler = this.handleTouchCancel.bind(this);
        
        this.canvas.addEventListener('touchstart', this.touchStartHandler, { passive: false });
        this.canvas.addEventListener('touchmove', this.touchMoveHandler, { passive: false });
        this.canvas.addEventListener('touchend', this.touchEndHandler, { passive: false });
        this.canvas.addEventListener('touchcancel', this.touchCancelHandler, { passive: false });
        
        if (this.debug) {
            console.log('Mobile controls touch events initialized');
        }
    }
    
    /**
     * Remove event listeners
     */
    removeEventListeners() {
        if (this.touchStartHandler) {
            this.canvas.removeEventListener('touchstart', this.touchStartHandler);
            this.canvas.removeEventListener('touchmove', this.touchMoveHandler);
            this.canvas.removeEventListener('touchend', this.touchEndHandler);
            this.canvas.removeEventListener('touchcancel', this.touchCancelHandler);
        }
    }
    
    /**
     * Handle touch start
     */
    handleTouchStart(e) {
        e.preventDefault();
        
        if (this.debug) {
            console.log(`Touch start with ${e.touches.length} touches`);
        }
        
        Array.from(e.touches).forEach(touch => {
            const buttonName = this.getButtonAtPosition(touch.clientX, touch.clientY);
            if (buttonName) {
                this.activeTouches.set(touch.identifier, buttonName);
                this.handleButtonPress(buttonName);
                
                if (this.debug) {
                    console.log(`Button press: ${buttonName}`);
                }
            }
        });
    }
    
    /**
     * Handle touch move
     */
    handleTouchMove(e) {
        e.preventDefault();
        
        Array.from(e.touches).forEach(touch => {
            const buttonName = this.getButtonAtPosition(touch.clientX, touch.clientY);
            const currentButton = this.activeTouches.get(touch.identifier);
            
            // If moving from one button to another, or from no button to a button
            if (buttonName !== currentButton) {
                // Release previous button if there was one
                if (currentButton) {
                    this.handleButtonRelease(currentButton);
                    if (this.debug) {
                        console.log(`Button release on move: ${currentButton}`);
                    }
                }
                
                // Press new button if there is one
                if (buttonName) {
                    this.handleButtonPress(buttonName);
                    this.activeTouches.set(touch.identifier, buttonName);
                    if (this.debug) {
                        console.log(`Button press on move: ${buttonName}`);
                    }
                } else {
                    this.activeTouches.delete(touch.identifier);
                }
            }
        });
    }
    
    /**
     * Handle touch end
     */
    handleTouchEnd(e) {
        e.preventDefault();
        
        if (this.debug) {
            console.log(`Touch end with ${e.changedTouches.length} changed touches`);
        }
        
        Array.from(e.changedTouches).forEach(touch => {
            const buttonName = this.activeTouches.get(touch.identifier);
            if (buttonName) {
                this.handleButtonRelease(buttonName);
                this.activeTouches.delete(touch.identifier);
                
                if (this.debug) {
                    console.log(`Button release on end: ${buttonName}`);
                }
            }
        });
    }
    
    /**
     * Handle touch cancel
     */
    handleTouchCancel(e) {
        e.preventDefault();
        
        if (this.debug) {
            console.log('Touch cancel event');
        }
        
        Array.from(e.changedTouches).forEach(touch => {
            const buttonName = this.activeTouches.get(touch.identifier);
            if (buttonName) {
                this.handleButtonRelease(buttonName);
                this.activeTouches.delete(touch.identifier);
            }
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
    
    /**
     * Clean up when removing controls
     */
    cleanup() {
        this.removeEventListeners();
        this.activeTouches.clear();
    }

    /**
     * Reset all touch controls
     * Used when player respawns to prevent stuck controls
     */
    resetTouchControls() {
        // Clear the active touches map
        this.activeTouches.clear();
        
        // Reset all button states in the game controller
        if (this.gameController) {
            this.gameController.setRotateLeft(false);
            this.gameController.setRotateRight(false);
            this.gameController.setThrusting(false);
            this.gameController.setFiring(false);
        }
        
        if (this.debug) {
            console.log('Mobile controls reset');
        }
    }
} 