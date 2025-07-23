class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.statusElement = document.getElementById('gameStatus');
        
        // Game settings
        this.gridSize = 20;
        this.tileCount = this.canvas.width / this.gridSize;
        
        // Game state
        this.snake = [
            {x: 10, y: 10}
        ];
        this.food = {};
        this.dx = 0;
        this.dy = 0;
        this.score = 0;
        this.gameRunning = false;
        this.gameOver = false;
        
        // Nokia-style colors
        this.colors = {
            snake: '#2c3e50',
            food: '#e74c3c',
            background: '#9bb563',
            grid: '#8ba05b'
        };
        
        this.generateFood();
        this.setupEventListeners();
        this.draw();
    }
      setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            // Prevent default behavior for all game control keys
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
                e.preventDefault();
            }
            
            if (this.gameOver && e.code === 'KeyR') {
                this.restart();
                return;
            }
            
            if (e.code === 'Space') {
                this.toggleGame();
                return;
            }
            
            if (!this.gameRunning) return;
            
            // Prevent reverse direction
            switch(e.code) {
                case 'ArrowUp':
                    if (this.dy !== 1) {
                        this.dx = 0;
                        this.dy = -1;
                    }
                    break;
                case 'ArrowDown':
                    if (this.dy !== -1) {
                        this.dx = 0;
                        this.dy = 1;
                    }
                    break;
                case 'ArrowLeft':
                    if (this.dx !== 1) {
                        this.dx = -1;
                        this.dy = 0;
                    }
                    break;
                case 'ArrowRight':
                    if (this.dx !== -1) {
                        this.dx = 1;
                        this.dy = 0;
                    }
                    break;
            }
        });
    }
    
    toggleGame() {
        if (this.gameOver) {
            this.restart();
            return;
        }
        
        this.gameRunning = !this.gameRunning;
        
        if (this.gameRunning) {
            this.statusElement.textContent = 'Playing...';
            this.gameLoop();
        } else {
            this.statusElement.textContent = 'Paused - Press SPACE to continue';
        }
    }
    
    gameLoop() {
        if (!this.gameRunning || this.gameOver) return;
        
        setTimeout(() => {
            this.update();
            this.draw();
            this.gameLoop();
        }, 150); // Nokia snake speed
    }
    
    update() {
        if (this.dx === 0 && this.dy === 0) return;
        
        const head = {x: this.snake[0].x + this.dx, y: this.snake[0].y + this.dy};
        
        // Check wall collision
        if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
            this.endGame();
            return;
        }
        
        // Check self collision
        for (let segment of this.snake) {
            if (head.x === segment.x && head.y === segment.y) {
                this.endGame();
                return;
            }
        }
        
        this.snake.unshift(head);
        
        // Check food collision
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.scoreElement.textContent = this.score;
            this.generateFood();
            
            // Play a simple beep sound effect (if audio context is available)
            this.playEatSound();
        } else {
            this.snake.pop();
        }
    }
    
    generateFood() {
        this.food = {
            x: Math.floor(Math.random() * this.tileCount),
            y: Math.floor(Math.random() * this.tileCount)
        };
        
        // Make sure food doesn't spawn on snake
        for (let segment of this.snake) {
            if (segment.x === this.food.x && segment.y === this.food.y) {
                this.generateFood();
                break;
            }
        }
    }
    
    draw() {
        // Clear canvas with background color
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw subtle grid (Nokia style)
        this.drawGrid();
        
        // Draw snake
        this.ctx.fillStyle = this.colors.snake;
        for (let segment of this.snake) {
            this.ctx.fillRect(
                segment.x * this.gridSize + 1,
                segment.y * this.gridSize + 1,
                this.gridSize - 2,
                this.gridSize - 2
            );
        }
        
        // Draw food
        this.ctx.fillStyle = this.colors.food;
        this.ctx.fillRect(
            this.food.x * this.gridSize + 1,
            this.food.y * this.gridSize + 1,
            this.gridSize - 2,
            this.gridSize - 2
        );
        
        // Add a small highlight to food to make it more visible
        this.ctx.fillStyle = '#ff6b6b';
        this.ctx.fillRect(
            this.food.x * this.gridSize + 3,
            this.food.y * this.gridSize + 3,
            this.gridSize - 6,
            this.gridSize - 6
        );
    }
    
    drawGrid() {
        this.ctx.strokeStyle = this.colors.grid;
        this.ctx.lineWidth = 0.5;
        
        for (let i = 0; i <= this.tileCount; i++) {
            // Vertical lines
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.gridSize, 0);
            this.ctx.lineTo(i * this.gridSize, this.canvas.height);
            this.ctx.stroke();
            
            // Horizontal lines
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.gridSize);
            this.ctx.lineTo(this.canvas.width, i * this.gridSize);
            this.ctx.stroke();
        }
    }
    
    endGame() {
        this.gameOver = true;
        this.gameRunning = false;
        this.statusElement.textContent = `Game Over! Score: ${this.score} - Press R to restart`;
        this.statusElement.classList.add('blink');
        
        // Play game over sound
        this.playGameOverSound();
    }
    
    restart() {
        this.snake = [{x: 10, y: 10}];
        this.dx = 0;
        this.dy = 0;
        this.score = 0;
        this.gameOver = false;
        this.gameRunning = false;
        this.scoreElement.textContent = '0';
        this.statusElement.textContent = 'Press SPACE to start';
        this.statusElement.classList.remove('blink');
        this.generateFood();
        this.draw();
    }
    
    // Simple sound effects using Web Audio API
    playEatSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (e) {
            // Silently fail if Web Audio API is not supported
        }
    }
    
    playGameOverSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(150, audioContext.currentTime + 0.5);
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (e) {
            // Silently fail if Web Audio API is not supported
        }
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const game = new SnakeGame();
});
