// Définition de toutes les pièces du jeu avec leur forme et leur couleur
// Chaque Tétrimino est défini comme une structure avec sa forme et sa couleur

const tetrominos = {
    I: { shape: [[1, 1, 1, 1]], color: 'cyan' },       // Pièce I (ligne droite)
    J: { shape: [[0, 0, 1], [1, 1, 1]], color: 'blue' }, // Pièce J (forme de L inversé)
    L: { shape: [[1, 0, 0], [1, 1, 1]], color: 'orange' },// Pièce L
    O: { shape: [[1, 1], [1, 1]], color: 'yellow' },     // Pièce O (carré)
    T: { shape: [[0, 1, 0], [1, 1, 1]], color: 'purple' },// Pièce T (en T)
    S: { shape: [[0, 1, 1], [1, 1, 0]], color: 'green' }, // Pièce S (forme de S)
    Z: { shape: [[1, 1, 0], [0, 1, 1]], color: 'red' }   // Pièce Z (forme de Z)
};

// On prépare le canvas où le jeu va s'afficher
const canvas = document.getElementById('tetris');
const ctx = canvas.getContext('2d');

// Paramètres du jeu
const BLOCK_SIZE = 30;   // Taille d'un bloc en pixels (30x30)
const BOARD_WIDTH = 10;  // Largeur du plateau en nombre de blocs
const BOARD_HEIGHT = 20; // Hauteur du plateau en nombre de blocs

// État du jeu
let board = Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(0)); // Grille de jeu vide
let currentPiece = null;  // Pièce qui tombe actuellement
let nextPiece = null;     // La prochaine pièce qui va tomber
let score = 0;            // Score du joueur
let isPaused = false;     // Vérifie si le jeu est en pause
let gameLoop = null;      // Stocke la boucle de jeu

// Position de départ des pièces (au milieu en haut)
const START_X = Math.floor(BOARD_WIDTH / 2) - 1;
const START_Y = 0;

// Détecter les touches du clavier pour déplacer les pièces
document.addEventListener('keydown', handleKeyPress);

// Fonction pour créer une nouvelle pièce aléatoire
function createPiece(type) {
    return {
        shape: tetrominos[type].shape, // Forme de la pièce
        color: tetrominos[type].color, // Sa couleur
        x: START_X, // Position horizontale de départ
        y: START_Y  // Position verticale de départ
    };
}

// Dessine un bloc à une position donnée sur le canvas
function drawBlock(x, y, color) {
    ctx.fillStyle = color; // Couleur du bloc
    ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE - 1, BLOCK_SIZE - 1); // Dessin du bloc
}

// Dessine tout le plateau de jeu
function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Nettoie le canvas

    // Dessine la grille de jeu existante
    for (let y = 0; y < BOARD_HEIGHT; y++) {
        for (let x = 0; x < BOARD_WIDTH; x++) {
            if (board[y][x]) {
                drawBlock(x, y, board[y][x]); // Dessine chaque bloc coloré
            }
        }
    }

    // Dessine la pièce qui est en train de tomber
    if (currentPiece) {
        currentPiece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    drawBlock(currentPiece.x + x, currentPiece.y + y, currentPiece.color);
                }
            });
        });
    }
}

// Vérifie si la pièce peut se déplacer dans une direction donnée
function isValidMove(piece, newX, newY) {
    return piece.shape.every((row, dy) =>
        row.every((value, dx) => {
            if (!value) return true; // Ignore les cases vides
            let x = newX + dx;
            let y = newY + dy;
            return x >= 0 && x < BOARD_WIDTH && y < BOARD_HEIGHT && !board[y][x]; // Vérifie les limites et collisions
        })
    );
}

// Déplace la pièce actuelle vers le bas
function moveDown() {
    if (!currentPiece) return;

    if (isValidMove(currentPiece, currentPiece.x, currentPiece.y + 1)) {
        currentPiece.y++; // Déplacer la pièce vers le bas
    } else {
        placePiece(); // Si elle ne peut pas descendre, elle est placée définitivement
        currentPiece = nextPiece;
        nextPiece = createPiece(randomTetromino());
    }

    drawBoard(); // Redessine le plateau
}

// Place la pièce définitivement sur le plateau
function placePiece() {
    currentPiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                board[currentPiece.y + y][currentPiece.x + x] = currentPiece.color; // Ajoute au plateau
            }
        });
    });

    checkLines(); // Vérifie si une ligne est complétée
}
// Fonction pour mettre à jour l'affichage du score dans l'interface
function updateScore() {
    document.getElementById('score').textContent = score;
}

// Vérifie et supprime les lignes complètes
function checkLines() {
    for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
        if (board[y].every(cell => cell)) {
            board.splice(y, 1); // Supprime la ligne complète
            board.unshift(Array(BOARD_WIDTH).fill(0)); // Ajoute une ligne vide en haut
            score += 100; // Augmente le score
            updateScore()
        }
    }
}

