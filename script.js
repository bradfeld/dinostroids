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

// Helper function to convert vertex array to SVG path data
function verticesToPathData(vertices) {
    if (!vertices || vertices.length === 0) return "";
    let path = `M ${vertices[0].x} ${vertices[0].y}`;
    for (let i = 1; i < vertices.length; i++) {
        path += ` L ${vertices[i].x} ${vertices[i].y}`;
    }
    path += " Z"; // Close the path
    return path;
}

// --- Dinosaur Shapes (SVG Format) ---
const DINO_SVGS = {
    small: `<svg viewBox="-1.1 -0.9 2.2 1.8" width="2.2" height="1.8">
              <path fill="none" stroke="currentColor" stroke-width="0.1" stroke-linecap="round" stroke-linejoin="round"
                    d="${verticesToPathData([ // Shape 0: Sauropod
                        {x: 0.8, y: -0.6}, {x: 1, y: -0.4}, {x: 0.9, y: 0}, {x: 0.5, y: 0.3},
                        {x: 0.2, y: 0.8}, {x: -0.5, y: 0.7}, {x: -1, y: 0.5},
                        {x: -0.8, y: 0}, {x: -0.9, y: -0.3},
                        {x: -0.4, y: -0.6},
                        {x: 0, y: -0.7},
                        {x: 0.3, y: -0.6},
                        {x: 0.6, y: -0.8}
                    ])}" />
            </svg>`,
    large: `<svg viewBox="-1.1 -0.9 2.1 1.9" width="2.1" height="1.9">
               <path fill="none" stroke="currentColor" stroke-width="0.1" stroke-linecap="round" stroke-linejoin="round"
                     d="${verticesToPathData([ // Shape 1: T-Rex
                        {x: 0.5, y: -0.9}, {x: 0.9, y: -0.7}, {x: 0.6, y: -0.2}, {x: 0.9, y: 0.1},
                        {x: 0.5, y: 0.3},
                        {x: 0.4, y: 0.8}, {x: -0.3, y: 0.9}, {x: -0.8, y: 0.6},
                        {x: -1.0, y: 0.0}, {x: -0.8, y: -0.3},
                        {x: -0.9, y: -0.6}, {x: -0.7, y: -0.7},
                        {x: -0.3, y: -0.8},
                        {x: 0.2, y: -0.3}, {x: 0.3, y: -0.5},
                        {x: 0.1, y: -0.8}
                     ])}" />
            </svg>`,
    medium: `<svg width="3.999" height="1.267" viewBox="0 0 3.999 1.267" xmlns="http://www.w3.org/2000/svg">
                <path fill="none" stroke="currentColor" stroke-width="0.015" stroke-linecap="round" stroke-linejoin="round"
                      d="m2.197 0-.064.04-.02.026-.06.093-.07.023-.2-.039-.033.004-.07.034-.186.08-.338.125-.098.085-.026.043L.82.61.598.705.453.75.341.761.2.776.01.79 0 .793l.04.023.249.068.284.049.214-.015.142-.01.24-.018.054-.008.05.01.025.044.015.077-.045.109-.037.1.045.042.37.001h.023l.03-.037-.02-.032-.01-.018-.01-.05.123-.106.019.037.022.056.042.104.052.048.345-.002.05-.007-.056-.098-.058-.118.038-.037h.25l.04-.008.03.052.078.128.126.064.223-.011h.104l.04-.008-.19-.2-.037-.044.032-.084.049-.029.178-.01.023-.004.152-.016.217.037.15.047.1-.018.01-.008.11-.139.002-.015L3.86.662 3.758.6l.24-.214-.105.01-.28.073-.062.003.17-.317-.045.004-.132.065-.193.09-.074.032-.031-.061-.17-.117-.167-.09L2.8.03 2.534.017l-.282-.01L2.24.004zm-.022.024.184.02.059.005.16.009h.056l.164.01.092.044.083.044.21.124.047.077.065.023.183-.086.135-.058-.025.073-.08.149.012.067.362-.094-.02.024-.132.112.035.087.118.112-.002.01-.12.14-.012.005-.138-.043L3.378.82l-.12.014-.026.005-.258.023-.068.03-.043.099.02.054.06.066.084.09.007.021-.123.003h-.18l-.042-.017-.063-.12-.07-.105-.064-.012-.047.004h-.252l-.043.029.062.157.02.054-.032.02h-.249l-.043-.035-.08-.183L1.8.964 1.76.986l-.105.087-.054.048.013.046.012.021-.046.038h-.3l.017-.055.058-.13-.021-.132-.008-.012L1.3.854h-.106l-.07.008-.226.02H.894l-.258.02L.34.864.188.819.176.81l.078-.01.235-.025.135-.039L.9.616l.155-.067.04-.054.1-.084.348-.13.21-.093.06-.006.198.037.06-.016.102-.154z" />
             </svg>` // Replaced placeholder with normalized Stegosaurus data
};

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
let gamesPlayedCount = 0; // Counter for games played (will be fetched)

