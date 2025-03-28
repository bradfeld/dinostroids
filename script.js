import { inject } from '@vercel/analytics';

inject();

// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas dimensions to fill the window
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// --- Constants ---
const TWO_PI = Math.PI * 2;
const PLAYER_SIZE = 20;
const PLAYER_ROTATION_SPEED = 0.05;
const PLAYER_ACCELERATION = 0.1;
const PLAYER_FRICTION = 0.98;
const BULLET_SPEED = 7;
const BULLET_RADIUS = 3;
const SHOOT_COOLDOWN = 150; // milliseconds
const ASTEROID_SPAWN_INTERVAL = 1800; // milliseconds
const ASTEROID_BASE_SIZE = 40; // Average size
const ASTEROID_SIZE_VARIATION = 20; // Max deviation from base size
const ASTEROID_MIN_SPEED = 0.5;
const ASTEROID_SPEED_VARIATION = 1.5;
const LEADERBOARD_MAX_ENTRIES = 20; // Match API

// --- Difficulty Settings --- //
const difficultySettings = {
    easy: {
        playerAcceleration: 0.15,
        shootCooldown: 120,
        asteroidMinSpeed: 0.4,
        asteroidSpeedVariation: 1.0,
        initialAsteroidCountBase: 2,
        lives: 5,
    },
    medium: {
        playerAcceleration: PLAYER_ACCELERATION, // Use original constant
        shootCooldown: SHOOT_COOLDOWN,       // Use original constant
        asteroidMinSpeed: ASTEROID_MIN_SPEED,      // Use original constant
        asteroidSpeedVariation: ASTEROID_SPEED_VARIATION, // Use original constant
        initialAsteroidCountBase: 3,
        lives: 3,
    },
    difficult: {
        playerAcceleration: 0.08,
        shootCooldown: 180,
        asteroidMinSpeed: 0.7,
        asteroidSpeedVariation: 2.0,
        initialAsteroidCountBase: 4,
        lives: 2,
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
// Define vertices relative to center (0,0) and scaled roughly to 1 unit radius
const DINO_SHAPES = [
    // Shape 1: Sauropod-like
    [
        {x: 0.8, y: -0.6}, {x: 1, y: -0.4}, {x: 0.9, y: 0}, {x: 0.5, y: 0.3}, // Head/Neck
        {x: 0.2, y: 0.8}, {x: -0.5, y: 0.7}, {x: -1, y: 0.5}, // Body/Tail
        {x: -0.8, y: 0}, {x: -0.9, y: -0.3}, // Under Tail / Back Leg
        {x: -0.4, y: -0.6}, // Back Leg Bottom
        {x: 0, y: -0.7}, // Belly
        {x: 0.3, y: -0.6}, // Front Leg
        {x: 0.6, y: -0.8} // Back to Neck Start
    ],
    // Shape 2: T-Rex-like (simplified)
    [
        {x: 0.5, y: -0.9}, {x: 0.9, y: -0.7}, {x: 0.6, y: -0.2}, {x: 0.9, y: 0.1}, // Head
        {x: 0.5, y: 0.3}, // Neck
        {x: 0.4, y: 0.8}, {x: -0.3, y: 0.9}, {x: -0.8, y: 0.6}, // Body/Tail
        {x: -1.0, y: 0.0}, {x: -0.8, y: -0.3}, // Tail bottom / Leg top
        {x: -0.9, y: -0.6}, {x: -0.7, y: -0.7}, // Leg bottom
        {x: -0.3, y: -0.6}, // Underbelly
        {x: 0.2, y: -0.3}, {x: 0.3, y: -0.5}, // Arm
        {x: 0.1, y: -0.8} // Chest back to neck
    ],
     // Shape 3: Pterodactyl-like (simplified)
    [
        {x: 0.4, y: -0.8}, {x: 0.8, y: -0.6}, {x: 1.0, y: -0.7}, {x: 0.6, y: 0}, // Head/Beak
        {x: 0.8, y: 0.4}, // Neck/Body top
        {x: 0.3, y: 0.1}, // Wing Joint
        {x: 0.9, y: 0.9}, {x: 0.5, y: 1.0}, {x: 0.0, y: 0.5}, // Outer Wing Top
        {x: -0.6, y: 0.8}, {x: -1.0, y: 0.6}, {x: -0.7, y: 0.1}, // Back wing edge
        {x: -0.5, y: 0.3}, // Body back
        {x: -0.6, y: -0.5}, {x: -0.4, y: -0.6}, // Legs
        {x: 0, y: -0.3} // Body Bottom
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
  lastShotTime: 0
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
    constructor(type, x, y, speedX, speedY, sizeVariation = 0) {
        this.type = type;
        this.x = x;
        this.y = y;
        const props = ASTEROID_PROPERTIES[type];
        // Apply variation only if provided (e.g., for initial big ones)
        this.size = props.baseSize + (Math.random() * sizeVariation * 2) - sizeVariation;
        this.scoreValue = props.score;
        this.speedX = speedX;
        this.speedY = speedY;
        this.rotation = Math.random() * TWO_PI; // Random initial rotation
        this.rotationSpeed = (Math.random() - 0.5) * 0.02; // Random rotation speed

        // Assign shape based on type
        switch (this.type) {
            case ASTEROID_TYPE.BIG: // T-Rex
                this.vertices = DINO_SHAPES[1];
                break;
            case ASTEROID_TYPE.MEDIUM: // Pterodactyl (used instead of Stegosaurus)
                this.vertices = DINO_SHAPES[2];
                break;
            case ASTEROID_TYPE.LITTLE: // Sauropod/Brontosaurus
                this.vertices = DINO_SHAPES[0];
                break;
            default: // Fallback to random if type is unknown (shouldn't happen)
                this.vertices = DINO_SHAPES[Math.floor(Math.random() * DINO_SHAPES.length)];
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        ctx.beginPath();
        // Start at the first vertex, scaled by size
        ctx.moveTo(this.vertices[0].x * this.size, this.vertices[0].y * this.size);
        // Draw lines to subsequent vertices
        for (let i = 1; i < this.vertices.length; i++) {
            ctx.lineTo(this.vertices[i].x * this.size, this.vertices[i].y * this.size);
        }
        ctx.closePath(); // Connect the last vertex back to the first

        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();

        // Optional: Draw collision circle for debugging
        /*
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, TWO_PI);
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 1;
        ctx.stroke();
        */
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.rotation += this.rotationSpeed;

        // Wrap around the screen
        if (this.x < -this.size) this.x = canvas.width + this.size;
        if (this.x > canvas.width + this.size) this.x = -this.size;
        if (this.y < -this.size) this.y = canvas.height + this.size;
        if (this.y > canvas.height + this.size) this.y = -this.size;
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
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, TWO_PI);
    ctx.fillStyle = 'white';
    ctx.fill();
  }

  update() {
    this.x += Math.cos(this.angle) * this.speed;
    this.y += Math.sin(this.angle) * this.speed;
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

function spawnAsteroid(type, x, y, baseSpeedX = null, baseSpeedY = null) {
    const variation = type === ASTEROID_TYPE.BIG ? ASTEROID_INITIAL_SIZE_VARIATION : 0;
    const props = ASTEROID_PROPERTIES[type];

    // If position not provided, spawn at edges (for initial level start)
    if (x === undefined || y === undefined) {
        const sizeForEdge = props.baseSize + variation;
        if (Math.random() < 0.5) {
            x = Math.random() < 0.5 ? -sizeForEdge : canvas.width + sizeForEdge;
            y = Math.random() * canvas.height;
        } else {
            x = Math.random() * canvas.width;
            y = Math.random() < 0.5 ? -sizeForEdge : canvas.height + sizeForEdge;
        }
    }

    let speedX, speedY;
    if (baseSpeedX !== null && baseSpeedY !== null) {
        // Splitting: Inherit base speed and add a random component
        const splitAngle = Math.random() * TWO_PI;
        const splitSpeedBoost = 0.5 + Math.random() * 0.5;
        speedX = baseSpeedX + Math.cos(splitAngle) * splitSpeedBoost;
        speedY = baseSpeedY + Math.sin(splitAngle) * splitSpeedBoost;
    } else {
        // Initial spawn: Use current difficulty settings for speed
        const angle = Math.random() * TWO_PI;
        const speed = currentAsteroidMinSpeed + Math.random() * currentAsteroidSpeedVariation;
        speedX = Math.cos(angle) * speed;
        speedY = Math.sin(angle) * speed;
    }

    // Create the asteroid - will assign shape later
    asteroids.push(new Asteroid(type, x, y, speedX, speedY, variation));
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
      requestAnimationFrame(updateGame); // Keep animation loop running
      return;
  }

  // Priority 2: Start Screen (now includes leaderboard)
  if (!isGameStarted) {
      drawStartScreen(); // Always draw start screen when game not started
      requestAnimationFrame(updateGame); // Keep animation loop running
      return;
  }

  // Priority 3: Game Over Screen - handled implicitly by gameOver setting gameRunning = false
  // No need for explicit check here, gameOver draws its screen then calls initGame

  // --- Game is running --- (Original updateGame logic)
  // --- Input ---
  if (keys['ArrowLeft']) {
    player.angle -= player.rotationSpeed;
  }
  if (keys['ArrowRight']) {
    player.angle += player.rotationSpeed;
  }
  if (keys['ArrowUp']) {
    // Apply thrust based on player angle
    player.speed += player.acceleration;
  } else {
      // Apply friction only when not accelerating
      player.speed *= player.friction;
  }

  // Shooting with cooldown
  if (keys[' '] && player.canShoot) {
    // Calculate bullet start position at the tip of the ship
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
  // Player
  player.x += Math.cos(player.angle) * player.speed;
  player.y += Math.sin(player.angle) * player.speed;
  wrapAround(player);

  // Bullets
  for (let i = bullets.length - 1; i >= 0; i--) {
    bullets[i].update();
    // Remove bullets that are out of bounds
    if (bullets[i].x < 0 || bullets[i].x > canvas.width || bullets[i].y < 0 || bullets[i].y > canvas.height) {
      bullets.splice(i, 1);
    }
  }

  // Asteroids
  for (let i = asteroids.length - 1; i >= 0; i--) {
    asteroids[i].update();
  }

  // --- Collision Detection ---
  for (let i = asteroids.length - 1; i >= 0; i--) {
    // Player-Asteroid Collision (Use lives)
    if (checkCollision(player, asteroids[i])) {
        lives--;
        asteroids.splice(i, 1);
        if (lives <= 0) {
            gameOver();
            return;
        } else {
            player.x = canvas.width / 2;
            player.y = canvas.height / 2;
            player.speed = 0;
            player.angle = -Math.PI / 2;
            break; // Avoid multiple hits in one frame
        }
    }

    // Bullet-Asteroid Collision (Implement Splitting)
    for (let j = bullets.length - 1; j >= 0; j--) {
        if (!asteroids[i]) break; // Check asteroid exists

        if (checkCollision(bullets[j], asteroids[i])) {
            const hitAsteroid = asteroids[i];
            const scoreBefore = score; // Store score before adding points
            score += hitAsteroid.scoreValue;

            // --- Bonus Life Check ---
            if (Math.floor(scoreBefore / 10000) < Math.floor(score / 10000)) {
                lives++;
                // Cap lives at the max for the current difficulty? Optional.
                // if (lives > currentMaxLives) lives = currentMaxLives;
                console.log('Awarded bonus life at', Math.floor(score / 10000) * 10000, 'points!'); // Optional: Log bonus life
            }

            // --- Splitting Logic ---
            if (hitAsteroid.type === ASTEROID_TYPE.BIG) {
                spawnAsteroid(ASTEROID_TYPE.MEDIUM, hitAsteroid.x, hitAsteroid.y, hitAsteroid.speedX, hitAsteroid.speedY);
                // spawnAsteroid(ASTEROID_TYPE.MEDIUM, hitAsteroid.x, hitAsteroid.y, hitAsteroid.speedX, hitAsteroid.speedY); // Optional second one
            } else if (hitAsteroid.type === ASTEROID_TYPE.MEDIUM) {
                spawnAsteroid(ASTEROID_TYPE.LITTLE, hitAsteroid.x, hitAsteroid.y, hitAsteroid.speedX, hitAsteroid.speedY);
            }

            asteroids.splice(i, 1);
            bullets.splice(j, 1);
            break;
        }
    }
  }

  // Check for level clear
  if (gameRunning && asteroids.length === 0) {
      level++;
      startLevel();
  }

  // --- Drawing ---
  ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas

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

  // Draw player
  drawPlayer();

  // Draw bullets
  for (const bullet of bullets) {
    bullet.draw();
  }

  // Draw asteroids (dinosaurs)
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
    ctx.fillStyle = 'black'; // Ensure black background
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Set text style
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';

    const centerX = canvas.width / 2;
    const topMargin = 60;
    const titleY = topMargin;
    const startPromptY = titleY + 60;
    const helpY = startPromptY + 40;
    const leaderboardTitleY = helpY + 60;
    const leaderboardStartY = leaderboardTitleY + 40;
    const lineHeight = 25; // Smaller line height for leaderboard entries

    // Title
    ctx.font = '48px Arial';
    ctx.textBaseline = 'top';
    ctx.fillText('Dinostroids', centerX, titleY); // Renamed

    // Start prompt - CHANGED
    ctx.font = '26px Arial'; // Slightly smaller for difficulty
    ctx.fillText('Select Difficulty:', centerX, startPromptY);
    ctx.font = '22px Arial';
    ctx.fillText('E)asy   M)edium   D)ifficult', centerX, startPromptY + 40);

    // Help hint
    ctx.font = '20px Arial';
    ctx.fillText('? for Help', centerX, helpY + 20); // Adjusted Y

    // --- Leaderboard Display --- //
    ctx.font = '24px Arial';
    ctx.fillText('Top Scores', centerX, leaderboardTitleY + 20); // Adjusted Y

    ctx.font = '16px Arial';
    ctx.textBaseline = 'top'; // Align leaderboard text from the top
    if (isFetchingLeaderboard) {
        ctx.fillText('Loading...', centerX, leaderboardStartY);
    } else if (leaderboardError) {
        ctx.fillText(`Error loading scores: ${leaderboardError}`, centerX, leaderboardStartY);
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
        ctx.textAlign = 'left'; // Reset for date
        ctx.fillText('Date', dateX, headerY);

        // Draw entries
        ctx.font = '14px Arial';
        leaderboardData.forEach((entry, index) => {
            if (index >= LEADERBOARD_MAX_ENTRIES) return; // Should be handled by API, but safe check
            const yPos = headerY + lineHeight * (index + 1.5); // Start 1.5 lines below header
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
        });
    } else {
        ctx.fillText('No scores yet! Be the first!', centerX, leaderboardStartY);
    }

    // Copyright
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom'; // Align copyright to bottom
    ctx.fillText('(c) Dinostroids, 2025', centerX, canvas.height - 20); // Renamed
}

// --- Set Difficulty Function ---
function setDifficulty(difficulty) {
    currentDifficulty = difficulty;
    const settings = difficultySettings[difficulty];

    currentAcceleration = settings.playerAcceleration;
    currentShootCooldown = settings.shootCooldown;
    currentAsteroidMinSpeed = settings.asteroidMinSpeed;
    currentAsteroidSpeedVariation = settings.asteroidSpeedVariation;
    currentInitialAsteroidCountBase = settings.initialAsteroidCountBase;
    currentMaxLives = settings.lives;

    // Apply initial lives based on difficulty for the new game
    lives = currentMaxLives;
    console.log(`Difficulty set to: ${difficulty}`);
}

// --- Start the Game Logic ---
function startGame() {
    if (isGameStarted) return; // Prevent multiple starts

    // Difficulty and lives are set by setDifficulty() before calling startGame
    isGameStarted = true;
    gameRunning = true;
    score = 0; // Reset score
    level = 1; // Start at level 1

    // Reset player state
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    player.speed = 0;
    player.angle = -Math.PI / 2;

    // Clear entities
    bullets = [];
    asteroids = [];

    startLevel(); // Spawn initial asteroids for level 1
}

// --- Initialization (Setup but doesn't start) ---
function initGame() {
    // Reset core game state variables
    score = 0;
    lives = 3;
    level = 1;
    // gameRunning = true; // DO NOT set to true here, needs Enter press
    isGameStarted = false; // Start screen should show first
    isHelpScreenVisible = false;
    // isLeaderboardVisible = false; // REMOVED
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    player.speed = 0;
    player.angle = -Math.PI / 2;
    bullets = [];
    asteroids = []; // Clear any potential leftover asteroids

    // Fetch leaderboard data for the start screen
    fetchLeaderboard();
}

// --- Level Handling ---
function startLevel() {
    // Spawn new BIG asteroids based on the level and difficulty
    const numAsteroids = currentInitialAsteroidCountBase + level;
    asteroids = []; // Clear existing asteroids
    for (let i = 0; i < numAsteroids; i++) {
        // Pass current speed settings to spawnAsteroid if needed, or modify spawnAsteroid itself
        spawnAsteroid(ASTEROID_TYPE.BIG);
    }
}

// Add resize listener
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // You might want to reposition the player if the canvas resizes significantly
    // player.x = canvas.width / 2;
    // player.y = canvas.height / 2;
});

// Initialize game state variables (will fetch leaderboard)
initGame();

// Start the animation loop - it will initially draw the start screen
requestAnimationFrame(updateGame);