// Écoute les touches du clavier pour contrôler les pièces
function handleKeyPress(event) {
    if (!currentPiece || isPaused) return;

    if (event.key === "ArrowLeft" && isValidMove(currentPiece, currentPiece.x - 1, currentPiece.y)) {
        currentPiece.x--; // Déplacer à gauche
    } else if (event.key === "ArrowRight" && isValidMove(currentPiece, currentPiece.x + 1, currentPiece.y)) {
        currentPiece.x++; // Déplacer à droite
    } else if (event.key === "ArrowDown") {
        moveDown(); // Accélérer la descente
    } else if (event.key === "ArrowUp") {
        rotatePiece(); // Tourner la pièce
    }

    drawBoard(); // Mettre à jour l'affichage
}

// Tourne la pièce si possible
function rotatePiece() {
    let rotatedShape = currentPiece.shape[0].map((_, index) =>
        currentPiece.shape.map(row => row[index]).reverse()
    );

    if (isValidMove({ ...currentPiece, shape: rotatedShape }, currentPiece.x, currentPiece.y)) {
        currentPiece.shape = rotatedShape;
    }
}



// Choisit une pièce aléatoire
function randomTetromino() {
    const keys = Object.keys(tetrominos);
    return keys[Math.floor(Math.random() * keys.length)];
}
// Désactiver le défilement du navigateur avec les flèches
// Fonction pour dessiner l'aperçu de la prochaine pièce sur le petit canvas
function drawNextPiece() {
    const nextCanvas = document.getElementById('next-piece'); // Récupère le canvas de la prochaine pièce
    const nextCtx = nextCanvas.getContext('2d'); // Contexte de dessin 2D

    nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height); // Efface le canvas avant de redessiner

    if (!nextPiece) return; // Si aucune pièce n'est définie, ne rien faire

    const size = 30; // Taille d'un bloc pour l'aperçu
    // Calcule le centrage de la pièce sur le canvas de prévisualisation
    const offsetX = (nextCanvas.width - nextPiece.shape[0].length * size) / 2;
    const offsetY = (nextCanvas.height - nextPiece.shape.length * size) / 2;

    // Dessine la prochaine pièce sur le canvas d'aperçu
    nextPiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) { // Si la case contient une partie de la pièce (1)
                nextCtx.fillStyle = nextPiece.color; // Définir la couleur
                nextCtx.fillRect(offsetX + x * size, offsetY + y * size, size - 1, size - 1); // Dessiner le bloc
            }
        });
    });
}

// Fonction pour placer définitivement la pièce actuelle sur le plateau
function placePiece() {
    currentPiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                let boardY = currentPiece.y + y;
                let boardX = currentPiece.x + x;
                
                // Vérifie si la pièce touche le haut du plateau (GAME OVER)
                if (boardY < 0) {
                    gameOver(); // Déclencher la fin du jeu
                    return;
                }
                
                board[boardY][boardX] = currentPiece.color; // Sauvegarde la pièce sur le plateau
            }
        });
    });

    checkLines(); // Vérifie si une ou plusieurs lignes sont complètes

    // Sélectionne la prochaine pièce et génère une nouvelle
    currentPiece = nextPiece;
    nextPiece = createPiece(randomTetromino());
    drawNextPiece(); // Met à jour l'affichage de la prochaine pièce

    // Vérifie si la nouvelle pièce ne peut pas apparaître (GAME OVER)
    if (!isValidMove(currentPiece, currentPiece.x, currentPiece.y)) {
        gameOver();
    }
}

// Fonction qui détecte la fin du jeu (Game Over)
function gameOver() {
    clearInterval(gameLoop); // Arrête la boucle du jeu
    alert("Game Over! Votre score final est de : " + score); // Affiche un message avec le score final
    document.getElementById('start-button').disabled = false; // Réactive le bouton "Start"
}

// Fonction pour démarrer ou redémarrer le jeu
function startGame() {
    board = Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(0)); // Réinitialise le plateau
    score = 0; // Réinitialise le score
    updateScore(); // Met à jour l'affichage du score

    currentPiece = createPiece(randomTetromino()); // Génère une première pièce
    nextPiece = createPiece(randomTetromino()); // Génère la prochaine pièce
    drawNextPiece(); // Affiche la prochaine pièce

    document.getElementById('start-button').disabled = true; // Désactive le bouton Start pendant la partie

    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(moveDown, 500); // Fait descendre la pièce toutes les 500ms
}

// Fonction pour empêcher le défilement du navigateur avec les touches fléchées
window.addEventListener("keydown", function(event) {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
        event.preventDefault(); // Empêche le scrolling de la page
    }
}, false);


// On écoute le clic sur le bouton "Start"
document.getElementById('start-button').addEventListener('click', startGame);


