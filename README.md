# Dinostroids

A classic arcade-style shooter game built with HTML Canvas and pure JavaScript. Pilot your spaceship, dodge and destroy waves of incoming dinosaur-shaped asteroids!

Written entirely by vibe coding using Cursor and Claude-3.7-sonnet.

Inspiration and emotional support from Quinn McIntyre.

## Directory Structure

```
.
├── api                   # API endpoints for leaderboard and game stats
│   ├── gamesPlayed.js    # Endpoint to get games played count
│   ├── incrementGamesPlayed.js # Endpoint to increment games played count
│   └── leaderboard.js    # Endpoint for leaderboard data
├── public                # Static assets
├── src                   # Source code
│   ├── controllers       # Game controllers
│   │   ├── game.js       # Main game controller logic
│   │   └── input.js      # Input handling
│   ├── entities          # Game entities
│   │   ├── asteroid.js   # Asteroid entity
│   │   ├── bullet.js     # Bullet entity
│   │   └── player.js     # Player entity
│   ├── services          # Game services
│   │   ├── api.js        # API client
│   │   ├── images.js     # Image handling
│   │   └── vectorDinos.js # Vector dinosaur drawing
│   ├── ui                # User interface elements
│   │   ├── gameOver.js   # Game over screen
│   │   ├── gameStatus.js # Game status HUD
│   │   ├── helpScreen.js # Help screen
│   │   ├── leaderboard.js # Leaderboard UI
│   │   ├── mobileControls.js # Mobile touch controls
│   │   └── startScreen.js # Start screen
│   ├── utils             # Utility functions
│   │   └── device.js     # Device detection utilities
│   ├── canvas.js         # Canvas setup and management
│   ├── constants.js      # Game constants and settings
│   ├── index.js          # Entry point
│   └── utils.js          # General utility functions
├── index.html            # Main HTML file
└── bundle.js             # Bundled JavaScript
```

## Gameplay

*   **Objective:** Survive as long as possible by shooting dinostroids and avoiding collisions.
*   **Dinostroids:** Destroy large dinostroids which break into medium and small ones.
*   **Scoring:** Earn points for each dinostroid destroyed.
*   **Levels:** Clear all dinostroids on the screen to advance to the next level, which introduces more asteroids.
*   **Lives:** You start with a set number of lives. Lose a life if an dinostroid hits your ship. Gain an extra life every 10,000 points.
*   **Game Over:** The game ends when you run out of lives.
*   **Difficulty Levels:** Choose between Easy, Medium, or Difficult modes, which affect dinostroid speed, quantity, and player lives.

## Controls

### Desktop Controls
*   **Movement:** Arrow Keys
*   **Shoot:** `Spacebar`
*   **Start Game:** `Enter/Return`
*   **Pause:** `P`
    **Help Screen:** `?`
*   **End Game:** `Esc`
*   **Hyperspace:** `H` (teleports your ship to a random location)

### Mobile Controls
*   **Movement:** Left/Right buttons on the bottom left
*   **Thrust:** Button on the bottom right
*   **Shoot:** Button on the bottom right
*   **Hyperspace:** Button above the bottom right controls

## How to Play

The program, with a High Score leaderboard, is at https://dinostroids.com

## To Create Your Own Version

1.  Clone or download this repository.
2.  Open the `index.html` file in your web browser.
3.  Select a difficulty level (Easy, Medium, or Difficult).
4.  Press `Enter` or tap your selected difficulty to start the game.
