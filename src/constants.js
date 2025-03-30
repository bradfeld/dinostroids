/**
 * Game Constants
 * 
 * This file contains all the constants used throughout the game.
 * Centralizing these values makes it easier to tweak game parameters.
 */

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
        playerAcceleration: PLAYER_ACCELERATION,
        shootCooldown: SHOOT_COOLDOWN,
        asteroidMinSpeed: ASTEROID_MIN_SPEED,
        asteroidSpeedVariation: ASTEROID_SPEED_VARIATION,
        initialAsteroidCountBase: 2,
        lives: 5
    },
    medium: {
        playerAcceleration: PLAYER_ACCELERATION * 1.5,
        shootCooldown: Math.floor(SHOOT_COOLDOWN * 0.7),
        asteroidMinSpeed: ASTEROID_MIN_SPEED * 1.5,
        asteroidSpeedVariation: ASTEROID_SPEED_VARIATION * 1.2,
        initialAsteroidCountBase: 3,
        lives: 3
    },
    difficult: {
        playerAcceleration: PLAYER_ACCELERATION * 2.0,
        shootCooldown: Math.floor(SHOOT_COOLDOWN * 0.5),
        asteroidMinSpeed: ASTEROID_MIN_SPEED * 2.0,
        asteroidSpeedVariation: ASTEROID_SPEED_VARIATION * 1.5,
        initialAsteroidCountBase: 4,
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

// Image paths
export const DINO_IMAGES = {
    small: './images/bront.png',
    medium: './images/steg.png',
    large: './images/trex.png'
}; 