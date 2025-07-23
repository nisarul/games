// WebRTC Multiplayer Manager
class WebRTCMultiplayer {
    constructor(game) {
        this.game = game;
        this.peer = null;
        this.connection = null;
        this.isHost = false;
        this.isConnected = false;
        this.roomCode = '';
        this.playerSymbol = '';
        
        this.initializePeer();
    }
    
    initializePeer() {
        // Using free PeerJS cloud service
        this.peer = new Peer({
            config: {
                'iceServers': [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' }
                ]
            }
        });
        
        this.peer.on('open', (id) => {
            console.log('Peer ID:', id);
        });
        
        this.peer.on('connection', (conn) => {
            this.connection = conn;
            this.setupConnection();
            this.showStatus('Player connected! Starting game...', 'connected');
            setTimeout(() => {
                this.startOnlineGame();
            }, 1000);
        });
        
        this.peer.on('error', (error) => {
            console.error('Peer error:', error);
            this.showStatus('Connection error. Please try again.', 'error');
        });
    }
    
    createGame() {
        if (!this.peer || !this.peer.id) {
            this.showStatus('Initializing... Please wait.', 'connecting');
            setTimeout(() => this.createGame(), 1000);
            return;
        }
        
        this.isHost = true;
        this.playerSymbol = 'X';
        this.roomCode = this.generateRoomCode();
        
        // Map room code to peer ID (simplified - in production use a proper signaling server)
        const mappedId = this.peer.id;
        
        document.getElementById('room-code').textContent = this.roomCode;
        document.getElementById('room-code-display').style.display = 'block';
        this.showStatus('Waiting for player to join...', 'connecting');
        
        // Store mapping in a simple way (this is a demo - use proper signaling server in production)
        this.storeRoomMapping(this.roomCode, mappedId);
    }
    
    joinGame(roomCode) {
        if (!roomCode || roomCode.length !== 8) {
            this.showStatus('Please enter a valid 8-character room code.', 'error');
            return;
        }
        
        this.isHost = false;
        this.playerSymbol = 'O';
        this.roomCode = roomCode.toUpperCase();
        
        this.showStatus('Connecting to game...', 'connecting');
        
        // Get peer ID from room code (simplified)
        this.getRoomMapping(this.roomCode).then(hostPeerId => {
            if (hostPeerId) {
                this.connection = this.peer.connect(hostPeerId);
                this.setupConnection();
            } else {
                this.showStatus('Room not found. Check the code and try again.', 'error');
            }
        });
    }
    
    setupConnection() {
        this.connection.on('open', () => {
            this.isConnected = true;
            this.showStatus('Connected! Game starting...', 'connected');
            setTimeout(() => {
                this.startOnlineGame();
            }, 1000);
        });
        
        this.connection.on('data', (data) => {
            this.handleRemoteMove(data);
        });
        
        this.connection.on('close', () => {
            this.isConnected = false;
            this.showStatus('Player disconnected.', 'error');
            this.game.gameActive = false;
        });
        
        this.connection.on('error', (error) => {
            console.error('Connection error:', error);
            this.showStatus('Connection failed. Please try again.', 'error');
        });
    }
    
    startOnlineGame() {
        document.getElementById('online-setup').style.display = 'none';
        document.getElementById('game-area').style.display = 'block';
        document.getElementById('game-mode-text').textContent = `Online Game - You are ${this.playerSymbol}`;
        
        this.game.resetGame();
        this.game.isOnline = true;
        this.game.playerSymbol = this.playerSymbol;
        this.game.isMyTurn = this.isHost; // Host (X) goes first
        
        if (!this.game.isMyTurn) {
            this.game.showMessage('Waiting for opponent\'s move...');
        }
    }
    
    sendMove(move) {
        if (this.connection && this.isConnected) {
            this.connection.send(move);
        }
    }
    
    handleRemoteMove(data) {
        if (data.type === 'move') {
            this.game.handleRemoteMove(data.index, data.player);
        } else if (data.type === 'reset') {
            this.game.resetGame();
        }
    }
    
    generateRoomCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 8; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
    
    // Simplified room mapping (in production, use a proper signaling server)
    storeRoomMapping(roomCode, peerId) {
        localStorage.setItem(`xo-room-${roomCode}`, JSON.stringify({
            peerId: peerId,
            timestamp: Date.now()
        }));
    }
    
