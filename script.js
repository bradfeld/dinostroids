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
const PLAYER_ROTATION_SPEED = 0.07;
// Increased base speed for Easy mode
const PLAYER_ACCELERATION = 0.18; 
const PLAYER_FRICTION = 0.98;
const INVINCIBILITY_TIME = 3000; // milliseconds

// Bullets
const BULLET_RADIUS = 2;
const BULLET_SPEED = 8; // Increased from original
const BULLET_LIFESPAN = 50; // frames
// Reduced cooldown for faster shooting
const SHOOT_COOLDOWN = 120; // milliseconds

// Asteroids
// Increased base speeds for asteroids
const ASTEROID_MIN_SPEED = 0.6;
const ASTEROID_SPEED_VARIATION = 1.6;

// Define asteroid sizes and speeds
const asteroidSizes = {
    large: 45,
    medium: 25,
    small: 15
};

const asteroidSpeeds = {
    easy: {
        large: { min: 0.5, max: 1.0 },
        medium: { min: 0.8, max: 1.5 },
        small: { min: 1.2, max: 2.0 }
    },
    medium: {
        large: { min: 0.8, max: 1.5 },
        medium: { min: 1.2, max: 2.0 },
        small: { min: 1.8, max: 2.5 }
    },
    difficult: {
        large: { min: 1.2, max: 2.0 },
        medium: { min: 1.8, max: 2.5 },
        small: { min: 2.5, max: 3.5 }
    }
};

// Leaderboard
const LEADERBOARD_MAX_ENTRIES = 10;

// Add field size variables after the game constants
let gameField = {
    width: window.innerWidth,
    height: window.innerHeight,
    offsetX: 0,
    offsetY: 0
};