// --- Classes ---

class Asteroid {
    constructor(sizeType, x, y) {
        this.sizeType = sizeType; // 'large', 'medium', 'small'
        this.x = x;
        this.y = y;
        this.radius = asteroidSizes[this.sizeType];
        this.size = this.radius; // Keep numeric size for collision/wrap
        this.speed = Math.random() * (asteroidSpeeds[currentDifficulty][this.sizeType].max - asteroidSpeeds[currentDifficulty][this.sizeType].min) + asteroidSpeeds[currentDifficulty][this.sizeType].min;
        this.angle = Math.random() * TWO_PI;
        this.rotation = Math.random() * TWO_PI; // Keep for rotation
        this.rotationSpeed = (Math.random() - 0.5) * 0.05;

        // Store the SVG string for this asteroid type
        this.svgString = DINO_SVGS[this.sizeType];
        this.canvgInstance = null; // To potentially cache canvg instance
        this.isRendering = false; // Flag to prevent concurrent rendering calls

        // Pre-parse base dimensions from SVG string
        try {
            const widthMatch = this.svgString.match(/width="([^"]+)"/);
            const heightMatch = this.svgString.match(/height="([^"]+)"/);
            this.baseWidth = widthMatch ? parseFloat(widthMatch[1]) : 2; // Default fallback
            this.baseHeight = heightMatch ? parseFloat(heightMatch[1]) : 2; // Default fallback
        } catch (e) {
            console.error("Error parsing SVG dimensions, using defaults.", e);
            this.baseWidth = 2;
            this.baseHeight = 2;
        }
    }

    // Make draw async to handle canvg rendering
    async draw() {
        // Check visibility based on radius, simple check
        if (this.x + this.radius < 0 ||
            this.x - this.radius > canvas.width ||
            this.y + this.radius < 0 ||
            this.y - this.radius > canvas.height) {
            return; // Skip drawing if entirely off-screen
        }
        
        if (this.isRendering) return; // Don't start new render if one is ongoing

        this.isRendering = true; // Set flag

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation); // Apply rotation

        // Calculate scaling
        const targetDiameter = this.radius * 2;
        const scaleX = targetDiameter / this.baseWidth;
        const scaleY = targetDiameter / this.baseHeight;
        const scale = Math.min(scaleX, scaleY); // Maintain aspect ratio

        const drawWidth = this.baseWidth * scale;
        const drawHeight = this.baseHeight * scale;
        const offsetX = -drawWidth / 2; // Center the drawing
        const offsetY = -drawHeight / 2;

        // Use Canvg
        try {
            // Set the stroke color based on the main context's strokeStyle
            // NOTE: This replaces "currentColor" in the SVG string temporarily.
            // A more robust solution might involve passing parameters to canvg if possible,
            // but direct string replacement is simpler here.
            const currentStrokeStyle = ctx.strokeStyle; // Usually 'white'
            const svgWithColor = this.svgString.replace(/currentColor/g, currentStrokeStyle);

            // If Canvg is available globally (from CDN script)
            if (typeof Canvg !== 'undefined') {
                 // Using Canvg v5+ API (async)
                 const v = await Canvg.fromString(ctx, svgWithColor, {
                     offsetX: offsetX,
                     offsetY: offsetY,
                     scaleWidth: drawWidth,
                     scaleHeight: drawHeight,
                     ignoreClear: true, // Don't clear the main canvas
                     useCORS: true // In case paths use external resources (not applicable here, but good practice)
                 });
                 await v.render(); // Await the rendering completion
                 this.canvgInstance = v; // Cache instance? Maybe not needed per frame.
            } else {
                console.error("Canvg library not loaded.");
                // Fallback: draw a circle?
                ctx.beginPath();
                ctx.arc(0, 0, this.radius, 0, TWO_PI);
                ctx.strokeStyle = 'red'; // Indicate error
                ctx.lineWidth = 1;
                ctx.stroke();
            }

        } catch (e) {
            console.error('Error rendering SVG for asteroid:', e, this.svgString);
            // Optional: Draw fallback shape on error
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, TWO_PI);
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 1;
            ctx.stroke();
        } finally {
           this.isRendering = false; // Reset flag
           ctx.restore();
        }
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
    
    console.log("Fetching leaderboard data...");
    
    try {
        // Add a timeout to the fetch to prevent long hangs
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5-second timeout
        
        const response = await fetch('/api/leaderboard', {
            signal: controller.signal,
            cache: 'no-store', // Prevent caching issues
            headers: {
                'Accept': 'application/json'
            }
        });
        
        // Clear the timeout
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            console.warn(`Leaderboard API returned error status: ${response.status}`);
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Leaderboard data received:", data.length ? `${data.length} entries` : "Empty array");
        
        // Debug the first entry if available
        if (data.length > 0) {
            console.log("First entry:", JSON.stringify(data[0]));
        }
        
        leaderboardData = data;
    } catch (error) {
        console.error("Failed to fetch leaderboard:", error);
        leaderboardError = error.message;
    } finally {
        isFetchingLeaderboard = false;
        console.log("Leaderboard fetch completed. Success:", !leaderboardError);
    }
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

    // --- Increment Global Games Played Count ---
    fetch('/api/incrementGamesPlayed', { method: 'POST' })
        .then(response => {
            if (!response.ok) {
                console.error('Failed to increment games played count on server.');
            } else {
                console.log('Successfully triggered server-side games played increment.');
                // Optionally parse response if needed: response.json().then(data => console.log(data));
            }
        })
        .catch(error => {
            console.error('Network error trying to increment games played count:', error);
        });
    // Note: We don't wait for this fetch to finish before starting the game.
    // We also don't update the local gamesPlayedCount here, it will be fetched next time.

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
    console.log("Initializing game...");

    // Fetch GLOBAL games played count
    fetchGamesPlayed();

    // Fetch leaderboard data right away
    fetchLeaderboard();

    // Set canvas dimensions
    resizeCanvas();

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

// --- Resize Canvas Function ---
function resizeCanvas() {
    console.log("Resizing canvas to fit window...");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Redraw the appropriate screen based on game state
    if (!isGameStarted) {
        drawStartScreen();
    } else if (isHelpScreenVisible) {
        drawHelpScreen();
    }
}

// --- Initialize and Start Loop --- 


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

// --- Fetch Games Played Count ---
async function fetchGamesPlayed() {
    console.log("Fetching global games played count...");
    try {
        const response = await fetch('/api/gamesPlayed');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (typeof data.count === 'number') {
            gamesPlayedCount = data.count;
            console.log(`Global games played count: ${gamesPlayedCount}`);
        } else {
            console.warn('Received invalid count from API.');
            gamesPlayedCount = 0; // Fallback
        }
    } catch (error) {
        console.error("Failed to fetch games played count:", error);
        gamesPlayedCount = 0; // Fallback on error
    }
    // No explicit redraw needed here, drawStartScreen will use the updated value
}

initGame();
requestAnimationFrame(updateGame);

