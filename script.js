import { inject } from '@vercel/analytics';

inject();

// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas dimensions to fill the window
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// --- Game Constants ---
const TWO_PI = Math.PI * 2;
const FRICTION = 0.98;
const ROTATION_INCREMENT = Math.PI / 18; // 10 degrees in radians

// Player
const PLAYER_SIZE = 20;
const PLAYER_ACCELERATION = 0.1;
const PLAYER_FRICTION = 0.98;
const INVINCIBILITY_TIME = 3000; // milliseconds

// Bullets
const BULLET_RADIUS = 2;
const BULLET_SPEED = 8; // Reverted to original speed
const BULLET_LIFESPAN = 50; // frames
// Reduced cooldown for faster shooting
const SHOOT_COOLDOWN = 120; // milliseconds

// Asteroids
// Increased base speeds for asteroids
const ASTEROID_MIN_SPEED = 0.6 * 3; // 1.8
const ASTEROID_SPEED_VARIATION = 1.6 * 3; // 4.8

// Define asteroid sizes and speeds
const asteroidSizes = {
    large: 45,
    medium: 25,
    small: 15
};

const asteroidSpeeds = {
    easy: {
        large: { min: 1.5, max: 3.0 },  // 0.5*3, 1.0*3
        medium: { min: 2.4, max: 4.5 },  // 0.8*3, 1.5*3
        small: { min: 3.6, max: 6.0 }   // 1.2*3, 2.0*3
    },
    medium: {
        large: { min: 2.4, max: 4.5 },  // 0.8*3, 1.5*3
        medium: { min: 3.6, max: 6.0 },  // 1.2*3, 2.0*3
        small: { min: 5.4, max: 7.5 }   // 1.8*3, 2.5*3
    },
    difficult: {
        large: { min: 3.6, max: 6.0 },  // 1.2*3, 2.0*3
        medium: { min: 5.4, max: 7.5 },  // 1.8*3, 2.5*3
        small: { min: 7.5, max: 10.5 }  // 2.5*3, 3.5*3
    }
};

// Leaderboard
const LEADERBOARD_MAX_ENTRIES = 10;

// Add field size variables after the game constants
/* // Remove gameField object
let gameField = {
    width: window.innerWidth,
    height: window.innerHeight, // Added missing height initialization
    offsetX: 0,
    offsetY: 0
};
*/

// Update difficulty settings to include field size
const difficultySettings = {
    easy: {
        playerAcceleration: PLAYER_ACCELERATION * 0.67,
        shootCooldown: SHOOT_COOLDOWN,
        asteroidMinSpeed: ASTEROID_MIN_SPEED * 0.67,
        asteroidSpeedVariation: ASTEROID_SPEED_VARIATION * 0.67,
        initialAsteroidCountBase: 2,
        lives: 5,
        // fieldSizePercent: 100 // Full screen - REMOVED
    },
    medium: {
        playerAcceleration: PLAYER_ACCELERATION * 1.0,
        shootCooldown: Math.floor(SHOOT_COOLDOWN * 0.7),
        asteroidMinSpeed: ASTEROID_MIN_SPEED * 1.0,
        asteroidSpeedVariation: ASTEROID_SPEED_VARIATION * 0.8,
        initialAsteroidCountBase: 3,
        lives: 3,
        // fieldSizePercent: 67 // 67% of screen size - REMOVED
    },
    difficult: {
        playerAcceleration: PLAYER_ACCELERATION * 1.33,
        shootCooldown: Math.floor(SHOOT_COOLDOWN * 0.5),
        asteroidMinSpeed: ASTEROID_MIN_SPEED * 1.33,
        asteroidSpeedVariation: ASTEROID_SPEED_VARIATION * 1.0,
        initialAsteroidCountBase: 4,
        lives: 2,
        // fieldSizePercent: 50 // 50% of screen size - REMOVED
    }
};

// Variables to hold current difficulty parameters
let currentDifficulty = 'medium'; // Default
let currentAcceleration = difficultySettings.medium.playerAcceleration;
let currentShootCooldown = difficultySettings.medium.shootCooldown;
let currentAsteroidMinSpeed = difficultySettings.medium.asteroidMinSpeed;
let currentAsteroidSpeedVariation = difficultySettings.medium.asteroidSpeedVariation;
let currentInitialAsteroidCountBase = difficultySettings.medium.initialAsteroidCountBase;
let currentMaxLives = difficultySettings.medium.lives;

// Asteroid Types
const ASTEROID_TYPE = {
    BIG: 'BIG',
    MEDIUM: 'MEDIUM',
    LITTLE: 'LITTLE'
};

const ASTEROID_PROPERTIES = {
    [ASTEROID_TYPE.BIG]: { baseSize: 45, score: 20 },
    [ASTEROID_TYPE.MEDIUM]: { baseSize: 25, score: 50 },
    [ASTEROID_TYPE.LITTLE]: { baseSize: 15, score: 100 }
};

// Size variation for initial spawns
const ASTEROID_INITIAL_SIZE_VARIATION = 15;

// --- Constants ---
const INITIAL_ASTEROID_COUNT = 7;