// Update difficulty settings to include field size
const difficultySettings = {
    easy: {
        playerAcceleration: PLAYER_ACCELERATION,
        shootCooldown: SHOOT_COOLDOWN,
        asteroidMinSpeed: ASTEROID_MIN_SPEED,
        asteroidSpeedVariation: ASTEROID_SPEED_VARIATION,
        initialAsteroidCountBase: 2,
        lives: 5,
        fieldSizePercent: 100 // Full screen
    },
    medium: {
        playerAcceleration: PLAYER_ACCELERATION * 1.5,
        shootCooldown: Math.floor(SHOOT_COOLDOWN * 0.7),
        asteroidMinSpeed: ASTEROID_MIN_SPEED * 1.5,
        asteroidSpeedVariation: ASTEROID_SPEED_VARIATION * 1.2,
        initialAsteroidCountBase: 3,
        lives: 3,
        fieldSizePercent: 67 // 67% of screen size
    },
    difficult: {
        playerAcceleration: PLAYER_ACCELERATION * 2.0,
        shootCooldown: Math.floor(SHOOT_COOLDOWN * 0.5),
        asteroidMinSpeed: ASTEROID_MIN_SPEED * 2.0,
        asteroidSpeedVariation: ASTEROID_SPEED_VARIATION * 1.5,
        initialAsteroidCountBase: 4,
        lives: 2,
        fieldSizePercent: 50 // 50% of screen size
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

        // Don't draw if outside game field
        if (this.x + this.radius < gameField.offsetX ||
            this.x - this.radius > gameField.offsetX + gameField.width ||
            this.y + this.radius < gameField.offsetY ||
            this.y - this.radius > gameField.offsetY + gameField.height) {
            console.log('Asteroid outside draw boundaries, skipping draw.');
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
        // Don't draw if outside game field
        if (this.x < gameField.offsetX || this.x > gameField.offsetX + gameField.width ||
            this.y < gameField.offsetY || this.y > gameField.offsetY + gameField.height) {
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
        
        // Return true if bullet should be kept, false if it should be removed
        return this.lifespan > 0 &&
               this.x >= gameField.offsetX - this.radius &&
               this.x <= gameField.offsetX + gameField.width + this.radius &&
               this.y >= gameField.offsetY - this.radius &&
               this.y <= gameField.offsetY + gameField.height + this.radius;
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
    // If position not specified, spawn at edge of game field
    if (x === null || y === null) {
        const side = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
        const spawnRadius = asteroidSizes[size]; // Use radius for offset
        switch(side) {
            case 0: // top
                x = gameField.offsetX + Math.random() * gameField.width;
                y = gameField.offsetY - spawnRadius;
                break;
            case 1: // right
                x = gameField.offsetX + gameField.width + spawnRadius;
                y = gameField.offsetY + Math.random() * gameField.height;
                break;
            case 2: // bottom
                x = gameField.offsetX + Math.random() * gameField.width;
                y = gameField.offsetY + gameField.height + spawnRadius;
                break;
            case 3: // left
                x = gameField.offsetX - spawnRadius;
                y = gameField.offsetY + Math.random() * gameField.height;
                break;
        }
    }

    // Log before creating
    console.log(`Spawning ${size} asteroid at (${x.toFixed(1)}, ${y.toFixed(1)})`);

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

    // Draw game field boundary if not in easy mode
    if (currentDifficulty !== 'easy') {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 2;
        ctx.strokeRect(gameField.offsetX, gameField.offsetY, gameField.width, gameField.height);
    }

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
    // Player movement with boundary constraints
    const newX = player.x + Math.cos(player.angle) * player.speed;
    const newY = player.y + Math.sin(player.angle) * player.speed;

    // Constrain player to game field
    player.x = Math.max(gameField.offsetX + player.size,
                Math.min(gameField.offsetX + gameField.width - player.size, newX));
    player.y = Math.max(gameField.offsetY + player.size,
                Math.min(gameField.offsetY + gameField.height - player.size, newY));

    // If player hits boundary, reduce speed
    if (player.x === gameField.offsetX + player.size || 
        player.x === gameField.offsetX + gameField.width - player.size ||
        player.y === gameField.offsetY + player.size || 
        player.y === gameField.offsetY + gameField.height - player.size) {
        player.speed *= 0.5;
    }

    // Update bullets and check boundaries
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].update();
        // Remove bullets that are outside game field
        if (bullets[i].x < gameField.offsetX || 
            bullets[i].x > gameField.offsetX + gameField.width ||
            bullets[i].y < gameField.offsetY || 
            bullets[i].y > gameField.offsetY + gameField.height) {
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

    // Set field size
    const percent = settings.fieldSizePercent / 100;
    gameField.width = Math.floor(canvas.width * percent);
    gameField.height = Math.floor(canvas.height * percent);
    gameField.offsetX = Math.floor((canvas.width - gameField.width) / 2);
    gameField.offsetY = Math.floor((canvas.height - gameField.height) / 2);

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

    // Reset player to center of game field
    player.x = gameField.offsetX + gameField.width / 2;
    player.y = gameField.offsetY + gameField.height / 2;
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

    // Initialize game field to full screen (will be updated when difficulty is selected)
    gameField.width = canvas.width;
    gameField.height = canvas.height;
    gameField.offsetX = 0;
    gameField.offsetY = 0;

    // Reset player to center of screen
    player.x = gameField.offsetX + gameField.width / 2;
    player.y = gameField.offsetY + gameField.height / 2;
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

    // Calculate number of asteroids based on level
    const numAsteroids = Math.min(2 + Math.floor(level / 2), 8);

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
    
    // Recalculate game field size if in a game
    if (currentDifficulty) {
        const percent = difficultySettings[currentDifficulty].fieldSizePercent / 100;
        gameField.width = Math.floor(canvas.width * percent);
        gameField.height = Math.floor(canvas.height * percent);
        gameField.offsetX = Math.floor((canvas.width - gameField.width) / 2);
        gameField.offsetY = Math.floor((canvas.height - gameField.height) / 2);
    }

    // Keep player within bounds
    if (player) {
        player.x = Math.max(gameField.offsetX + player.size,
                  Math.min(gameField.offsetX + gameField.width - player.size, player.x));
        player.y = Math.max(gameField.offsetY + player.size,
                  Math.min(gameField.offsetY + gameField.height - player.size, player.y));
    }
});

// Initialize game state variables (will fetch leaderboard)
initGame();

// Start the animation loop - it will initially draw the start screen
requestAnimationFrame(updateGame);

function updateAsteroids() {
    for (let i = asteroids.length - 1; i >= 0; i--) {
        const asteroid = asteroids[i];
        
        // Call the asteroid's own update method for movement
        asteroid.update();

        // Check if asteroid is completely outside the game field
        const isOutside = (
            asteroid.x + asteroid.radius < gameField.offsetX ||
            asteroid.x - asteroid.radius > gameField.offsetX + gameField.width ||
            asteroid.y + asteroid.radius < gameField.offsetY ||
            asteroid.y - asteroid.radius > gameField.offsetY + gameField.height
        );

        if (isOutside) {
            // Log before removing
            console.log(`Removing asteroid at (${asteroid.x.toFixed(1)}, ${asteroid.y.toFixed(1)}) because it's outside game field.`);
            asteroids.splice(i, 1);
            continue;
        }

        // Check collision with player
        if (gameRunning && !player.isInvulnerable) {
            const dx = player.x - asteroid.x;
            const dy = player.y - asteroid.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Use asteroid.radius and player.size for collision check
            if (distance < asteroid.radius + player.size / 2) { 
                handlePlayerCollision();
            }
        }

        // Check collision with bullets
        for (let j = bullets.length - 1; j >= 0; j--) {
            const bullet = bullets[j];
            const dx = bullet.x - asteroid.x;
            const dy = bullet.y - asteroid.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Use asteroid.radius and bullet.radius for collision check
            if (distance < asteroid.radius + bullet.radius) { 
                // Remove bullet
                bullets.splice(j, 1);
                
                // Handle asteroid destruction (which might remove the asteroid)
                handleAsteroidDestruction(asteroid, i);
                // Important: break after destruction as the asteroid at index 'i' is gone
                break; 
            }
        }
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

    // Reset player position to center of game field
    player.x = gameField.offsetX + gameField.width / 2;
    player.y = gameField.offsetY + gameField.height / 2;
    player.speed = 0;
    player.angle = -Math.PI / 2;

    // Make player invulnerable temporarily
    player.isInvulnerable = true;
    setTimeout(() => {
        player.isInvulnerable = false;
    }, INVINCIBILITY_TIME);
}