    async getRoomMapping(roomCode) {
        // In production, this would query a signaling server
        const stored = localStorage.getItem(`xo-room-${roomCode}`);
        if (stored) {
            const data = JSON.parse(stored);
            // Check if room is not too old (10 minutes)
            if (Date.now() - data.timestamp < 600000) {
                return data.peerId;
            }
        }
        return null;
    }
    
    showStatus(message, type = '') {
        const statusElement = document.getElementById('connection-status');
        statusElement.textContent = message;
        statusElement.className = `connection-status ${type}`;
    }
    
    disconnect() {
        if (this.connection) {
            this.connection.close();
        }
        if (this.peer) {
            this.peer.destroy();
        }
        this.isConnected = false;
    }
}

class XOGame {
    constructor() {
        this.board = Array(9).fill('');
        this.currentPlayer = 'X';
        this.gameActive = true;
        this.scores = {
            X: 0,
            O: 0,
            draws: 0
        };
        
        this.winningConditions = [
            [0, 1, 2],
            [3, 4, 5],
            [6, 7, 8],
            [0, 3, 6],
            [1, 4, 7],
            [2, 5, 8],
            [0, 4, 8],
            [2, 4, 6]
        ];
        
        this.initializeGame();
        this.loadScores();
    }
    
    initializeGame() {
        const cells = document.querySelectorAll('.cell');
        const resetGameBtn = document.getElementById('reset-game');
        const resetScoresBtn = document.getElementById('reset-scores');
        
        cells.forEach((cell, index) => {
            cell.addEventListener('click', () => this.makeMove(index));
        });
        
        resetGameBtn.addEventListener('click', () => this.resetGame());
        resetScoresBtn.addEventListener('click', () => this.resetScores());
        
        this.updateDisplay();
    }
    
    makeMove(index) {
        if (this.board[index] !== '' || !this.gameActive) {
            return;
        }
        
        this.board[index] = this.currentPlayer;
        this.updateCell(index);
        
        if (this.checkWin()) {
            this.handleWin();
        } else if (this.checkDraw()) {
            this.handleDraw();
        } else {
            this.switchPlayer();
        }
    }
    
    updateCell(index) {
        const cell = document.querySelector(`[data-index="${index}"]`);
        cell.textContent = this.currentPlayer;
        cell.classList.add(this.currentPlayer.toLowerCase());
    }
    
    checkWin() {
        return this.winningConditions.some(condition => {
            const [a, b, c] = condition;
            if (this.board[a] && this.board[a] === this.board[b] && this.board[a] === this.board[c]) {
                this.highlightWinningCells(condition);
                return true;
            }
            return false;
        });
    }
    
    highlightWinningCells(winningCondition) {
        winningCondition.forEach(index => {
            const cell = document.querySelector(`[data-index="${index}"]`);
            cell.classList.add('winning');
        });
    }
    
    checkDraw() {
        return this.board.every(cell => cell !== '');
    }
    
    handleWin() {
        this.gameActive = false;
        this.scores[this.currentPlayer]++;
        this.saveScores();
        this.updateDisplay();
        const winnerName = playerNames[this.currentPlayer];
        this.showMessage(`${winnerName} wins! 🎉`, 'win');
        
        // Auto reset after 3 seconds
        setTimeout(() => {
            this.resetGame();
        }, 3000);
    }
    
