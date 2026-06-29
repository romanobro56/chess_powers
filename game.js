// Chess Powers - Game Engine
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const turnIndicator = document.getElementById('turnIndicator');

// Power panel DOM elements
const powerPanelLeft = document.getElementById('powerPanelLeft');
const powerPanelRight = document.getElementById('powerPanelRight');
const pieceInfoLeft = document.getElementById('pieceInfoLeft');
const pieceInfoRight = document.getElementById('pieceInfoRight');
const powersListLeft = document.getElementById('powersListLeft');
const powersListRight = document.getElementById('powersListRight');

const TILE_SIZE = 80;
const BOARD_SIZE = 8;
const PIECE_SCALE = 0.75; // Scale pieces relative to tile size

// Piece images storage
const pieceImages = {
    black: {},
    white: {}
};
let imagesLoaded = false;

// Load piece images
async function loadPieceImages() {
    const pieceNames = ['King', 'Queen', 'Rook', 'Bishop', 'Knight', 'Pawn'];
    const loadPromises = [];

    for (const name of pieceNames) {
        const promise = new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                // Store black version (original)
                pieceImages.black[name.toLowerCase()] = img;
                // White version will use the same image but drawn with invert filter
                pieceImages.white[name.toLowerCase()] = img;
                resolve();
            };
            img.onerror = reject;
            img.src = `pieces_original/${name}.png`;
        });
        loadPromises.push(promise);
    }

    await Promise.all(loadPromises);
    imagesLoaded = true;
    console.log('All piece images loaded!');
}

// Colors
const LIGHT_TILE = '#e8d4b8';
const DARK_TILE = '#b58863';
const SELECTED_TILE = 'rgba(255, 255, 0, 0.5)';
const VALID_MOVE_TILE = 'rgba(0, 255, 0, 0.4)';
const CAPTURE_TILE = 'rgba(255, 0, 0, 0.4)';
const POWER_TARGET_TILE = 'rgba(138, 43, 226, 0.5)';
const STUNNED_TILE = 'rgba(0, 150, 255, 0.4)';

// Piece types
const PIECE_TYPES = {
    KING: 'king',
    QUEEN: 'queen',
    ROOK: 'rook',
    BISHOP: 'bishop',
    KNIGHT: 'knight',
    PAWN: 'pawn'
};

// HP values for each piece type
const PIECE_HP = {
    [PIECE_TYPES.PAWN]: 2,
    [PIECE_TYPES.ROOK]: 4,
    [PIECE_TYPES.BISHOP]: 3,
    [PIECE_TYPES.KNIGHT]: 3,
    [PIECE_TYPES.QUEEN]: 5,
    [PIECE_TYPES.KING]: 6
};

// Power definitions
const POWERS = {
    pawn: [
        { name: 'Shrink', description: 'Become immune to attacks for one turn', icon: '🔮', key: '1' }
    ],
    rook: [
        { name: 'Jump Smash', description: 'Jump 1 space, deal 2 dmg to target, 1 dmg to surrounding', icon: '💥', key: '1', needsTarget: true, range: 1 },
        { name: 'Heal', description: 'Restore 2 HP to nearby friendly piece', icon: '💚', key: '2', needsTarget: true, range: 2, targetFriendly: true }
    ],
    bishop: [
        { name: 'Stun Beam', description: 'Stun enemy within 3 tiles for 1 turn', icon: '⚡', key: '1', needsTarget: true, range: 3, targetEnemy: true },
        { name: 'Kick', description: 'Deal 2 damage to adjacent piece', icon: '🦵', key: '2', needsTarget: true, range: 1, targetEnemy: true }
    ],
    knight: [
        { name: 'Smash', description: 'Deal 2 damage to all enemies within 1 tile', icon: '💢', key: '1' },
        { name: 'Teleport', description: 'Teleport to any tile within 3 spaces', icon: '✨', key: '2', needsTarget: true, range: 3, targetEmpty: true }
    ],
    queen: [
        { name: 'Shockwave', description: 'Deal 2 damage to all enemies within 1 tile', icon: '🌊', key: '1' },
        { name: 'Electric Beam', description: 'Deal 1 damage to all in line (range 3)', icon: '⚡', key: '2', needsTarget: true, range: 3, isBeam: true },
        { name: 'Teleport', description: 'Teleport 1-3 spaces in any direction', icon: '✨', key: '3', needsTarget: true, range: 3, targetEmpty: true }
    ],
    king_white: [
        { name: 'Electric Beam', description: 'Deal 1 damage to all in line (range 3)', icon: '⚡', key: '1', needsTarget: true, range: 3, isBeam: true },
        { name: 'Dash', description: 'Move 1-3 spaces in any direction', icon: '💨', key: '2', needsTarget: true, range: 3, targetEmpty: true },
        { name: 'Armor', description: 'Become immune to attacks for one turn', icon: '🛡️', key: '3' }
    ],
    king_black: [
        { name: 'Shield Throw', description: 'Deal 1 damage to all in line (range 3)', icon: '🛡️', key: '1', needsTarget: true, range: 3, isBeam: true },
        { name: 'Jump', description: 'Move 1-3 spaces in any direction', icon: '🦘', key: '2', needsTarget: true, range: 3, targetEmpty: true },
        { name: 'Shield Block', description: 'Become immune to attacks for one turn', icon: '🔰', key: '3' }
    ]
};