// --- Image Loading ---
const dinoImagePaths = {
    small: 'images/bront.png',
    medium: 'images/steg.png',
    large: 'images/trex.png'
};
const dinoImages = {}; // To store loaded Image objects
let imagesLoaded = false;
let imagesSuccessfullyLoaded = 0;
const totalImages = Object.keys(dinoImagePaths).length;

function preloadImages(callback) {
    console.log("Preloading images...");
    Object.keys(dinoImagePaths).forEach(key => {
        const img = new Image();
        img.onload = () => {
            console.log(`Image loaded: ${dinoImagePaths[key]}`);
            imagesSuccessfullyLoaded++;
            dinoImages[key] = img; // Store the loaded image
            if (imagesSuccessfullyLoaded === totalImages) {
                console.log("All images successfully preloaded.");
                imagesLoaded = true;
                if (callback) callback(); // Signal completion
            }
        };
        img.onerror = () => {
            console.error(`Failed to load image: ${dinoImagePaths[key]}`);
            // Decide how to handle error - maybe use fallback shapes?
             imagesSuccessfullyLoaded++; // Count as processed even on error to avoid blocking
             if (imagesSuccessfullyLoaded === totalImages) {
                 console.warn("Finished processing images, some failed to load.");
                 imagesLoaded = true; // Still allow game to start, but with potential missing images
                 if (callback) callback();
             }
        };
        img.src = dinoImagePaths[key];
    });
}

// --- Game state ---
let player = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  angle: -Math.PI / 2, // Point up
  speed: 0,
  acceleration: PLAYER_ACCELERATION,
  friction: PLAYER_FRICTION,
  size: PLAYER_SIZE,
  canShoot: true,
  lastShotTime: 0,
  isInvulnerable: false
};

let bullets = [];
let asteroids = [];
let score = 0;
let lives = 3; // Initialize directly
let level = 1; // Initialize directly
let gameRunning = true;
let lastAsteroidSpawn = 0;
let isHelpScreenVisible = false; // Added for help screen state
let isGameStarted = false; // Added for start screen state
let leaderboardData = null; // To store fetched leaderboard data
let leaderboardError = null; // To store fetch errors
let isFetchingLeaderboard = false; // Flag for loading state

// --- Classes ---

class Asteroid {
    constructor(sizeType, x, y) {
        this.sizeType = sizeType;
        this.x = x;
        this.y = y;
        this.radius = asteroidSizes[this.sizeType];
        this.size = this.radius; // Keep numeric size for collision/wrap
        this.speed = Math.random() * (asteroidSpeeds[currentDifficulty][this.sizeType].max - asteroidSpeeds[currentDifficulty][this.sizeType].min) + asteroidSpeeds[currentDifficulty][this.sizeType].min;
        this.angle = Math.random() * TWO_PI;
        this.rotation = Math.random() * TWO_PI; // Keep for rotation
        this.rotationSpeed = (Math.random() - 0.5) * 0.05;

        // Get the preloaded image for this asteroid type
        this.image = dinoImages[this.sizeType];
        if (!this.image) {
            console.error(`Image not loaded for sizeType: ${this.sizeType}. Asteroid may not render correctly.`);
            // Optionally assign a fallback or handle error
        }
    }

    // Draw method using Image
    draw() {
        // Basic visibility check (can be refined)
        if (this.x + this.radius < 0 || this.x - this.radius > canvas.width ||
            this.y + this.radius < 0 || this.y - this.radius > canvas.height) {
            return; // Don't draw if completely off-screen
        }

        if (!this.image) {
            // Optional: Draw a fallback if image failed to load
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, TWO_PI);
            ctx.strokeStyle = 'grey'; // Indicate missing image
            ctx.stroke();
            return;
        }

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation); // Apply rotation

        // Calculate draw size based on radius (maintain aspect ratio)
        const aspectRatio = this.image.naturalWidth / this.image.naturalHeight;
        const targetDiameter = this.radius * 2;
        let drawWidth, drawHeight;
        if (aspectRatio > 1) { // Wider than tall
            drawWidth = targetDiameter;
            drawHeight = targetDiameter / aspectRatio;
        } else { // Taller than wide or square
            drawHeight = targetDiameter;
            drawWidth = targetDiameter * aspectRatio;
        }
        
        // Draw the image centered
        const offsetX = -drawWidth / 2;
        const offsetY = -drawHeight / 2;

        ctx.drawImage(this.image, offsetX, offsetY, drawWidth, drawHeight);

        ctx.restore();
    }

    update() {
        // Move asteroid (same logic)
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
        this.rotation += this.rotationSpeed; // Apply rotation speed

        // Apply screen wrapping
        wrapAround(this);
    }
}