    handleDraw() {
        this.gameActive = false;
        this.scores.draws++;
        this.saveScores();
        this.updateDisplay();
        this.showMessage("It's a draw! 🤝", 'draw');
        
        // Auto reset after 3 seconds
        setTimeout(() => {
            this.resetGame();
        }, 3000);
    }
    
    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
        this.updateDisplay();
    }
    
    resetGame() {
        this.board = Array(9).fill('');
        this.currentPlayer = 'X';
        this.gameActive = true;
        
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            cell.textContent = '';
            cell.className = 'cell';
        });
        
        this.updateDisplay();
        this.showMessage('');
    }
    
    resetScores() {
        this.scores = {
            X: 0,
            O: 0,
            draws: 0
        };
        this.saveScores();
        this.updateDisplay();
        this.showMessage('Scores reset! 🔄');
        
        setTimeout(() => {
            this.showMessage('');
        }, 2000);
    }
      updateDisplay() {
        // Only call updateCurrentPlayerDisplay if the element exists
        if (document.getElementById('current-player-text')) {
            updateCurrentPlayerDisplay();
        }
        
        const scoreX = document.getElementById('score-x');
        const scoreO = document.getElementById('score-o');
        const scoreDraw = document.getElementById('score-draw');
        
        if (scoreX) scoreX.textContent = this.scores.X;
        if (scoreO) scoreO.textContent = this.scores.O;
        if (scoreDraw) scoreDraw.textContent = this.scores.draws;
    }

    showMessage(message, className = '') {
        const messageElement = document.getElementById('game-message');
        messageElement.textContent = message;
        messageElement.className = `game-message ${className}`;
    }
    
    saveScores() {
        localStorage.setItem('xo-scores', JSON.stringify(this.scores));
    }
    
    loadScores() {
        const savedScores = localStorage.getItem('xo-scores');
        if (savedScores) {
            this.scores = JSON.parse(savedScores);
        }
    }
}

// Game modes and additional features
class GameModes {
    static setupTeamMode() {
        // Future enhancement: Team vs Team mode
        console.log('Team mode - Coming soon!');
    }
    
    static setupOnlineMode() {
        // Future enhancement: Online multiplayer
        console.log('Online mode - Coming soon!');
    }
    
    static setupAIMode() {
        // Future enhancement: vs AI mode
        console.log('AI mode - Coming soon!');
    }
}

// Sound effects (optional enhancement)
class SoundManager {
    constructor() {
        this.enabled = true;
    }
    
    playMove() {
        if (!this.enabled) return;
        // Create a simple click sound using Web Audio API
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    }
    
    playWin() {
        if (!this.enabled) return;
        // Create a celebration sound
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
        
        notes.forEach((freq, index) => {
            setTimeout(() => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.value = freq;
                oscillator.type = 'sine';
                
                gainNode.gain.setValueAtTime(0, audioContext.currentTime);
                gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.01);
                gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.3);
            }, index * 100);
        });
    }
    
    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
}

// WebRTC Multiplayer Variables
let peer = null;
let connection = null;
let isHost = false;
let isOnlineGame = false;
let mySymbol = 'X';
let fullPeerId = ''; // Store the full peer ID

// Player names
let playerNames = {
    X: 'Player X',
    O: 'Player O'
};

// Function to update current player display
function updateCurrentPlayerDisplay() {
    const currentPlayerText = document.getElementById('current-player-text');
    if (!currentPlayerText) return; // Exit if element doesn't exist
    
    if (window.game && window.game.gameActive) {
        const currentPlayerName = playerNames[window.game.currentPlayer];
        currentPlayerText.textContent = `${currentPlayerName}'s Turn`;
    } else {
        currentPlayerText.textContent = 'Game Over';
    }
}