// Game state
let board = [];
let selectedPiece = null;
let validMoves = [];
let currentTurn = 'white';
let gameOver = false;
let activePower = null;
let powerTargets = [];
let statusEffects = []; // { piece, effect, turnsLeft }

// Piece class
class Piece {
    constructor(type, color, row, col) {
        this.type = type;
        this.color = color;
        this.row = row;
        this.col = col;
        this.hasMoved = false;
        this.maxHp = PIECE_HP[type];
        this.hp = this.maxHp;
        this.isImmune = false;
        this.isStunned = false;
    }

    getPowers() {
        // Stunned pieces can't use powers
        if (this.isStunned) return [];

        if (this.type === PIECE_TYPES.KING) {
            return POWERS[`king_${this.color}`];
        }
        return POWERS[this.type] || [];
    }

    getSymbol() {
        const symbols = {
            white: {
                king: '♔', queen: '♕', rook: '♖',
                bishop: '♗', knight: '♘', pawn: '♙'
            },
            black: {
                king: '♚', queen: '♛', rook: '♜',
                bishop: '♝', knight: '♞', pawn: '♟'
            }
        };
        return symbols[this.color][this.type];
    }

    takeDamage(amount) {
        if (this.isImmune) {
            showFloatingText(this.col * TILE_SIZE + TILE_SIZE/2, this.row * TILE_SIZE, 'IMMUNE!', '#00ffff');
            return false;
        }
        this.hp -= amount;
        showFloatingText(this.col * TILE_SIZE + TILE_SIZE/2, this.row * TILE_SIZE, `-${amount}`, '#ff4444');

        if (this.hp <= 0) {
            this.die();
            return true;
        }
        return false;
    }

    die() {
        board[this.row][this.col] = null;
        if (this.type === PIECE_TYPES.KING) {
            gameOver = true;
            setTimeout(() => {
                alert(`${this.color === 'white' ? 'Black' : 'White'} wins! The ${this.color} King has fallen!`);
            }, 100);
        }
    }

    getValidMoves(board) {
        if (this.isStunned) return [];

        const moves = [];

        switch (this.type) {
            case PIECE_TYPES.PAWN:
                this.getPawnMoves(board, moves);
                break;
            case PIECE_TYPES.ROOK:
                this.getRookMoves(board, moves);
                break;
            case PIECE_TYPES.KNIGHT:
                this.getKnightMoves(board, moves);
                break;
            case PIECE_TYPES.BISHOP:
                this.getBishopMoves(board, moves);
                break;
            case PIECE_TYPES.QUEEN:
                this.getRookMoves(board, moves);
                this.getBishopMoves(board, moves);
                break;
            case PIECE_TYPES.KING:
                this.getKingMoves(board, moves);
                break;
        }

        return moves;
    }

