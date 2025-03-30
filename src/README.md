# Dinostroids Source Code Structure

This directory contains the modular source code for the Dinostroids game.

## Directory Structure

```
/src
├── index.js           # Main entry point
├── constants.js       # Game constants and configuration
├── utils.js           # Utility functions
├── canvas.js          # Canvas handling
├── entities/
│   ├── player.js      # Player class
│   ├── asteroid.js    # Asteroid class
│   └── bullet.js      # Bullet class
├── services/
│   ├── api.js         # API handling for leaderboard, etc.
│   └── images.js      # Image loading service
├── controllers/
│   ├── game.js        # Game state management
│   ├── input.js       # Input handling
│   └── collision.js   # Collision detection
└── ui/
    ├── screens.js     # Game screens (start, help, game over)
    └── hud.js         # Heads-up display elements
```

## Module Responsibilities

### Core Modules

- **index.js**: Entry point that initializes the game
- **constants.js**: Contains all game constants and configuration settings
- **utils.js**: Utility functions used throughout the game
- **canvas.js**: Handles canvas operations and rendering context

### Entities

- **player.js**: The player's ship class
- **asteroid.js**: Different asteroid types and behaviors
- **bullet.js**: Projectiles fired by the player

### Services

- **api.js**: Handles server communication for leaderboard and game stats
- **images.js**: Manages loading and caching of game images

### Controllers

- **game.js**: Controls game state, level progression, and core game loop
- **input.js**: Manages keyboard input and control mapping
- **collision.js**: Handles collision detection and response

### UI

- **screens.js**: Different game screens (start menu, help, game over)
- **hud.js**: In-game heads-up display elements

## Build Process

The build process uses esbuild to bundle all modules into a single file:

```bash
# Production build
npm run build

# Development with auto-reload
npm run dev
``` 