// PeerJS Setup Function
function setupPeerJS() {
    const createGameBtn = document.getElementById('create-game');
    const joinGameBtn = document.getElementById('join-game');
    const retryJoinBtn = document.getElementById('retry-join');
    const roomCodeInput = document.getElementById('room-code-input');
    const roomCodeDisplay = document.getElementById('room-code');
    const roomCodeDisplayDiv = document.getElementById('room-code-display');
    const connectionStatus = document.getElementById('connection-status');
    const copyCodeBtn = document.getElementById('copy-code');
    const backToMenuBtn = document.getElementById('back-to-menu');

    // Create Game
    createGameBtn.addEventListener('click', () => {
        // Try with default PeerJS server for better reliability
        peer = new Peer({
            host: '0.peerjs.com',
            port: 443,
            secure: true,
            config: {
                'iceServers': [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' },
                    { urls: 'stun:stun2.l.google.com:19302' },
                    { urls: 'stun:stun3.l.google.com:19302' },
                    { urls: 'stun:stun4.l.google.com:19302' }
                ]
            }
        });
        isHost = true;
        mySymbol = 'X';
        connectionStatus.textContent = 'Creating room...';
        connectionStatus.className = 'connection-status connecting';

        peer.on('open', (id) => {
            console.log('Host Peer ID:', id);
            fullPeerId = id; // Store full ID
            const shortId = id.substring(0, 8).toUpperCase();
            roomCodeDisplay.textContent = fullPeerId; // Show full ID for now
            roomCodeDisplayDiv.style.display = 'block';
            connectionStatus.textContent = `Host ready! Waiting for player...`;
            connectionStatus.className = 'connection-status waiting';
            console.log('Host is ready to accept connections on ID:', id);
        });

        peer.on('connection', (conn) => {
            console.log('Player connected!', conn);
            connection = conn;
            
            // Handle connection immediately if already open, or wait for open event
            if (conn.open) {
                console.log('Connection already open on host side');
                setupConnection();
                connectionStatus.textContent = 'Player joined! Starting game...';
                connectionStatus.className = 'connection-status connected';
                setTimeout(() => startOnlineGame(), 1000);
            } else {
                conn.on('open', () => {
                    console.log('Connection opened on host side');
                    setupConnection();
                    connectionStatus.textContent = 'Player joined! Starting game...';
                    connectionStatus.className = 'connection-status connected';
                    setTimeout(() => startOnlineGame(), 1000);
                });
            }
            
            // Handle connection errors and close events
            conn.on('error', (error) => {
                console.error('Host connection error:', error);
                connectionStatus.textContent = 'Connection failed.';
                connectionStatus.className = 'connection-status error';
            });
            
            conn.on('close', () => {
                console.log('Connection closed on host side');
                connectionStatus.textContent = 'Player disconnected.';
                connectionStatus.className = 'connection-status error';
                isOnlineGame = false;
            });
        });

        peer.on('error', (error) => {
            console.error('Peer error:', error);
            connectionStatus.textContent = `Error: ${error.type}. Try again.`;
            connectionStatus.className = 'connection-status error';
        });
    });

    // Join Game
    joinGameBtn.addEventListener('click', () => {
        const roomCode = roomCodeInput.value.trim();
        if (!roomCode) {
            connectionStatus.textContent = 'Please enter a room code.';
            connectionStatus.className = 'connection-status error';
            return;
        }

        // Use the room code as the full peer ID
        const targetPeerId = roomCode;
        
        // Clean up any existing peer
        if (peer) {
            peer.destroy();
        }
        
        peer = new Peer({
            host: '0.peerjs.com',
            port: 443,
            secure: true,
            config: {
                'iceServers': [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' },
                    { urls: 'stun:stun2.l.google.com:19302' },
                    { urls: 'stun:stun3.l.google.com:19302' },
                    { urls: 'stun:stun4.l.google.com:19302' }
                ]
            }
        });
        isHost = false;
        mySymbol = 'O';
        connectionStatus.textContent = 'Initializing...';
        connectionStatus.className = 'connection-status connecting';

        peer.on('open', (myId) => {
            console.log('Joiner Peer ID:', myId);
            console.log('Attempting to connect to:', targetPeerId);
            
            connectionStatus.textContent = 'Connecting to host...';
            connection = peer.connect(targetPeerId);
            
            // Add timeout for connection attempt  
            const connectionTimeout = setTimeout(() => {
                if (!connection || !connection.open) {
                    connectionStatus.textContent = 'Connection timeout. Host may be offline. Try retry.';
                    connectionStatus.className = 'connection-status error';
                    retryJoinBtn.style.display = 'inline-block';
                    console.log('Connection timeout - host may not be available');
                }
            }, 10000); // Reduced to 10 seconds for faster feedback
            
            connection.on('open', () => {
                clearTimeout(connectionTimeout);
                console.log('Connection established on joiner side!');
                setupConnection();
                connectionStatus.textContent = 'Connected! Starting game...';
                connectionStatus.className = 'connection-status connected';
                setTimeout(() => startOnlineGame(), 1000);
            });

            connection.on('error', (error) => {
                clearTimeout(connectionTimeout);
                console.error('Joiner connection error:', error);
                connectionStatus.textContent = 'Could not connect. Host may be offline.';
                connectionStatus.className = 'connection-status error';
                retryJoinBtn.style.display = 'inline-block';
            });
            
            connection.on('close', () => {
                clearTimeout(connectionTimeout);
                console.log('Connection closed on joiner side');
                connectionStatus.textContent = 'Connection lost.';
                connectionStatus.className = 'connection-status error';
                isOnlineGame = false;
            });
        });

        peer.on('error', (error) => {
            console.error('Peer error:', error);
            connectionStatus.textContent = `Connection failed: ${error.type}`;
            connectionStatus.className = 'connection-status error';
            retryJoinBtn.style.display = 'inline-block';
        });
    });

    // Retry Join functionality
    retryJoinBtn.addEventListener('click', () => {
        retryJoinBtn.style.display = 'none';
        joinGameBtn.click(); // Trigger the join game logic again
    });

    // Copy room code
    copyCodeBtn.addEventListener('click', () => {
        const textToCopy = roomCodeDisplay.textContent;
        navigator.clipboard.writeText(textToCopy).then(() => {
            copyCodeBtn.textContent = 'Copied!';
            setTimeout(() => {
                copyCodeBtn.textContent = 'Copy Code';
            }, 2000);
        }).catch(() => {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = textToCopy;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            copyCodeBtn.textContent = 'Copied!';
            setTimeout(() => {
                copyCodeBtn.textContent = 'Copy Code';
            }, 2000);
        });
    });

    // Back to menu
    backToMenuBtn.addEventListener('click', () => {
        if (connection) connection.close();
        if (peer) peer.destroy();
        resetToMenu();
    });
}