class Bullet {
    constructor(x, y, angle) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.speed = BULLET_SPEED;
        this.radius = BULLET_RADIUS;
        this.size = this.radius; // for collision check consistency
        this.lifespan = BULLET_LIFESPAN;
    }

    draw() {
        // Don't draw if outside canvas boundaries
        if (this.x < -this.radius || this.x > canvas.width + this.radius ||
            this.y < -this.radius || this.y > canvas.height + this.radius) {
            return;
        }
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, TWO_PI);
        ctx.fillStyle = 'white';
        ctx.fill();
    }

    update() {
        // Update position
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
        
        // Decrease lifespan
        this.lifespan--;
        
        // Return true if bullet should be kept (within canvas bounds)
        return this.lifespan > 0 &&
               this.x >= -this.radius &&
               this.x <= canvas.width + this.radius &&
               this.y >= -this.radius &&
               this.y <= canvas.height + this.radius;
    }
}

// --- Global Event Listeners ---
// Consolidated keydown listener
const keys = {};
window.addEventListener('keydown', (event) => {
    // Set key state for held keys (thrust, shoot)
    keys[event.key] = true;

    // --- Single Press Actions ---

    // Help Screen Toggle (?)
    if (event.key === '?') {
        toggleHelpScreen();
        event.preventDefault(); // Prevent browser find (?)
    }

    // Difficulty Selection & Start (only if not started and help is off)
    if (!isGameStarted && !isHelpScreenVisible) {
        const key = event.key.toLowerCase();
        let selectedDifficulty = null;
        if (key === 'e') selectedDifficulty = 'easy';
        else if (key === 'm') selectedDifficulty = 'medium';
        else if (key === 'd') selectedDifficulty = 'difficult';

        if (selectedDifficulty) {
            setDifficulty(selectedDifficulty);
            startGame();
            event.preventDefault();
        }
    }

    // Rotation (only if game started and help is off)
    if (isGameStarted && !isHelpScreenVisible) {
        if (event.key === 'ArrowLeft') {
            player.angle -= ROTATION_INCREMENT;
        } else if (event.key === 'ArrowRight') {
            player.angle += ROTATION_INCREMENT;
        }
    }

    // Escape to Main Menu (only if game started)
    if (event.key === 'Escape' && isGameStarted) {
        returnToMainMenu();
    }

    // Prevent default browser action for spacebar (scrolling)
    if (event.key === ' ') {
        event.preventDefault();
    }
});

// Keyup listener remains the same
window.addEventListener('keyup', (event) => {
    keys[event.key] = false;
});

// --- Helper Functions ---
function wrapAround(object) {
  // Use object.radius if it exists (for Asteroids), otherwise use object.size (for Player)
  const size = typeof object.radius !== 'undefined' ? object.radius : object.size;
  if (object.x < -size) object.x = canvas.width + size;
  if (object.x > canvas.width + size) object.x = -size;
  if (object.y < -size) object.y = canvas.height + size;
  if (object.y > canvas.height + size) object.y = -size;
}

function spawnAsteroid(sizeType = 'large', x = null, y = null) { // Renamed parameter
    const spawnRadius = asteroidSizes[sizeType];
    const minSpawnDistFromPlayer = player.size + spawnRadius + 100; // Safe distance from player

    // If position is not specified (initial level spawn), find a random safe spot INSIDE the canvas
    if (x === null || y === null) {
        let attempts = 0;
        do {
            // Spawn within canvas, accounting for radius
            x = spawnRadius + Math.random() * (canvas.width - 2 * spawnRadius);
            y = spawnRadius + Math.random() * (canvas.height - 2 * spawnRadius);
            attempts++;
            // Ensure not too close to player
        } while (attempts < 50 && 
                 Math.sqrt(Math.pow(x - player.x, 2) + Math.pow(y - player.y, 2)) < minSpawnDistFromPlayer);
        
        if (attempts >= 50) {
            console.warn('Could not find a safe spawn location far from the player after 50 attempts. Spawning anyway.');
        }

        // Log before creating
        console.log(`Spawning ${sizeType} asteroid randomly inside canvas at (${x.toFixed(1)}, ${y.toFixed(1)})`);
    
    } else {
        // If position IS specified (e.g., when an asteroid splits), use those coordinates directly
        console.log(`Spawning split ${sizeType} asteroid at provided location (${x.toFixed(1)}, ${y.toFixed(1)})`);
    }

    // Create and add the asteroid
    const newAsteroid = new Asteroid(sizeType, x, y); // Pass sizeType
    asteroids.push(newAsteroid);
    console.log(`Asteroids array length: ${asteroids.length}`);
}

// Simple Circular Collision Check (Approximation)
function checkCollision(obj1, obj2) {
    const dx = obj1.x - obj2.x;
    const dy = obj1.y - obj2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    // Use .radius if available, otherwise .size
    const size1 = typeof obj1.radius !== 'undefined' ? obj1.radius : obj1.size;
    const size2 = typeof obj2.radius !== 'undefined' ? obj2.radius : obj2.size;
    return distance < size1 + size2;
}

