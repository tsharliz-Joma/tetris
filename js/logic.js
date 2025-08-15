document.addEventListener(`DOMContentLoaded`, () => {
  const holdCanvas = document.getElementById("holdCanvas");
  const holdCtx = holdCanvas ? holdCanvas.getContext("2d") : null;
  const controls = document.querySelectorAll(".controls i");
  const holdBtn = document.getElementById(`btn-hold`);
  const boardEl = document.querySelector(".play-board");
  let heldKey = null;
  let canHold = true;
  let isGameRunning = false;

  let score = 0;
  let lastDropTime = 0;
  const dropInterval = 500;
  let currentTetromino;
  const NUM_COLS = 10;
  const NUM_ROWS = 20;

  function render() {
    if (!boardEl) return;
    boardEl.querySelectorAll(".cell").forEach((n) => n.remove());

    const frag = document.createDocumentFragment();

    // draw locked board cells
    for (let y = 0; y < row; y++) {
      for (let x = 0; x < col; x++) {
        const c = board[y][x];
        if (!c) continue;
        const d = document.createElement("div");
        d.className = "cell";
        d.style.gridArea = `${y + 1} / ${x + 1}`;
        d.style.setProperty("--cell", c);
        frag.appendChild(d);
      }
    }

    // Draw current falling piece
    if (currentTetromino) {
      const {shape, x: ox, y: oy, randomlySelectedKey} = currentTetromino;
      const color = colors[randomlySelectedKey];
      for (let j = 0; j < shape.length; j++) {
        for (let i = 0; i < shape[0].length; i++) {
          if (!shape[j][i]) continue;
          const d = document.createElement("div");
          d.className = "cell";
          d.style.gridArea = `${oy + j + 1} / ${ox + i + 1}`;
          d.style.setProperty("--cell", color);
          frag.appendChild(d);
        }
      }
    }

    boardEl.appendChild(frag);
  }

  const row = NUM_ROWS;
  const col = NUM_COLS;
  const board = Array.from({length: row}, () => Array(col).fill(0));

  const tetrominoes = {
    I: [[1, 1, 1, 1]],
    J: [
      [0, 0, 1],
      [1, 1, 1],
    ],
    L: [
      [1, 0, 0],
      [1, 1, 1],
    ],
    O: [
      [1, 1],
      [1, 1],
    ],
    S: [
      [0, 1, 1],
      [1, 1, 0],
    ],
    T: [
      [1, 1, 1],
      [0, 1, 0],
    ],
    Z: [
      [1, 1, 0],
      [0, 1, 1],
    ],
  };

  const colors = {
    I: "#00fff7", // Neon cyan
    J: "#1e90ff", // Neon blue
    L: "#ff9900", // Neon orange
    O: "#ffe600", // Neon yellow
    S: "#39ff14", // Neon green
    T: "#d726ff", // Neon purple
    Z: "#ff206e", // Neon pink/red
  };

  const newTetromino = () => {
    const tetrominoKeys = Object.keys(tetrominoes);
    const randomlySelectedKey =
      tetrominoKeys[Math.floor(Math.random() * tetrominoKeys.length)];

    currentTetromino = {
      shape: tetrominoes[randomlySelectedKey],
      x:
        Math.floor(col / 2) -
        Math.floor(tetrominoes[randomlySelectedKey][0].length / 2),
      y: 0,
      randomlySelectedKey,
    };
  };

  const setCurrentFromKey = (key) => {
    currentTetromino = {
      shape: tetrominoes[key],
      x: Math.floor(col / 2) - Math.floor(tetrominoes[key][0].length / 2),
      y: 0,
      randomlySelectedKey: key,
    };
  };

  // Hold Piece Funtion
  const holdPiece = () => {
    if (!isGameRunning || !currentTetromino || !canHold) return;

    const curKey = currentTetromino.randomlySelectedKey;
    if (heldKey === null) {
      // First time: stash the piece and call a fresh one
      heldKey = curKey;
      newTetromino();
    } else {
      const swapKey = heldKey;
      heldKey = curKey;
      setCurrentFromKey(swapKey);
    }

    canHold = false; // Must lock a piece before holding again
    renderHoldPreview();
  };

  const draw = () => {
    render();
  };

  const renderHoldPreview = () => {
    // Check if holdCtx or holdCanvas already exists
    if (!holdCtx || !holdCanvas) return;

    // clear
    holdCtx.clearRect(0, 0, holdCanvas.width, holdCanvas.height);

    // no held piece --> nothing to draw
    if (heldKey == null) return;

    const shape = tetrominoes[heldKey];
    const color = colors[heldKey];

    const cells = 4;
    const cell = Math.floor(holdCanvas.width / cells);

    holdCtx.strokeStyle = "#132532";
    holdCtx.lineWidth = 1;
    for (let i = 1; i < cells; i++) {
      const p = i * cell + 0.5;
      holdCtx.beginPath();
      holdCtx.moveTo(p, 0);
      holdCtx.lineTo(p, holdCanvas.height);
      holdCtx.stroke();
      holdCtx.beginPath();
      holdCtx.moveTo(0, p);
      holdCtx.lineTo(holdCanvas.width, p);
      holdCtx.stroke();
    }

    const sx = shape[0].length;
    const sy = shape.length;
    const offX = Math.floor((cells - sx) / 2);
    const offY = Math.floor((cells - sy) / 2);

    // draw blocks
    for (let y = 0; y < sy; y++) {
      for (let x = 0; x < sx; x++) {
        if (!shape[y][x]) continue;

        const px = (x + offX) * cell + 1;
        const py = (y + offY) * cell + 1;
        const sz = cell - 2;

        holdCtx.fillStyle = color;
        holdCtx.fillRect(px, py, sz, sz);
        holdCtx.strokeStyle = `rgba(0, 0, 0, .35)`;
        holdCtx.strokeRect(px, py, sz, sz);
      }
    }
  };

  const moveLeft = () => {
    if (
      !collisionDetection(
        currentTetromino.shape,
        currentTetromino.x - 1,
        currentTetromino.y,
      )
    ) {
      currentTetromino.x--;
      render();
    }
  };

  const moveRight = () => {
    if (
      !collisionDetection(
        currentTetromino.shape,
        currentTetromino.x + 1,
        currentTetromino.y,
      )
    ) {
      currentTetromino.x++;
      render();
    }
  };

  const moveDown = () => {
    if (
      !collisionDetection(
        currentTetromino.shape,
        currentTetromino.x,
        currentTetromino.y + 1,
      )
    ) {
      currentTetromino.y++;
      render();
    } else {
      mergeTetromino();
      // Allow holding again
      canHold = true;
      newTetromino();
      if (
        collisionDetection(
          currentTetromino.shape,
          currentTetromino.x,
          currentTetromino.y,
        )
      ) {
        isGameRunning = false;
        cancelAnimationFrame(radId);
        displayMessage("Game over!!");
        return;
      }
      render();
    }
  };
  const rotateTetromino = () => {
    const tempShape = currentTetromino.shape;
    const r = rotateMatrix(tempShape);
    currentTetromino.shape = r;
    render();
  };

  const rotateMatrix = (matrix) => {
    return matrix[0].map((_, i) => matrix.map((row) => row[i]).reverse());
  };
  let radId = 0;
  const gameLoop = (timestamp = 0) => {
    if (!isGameRunning) return;

    render();

    if (timestamp - lastDropTime > dropInterval) {
      //   We place moveDown to make the tetromino move down automatically, every time the game starts
      moveDown();
      lastDropTime = timestamp;
    }
    radId = requestAnimationFrame(gameLoop);
  };

  const mergeTetromino = () => {
    currentTetromino.shape.forEach((tet, y) => {
      tet.forEach((value, x) => {
        if (value) {
          const boardY = currentTetromino.y + y;
          const boardX = currentTetromino.x + x;
          if (boardY >= 0 && boardY < row && boardX >= 0 && boardX < col) {
            board[y + currentTetromino.y][x + currentTetromino.x] =
              colors[currentTetromino.randomlySelectedKey];
          }
        }
      });
    });
    checkLines();
  };

  const checkLines = () => {
    for (let y = row - 1; y >= 0; y--) {
      if (board[y].every((item) => item)) {
        board.splice(y, 1);
        board.unshift(Array(col).fill(0));
        score += 100;
        updateScore();
        y = row;
      }
    }
  };

  const updateScore = () => {
    document.getElementById("score").textContent = score;
  };

  const collisionDetection = (tetromino, offSetX, offSetY) => {
    return tetromino.some((rowArr, y) => {
      return rowArr.some((value, x) => {
        if (value) {
          const newX = x + offSetX;
          const newY = y + offSetY;
          return (
            newX < 0 ||
            newX >= col ||
            newY < 0 ||
            newY >= row ||
            (board[newY] && board[newY][newX])
          );
        }
        return false;
      });
    });
  };

  const startGame = () => {
    isGameRunning = true;
    score = 0;
    updateScore();
    board.forEach((row) => row.fill(0));
    canHold = true;
    heldKey = null;
    renderHoldPreview();
    newTetromino();
    render();
    cancelAnimationFrame(radId);
    requestAnimationFrame(gameLoop);
  };

  const changeDirection = (event) => {
    if (event.key === "ArrowUp") {
      if (!isGameRunning) {
        startGame();
      }
      rotateTetromino();
    } else if (event.key === "ArrowLeft") {
      moveLeft();
    } else if (event.key === "ArrowRight") {
      moveRight();
    } else if (event.key === "ArrowDown") {
      moveDown();
    } else if (event.key === "Space") {
      if (!isGameRunning) {
        startGame();
      }
    }
  };

  if (holdBtn) {
    holdBtn.addEventListener("click", holdPiece);
  }

  window.addEventListener("keydown", (event) => {
    if (
      !isGameRunning &&
      (event.key == " " || event.code === "Space" || event.key === "Enter")
    ) {
      startGame();
    }
  });

  controls.forEach((control) => {
    control.addEventListener("click", () =>
      changeDirection({key: control.dataset.key}),
    );
  });

  document.addEventListener("keydown", (event) => {
    if (isGameRunning) {
      if (event.key === `ArrowLeft`) {
        moveLeft();
      } else if (event.key === `ArrowRight`) {
        moveRight();
      } else if (event.key === `ArrowUp`) {
        rotateTetromino();
      } else if (event.key === `ArrowDown`) {
        moveDown();
      } else if (event.key === "c" || event.key === "C") {
        holdPiece();
      }
    }
  });

  window.addEventListener("resize", () => {
    // sizeCanvasToShell();
    draw();
  });
});
