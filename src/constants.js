/**
 * Game Constants
 * 
 * This file contains all the constants used throughout the game.
 * Centralizing these values makes it easier to tweak game parameters.
 */

// Game settings
export const GAME_SETTINGS = {
  INITIAL_LIVES: 3,          // Number of player ships at start
  EXTRA_LIFE_SCORE_THRESHOLD: 10000,  // Score needed for an extra life
  STARTING_LEVEL: 1,         // Initial level
  ASTEROID_COUNT_INCREMENT: 2,  // Number of extra asteroids per level
  MAX_ASTEROIDS: 15          // Maximum number of asteroids on screen
};

// Player settings
export const PLAYER_SETTINGS = {
  RADIUS: 15,               // Radius for collision detection
  ROTATION_SPEED: 5,        // Rotation speed in radians per second
  ACCELERATION: 300,        // Acceleration in pixels per second squared
  FRICTION: 0.98,           // Friction coefficient (1 = no friction)
  SHOOT_COOLDOWN: 200,      // Cooldown between shots in milliseconds
  INVINCIBILITY_TIME: 3000  // Invincibility time after reset in milliseconds
};

// Bullet settings
export const BULLET_SETTINGS = {
  RADIUS: 2,                // Radius for collision detection
  SPEED: 800,               // Speed in pixels per second
  LIFESPAN: 1000            // Lifespan in milliseconds
};

// Asteroid settings
export const ASTEROID_SETTINGS = {
  BASE_RADIUS: 40,          // Base radius for large asteroids
  ROTATION_SPEED: 1,        // Rotation speed in radians per second
  SPAWN_DISTANCE_MIN: 200,  // Minimum distance from player to spawn 
  POINTS_BASE: 100,         // Base points for destroying an asteroid
  BREAK_VELOCITY_FACTOR: 1.2, // Velocity factor for broken pieces
  // Points awarded for destroying an asteroid based on size
  SCORE_VALUES: {
    1: 100, // Large
    2: 200, // Medium
    3: 300  // Small
  },
  // Available dino types
  TYPES: ['bront', 'steg', 'trex']
};

// UI settings
export const UI_SETTINGS = {
  FONT_FAMILY: 'Arial',
  TEXT_COLOR: 'white',
  TITLE_SIZE: 48,
  SUBTITLE_SIZE: 24,
  BODY_SIZE: 16,
  HUD_SIZE: 20
};

// Sound settings
export const SOUND_SETTINGS = {
  ENABLED: true,
  VOLUME: 0.5
};

// Keyboard controls
export const CONTROLS = {
  LEFT: 'ArrowLeft',
  RIGHT: 'ArrowRight',
  UP: 'ArrowUp',
  SHOOT: 'Space',
  START: 'Enter',
  HELP: 'KeyH',
  PAUSE: 'KeyP',
  MUTE: 'KeyM'
};

// API endpoints
export const API_ENDPOINTS = {
  GAMES_PLAYED: '/api/gamesPlayed',
  INCREMENT_GAMES_PLAYED: '/api/incrementGamesPlayed',
  LEADERBOARD: '/api/leaderboard'
};

// Animation settings
export const ANIMATION_SETTINGS = {
  EXPLOSION_DURATION: 500, // milliseconds
  SHIP_BLINK_RATE: 100 // milliseconds
};

// Math constants
export const TWO_PI = Math.PI * 2;
export const FRICTION = 0.98;

// Player constants
export const PLAYER_SIZE = 15;
export const PLAYER_ROTATION_SPEED = 0.07 * 3; // ~0.21
export const PLAYER_ACCELERATION = 0.18 * 3; // 0.54
export const PLAYER_FRICTION = 0.98;
export const INVINCIBILITY_TIME = 3000; // milliseconds

// Bullets constants
export const BULLET_RADIUS = 2;
export const BULLET_SPEED = 8;
export const BULLET_LIFESPAN = 50; // frames
export const SHOOT_COOLDOWN = 120; // milliseconds

// Asteroids constants
export const ASTEROID_MIN_SPEED = 0.6 * 3; // 1.8
export const ASTEROID_SPEED_VARIATION = 1.6 * 3; // 4.8
export const ASTEROID_INITIAL_SIZE_VARIATION = 15;

// Define asteroid sizes
export const ASTEROID_SIZES = {
    large: 45,
    medium: 25,
    small: 15
};

// Define asteroid speeds by difficulty
export const ASTEROID_SPEEDS = {
    easy: {
        large: { min: 1.5, max: 3.0 },
        medium: { min: 2.4, max: 4.5 },
        small: { min: 3.6, max: 6.0 }
    },
    medium: {
        large: { min: 2.4, max: 4.5 },
        medium: { min: 3.6, max: 6.0 },
        small: { min: 5.4, max: 7.5 }
    },
    difficult: {
        large: { min: 3.6, max: 6.0 },
        medium: { min: 5.4, max: 7.5 },
        small: { min: 7.5, max: 10.5 }
    }
};

// Leaderboard constants
export const LEADERBOARD_MAX_ENTRIES = 10;

// Difficulty settings
export const DIFFICULTY_SETTINGS = {
    easy: {
        shootCooldown: 120,        // Based on SHOOT_COOLDOWN
        asteroidSpeed: {
            large: { min: 1.5, max: 3.0 },
            medium: { min: 2.4, max: 4.5 },
            small: { min: 3.6, max: 6.0 }
        },
        initialAsteroids: 2,
        lives: 5
    },
    medium: {
        shootCooldown: 84,         // 70% of base cooldown
        asteroidSpeed: {
            large: { min: 2.4, max: 4.5 },
            medium: { min: 3.6, max: 6.0 },
            small: { min: 5.4, max: 7.5 }
        },
        initialAsteroids: 3,
        lives: 3
    },
    difficult: {
        shootCooldown: 60,         // 50% of base cooldown
        asteroidSpeed: {
            large: { min: 3.6, max: 6.0 },
            medium: { min: 5.4, max: 7.5 },
            small: { min: 7.5, max: 10.5 }
        },
        initialAsteroids: 4,
        lives: 2
    }
};

// Asteroid types
export const ASTEROID_TYPE = {
    BIG: 'BIG',
    MEDIUM: 'MEDIUM',
    LITTLE: 'LITTLE'
};

// Asteroid properties
export const ASTEROID_PROPERTIES = {
    [ASTEROID_TYPE.BIG]: { baseSize: 45, score: 20 },
    [ASTEROID_TYPE.MEDIUM]: { baseSize: 25, score: 50 },
    [ASTEROID_TYPE.LITTLE]: { baseSize: 15, score: 100 }
}; 