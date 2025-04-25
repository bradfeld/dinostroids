# Dinostroids

A classic arcade-style shooter game built with HTML Canvas and pure JavaScript. Pilot your spaceship, dodge and destroy waves of incoming dinosaur-shaped asteroids!

Written entirely by vibe coding using Cursor and gemini-2.5.-pro-exp-03-25 with assists from claude-3.7-sonnet and claude-3.5-sonnet. Well, not entirely.

Inspiration and emotional support from Quinn McIntyre.

## Gameplay

*   **Objective:** Survive as long as possible by shooting asteroids and avoiding collisions.
*   **Asteroids:** Destroy large asteroids (T-Rex), which break into medium ones (Pterodactyl), which break into small ones (Sauropod). Smaller asteroids are worth more points.
*   **Scoring:** Earn points for each asteroid destroyed.
*   **Levels:** Clear all asteroids on the screen to advance to the next level, which introduces more asteroids.
*   **Lives:** You start with a set number of lives. Lose a life if an asteroid hits your ship. Gain an extra life every 10,000 points.
*   **Game Over:** The game ends when you run out of lives.
*   **Difficulty Levels:** Choose between Easy, Medium, or Difficult modes, which affect asteroid speed, quantity, and player lives.

## Controls

### Desktop Controls
*   **Movement:** Arrow Keys
*   **Shoot:** `Spacebar`
*   **Start Game:** `Enter/Return`
*   **Help Screen:** `?`
*   **End Game:** `Esc`
*   **Hyperspace:** `H` (teleports your ship to a random location)

### Mobile Controls
*   **Movement:** Left/Right buttons on the bottom left
*   **Thrust:** Button on the bottom right
*   **Shoot:** Button on the bottom right
*   **Hyperspace:** Button above the bottom right controls

## How to Play

1.  Clone or download this repository.
2.  Open the `index.html` file in your web browser.
3.  Select a difficulty level (Easy, Medium, or Difficult).
4.  Press `Enter` or tap your selected difficulty to start the game.

## Directory Structure

```
/
├── api/                    # Server API endpoints
│   ├── gamesPlayed.js      # Tracks total games played
│   ├── incrementGamesPlayed.js # Increments games counter
│   └── leaderboard.js      # High score management
├── public/                 # Static assets
├── src/                    # Source code
│   ├── controllers/        # Game controllers
│   │   ├── game.js         # Main game logic
│   │   └── input.js        # Input handling
│   ├── entities/           # Game entities
│   │   ├── asteroid.js     # Asteroid implementation
│   │   ├── bullet.js       # Bullet implementation
│   │   └── player.js       # Player ship implementation
│   ├── services/           # Service modules
│   │   ├── api.js          # API client for server interaction
│   │   ├── images.js       # Image loading service
│   │   └── vectorDinos.js  # Vector graphics for dinosaurs
│   ├── ui/                 # User interface components
│   │   ├── gameOver.js     # Game over screen
│   │   ├── gameStatus.js   # In-game status display
│   │   ├── helpScreen.js   # Help/instructions screen
│   │   ├── leaderboard.js  # Leaderboard display
│   │   ├── mobileControls.js # Mobile control overlay
│   │   └── startScreen.js  # Game start screen
│   ├── utils/              # Utility functions
│   │   └── device.js       # Device detection
│   ├── canvas.js           # Canvas setup and management
│   ├── constants.js        # Game constants and settings
│   ├── index.js            # Application entry point
│   └── utils.js            # General utility functions
├── index.html              # Main HTML file
└── README.md               # Project documentation
```

Enjoy! 