// --- Game Over Logic with Leaderboard Check ---
async function gameOver() {
    gameRunning = false;
    const finalScore = score; // Capture score before potential reset

    // Fetch the latest leaderboard to check qualification
    await fetchLeaderboard();

    let qualifies = false;
    if (leaderboardData && !leaderboardError) {
        if (leaderboardData.length < LEADERBOARD_MAX_ENTRIES) {
            qualifies = finalScore > 0; // Qualifies if list isn't full (and score > 0)
        } else {
            qualifies = finalScore > leaderboardData[leaderboardData.length - 1].score;
        }
    }
    // If fetch failed, we can't submit, maybe log error or just skip
    else if (leaderboardError) {
        console.error("Cannot check leaderboard qualification due to fetch error.");
    }

    let initials = null;
    let submitted = false;
    let submitError = null;

    if (qualifies) {
        // Use prompt to get initials (loop for validation)
        while (true) {
            initials = prompt(`You made the leaderboard! Score: ${finalScore}\nEnter your initials (1-3 characters):`);
            if (initials === null) { // User pressed Cancel
                initials = null;
                break;
            }
            initials = initials.trim().toUpperCase();
            if (initials.length > 0 && initials.length <= 3) {
                break; // Valid input
            }
            alert("Please enter 1 to 3 characters for your initials.");
        }

        if (initials) {
            try {
                submitted = await submitScore(initials, finalScore);
                if (submitted) {
                    // Refresh leaderboard after submission
                    await fetchLeaderboard();
                }
            } catch (error) {
                submitError = error.message;
            }
        }
    }

    // --- Draw Final Game Over Screen ---
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)'; // Slightly darker overlay
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    ctx.font = '48px Arial';
    ctx.fillText('GAME OVER', centerX, centerY - 150);

    ctx.font = '30px Arial';
    ctx.fillText(`Final Score: ${finalScore}`, centerX, centerY - 100);

    // Display leaderboard status/result
    ctx.font = '20px Arial';
    if (qualifies) {
        if (initials) {
            if (submitted) {
                ctx.fillText('Score submitted to leaderboard!', centerX, centerY - 60);
            } else if (submitError) {
                ctx.fillText(`Submission Error: ${submitError}`, centerX, centerY - 60);
                ctx.fillText('Your score was not saved.', centerX, centerY - 30);
            } else { // Should not happen if submission attempt was made, but fallback
                 ctx.fillText('Score qualified, but was not submitted.', centerX, centerY - 60);
            }
        } else {
            ctx.fillText('You qualified, but did not enter initials.', centerX, centerY - 60);
        }
    } else {
        if (!leaderboardError) {
             ctx.fillText('Better luck next time!', centerX, centerY - 60);
        } else {
             ctx.fillText('Could not check leaderboard ranking.', centerX, centerY - 60);
        }
    }

    ctx.font = '20px Arial';
    ctx.fillText('Returning to Title Screen...', centerX, centerY + 150);

    // Short delay before automatically returning to start screen
    setTimeout(() => {
        initGame(); // Reset game state and trigger start screen draw via updateGame
    }, 3000); // 3 second delay
}

// --- Submit Score Function ---
async function submitScore(initials, score) {
    console.log(`Submitting score: ${initials} - ${score}`);
    try {
        const response = await fetch('/api/leaderboard', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ initials, score }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Unknown error' })); // Try to parse error
            throw new Error(`Failed to submit score: ${response.status} ${errorData.message || ''}`);
        }

        const result = await response.json();
        console.log("Submission result:", result.message);
        return true; // Indicate success
    } catch (error) {
        console.error("Error submitting score:", error);
        throw error; // Re-throw to be caught in gameOver
    }
}

// Function to reset game state and return to the main menu
function returnToMainMenu() {
    console.log("Returning to main menu via Esc key...");
    isGameStarted = false; // This signals updateGame to show the start screen
    gameRunning = false;   // Stop any potential game-related timeouts/intervals if needed

    // Clear dynamic game elements
    asteroids = [];
    bullets = [];

    // Optional: Reset player position/state for a clean menu start
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    player.speed = 0;
    player.angle = -Math.PI / 2; // Point up
    player.canShoot = true; // Reset shooting state

    // Reset game statistics
    score = 0;
    level = 1;
    // Lives are reset upon selecting a new difficulty

    // No need to call showStartScreen() directly,
    // updateGame loop will handle drawing it because isGameStarted is false.
}