    getPawnMoves(board, moves) {
        const direction = this.color === 'white' ? -1 : 1;
        const startRow = this.color === 'white' ? 6 : 1;

        const newRow = this.row + direction;
        if (newRow >= 0 && newRow < 8 && !board[newRow][this.col]) {
            moves.push({ row: newRow, col: this.col, type: 'move' });

            if (this.row === startRow && !board[this.row + 2 * direction][this.col]) {
                moves.push({ row: this.row + 2 * direction, col: this.col, type: 'move' });
            }
        }

        for (const colOffset of [-1, 1]) {
            const captureCol = this.col + colOffset;
            if (captureCol >= 0 && captureCol < 8 && newRow >= 0 && newRow < 8) {
                const target = board[newRow][captureCol];
                // Can't capture immune pieces
                if (target && target.color !== this.color && !target.isImmune) {
                    moves.push({ row: newRow, col: captureCol, type: 'capture' });
                }
            }
        }
    }

    getRookMoves(board, moves) {
        const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        this.getSlidingMoves(board, moves, directions);
    }

    getBishopMoves(board, moves) {
        const directions = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
        this.getSlidingMoves(board, moves, directions);
    }

    getSlidingMoves(board, moves, directions) {
        for (const [dr, dc] of directions) {
            let newRow = this.row + dr;
            let newCol = this.col + dc;

            while (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                const target = board[newRow][newCol];

                if (!target) {
                    moves.push({ row: newRow, col: newCol, type: 'move' });
                } else if (target.color !== this.color) {
                    // Can't capture immune pieces, but they still block movement
                    if (!target.isImmune) {
                        moves.push({ row: newRow, col: newCol, type: 'capture' });
                    }
                    break;
                } else {
                    break;
                }

                newRow += dr;
                newCol += dc;
            }
        }
    }

    getKnightMoves(board, moves) {
        const offsets = [
            [-2, -1], [-2, 1], [-1, -2], [-1, 2],
            [1, -2], [1, 2], [2, -1], [2, 1]
        ];

        for (const [dr, dc] of offsets) {
            const newRow = this.row + dr;
            const newCol = this.col + dc;

            if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                const target = board[newRow][newCol];

                if (!target) {
                    moves.push({ row: newRow, col: newCol, type: 'move' });
                } else if (target.color !== this.color && !target.isImmune) {
                    // Can't capture immune pieces
                    moves.push({ row: newRow, col: newCol, type: 'capture' });
                }
            }
        }
    }

    getKingMoves(board, moves) {
        const offsets = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1], [0, 1],
            [1, -1], [1, 0], [1, 1]
        ];

        for (const [dr, dc] of offsets) {
            const newRow = this.row + dr;
            const newCol = this.col + dc;

            if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                const target = board[newRow][newCol];

                if (!target) {
                    moves.push({ row: newRow, col: newCol, type: 'move' });
                } else if (target.color !== this.color && !target.isImmune) {
                    // Can't capture immune pieces
                    moves.push({ row: newRow, col: newCol, type: 'capture' });
                }
            }
        }

        if (!this.hasMoved) {
            if (this.canCastle(board, 'kingside')) {
                moves.push({ row: this.row, col: this.col + 2, type: 'castle', side: 'kingside' });
            }
            if (this.canCastle(board, 'queenside')) {
                moves.push({ row: this.row, col: this.col - 2, type: 'castle', side: 'queenside' });
            }
        }
    }

    canCastle(board, side) {
        const row = this.row;
        const rookCol = side === 'kingside' ? 7 : 0;
        const rook = board[row][rookCol];

        if (!rook || rook.type !== PIECE_TYPES.ROOK || rook.hasMoved) {
            return false;
        }

        const startCol = side === 'kingside' ? this.col + 1 : 1;
        const endCol = side === 'kingside' ? rookCol : this.col;

        for (let col = startCol; col < endCol; col++) {
            if (board[row][col]) return false;
        }

        return true;
    }
}

// Floating text for damage numbers
let floatingTexts = [];

function showFloatingText(x, y, text, color) {
    floatingTexts.push({ x, y, text, color, alpha: 1, vy: -2 });
}

