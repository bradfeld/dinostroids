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

// Player
const PLAYER_SIZE = 15;
const PLAYER_ROTATION_SPEED = 0.07 * 3; // ~0.21
const PLAYER_ACCELERATION = 0.18 * 3; // 0.54
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
        playerAcceleration: PLAYER_ACCELERATION,
        shootCooldown: SHOOT_COOLDOWN,
        asteroidMinSpeed: ASTEROID_MIN_SPEED,
        asteroidSpeedVariation: ASTEROID_SPEED_VARIATION,
        initialAsteroidCountBase: 2,
        lives: 5,
        // fieldSizePercent: 100 // Full screen - REMOVED
    },
    medium: {
        playerAcceleration: PLAYER_ACCELERATION * 1.5,
        shootCooldown: Math.floor(SHOOT_COOLDOWN * 0.7),
        asteroidMinSpeed: ASTEROID_MIN_SPEED * 1.5,
        asteroidSpeedVariation: ASTEROID_SPEED_VARIATION * 1.2,
        initialAsteroidCountBase: 3,
        lives: 3,
        // fieldSizePercent: 67 // 67% of screen size - REMOVED
    },
    difficult: {
        playerAcceleration: PLAYER_ACCELERATION * 2.0,
        shootCooldown: Math.floor(SHOOT_COOLDOWN * 0.5),
        asteroidMinSpeed: ASTEROID_MIN_SPEED * 2.0,
        asteroidSpeedVariation: ASTEROID_SPEED_VARIATION * 1.5,
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

// --- Dinosaur Shapes ---
const DINO_SHAPES = [
    // Shape 1: Sauropod-like (small)
    [
        {x: 0.8, y: -0.6}, {x: 1, y: -0.4}, {x: 0.9, y: 0}, {x: 0.5, y: 0.3},
        {x: 0.2, y: 0.8}, {x: -0.5, y: 0.7}, {x: -1, y: 0.5},
        {x: -0.8, y: 0}, {x: -0.9, y: -0.3},
        {x: -0.4, y: -0.6},
        {x: 0, y: -0.7},
        {x: 0.3, y: -0.6},
        {x: 0.6, y: -0.8}
    ],
    // Shape 2: T-Rex-like (large)
    [
        {x: 0.5, y: -0.9}, {x: 0.9, y: -0.7}, {x: 0.6, y: -0.2}, {x: 0.9, y: 0.1},
        {x: 0.5, y: 0.3},
        {x: 0.4, y: 0.8}, {x: -0.3, y: 0.9}, {x: -0.8, y: 0.6},
        {x: -1.0, y: 0.0}, {x: -0.8, y: -0.3},
        {x: -0.9, y: -0.6}, {x: -0.7, y: -0.7},
        {x: -0.3, y: -0.8},
        {x: 0.2, y: -0.3}, {x: 0.3, y: -0.5},
        {x: 0.1, y: -0.8}
    ],
    // Shape 3: Pterodactyl-like (medium)
    [
        {x: 0.4, y: -0.8}, {x: 0.8, y: -0.6}, {x: 1.0, y: -0.7}, {x: 0.6, y: 0},
        {x: 0.8, y: 0.4},
        {x: 0.3, y: 0.1},
        {x: 0.9, y: 0.9}, {x: 0.5, y: 1.0}, {x: 0.0, y: 0.5},
        {x: -0.6, y: 0.8}, {x: -1.0, y: 0.6}, {x: -0.7, y: 0.1},
        {x: -0.5, y: 0.3},
        {x: -0.6, y: -0.5}, {x: -0.4, y: -0.6},
        {x: 0, y: -0.3}
    ]
];

// --- Game state ---
let player = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  angle: -Math.PI / 2, // Point up
  speed: 0,
  rotationSpeed: PLAYER_ROTATION_SPEED,
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
    constructor(size, x, y) {
        this.size = size;
        this.x = x;
        this.y = y;
        this.radius = asteroidSizes[size];
        this.speed = Math.random() * (asteroidSpeeds[currentDifficulty][size].max - asteroidSpeeds[currentDifficulty][size].min) + asteroidSpeeds[currentDifficulty][size].min;
        this.angle = Math.random() * TWO_PI;
        this.rotation = Math.random() * TWO_PI;
        this.rotationSpeed = (Math.random() - 0.5) * 0.05;

        // Assign shape based on size
        switch (size) {
            case 'large':
                this.vertices = DINO_SHAPES[1]; // T-Rex
                break;
            case 'medium':
                this.vertices = DINO_SHAPES[2]; // Pterodactyl
                break;
            case 'small':
                this.vertices = DINO_SHAPES[0]; // Sauropod
                break;
        }
    }

    draw() {
        // Log asteroid position before drawing
        console.log(`Drawing asteroid at (${this.x.toFixed(1)}, ${this.y.toFixed(1)}) with radius ${this.radius}`);

        // Don't draw if outside canvas boundaries
        if (this.x + this.radius < 0 ||
            this.x - this.radius > canvas.width ||
            this.y + this.radius < 0 ||
            this.y - this.radius > canvas.height) {
            console.log('Asteroid outside canvas draw boundaries, skipping draw.');
            return;
        }

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // Draw the dinosaur shape
        ctx.beginPath();
        ctx.moveTo(this.vertices[0].x * this.radius, this.vertices[0].y * this.radius);
        for (let i = 1; i < this.vertices.length; i++) {
            ctx.lineTo(this.vertices[i].x * this.radius, this.vertices[i].y * this.radius);
        }
        ctx.closePath();

        // Style the asteroid
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();
    }

    update() {
        // Move asteroid
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
        this.rotation += this.rotationSpeed;
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

// --- Input Handling ---
const keys = {};
document.addEventListener('keydown', (event) => {
    keys[event.key] = true;
    // Toggle help screen on '?' press
    if (event.key === '?') {
        isHelpScreenVisible = !isHelpScreenVisible;
        event.preventDefault(); // Prevent browser find (?)
    }
    // Select difficulty and start game if not started
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
    // End game on 'Escape' press if game is running and help isn't visible
    if (event.key === 'Escape' && isGameStarted && !isHelpScreenVisible) {
        // Prevent triggering if already in gameOver state (e.g. multiple ESC presses)
        if (gameRunning) { // Only trigger if game is logically running
            gameOver();
        }
        event.preventDefault();
    }
});
document.addEventListener('keyup', (event) => { keys[event.key] = false; });

// --- Helper Functions ---
function wrapAround(object) {
  if (object.x < -object.size) object.x = canvas.width + object.size;
  if (object.x > canvas.width + object.size) object.x = -object.size;
  if (object.y < -object.size) object.y = canvas.height + object.size;
  if (object.y > canvas.height + object.size) object.y = -object.size;
}

function spawnAsteroid(size = 'large', x = null, y = null) {
    const spawnRadius = asteroidSizes[size];
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
        console.log(`Spawning ${size} asteroid randomly inside canvas at (${x.toFixed(1)}, ${y.toFixed(1)})`);
    
    } else {
        // If position IS specified (e.g., when an asteroid splits), use those coordinates directly
        console.log(`Spawning split ${size} asteroid at provided location (${x.toFixed(1)}, ${y.toFixed(1)})`);
    }

    // Create and add the asteroid
    const newAsteroid = new Asteroid(size, x, y);
    asteroids.push(newAsteroid);
    console.log(`Asteroids array length: ${asteroids.length}`);
}

// Simple Circular Collision Check (Approximation)
function checkCollision(obj1, obj2) {
    const dx = obj1.x - obj2.x;
    const dy = obj1.y - obj2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    // Use 'size' property which approximates radius for both player and asteroids
    return distance < obj1.size + obj2.size;
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

// --- Update and Draw ---
function updateGame(currentTime) {
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

    // --- Game is running ---
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // --- Input ---
    if (keys['ArrowLeft']) {
        player.angle -= player.rotationSpeed;
    }
    if (keys['ArrowRight']) {
        player.angle += player.rotationSpeed;
    }
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

    // Update asteroids
    updateAsteroids();

    // Draw Top UI (Level, Score, Lives)
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

    // Draw asteroids
    for (const asteroid of asteroids) {
        asteroid.draw();
    }

    // Request next frame
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
    ctx.fillText('(c) Brad Feld, 2025', centerX, canvas.height - 20);
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

// --- Initialization (Setup but doesn't start) ---
function initGame() {
    // Reset core game state variables
    score = 0;
    lives = 3;
    level = 1;
    isGameStarted = false;
    isHelpScreenVisible = false;

    // Reset player to center of canvas
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    player.speed = 0;
    player.angle = -Math.PI / 2;
    
    bullets = [];
    asteroids = [];

    // Fetch leaderboard data for the start screen
    fetchLeaderboard();
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

// Start the animation loop - it will initially draw the start screen
requestAnimationFrame(updateGame);

function updateAsteroids() {
    for (let i = asteroids.length - 1; i >= 0; i--) {
        const asteroid = asteroids[i];
        let destroyed = false; // Flag to check if asteroid was destroyed by collision

        // Check collision with player first
        if (gameRunning && !player.isInvulnerable) {
            const dx = player.x - asteroid.x;
            const dy = player.y - asteroid.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < asteroid.radius + player.size / 2) {
                handlePlayerCollision();
            }
        }

        // Check collision with bullets
        for (let j = bullets.length - 1; j >= 0; j--) {
            const bullet = bullets[j];
            const dxBullet = bullet.x - asteroid.x;
            const dyBullet = bullet.y - asteroid.y;
            const distanceBullet = Math.sqrt(dxBullet * dxBullet + dyBullet * dyBullet);
            
            if (distanceBullet < asteroid.radius + bullet.radius) {
                bullets.splice(j, 1); // Remove bullet
                handleAsteroidDestruction(asteroid, i); // Handle destruction (might splice asteroid)
                destroyed = true; // Mark as destroyed
                break; // Stop checking bullets for this asteroid
            }
        }

        // If asteroid was destroyed by a bullet, skip update and boundary check for this iteration
        if (destroyed) {
            continue;
        }

        // If not destroyed, THEN update its position
        asteroid.update();

        // Use wrapAround for asteroids
        wrapAround(asteroid); 
    }
}

function handleAsteroidDestruction(asteroid, index) {
    // Remove the hit asteroid
    asteroids.splice(index, 1);
    
    // Update score based on asteroid size
    switch(asteroid.size) {
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