// --- Update and Draw (Modified for Async Drawing) ---
async function updateGame(currentTime) { // Make updateGame async
    // Priority 1: Help Screen
    if (isHelpScreenVisible) {
        drawHelpScreen();
        requestAnimationFrame(updateGame);
        return;
    }

    // Priority 2: Start Screen
    if (!isGameStarted) {
        drawStartScreen();
        requestAnimationFrame(updateGame);
        return;
    }

    // Priority 3: Game Over state check
    if (!gameRunning) {
        // If gameRunning is false, it means gameOver() was called.
        // gameOver() handles drawing the final screen.
        // We just need to stop the loop here until initGame() is called.
        // requestAnimationFrame is NOT called here, pausing the updates.
        return; 
    }

    // --- Game is running ---
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // --- Input ---
    if (keys['ArrowUp']) {
        player.speed += player.acceleration;
    } else {
        player.speed *= player.friction;
    }

    // Shooting with cooldown
    if (keys[' '] && player.canShoot) {
        const noseX = player.x + Math.cos(player.angle) * player.size;
        const noseY = player.y + Math.sin(player.angle) * player.size;
        bullets.push(new Bullet(noseX, noseY, player.angle));
        player.canShoot = false;
        player.lastShotTime = currentTime;
    }

    // Reset shooting ability after cooldown
    if (!player.canShoot && currentTime - player.lastShotTime > currentShootCooldown) {
        player.canShoot = true;
    }

    // --- Update Positions ---
    // Player movement with wrap-around instead of boundary constraints
    player.x += Math.cos(player.angle) * player.speed;
    player.y += Math.sin(player.angle) * player.speed;
    wrapAround(player); // Use wrapAround for player movement

    // Update bullets and check canvas boundaries
    for (let i = bullets.length - 1; i >= 0; i--) {
        if (!bullets[i].update()) { // update() now returns false if outside bounds or lifespan ended
            bullets.splice(i, 1);
        }
    }

    // Update asteroids (position, rotation) - Synchronous part
    updateAsteroids(); // This just updates x, y, rotation

    // Draw Top UI (Sync)
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.textBaseline = 'top';
    // Level (Left)
    ctx.textAlign = 'left';
    ctx.fillText('Level: ' + level, 10, 10);
    // Score (Center)
    ctx.textAlign = 'center';
    ctx.fillText('Score: ' + score, canvas.width / 2, 10);
    // Lives (Right)
    ctx.textAlign = 'right';
    ctx.fillText('Lives: ' + lives, canvas.width - 10, 10);

    // Draw game elements
    drawPlayer();
    
    // Draw bullets
    for (const bullet of bullets) {
        bullet.draw();
    }

    // Draw asteroids (Async) - Trigger all draws, they will render when ready
    // Use Promise.all to wait for all asteroid rendering promises to resolve for this frame
    // This ensures we don't request the next frame until all SVGs are drawn
    const asteroidDrawPromises = [];
    for (const asteroid of asteroids) {
        // The draw() method is now async
        asteroidDrawPromises.push(asteroid.draw());
    }

    try {
        await Promise.all(asteroidDrawPromises); // Wait for all asteroids to finish drawing
    } catch (renderError) {
        console.error("Error during asteroid drawing batch:", renderError);
        // Decide how to handle batch rendering errors if necessary
    }

    // Request next frame only after all drawing for the current frame is complete
    requestAnimationFrame(updateGame);
}

function drawPlayer() {
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);

    ctx.beginPath();
    // Defined relative to center (0,0)
    ctx.moveTo(player.size, 0); // Nose
    ctx.lineTo(-player.size * 0.7, player.size * 0.7); // Bottom left wing
    ctx.lineTo(-player.size * 0.4, 0); // Engine center indent (optional)
    ctx.lineTo(-player.size * 0.7, -player.size * 0.7); // Bottom right wing
    ctx.closePath();

    ctx.strokeStyle = 'cyan'; // Changed player color
    ctx.lineWidth = 2;
    ctx.stroke();

    // Optional: Draw thrust flame when accelerating
    if (keys['ArrowUp']) {
        ctx.beginPath();
        ctx.moveTo(-player.size * 0.5, 0); // Behind center
        ctx.lineTo(-player.size * 0.9, player.size * 0.4); // Flame left point
        ctx.lineTo(-player.size * 1.2, 0); // Flame tip
        ctx.lineTo(-player.size * 0.9, -player.size * 0.4); // Flame right point
        ctx.closePath();
        ctx.fillStyle = 'orange';
        ctx.fill();
    }

    ctx.restore();
}

// --- Draw Help Screen ---
function drawHelpScreen() {
    // Draw semi-transparent background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Set text style
    ctx.fillStyle = 'white';
    ctx.font = '32px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle'; // Align text vertically

    const centerX = canvas.width / 2;
    const startY = canvas.height / 2 - 100; // Adjust starting position
    const lineHeight = 40; // Spacing between lines

    // Draw title
    ctx.fillText('Controls', centerX, startY);

    // Draw control list
    ctx.font = '20px Arial'; // Smaller font for controls
    ctx.fillText('Arrow Left: Rotate Left', centerX, startY + lineHeight * 1.5);
    ctx.fillText('Arrow Right: Rotate Right', centerX, startY + lineHeight * 2.5);
    ctx.fillText('Arrow Up: Thrust', centerX, startY + lineHeight * 3.5);
    ctx.fillText('Spacebar: Shoot', centerX, startY + lineHeight * 4.5);
    ctx.fillText('?: Toggle Help / Pause', centerX, startY + lineHeight * 5.5);
    ctx.fillText('Esc: End Game', centerX, startY + lineHeight * 6.5); // Updated Esc info

    // Draw close instruction
    ctx.font = '24px Arial'; // Slightly larger font for close instruction
    ctx.fillText('Press ? to close', centerX, startY + lineHeight * 8.5); // Adjusted Y position
}

// --- Draw Leaderboard Screen ---
// function drawLeaderboardScreen() { ... }