function updateFloatingTexts() {
    floatingTexts = floatingTexts.filter(ft => {
        ft.y += ft.vy;
        ft.alpha -= 0.02;
        return ft.alpha > 0;
    });
}

function drawFloatingTexts() {
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    for (const ft of floatingTexts) {
        ctx.globalAlpha = ft.alpha;
        ctx.fillStyle = ft.color;
        ctx.fillText(ft.text, ft.x, ft.y);
    }
    ctx.globalAlpha = 1;
}

// Initialize the board
function initBoard() {
    board = Array(8).fill(null).map(() => Array(8).fill(null));

    for (let col = 0; col < 8; col++) {
        board[1][col] = new Piece(PIECE_TYPES.PAWN, 'black', 1, col);
        board[6][col] = new Piece(PIECE_TYPES.PAWN, 'white', 6, col);
    }

    const pieceOrder = [
        PIECE_TYPES.ROOK, PIECE_TYPES.KNIGHT, PIECE_TYPES.BISHOP, PIECE_TYPES.QUEEN,
        PIECE_TYPES.KING, PIECE_TYPES.BISHOP, PIECE_TYPES.KNIGHT, PIECE_TYPES.ROOK
    ];

    for (let col = 0; col < 8; col++) {
        board[0][col] = new Piece(pieceOrder[col], 'black', 0, col);
        board[7][col] = new Piece(pieceOrder[col], 'white', 7, col);
    }
}

// Draw the board
function drawBoard() {
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const isLight = (row + col) % 2 === 0;
            ctx.fillStyle = isLight ? LIGHT_TILE : DARK_TILE;
            ctx.fillRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);

            // Draw stunned indicator
            const piece = board[row][col];
            if (piece && piece.isStunned) {
                ctx.fillStyle = STUNNED_TILE;
                ctx.fillRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }
        }
    }
}

// Draw selection and valid moves
function drawHighlights() {
    if (selectedPiece) {
        ctx.fillStyle = SELECTED_TILE;
        ctx.fillRect(
            selectedPiece.col * TILE_SIZE,
            selectedPiece.row * TILE_SIZE,
            TILE_SIZE,
            TILE_SIZE
        );

        for (const move of validMoves) {
            ctx.fillStyle = move.type === 'capture' ? CAPTURE_TILE : VALID_MOVE_TILE;
            ctx.fillRect(
                move.col * TILE_SIZE,
                move.row * TILE_SIZE,
                TILE_SIZE,
                TILE_SIZE
            );

            ctx.beginPath();
            ctx.arc(
                move.col * TILE_SIZE + TILE_SIZE / 2,
                move.row * TILE_SIZE + TILE_SIZE / 2,
                move.type === 'capture' ? TILE_SIZE / 2.5 : TILE_SIZE / 6,
                0,
                Math.PI * 2
            );
            ctx.fillStyle = move.type === 'capture' ? 'rgba(255, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.2)';
            ctx.fill();
        }
    }

    // Draw power targets
    if (activePower && powerTargets.length > 0) {
        for (const target of powerTargets) {
            ctx.fillStyle = POWER_TARGET_TILE;
            ctx.fillRect(
                target.col * TILE_SIZE,
                target.row * TILE_SIZE,
                TILE_SIZE,
                TILE_SIZE
            );

            // Draw purple circle
            ctx.beginPath();
            ctx.arc(
                target.col * TILE_SIZE + TILE_SIZE / 2,
                target.row * TILE_SIZE + TILE_SIZE / 2,
                TILE_SIZE / 4,
                0,
                Math.PI * 2
            );
            ctx.fillStyle = 'rgba(138, 43, 226, 0.6)';
            ctx.fill();
        }
    }
}

