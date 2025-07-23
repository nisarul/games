# Multiplayer X-O Game 🎮

A modern, responsive web-based multiplayer X-O (Tic-Tac-Toe) game built with vanilla HTML, CSS, and JavaScript.

## Features ✨

### Core Gameplay
- **Local Multiplayer**: Two players take turns on the same device
- **Smart Win Detection**: Automatic win/draw detection with visual feedback
- **Score Tracking**: Persistent score keeping with localStorage
- **Auto Reset**: Games automatically reset after completion

### User Experience
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Modern UI**: Glassmorphism design with beautiful animations
- **Sound Effects**: Optional audio feedback for moves and wins
- **Keyboard Controls**: Use number keys 1-9 for moves, R to reset
- **Touch Support**: Optimized for touch devices with long-press reset

### Visual Features
- **Winning Animation**: Highlighting and pulsing effects for winning combinations
- **Player Indicators**: Clear current player display with color coding
- **Celebration Effects**: Special animations for wins and draws
- **Smooth Transitions**: Hover effects and scaling animations

## How to Play 🎯

1. **Start**: Player X goes first
2. **Make Moves**: Click on empty cells or use keyboard (1-9)
3. **Win Condition**: Get three in a row (horizontal, vertical, or diagonal)
4. **Reset**: Use the reset button or press 'R' on keyboard
5. **Scores**: Track wins and draws across multiple games

## Quick Start 🚀

1. Open `index.html` in any modern web browser
2. Start playing immediately - no setup required!
3. Share with friends for local multiplayer fun

## File Structure 📁

```
XO/
├── index.html          # Main game interface
├── styles.css          # Modern styling and animations
├── script.js           # Game logic and interactions
├── README.md           # This file
└── .github/
    └── copilot-instructions.md
```

## Technical Details 🔧

### Technologies Used
- **HTML5**: Semantic structure and accessibility
- **CSS3**: Modern styling with flexbox/grid, animations, and glassmorphism
- **JavaScript ES6+**: Class-based architecture, event handling, localStorage

### Browser Support
- Chrome/Edge 60+
- Firefox 55+
- Safari 12+
- Mobile browsers (iOS Safari, Chrome Mobile)

### Key Classes
- `XOGame`: Core game logic and state management
- `EnhancedXOGame`: Extended version with sound effects
- `SoundManager`: Web Audio API integration for game sounds
- `GameModes`: Placeholder for future multiplayer modes

## Future Enhancements 🔮

Ready for expansion with:
- **Online Multiplayer**: Socket.io integration planned
- **Team vs Team**: Multi-player team modes
- **AI Opponent**: Computer player with difficulty levels
- **Tournament Mode**: Bracket-style competitions
- **Custom Themes**: Different visual styles and color schemes
- **Statistics**: Detailed game analytics and history

## Development 👨‍💻

### Local Development
1. Clone or download the project
2. Open in VS Code or your preferred editor
3. Use Live Server extension or similar for live reload
4. Open `index.html` in browser

### Customization
- Modify `styles.css` for visual changes
- Update `script.js` for gameplay features
- All game settings are easily configurable in the class constructors

## Contributing 🤝

Feel free to contribute by:
- Adding new game modes
- Improving mobile experience
- Adding accessibility features
- Implementing online multiplayer
- Creating new themes and animations

## License 📄

This project is open source and available under the MIT License.

---

**Enjoy playing X-O with friends! 🎉**