// --- Fetch Leaderboard Data ---
async function fetchLeaderboard() {
    isFetchingLeaderboard = true;
    leaderboardError = null;
    // leaderboardData = null; // Don't clear immediately, keep old data while fetching
    // Force redraw to show loading state on start screen
    // if (!isGameStarted) drawStartScreen(); // Redraw start screen if visible

    try {
        const response = await fetch('/api/leaderboard');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        leaderboardData = await response.json();
    } catch (error) {
        console.error("Failed to fetch leaderboard:", error);
        leaderboardError = error.message;
        // leaderboardData = []; // Keep old data on error? Or clear?
    } finally {
        isFetchingLeaderboard = false;
        // Force redraw to show data or error on start screen
        // if (!isGameStarted) drawStartScreen(); // Redraw start screen if visible
    }
    // No explicit redraw here, relies on updateGame loop calling drawStartScreen
}

// --- Toggle Leaderboard Visibility ---
// function toggleLeaderboard() { ... }

// --- Draw Start Screen (Now includes Leaderboard) ---
function drawStartScreen() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Set text style
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';

    const centerX = canvas.width / 2;
    
    // ------------------------------------
    // SECTION 1: BIG TITLE
    // ------------------------------------
    const titleY = canvas.height * 0.15; // 15% from top
    
    // Title
    ctx.font = '84px Arial';
    ctx.textBaseline = 'middle';
    ctx.fillText('DINOSTROIDS', centerX, titleY);
    
    // ------------------------------------
    // SECTION 2: LEADERBOARD
    // ------------------------------------
    const leaderboardTitleY = titleY + 100;
    const leaderboardStartY = leaderboardTitleY + 40;
    const lineHeight = 25;
    
    // Leaderboard header
    ctx.font = '32px Arial';
    ctx.fillText('TOP SCORES', centerX, leaderboardTitleY);
    
    // Leaderboard content
    ctx.font = '16px Arial';
    ctx.textBaseline = 'top';
    let leaderboardEndY = leaderboardStartY;
    
    if (isFetchingLeaderboard) {
        ctx.fillText('Loading...', centerX, leaderboardStartY);
        leaderboardEndY += lineHeight;
    } else if (leaderboardError) {
        ctx.fillText(`Error loading scores: ${leaderboardError}`, centerX, leaderboardStartY);
        leaderboardEndY += lineHeight;
    } else if (leaderboardData && leaderboardData.length > 0) {
        // Calculate layout for centered leaderboard
        const rankX = centerX - 180;
        const initialsX = centerX - 100;
        const scoreX = centerX + 50;
        const dateX = centerX + 110;
        const headerY = leaderboardStartY;

        // Draw header
        ctx.textAlign = 'left';
        ctx.fillText('Rank', rankX, headerY);
        ctx.fillText('Initials', initialsX, headerY);
        ctx.textAlign = 'right';
        ctx.fillText('Score', scoreX + 40, headerY);
        ctx.textAlign = 'left';
        ctx.fillText('Date', dateX, headerY);

        // Draw entries
        ctx.font = '14px Arial';
        leaderboardData.forEach((entry, index) => {
            if (index >= LEADERBOARD_MAX_ENTRIES) return;
            const yPos = headerY + lineHeight * (index + 1.5);
            ctx.textAlign = 'left';
            ctx.fillText(`${index + 1}.`, rankX, yPos);
            ctx.fillText(entry.initials, initialsX, yPos);
            ctx.textAlign = 'right';
            ctx.fillText(entry.score.toLocaleString(), scoreX + 40, yPos);

            // Format date nicely
            ctx.textAlign = 'left';
            try {
                const date = new Date(entry.createdAt);
                const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                ctx.fillText(formattedDate, dateX, yPos);
            } catch (e) {
                ctx.fillText('Invalid Date', dateX, yPos);
            }
            leaderboardEndY = yPos + lineHeight;
        });
    } else {
        ctx.fillText('No scores yet! Be the first!', centerX, leaderboardStartY);
        leaderboardEndY += lineHeight;
    }
    
    // ------------------------------------
    // SECTION 3: GAME INSTRUCTIONS
    // ------------------------------------
    const instructionsY = leaderboardEndY + 60;
    
    ctx.textAlign = 'center';
    ctx.font = '28px Arial';
    ctx.fillText('Start Game:', centerX, instructionsY);
    
    ctx.font = '24px Arial';
    ctx.fillText('E)asy   M)edium   D)ifficult', centerX, instructionsY + 40);
    
    // Help text near bottom
    ctx.font = '20px Arial';
    ctx.textBaseline = 'bottom';
    ctx.fillText('? for Help', centerX, canvas.height - 50);
    
    // Copyright at very bottom
    ctx.font = '16px Arial';
    ctx.fillText('(c) Intensity Ventures, 2025', centerX, canvas.height - 20);
}

// --- Set Difficulty Function ---
function setDifficulty(difficulty) {
    currentDifficulty = difficulty;
    const settings = difficultySettings[difficulty];

    // Set gameplay parameters
    currentAcceleration = settings.playerAcceleration;
    currentShootCooldown = settings.shootCooldown;
    currentAsteroidMinSpeed = settings.asteroidMinSpeed;
    currentAsteroidSpeedVariation = settings.asteroidSpeedVariation;
    currentInitialAsteroidCountBase = settings.initialAsteroidCountBase;
    currentMaxLives = settings.lives;

    // Apply initial lives
    lives = currentMaxLives;
    console.log(`Difficulty set to: ${difficulty}`);
}