// Draw health bar
function drawHealthBar(piece, x, y) {
    const barWidth = TILE_SIZE - 16;
    const barHeight = 6;
    const barX = x + 8;
    const barY = y + TILE_SIZE - 12;

    // Background
    ctx.fillStyle = '#333';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // Health
    const healthPercent = piece.hp / piece.maxHp;
    let healthColor = '#4ade80'; // green
    if (healthPercent <= 0.5) healthColor = '#fbbf24'; // yellow
    if (healthPercent <= 0.25) healthColor = '#ef4444'; // red

    ctx.fillStyle = healthColor;
    ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);

    // Border
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    // Immune indicator
    if (piece.isImmune) {
        ctx.fillStyle = 'rgba(0, 255, 255, 0.5)';
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

        ctx.font = 'bold 12px Arial';
        ctx.fillStyle = '#00ffff';
        ctx.textAlign = 'center';
        ctx.fillText('🛡️', x + TILE_SIZE/2, y + 12);
    }

    // Stunned indicator
    if (piece.isStunned) {
        ctx.font = 'bold 12px Arial';
        ctx.fillStyle = '#00aaff';
        ctx.textAlign = 'center';
        ctx.fillText('💫', x + TILE_SIZE/2, y + 12);
    }
}

// Draw pieces
function drawPieces() {
    if (!imagesLoaded) return;

    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const piece = board[row][col];
            if (piece) {
                const x = col * TILE_SIZE;
                const y = row * TILE_SIZE;

                // Get the image
                const img = pieceImages[piece.color][piece.type];
                if (img) {
                    const pieceSize = TILE_SIZE * PIECE_SCALE;
                    const offsetX = (TILE_SIZE - pieceSize) / 2;
                    const offsetY = (TILE_SIZE - pieceSize) / 2 - 5; // Slight offset up for health bar

                    // Draw shadow for depth
                    ctx.globalAlpha = 0.3;
                    ctx.drawImage(img, x + offsetX + 3, y + offsetY + 3, pieceSize, pieceSize);
                    ctx.globalAlpha = 1;

                    // Apply invert filter for white pieces
                    if (piece.color === 'white') {
                        ctx.filter = 'invert(1)';
                    }

                    // Draw piece
                    ctx.drawImage(img, x + offsetX, y + offsetY, pieceSize, pieceSize);

                    // Reset filter
                    ctx.filter = 'none';
                }

                // Health bar
                drawHealthBar(piece, x, y);
            }
        }
    }
}

// Update power panel UI (HTML-based)
function updatePowerPanel() {
    // Determine which panel to use based on current turn
    const isWhiteTurn = currentTurn === 'white';
    const activePanel = isWhiteTurn ? powerPanelRight : powerPanelLeft;
    const inactivePanel = isWhiteTurn ? powerPanelLeft : powerPanelRight;
    const pieceInfo = isWhiteTurn ? pieceInfoRight : pieceInfoLeft;
    const powersList = isWhiteTurn ? powersListRight : powersListLeft;

    // Hide inactive panel
    inactivePanel.classList.remove('active');

    // Check if we should show the panel
    if (!selectedPiece || selectedPiece.color !== currentTurn) {
        activePanel.classList.remove('active');
        return;
    }

    const powers = selectedPiece.getPowers();
    if (powers.length === 0) {
        activePanel.classList.remove('active');
        return;
    }

    // Show active panel
    activePanel.classList.add('active');

    // Update piece info
    const pieceTypeName = selectedPiece.type.charAt(0).toUpperCase() + selectedPiece.type.slice(1);
    pieceInfo.textContent = `${selectedPiece.color === 'white' ? 'White' : 'Black'} ${pieceTypeName}`;

    // Clear and rebuild powers list
    powersList.innerHTML = '';

    powers.forEach((power) => {
        const button = document.createElement('div');
        button.className = 'power-button' + (activePower === power ? ' active' : '');
        button.innerHTML = `
            <div class="power-header">
                <span class="power-key">${power.key}</span>
                <span class="power-icon">${power.icon}</span>
                <span class="power-name">${power.name}</span>
            </div>
            <div class="power-description">${power.description}</div>
        `;
        button.addEventListener('click', () => selectPower(power));
        powersList.appendChild(button);
    });
}

// Main render function
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBoard();
    drawHighlights();
    drawPieces();
    drawFloatingTexts();
}

// Animation loop
function gameLoop() {
    updateFloatingTexts();
    render();
    requestAnimationFrame(gameLoop);
}