function setupConnection() {
    if (!connection) {
        console.error('No connection to setup');
        return;
    }
    
    console.log('Setting up connection handlers');
    
    connection.on('data', (data) => {
        console.log('Received data:', data);
        if (data.type === 'move') {
            window.game.remoteMove(data.index);
        } else if (data.type === 'reset') {
            window.game.remoteReset();
        } else if (data.type === 'ping') {
            // Respond to ping
            connection.send({ type: 'pong' });
        } else if (data.type === 'pong') {
            console.log('Received pong');
        }
    });

    connection.on('close', () => {
        console.log('Connection closed');
        isOnlineGame = false;
        document.getElementById('connection-status').textContent = 'Connection lost.';
        document.getElementById('connection-status').className = 'connection-status error';
    });
    
    connection.on('error', (error) => {
        console.error('Connection error:', error);
        isOnlineGame = false;
        document.getElementById('connection-status').textContent = 'Connection error.';
        document.getElementById('connection-status').className = 'connection-status error';
    });
    
    // Send a ping to test the connection
    setTimeout(() => {
        if (connection && connection.open) {
            connection.send({ type: 'ping' });
            console.log('Sent ping');
        }
    }, 1000);
}

function startOnlineGame() {
    isOnlineGame = true;
    document.getElementById('online-setup').style.display = 'none';
    document.getElementById('game-area').style.display = 'block';
    
    // Set player names for online game
    if (isHost) {
        playerNames.X = document.getElementById('player1-name').value.trim() || 'Host Player';
        playerNames.O = 'Guest Player';
        document.getElementById('game-mode-text').textContent = `Online Game (You are ${playerNames.X})`;
    } else {
        playerNames.X = 'Host Player';
        playerNames.O = document.getElementById('player1-name').value.trim() || 'Guest Player';
        document.getElementById('game-mode-text').textContent = `Online Game (You are ${playerNames.O})`;
    }
    
    updatePlayerLabels();
    window.game.resetGame();
}

function resetToMenu() {
    isOnlineGame = false;
    document.getElementById('game-mode-selector').style.display = 'block';
    document.getElementById('online-setup').style.display = 'none';
    document.getElementById('game-area').style.display = 'none';
    document.getElementById('room-code-display').style.display = 'none';
    document.getElementById('connection-status').textContent = '';
    
    // Reset player names to defaults
    playerNames.X = 'Player X';
    playerNames.O = 'Player O';
}


// Enhanced game class with sound
class EnhancedXOGame extends XOGame {
    constructor() {
        super();
        this.soundManager = new SoundManager();
    }
    
    makeMove(index) {
        if (this.board[index] !== '' || !this.gameActive) {
            return;
        }
        
        this.soundManager.playMove();
        super.makeMove(index);
    }
    
    handleWin() {
        this.soundManager.playWin();
        super.handleWin();
    }
}