// --- Start the Game Logic ---
function startGame() {
    if (isGameStarted) return; // Prevent multiple starts

    isGameStarted = true;
    gameRunning = true;
    score = 0;
    level = 1;

    // Reset player to center of canvas
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    player.speed = 0;
    player.angle = -Math.PI / 2;

    bullets = [];
    asteroids = [];

    startLevel();
}

// --- Main Initialization ---
function resizeCanvas() {
    console.log("Resizing canvas..."); // Log for confirmation
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Redraw the appropriate screen immediately after resize
    if (isHelpScreenVisible) {
        drawHelpScreen();
    } else if (!isGameStarted) {
        // If the game hasn't started, we are on the start screen
        showStartScreen(); // Use the correct function to draw the start screen
    }
    // No need for an 'else' here, as the main game loop (updateGame)
    // handles redraws when the game is running.
}

function initGame() {
    console.log("Initializing game...");

    // Fetch leaderboard data right away
    fetchLeaderboard();

    // Set canvas dimensions
    resizeCanvas();

    // Setup resize listener
    // Use a basic resize handling for now
    window.addEventListener('resize', resizeCanvas);

    // Reset game state variables
    isGameStarted = false;
    isHelpScreenVisible = false;
    // gameRunning = false; // Should be false by default or handled by start screen
    score = 0;
    level = 1;
    lives = 3; // Default lives, will be set by difficulty
    asteroids = [];
    bullets = [];
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    player.speed = 0;
    player.angle = -Math.PI / 2;
    player.canShoot = true;
    player.isInvulnerable = false;

    // Preload images and then show the start screen
    preloadImages(() => {
        console.log("Image loading complete, showing start screen.");
        // Now that images are loaded (or failed), show the start screen
        showStartScreen(); // Directly draw the start screen once images are processed
    });

    // Ensure the animation loop starts/continues after init
    requestAnimationFrame(updateGame); 
}

// Function to display the start screen and wait for difficulty selection
function showStartScreen() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Set text style
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';

    const centerX = canvas.width / 2;
    
    // ------------------------------------
    // SECTION 1: BIG TITLE
    // ------------------------------------
    const titleY = canvas.height * 0.15; // 15% from top
    
    // Title
    ctx.font = '84px Arial';
    ctx.textBaseline = 'middle';
    ctx.fillText('DINOSTROIDS', centerX, titleY);
    
    // ------------------------------------
    // SECTION 2: LEADERBOARD
    // ------------------------------------
    const leaderboardTitleY = titleY + 100;
    const leaderboardStartY = leaderboardTitleY + 40;
    const lineHeight = 25;
    
    // Leaderboard header
    ctx.font = '32px Arial';
    ctx.fillText('TOP SCORES', centerX, leaderboardTitleY);
    
    // Leaderboard content
    ctx.font = '16px Arial';
    ctx.textBaseline = 'top';
    let leaderboardEndY = leaderboardStartY;
    
    if (isFetchingLeaderboard) {
        ctx.fillText('Loading...', centerX, leaderboardStartY);
        leaderboardEndY += lineHeight;
    } else if (leaderboardError) {
        ctx.fillText(`Error loading scores: ${leaderboardError}`, centerX, leaderboardStartY);
        leaderboardEndY += lineHeight;
    } else if (leaderboardData && leaderboardData.length > 0) {
        // Calculate layout for centered leaderboard
        const rankX = centerX - 180;
        const initialsX = centerX - 100;
        const scoreX = centerX + 50;
        const dateX = centerX + 110;
        const headerY = leaderboardStartY;

        // Draw header
        ctx.textAlign = 'left';
        ctx.fillText('Rank', rankX, headerY);
        ctx.fillText('Initials', initialsX, headerY);
        ctx.textAlign = 'right';
        ctx.fillText('Score', scoreX + 40, headerY);
        ctx.textAlign = 'left';
        ctx.fillText('Date', dateX, headerY);

        // Draw entries
        ctx.font = '14px Arial';
        leaderboardData.forEach((entry, index) => {
            if (index >= LEADERBOARD_MAX_ENTRIES) return;
            const yPos = headerY + lineHeight * (index + 1.5);
            ctx.textAlign = 'left';
            ctx.fillText(`${index + 1}.`, rankX, yPos);
            ctx.fillText(entry.initials, initialsX, yPos);
            ctx.textAlign = 'right';
            ctx.fillText(entry.score.toLocaleString(), scoreX + 40, yPos);

            // Format date nicely
            ctx.textAlign = 'left';
            try {
                const date = new Date(entry.createdAt);
                const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                ctx.fillText(formattedDate, dateX, yPos);
            } catch (e) {
                ctx.fillText('Invalid Date', dateX, yPos);
            }
            leaderboardEndY = yPos + lineHeight;
        });
    } else {
        ctx.fillText('No scores yet! Be the first!', centerX, leaderboardStartY);
        leaderboardEndY += lineHeight;
    }
    
    // ------------------------------------
    // SECTION 3: GAME INSTRUCTIONS
    // ------------------------------------
    const instructionsY = leaderboardEndY + 60;
    
    ctx.textAlign = 'center';
    ctx.font = '28px Arial';
    ctx.fillText('Start Game:', centerX, instructionsY);
    
    ctx.font = '24px Arial';
    ctx.fillText('E)asy   M)edium   D)ifficult', centerX, instructionsY + 40);
    
    // Help text near bottom
    ctx.font = '20px Arial';
    ctx.textBaseline = 'bottom';
    ctx.fillText('? for Help', centerX, canvas.height - 50);
    
    // Copyright at very bottom
    ctx.font = '16px Arial';
    ctx.fillText('(c) Intensity Ventures, 2025', centerX, canvas.height - 20);
}