// Get tiles within radius
function getTilesInRadius(centerRow, centerCol, radius, condition) {
    const tiles = [];
    for (let dr = -radius; dr <= radius; dr++) {
        for (let dc = -radius; dc <= radius; dc++) {
            if (dr === 0 && dc === 0) continue;
            const row = centerRow + dr;
            const col = centerCol + dc;
            if (row >= 0 && row < 8 && col >= 0 && col < 8) {
                const distance = Math.max(Math.abs(dr), Math.abs(dc)); // Chebyshev distance
                if (distance <= radius && (!condition || condition(row, col))) {
                    tiles.push({ row, col });
                }
            }
        }
    }
    return tiles;
}

// Get tiles in line from piece to target
function getTilesInLine(fromRow, fromCol, toRow, toCol) {
    const tiles = [];
    const dr = Math.sign(toRow - fromRow);
    const dc = Math.sign(toCol - fromCol);

    let row = fromRow + dr;
    let col = fromCol + dc;

    while (row !== toRow + dr || col !== toCol + dc) {
        if (row < 0 || row >= 8 || col < 0 || col >= 8) break;
        tiles.push({ row, col });
        row += dr;
        col += dc;
    }

    return tiles;
}

// Calculate power targets
function calculatePowerTargets(piece, power) {
    const targets = [];

    // Special handling for Jump Smash - can only land on empty tiles or killable enemies
    if (power.name === 'Jump Smash') {
        return getTilesInRadius(piece.row, piece.col, power.range, (row, col) => {
            const target = board[row][col];
            if (!target) return true; // Empty tile is valid
            // Can land on enemy only if 2 damage would kill them (HP <= 2) and not immune
            if (target.color !== piece.color && !target.isImmune && target.hp <= 2) {
                return true;
            }
            return false;
        });
    }

    if (power.targetFriendly) {
        // Target friendly pieces within range (for healing)
        return getTilesInRadius(piece.row, piece.col, power.range, (row, col) => {
            const target = board[row][col];
            // Can target any friendly piece (including self)
            return target && target.color === piece.color;
        });
    } else if (power.targetEnemy) {
        // Target enemy pieces within range (exclude immune pieces for stun)
        return getTilesInRadius(piece.row, piece.col, power.range, (row, col) => {
            const target = board[row][col];
            if (!target || target.color === piece.color) return false;
            // For Stun Beam, can't target immune pieces
            if (power.name === 'Stun Beam' && target.isImmune) return false;
            return true;
        });
    } else if (power.targetEmpty) {
        // Target empty tiles within range
        return getTilesInRadius(piece.row, piece.col, power.range, (row, col) => {
            return !board[row][col];
        });
    } else if (power.isBeam) {
        // For beam attacks, show all tiles in range (any direction)
        return getTilesInRadius(piece.row, piece.col, power.range, () => true);
    } else if (power.range) {
        // Generic range targeting
        return getTilesInRadius(piece.row, piece.col, power.range, () => true);
    }

    return targets;
}