// Multiplayer Game Class
class MultiplayerXOGame extends EnhancedXOGame {
    makeMove(index) {
        if (isOnlineGame) {
            // Only allow move if it's your turn
            if (this.currentPlayer === mySymbol) {
                if (this.board[index] === '' && this.gameActive) {
                    super.makeMove(index);
                    // Send move to other player
                    if (connection && connection.open) {
                        connection.send({ type: 'move', index: index });
                    }
                }
            }
        } else {
            // Local multiplayer - normal behavior
            super.makeMove(index);
        }
    }

    remoteMove(index) {
        // Receive move from other player
        if (this.board[index] === '' && this.gameActive) {
            super.makeMove(index);
        }
    }

    resetGame() {
        super.resetGame();
        if (isOnlineGame && connection && connection.open) {
            connection.send({ type: 'reset' });
        }
    }

    remoteReset() {
        super.resetGame();
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Use MultiplayerXOGame for WebRTC support
    window.game = new MultiplayerXOGame();
    
    // Setup game mode selector
    const modeButtons = document.querySelectorAll('.mode-btn');
    const gameModeSelector = document.getElementById('game-mode-selector');
    const onlineSetup = document.getElementById('online-setup');
    const gameArea = document.getElementById('game-area');
    const player1NameInput = document.getElementById('player1-name');
    const player2NameInput = document.getElementById('player2-name');
    const player2NameGroup = document.getElementById('player2-name-group');
    const player1Label = document.getElementById('player1-label');
    const namesSectionTitle = document.getElementById('names-section-title');
    const localBtn = document.getElementById('local-btn');
    const onlineBtn = document.getElementById('online-btn');

    // Add hover effects to show/hide second player input
    localBtn.addEventListener('mouseenter', () => {
        player2NameGroup.style.display = 'flex';
        player1Label.textContent = 'Player 1 (X):';
        namesSectionTitle.textContent = 'Player Names';
        player1NameInput.placeholder = 'Enter name';
    });

    onlineBtn.addEventListener('mouseenter', () => {
        player2NameGroup.style.display = 'none';
        player1Label.textContent = 'Your Name:';
        namesSectionTitle.textContent = 'Your Name';
        player1NameInput.placeholder = 'Enter your name';
    });

    // Set initial state
    player2NameGroup.style.display = 'flex';

    modeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const mode = btn.getAttribute('data-mode');
            
            // Get player names
            const player1Name = player1NameInput.value.trim() || 'Player 1';
            const player2Name = player2NameInput.value.trim() || 'Player 2';
            
            if (mode === 'local') {
                // Start local multiplayer with both names
                isOnlineGame = false;
                playerNames.X = player1Name;
                playerNames.O = player2Name;
                
                gameModeSelector.style.display = 'none';
                gameArea.style.display = 'block';
                document.getElementById('game-mode-text').textContent = 'Local Game';
                updatePlayerLabels();
                window.game.resetGame();
            } else if (mode === 'online') {
                // Show online setup - only use player 1 name for online
                playerNames.X = player1Name;
                playerNames.O = 'Other Player'; // Will be updated when they connect
                
                gameModeSelector.style.display = 'none';
                onlineSetup.style.display = 'block';
            }
        });
    });

    // Function to update player labels in the UI
    function updatePlayerLabels() {
        const playerXLabel = document.getElementById('player-x-label');
        const playerOLabel = document.getElementById('player-o-label');
        
        if (playerXLabel) playerXLabel.textContent = playerNames.X;
        if (playerOLabel) playerOLabel.textContent = playerNames.O;
        updateCurrentPlayerDisplay();
    }
    
    // Setup PeerJS multiplayer UI and logic
    if (typeof Peer !== 'undefined') {
        setupPeerJS();
    }

    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        if (e.key >= '1' && e.key <= '9') {
            const index = parseInt(e.key) - 1;
            window.game.makeMove(index);
        } else if (e.key === 'r' || e.key === 'R') {
            window.game.resetGame();
        }
    });

    // Touch support
    let touchStartTime = 0;
    document.addEventListener('touchstart', () => {
        touchStartTime = Date.now();
    });
    document.addEventListener('touchend', (e) => {
        const touchDuration = Date.now() - touchStartTime;
        if (touchDuration > 500) {
            window.game.resetGame();
        }
    });
});

// Export for potential future enhancements
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { XOGame, GameModes, SoundManager };
}
