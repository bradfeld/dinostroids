/**
 * Game Constants
 * 
 * This file contains all the constants used throughout the game.
 * Centralizing these values makes it easier to tweak game parameters.
 */

// Game settings
export const GAME_SETTINGS = {
  FPS: 60,
  INITIAL_LIVES: 3,
  LEVEL_MULTIPLIER: 0.5,
  INITIAL_ASTEROIDS: 4,
  ASTEROID_INCREMENT_PER_LEVEL: 2,
  EXTRA_LIFE_SCORE_THRESHOLD: 10000,
  FRAME_DURATION: 1000 / 60, // milliseconds per frame at 60 FPS
  SPAWN_BUFFER: 100 // Distance from player to avoid spawning asteroids
};

// Player settings
export const PLAYER_SETTINGS = {
  RADIUS: 15,
  ROTATION_SPEED: 4, // radians per second
  ACCELERATION: 200, // pixels per second per second
  FRICTION: 0.98,
  INVINCIBILITY_TIME: 3000, // milliseconds
  SHOOT_COOLDOWN: 250 // milliseconds
};

// Bullet settings
export const BULLET_SETTINGS = {
  RADIUS: 2,
  SPEED: 500, // pixels per second
  LIFESPAN: 1000 // milliseconds
};

// Asteroid settings
export const ASTEROID_SETTINGS = {
  BASE_RADIUS: 50, // For size 1 (largest)
  SPEED_MULTIPLIER: 50, // pixels per second
  ROTATION_SPEED: 1, // radians per second
  POINTS_BASE: 100, // Points multiplied by size
  COLLISION_DAMAGE: 1, // Lives lost when hit
  SPAWN_DISTANCE_MIN: 100, // Minimum distance from player to spawn
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

// Image paths
export const IMAGES = {
  // Map of image keys to file paths
  bront: './images/bront.png',
  steg: './images/steg.png',
  trex: './images/trex.png'
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