// Execute power
function executePower(piece, power, targetRow, targetCol) {
    const pieceColor = piece.color;

    switch (power.name) {
        case 'Shrink':
        case 'Armor':
        case 'Shield Block':
            // Immunity for one turn
            piece.isImmune = true;
            statusEffects.push({ piece, effect: 'immune', turnsLeft: 2 });
            showFloatingText(piece.col * TILE_SIZE + TILE_SIZE/2, piece.row * TILE_SIZE, 'IMMUNE!', '#00ffff');
            break;

        case 'Jump Smash':
            // Move to target, deal damage
            const oldRow = piece.row;
            const oldCol = piece.col;

            // Deal 2 damage to piece on target tile
            const targetPiece = board[targetRow][targetCol];
            if (targetPiece && targetPiece.color !== pieceColor) {
                targetPiece.takeDamage(2);
            }

            // Move piece
            board[oldRow][oldCol] = null;
            board[targetRow][targetCol] = piece;
            piece.row = targetRow;
            piece.col = targetCol;

            // Deal 1 damage to surrounding
            const surrounding = getTilesInRadius(targetRow, targetCol, 1, () => true);
            for (const tile of surrounding) {
                const adj = board[tile.row][tile.col];
                if (adj && adj.color !== pieceColor && adj !== piece) {
                    adj.takeDamage(1);
                }
            }
            break;

        case 'Heal':
            // Heal a friendly piece by 2 HP (can't exceed max HP)
            const healTarget = board[targetRow][targetCol];
            if (healTarget && healTarget.color === pieceColor) {
                const oldHp = healTarget.hp;
                healTarget.hp = Math.min(healTarget.hp + 2, healTarget.maxHp);
                const healed = healTarget.hp - oldHp;
                if (healed > 0) {
                    showFloatingText(targetCol * TILE_SIZE + TILE_SIZE/2, targetRow * TILE_SIZE, `+${healed}`, '#4ade80');
                } else {
                    showFloatingText(targetCol * TILE_SIZE + TILE_SIZE/2, targetRow * TILE_SIZE, 'FULL', '#4ade80');
                }
            }
            break;

        case 'Stun Beam':
            // Stun target (can't stun immune pieces)
            const stunTarget = board[targetRow][targetCol];
            if (stunTarget && stunTarget.color !== pieceColor && !stunTarget.isImmune) {
                stunTarget.isStunned = true;
                // turnsLeft: 1 means stunned for 1 full turn of the target player
                statusEffects.push({ piece: stunTarget, effect: 'stunned', turnsLeft: 1 });
                showFloatingText(targetCol * TILE_SIZE + TILE_SIZE/2, targetRow * TILE_SIZE, 'STUNNED!', '#00aaff');
            }
            break;

        case 'Kick':
            // Deal 2 damage to adjacent piece
            const kickTarget = board[targetRow][targetCol];
            if (kickTarget && kickTarget.color !== pieceColor) {
                kickTarget.takeDamage(2);
            }
            break;

        case 'Smash':
        case 'Shockwave':
            // Deal 2 damage to all enemies within 1 tile
            const smashTargets = getTilesInRadius(piece.row, piece.col, 1, () => true);
            for (const tile of smashTargets) {
                const adj = board[tile.row][tile.col];
                if (adj && adj.color !== pieceColor) {
                    adj.takeDamage(2);
                }
            }
            break;

        case 'Teleport':
        case 'Dash':
        case 'Jump':
            // Teleport to empty tile
            if (!board[targetRow][targetCol]) {
                board[piece.row][piece.col] = null;
                board[targetRow][targetCol] = piece;
                piece.row = targetRow;
                piece.col = targetCol;
                piece.hasMoved = true;
            }
            break;

        case 'Electric Beam':
        case 'Shield Throw':
            // Deal 1 damage to all pieces in line
            const beamTiles = getTilesInLine(piece.row, piece.col, targetRow, targetCol);
            for (const tile of beamTiles) {
                const beamTarget = board[tile.row][tile.col];
                if (beamTarget && beamTarget.color !== pieceColor) {
                    beamTarget.takeDamage(1);
                }
            }
            break;
    }

    // End turn after using power
    endTurn();
}

// End turn
function endTurn() {
    // Process status effects
    statusEffects = statusEffects.filter(se => {
        if (se.piece.color !== currentTurn) return true; // Only process current player's effects

        se.turnsLeft--;
        if (se.turnsLeft <= 0) {
            if (se.effect === 'immune') se.piece.isImmune = false;
            if (se.effect === 'stunned') se.piece.isStunned = false;
            return false;
        }
        return true;
    });

    currentTurn = currentTurn === 'white' ? 'black' : 'white';
    selectedPiece = null;
    validMoves = [];
    activePower = null;
    powerTargets = [];
    updateTurnIndicator();
    updatePowerPanel();
}