// --- Level Handling ---
function startLevel() {
    // Clear any existing asteroids and bullets
    asteroids = [];
    bullets = [];

    // Calculate number of asteroids based on level: 5 + (level * 2)
    const numAsteroids = 5 + (level * 2);
    console.log(`Level ${level}: Spawning ${numAsteroids} asteroids.`); // Keep log for now

    // Spawn initial asteroids
    for (let i = 0; i < numAsteroids; i++) {
        spawnAsteroid('large');
    }

    // Give player brief invulnerability at start of level
    player.isInvulnerable = true;
    setTimeout(() => {
        player.isInvulnerable = false;
    }, INVINCIBILITY_TIME);
}

// Add resize listener
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Re-center player roughly on resize, or use wrapAround logic
    if (player) {
         // Option 1: Re-center (might feel abrupt)
         // player.x = canvas.width / 2;
         // player.y = canvas.height / 2;

         // Option 2: Ensure player stays within new bounds using wrapAround idea
         // This requires modifying wrapAround or ensuring it's called after resize
         // For simplicity, let's just ensure player is not completely lost.
         // The wrapAround in updateGame should handle it mostly.
         if (player.x > canvas.width + player.size) player.x = canvas.width / 2; // Basic reset if way off
         if (player.y > canvas.height + player.size) player.y = canvas.height / 2;
    }
});

// Initialize game state variables (will fetch leaderboard)
initGame();

// Start the animation loop
requestAnimationFrame(updateGame);

function updateAsteroids() {
    for (let i = asteroids.length - 1; i >= 0; i--) {
        const asteroid = asteroids[i];
        let destroyed = false; // Flag

        // Collision checks (sync)
        if (gameRunning && !player.isInvulnerable) {
            if (checkCollision(player, asteroid)) {
                handlePlayerCollision();
            }
        }
        for (let j = bullets.length - 1; j >= 0; j--) {
            const bullet = bullets[j];
            if (checkCollision(bullet, asteroid)) {
                bullets.splice(j, 1);
                handleAsteroidDestruction(asteroid, i);
                destroyed = true;
                break;
            }
        }

        if (destroyed) {
            continue; // Skip update if destroyed
        }

        // Update position/rotation (sync)
        asteroid.update();

        // Wrap around (sync)
        wrapAround(asteroid);
    }
}

function handleAsteroidDestruction(asteroid, index) {
    // Remove the hit asteroid
    asteroids.splice(index, 1);
    
    // Update score based on asteroid size type
    switch(asteroid.sizeType) { // Use sizeType
        case 'large':
            score += 20;
            // Spawn medium asteroids
            for (let i = 0; i < 2; i++) {
                spawnAsteroid('medium', asteroid.x, asteroid.y);
            }
            break;
        case 'medium':
            score += 50;
            // Spawn small asteroids
            for (let i = 0; i < 2; i++) {
                spawnAsteroid('small', asteroid.x, asteroid.y);
            }
            break;
        case 'small':
            score += 100;
            break;
    }

    // Check if level is complete
    if (asteroids.length === 0) {
        level++;
        startLevel();
    }
}

// Add handlePlayerCollision function
function handlePlayerCollision() {
    if (player.isInvulnerable) return;
    
    lives--;
    if (lives <= 0) {
        gameOver();
        return;
    }

    // Reset player position to center of canvas
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    player.speed = 0;
    player.angle = -Math.PI / 2;

    // Make player invulnerable temporarily
    player.isInvulnerable = true;
    setTimeout(() => {
        player.isInvulnerable = false;
    }, INVINCIBILITY_TIME);
}

// --- Toggle Help Screen ---
function toggleHelpScreen() {
    isHelpScreenVisible = !isHelpScreenVisible;
    // If turning help off, ensure game loop continues if it was running
    if (!isHelpScreenVisible && isGameStarted && !gameRunning) {
        // Potentially needed if pausing was implemented alongside help
        // gameRunning = true;
        // requestAnimationFrame(updateGame);
    }
    // If turning help on while game is running, maybe pause?
    // else if (isHelpScreenVisible && isGameStarted && gameRunning) {
        // gameRunning = false;
    // }
}

// --- Start Game Initialization ---
initGame(); // Call initGame to start loading images and show menu