// Handle click
function handleClick(event) {
    if (gameOver) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const col = Math.floor(x / TILE_SIZE);
    const row = Math.floor(y / TILE_SIZE);

    if (col < 0 || col >= 8 || row < 0 || row >= 8) return;

    // If a power is active and needs target
    if (activePower && activePower.needsTarget) {
        const isValidTarget = powerTargets.some(t => t.row === row && t.col === col);
        if (isValidTarget) {
            executePower(selectedPiece, activePower, row, col);
            return;
        } else {
            // Cancel power
            activePower = null;
            powerTargets = [];
            updatePowerPanel();
        }
    }

    const clickedPiece = board[row][col];

    if (selectedPiece) {
        const move = validMoves.find(m => m.row === row && m.col === col);

        if (move) {
            executeMove(selectedPiece, move);
            selectedPiece = null;
            validMoves = [];
            activePower = null;
            powerTargets = [];
            updatePowerPanel();
        } else if (clickedPiece && clickedPiece.color === currentTurn) {
            selectedPiece = clickedPiece;
            validMoves = clickedPiece.getValidMoves(board);
            activePower = null;
            powerTargets = [];
            updatePowerPanel();
        } else {
            selectedPiece = null;
            validMoves = [];
            activePower = null;
            powerTargets = [];
            updatePowerPanel();
        }
    } else if (clickedPiece && clickedPiece.color === currentTurn) {
        selectedPiece = clickedPiece;
        validMoves = clickedPiece.getValidMoves(board);
        updatePowerPanel();
    }
}

// Select a power
function selectPower(power) {
    if (activePower === power) {
        // Toggle off
        activePower = null;
        powerTargets = [];
    } else {
        activePower = power;
        if (power.needsTarget) {
            powerTargets = calculatePowerTargets(selectedPiece, power);
        } else {
            // Instant power, execute immediately
            executePower(selectedPiece, power, null, null);
        }
    }
    updatePowerPanel();
}

// Handle keyboard
function handleKeyboard(event) {
    if (!selectedPiece || selectedPiece.color !== currentTurn) return;

    const powers = selectedPiece.getPowers();
    const power = powers.find(p => p.key === event.key);
    if (power) {
        selectPower(power);
    }

    // Escape to cancel
    if (event.key === 'Escape') {
        activePower = null;
        powerTargets = [];
        updatePowerPanel();
    }
}

// Execute a move
function executeMove(piece, move) {
    const oldRow = piece.row;
    const oldCol = piece.col;

    if (move.type === 'castle') {
        const rookCol = move.side === 'kingside' ? 7 : 0;
        const newRookCol = move.side === 'kingside' ? move.col - 1 : move.col + 1;
        const rook = board[piece.row][rookCol];

        board[piece.row][rookCol] = null;
        board[piece.row][newRookCol] = rook;
        rook.col = newRookCol;
        rook.hasMoved = true;
    }

    // Handle capture - deal damage instead of instant kill
    const capturedPiece = board[move.row][move.col];
    if (capturedPiece) {
        capturedPiece.takeDamage(piece.maxHp); // Deal damage equal to attacker's max HP
    }

    board[oldRow][oldCol] = null;
    board[move.row][move.col] = piece;
    piece.row = move.row;
    piece.col = move.col;
    piece.hasMoved = true;

    // Pawn promotion
    if (piece.type === PIECE_TYPES.PAWN) {
        if ((piece.color === 'white' && piece.row === 0) ||
            (piece.color === 'black' && piece.row === 7)) {
            piece.type = PIECE_TYPES.QUEEN;
            piece.maxHp = PIECE_HP[PIECE_TYPES.QUEEN];
            piece.hp = piece.maxHp;
        }
    }

    endTurn();
}

// Update turn indicator
function updateTurnIndicator() {
    turnIndicator.textContent = `${currentTurn.charAt(0).toUpperCase() + currentTurn.slice(1)}'s Turn`;
    turnIndicator.className = currentTurn === 'white' ? 'turn-white' : 'turn-black';
}

// Initialize game
async function init() {
    // Load piece images first
    console.log('Loading piece images...');
    await loadPieceImages();

    initBoard();
    updateTurnIndicator();

    canvas.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeyboard);

    gameLoop();
    console.log('Chess Powers initialized! Click pieces to select, use number keys or click to activate powers.');
}

// Start the game
init();
