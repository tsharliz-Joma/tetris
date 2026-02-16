document.addEventListener("DOMContentLoaded", () => {
  const boardEl = document.querySelector(".play-board");
  const controls = document.querySelectorAll(".controls [data-key]");
  const actionButtons = document.querySelectorAll(".controls [data-action]");
  const holdBtn = document.getElementById("btn-hold");
  const restartBtn = document.querySelector(".restart");
  const pauseBtn = document.querySelector(".pause");
  const startBtn = document.getElementById("btn-start");
  const overlayEl = document.getElementById("overlay");
  const overlayText = document.getElementById("overlayText");
  const scoreEl = document.getElementById("score");
  const linesEl = document.getElementById("lines");
  const levelEl = document.getElementById("level");
  const bestEl = document.getElementById("best");
  const holdCanvas = document.getElementById("holdCanvas");
  const nextCanvas = document.getElementById("nextCanvas");
  const holdCtx = holdCanvas ? holdCanvas.getContext("2d") : null;
  const nextCtx = nextCanvas ? nextCanvas.getContext("2d") : null;
  const wrapper = document.querySelector(".wrapper");
  const styles = wrapper ? getComputedStyle(wrapper) : null;
  const NUM_ROWS = Number.parseInt(styles?.getPropertyValue("--rows"), 10) || 20;
  const NUM_COLS = Number.parseInt(styles?.getPropertyValue("--cols"), 10) || 10;
  const mobileQuery = window.matchMedia("(hover: none) and (pointer: coarse)");
  let isMobile = mobileQuery.matches;

  const row = NUM_ROWS;
  const col = NUM_COLS;
  const board = Array.from({length: row}, () => Array(col).fill(0));

  const BEST_KEY = "tetris-highscore";
  let bestScore = Number(localStorage.getItem(BEST_KEY) || 0);

  let score = 0;
  let lines = 0;
  let level = 1;

  let isGameRunning = false;
  let isPaused = false;
  let radId = 0;
  let lastDropTime = 0;

  const BASE_DROP_INTERVAL = 700;
  const SPEED_STEP = 55;
  const MIN_DROP_INTERVAL = 90;
  let dropInterval = BASE_DROP_INTERVAL;

  let currentTetromino = null;
  let heldKey = null;
  let canHold = true;
  let bag = [];
  let nextQueue = [];
  const QUEUE_SIZE = 3;

  if (bestEl) bestEl.textContent = bestScore;

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
    I: "#00fff7",
    J: "#1e90ff",
    L: "#ff9900",
    O: "#ffe600",
    S: "#39ff14",
    T: "#d726ff",
    Z: "#ff206e",
  };

  const showOverlay = (text, buttonLabel = "Start") => {
    if (!overlayEl) return;
    if (overlayText) overlayText.textContent = text;
    if (startBtn) startBtn.textContent = buttonLabel;
    overlayEl.classList.add("visible");
  };

  const hideOverlay = () => {
    if (!overlayEl) return;
    overlayEl.classList.remove("visible");
  };

  const updateBest = () => {
    if (score > bestScore) {
      bestScore = score;
      localStorage.setItem(BEST_KEY, String(bestScore));
    }
    if (bestEl) bestEl.textContent = bestScore;
  };

  const updateScore = () => {
    if (scoreEl) scoreEl.textContent = `Score : ${score}`;
    updateBest();
  };

  const updateLines = () => {
    if (linesEl) linesEl.textContent = `Lines : ${lines}`;
  };

  const updateLevel = () => {
    level = Math.floor(lines / 10) + 1;
    dropInterval = Math.max(
      MIN_DROP_INTERVAL,
      BASE_DROP_INTERVAL - (level - 1) * SPEED_STEP,
    );
    if (levelEl) levelEl.textContent = `Level : ${level}`;
  };

  const updateHud = () => {
    updateScore();
    updateLines();
    updateLevel();
  };

  const resetBoard = () => {
    board.forEach((rowArr) => rowArr.fill(0));
  };

  const shuffle = (list) => {
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  };

  const refillBag = () => {
    bag = shuffle(Object.keys(tetrominoes));
  };

  const popFromBag = () => {
    if (!bag.length) refillBag();
    return bag.pop();
  };

  const fillQueue = () => {
    while (nextQueue.length < QUEUE_SIZE) {
      nextQueue.push(popFromBag());
    }
  };

  const pullNextKey = () => {
    fillQueue();
    const key = nextQueue.shift();
    nextQueue.push(popFromBag());
    return key;
  };

  const setCurrentFromKey = (key) => {
    currentTetromino = {
      shape: tetrominoes[key],
      x: Math.floor(col / 2) - Math.floor(tetrominoes[key][0].length / 2),
      y: 0,
      randomlySelectedKey: key,
    };
  };

  const newTetromino = () => {
    const key = pullNextKey();
    setCurrentFromKey(key);
    renderNextPreview();
  };

  const renderPreview = (ctx, canvas, key) => {
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!key) return;

    const shape = tetrominoes[key];
    const color = colors[key];
    const cells = 4;
    const cell = Math.floor(canvas.width / cells);

    ctx.strokeStyle = "#132532";
    ctx.lineWidth = 1;
    for (let i = 1; i < cells; i++) {
      const p = i * cell + 0.5;
      ctx.beginPath();
      ctx.moveTo(p, 0);
      ctx.lineTo(p, canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, p);
      ctx.lineTo(canvas.width, p);
      ctx.stroke();
    }

    const sx = shape[0].length;
    const sy = shape.length;
    const offX = Math.floor((cells - sx) / 2);
    const offY = Math.floor((cells - sy) / 2);

    for (let y = 0; y < sy; y++) {
      for (let x = 0; x < sx; x++) {
        if (!shape[y][x]) continue;
        const px = (x + offX) * cell + 1;
        const py = (y + offY) * cell + 1;
        const sz = cell - 2;

        ctx.fillStyle = color;
        ctx.fillRect(px, py, sz, sz);
        ctx.strokeStyle = "rgba(0, 0, 0, .35)";
        ctx.strokeRect(px, py, sz, sz);
      }
    }
  };

  const renderHoldPreview = () => {
    if (isMobile) {
      renderPreview(holdCtx, holdCanvas, null);
      return;
    }
    renderPreview(holdCtx, holdCanvas, heldKey);
  };

  const renderNextPreview = () => {
    if (isMobile) {
      renderPreview(nextCtx, nextCanvas, null);
      return;
    }
    renderPreview(nextCtx, nextCanvas, nextQueue[0]);
  };

  const collisionDetection = (tetromino, offSetX, offSetY) => {
    return tetromino.some((rowArr, y) =>
      rowArr.some((value, x) => {
        if (!value) return false;
        const newX = x + offSetX;
        const newY = y + offSetY;
        return (
          newX < 0 ||
          newX >= col ||
          newY < 0 ||
          newY >= row ||
          (board[newY] && board[newY][newX])
        );
      }),
    );
  };

  const getGhostY = () => {
    if (!currentTetromino) return 0;
    let y = currentTetromino.y;
    while (!collisionDetection(currentTetromino.shape, currentTetromino.x, y + 1)) {
      y++;
    }
    return y;
  };

  const render = () => {
    if (!boardEl) return;
    boardEl.querySelectorAll(".cell").forEach((n) => n.remove());

    const frag = document.createDocumentFragment();

    const appendCell = (x, y, color, extraClass) => {
      const d = document.createElement("div");
      d.className = extraClass ? `cell ${extraClass}` : "cell";
      d.style.gridArea = `${y + 1} / ${x + 1}`;
      d.style.setProperty("--cell", color);
      frag.appendChild(d);
    };

    for (let y = 0; y < row; y++) {
      for (let x = 0; x < col; x++) {
        const c = board[y][x];
        if (!c) continue;
        appendCell(x, y, c);
      }
    }

    if (currentTetromino) {
      const {shape, x: ox, y: oy, randomlySelectedKey} = currentTetromino;
      const color = colors[randomlySelectedKey];
      const ghostY = getGhostY();

      if (ghostY !== oy) {
        for (let j = 0; j < shape.length; j++) {
          for (let i = 0; i < shape[0].length; i++) {
            if (!shape[j][i]) continue;
            appendCell(ox + i, ghostY + j, color, "ghost");
          }
        }
      }

      for (let j = 0; j < shape.length; j++) {
        for (let i = 0; i < shape[0].length; i++) {
          if (!shape[j][i]) continue;
          appendCell(ox + i, oy + j, color);
        }
      }
    }

    boardEl.appendChild(frag);
  };

  const rotateMatrix = (matrix) => {
    return matrix[0].map((_, i) => matrix.map((rowArr) => rowArr[i]).reverse());
  };

  const rotateTetromino = () => {
    if (!currentTetromino) return;
    const rotated = rotateMatrix(currentTetromino.shape);
    const offsets = [0, -1, 1, -2, 2];
    for (const offset of offsets) {
      if (!collisionDetection(rotated, currentTetromino.x + offset, currentTetromino.y)) {
        currentTetromino.shape = rotated;
        currentTetromino.x += offset;
        render();
        return;
      }
    }
  };

  const checkLines = () => {
    let cleared = 0;
    for (let y = row - 1; y >= 0; y--) {
      if (board[y].every((cell) => cell)) {
        board.splice(y, 1);
        board.unshift(Array(col).fill(0));
        cleared++;
        y++;
      }
    }

    if (cleared > 0) {
      const lineScores = {1: 100, 2: 300, 3: 500, 4: 800};
      score += (lineScores[cleared] || 0) * level;
      lines += cleared;
      if (boardEl) {
        boardEl.classList.remove("flash");
        void boardEl.offsetWidth;
        boardEl.classList.add("flash");
      }
      updateHud();
    }
  };

  const mergeTetromino = () => {
    if (!currentTetromino) return;
    currentTetromino.shape.forEach((tet, y) => {
      tet.forEach((value, x) => {
        if (!value) return;
        const boardY = currentTetromino.y + y;
        const boardX = currentTetromino.x + x;
        if (boardY >= 0 && boardY < row && boardX >= 0 && boardX < col) {
          board[boardY][boardX] = colors[currentTetromino.randomlySelectedKey];
        }
      });
    });
    checkLines();
  };

  const lockPiece = () => {
    mergeTetromino();
    canHold = true;
    newTetromino();
    if (collisionDetection(currentTetromino.shape, currentTetromino.x, currentTetromino.y)) {
      render();
      endGame();
      return;
    }
    render();
  };

  const moveLeft = () => {
    if (!currentTetromino) return;
    if (!collisionDetection(currentTetromino.shape, currentTetromino.x - 1, currentTetromino.y)) {
      currentTetromino.x--;
      render();
    }
  };

  const moveRight = () => {
    if (!currentTetromino) return;
    if (!collisionDetection(currentTetromino.shape, currentTetromino.x + 1, currentTetromino.y)) {
      currentTetromino.x++;
      render();
    }
  };

  const moveDown = (isSoftDrop = false) => {
    if (!currentTetromino) return false;
    if (!collisionDetection(currentTetromino.shape, currentTetromino.x, currentTetromino.y + 1)) {
      currentTetromino.y++;
      if (isSoftDrop) {
        score += 1;
        updateScore();
      }
      render();
      return true;
    }
    lockPiece();
    return false;
  };

  const hardDrop = () => {
    if (!currentTetromino) return;
    let distance = 0;
    while (!collisionDetection(currentTetromino.shape, currentTetromino.x, currentTetromino.y + 1)) {
      currentTetromino.y++;
      distance++;
    }
    if (distance > 0) {
      score += distance * 2;
      updateScore();
    }
    lockPiece();
  };

  const holdPiece = () => {
    if (isMobile) return;
    if (!isGameRunning || !currentTetromino || !canHold) return;
    const curKey = currentTetromino.randomlySelectedKey;
    if (heldKey === null) {
      heldKey = curKey;
      newTetromino();
    } else {
      const swapKey = heldKey;
      heldKey = curKey;
      setCurrentFromKey(swapKey);
    }
    canHold = false;
    renderHoldPreview();

    if (collisionDetection(currentTetromino.shape, currentTetromino.x, currentTetromino.y)) {
      render();
      endGame();
      return;
    }
    render();
  };

  const gameLoop = (timestamp = 0) => {
    if (!isGameRunning || isPaused) return;
    if (timestamp - lastDropTime > dropInterval) {
      moveDown();
      lastDropTime = timestamp;
    }
    radId = requestAnimationFrame(gameLoop);
  };

  const startGame = () => {
    isGameRunning = true;
    isPaused = false;
    score = 0;
    lines = 0;
    level = 1;
    dropInterval = BASE_DROP_INTERVAL;
    lastDropTime = 0;
    resetBoard();
    canHold = true;
    heldKey = null;
    bag = [];
    nextQueue = [];
    fillQueue();
    newTetromino();
    renderHoldPreview();
    renderNextPreview();
    updateHud();
    hideOverlay();
    cancelAnimationFrame(radId);
    radId = requestAnimationFrame(gameLoop);
    render();
  };

  const endGame = () => {
    isGameRunning = false;
    isPaused = false;
    cancelAnimationFrame(radId);
    showOverlay(`Game Over. Score : ${score}`, "Play Again");
  };

  const togglePause = () => {
    if (!isGameRunning) return;
    if (!isPaused) {
      isPaused = true;
      cancelAnimationFrame(radId);
      showOverlay("Paused. Press P to resume", "Resume");
      return;
    }
    isPaused = false;
    hideOverlay();
    lastDropTime = performance.now();
    radId = requestAnimationFrame(gameLoop);
  };

  const handleKey = (key) => {
    if (key === " ") key = "Space";
    if (key === "p" || key === "P") key = "Pause";
    if (key === "c" || key === "C") key = "Hold";

    if (isMobile && (key === "Space" || key === "Hold")) return;

    if (!isGameRunning) {
      if (key === "Space" || key === "Enter" || key === "ArrowUp") {
        startGame();
      }
      return;
    }

    if (key === "Pause") {
      togglePause();
      return;
    }

    if (isPaused) return;

    if (key === "ArrowLeft") {
      moveLeft();
    } else if (key === "ArrowRight") {
      moveRight();
    } else if (key === "ArrowUp") {
      rotateTetromino();
    } else if (key === "ArrowDown") {
      moveDown(true);
    } else if (key === "Space") {
      hardDrop();
    } else if (key === "Hold") {
      holdPiece();
    }
  };

  document.addEventListener("keydown", (event) => {
    const key = event.code === "Space" ? "Space" : event.key;
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space"].includes(key)) {
      event.preventDefault();
    }
    handleKey(key);
  });

  controls.forEach((control) => {
    control.addEventListener("click", () => handleKey(control.dataset.key));
  });

  actionButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.action;
      const map = {
        rotate: "ArrowUp",
        drop: "Space",
        hold: "Hold",
        pause: "Pause",
      };
      handleKey(map[action]);
    });
  });

  if (holdBtn) holdBtn.addEventListener("click", holdPiece);
  if (restartBtn) restartBtn.addEventListener("click", startGame);
  if (pauseBtn) pauseBtn.addEventListener("click", togglePause);
  if (startBtn) startBtn.addEventListener("click", startGame);

  window.addEventListener("resize", render);

  const updateOverlayHint = () => {
    const hint = isMobile
      ? "Tap Start, then use the D-pad to play"
      : "Press Space or Enter to start";
    if (overlayEl && overlayEl.classList.contains("visible")) {
      if (overlayText) overlayText.textContent = hint;
    }
  };

  const refreshMobileMode = () => {
    isMobile = mobileQuery.matches;
    if (holdBtn) holdBtn.disabled = isMobile;
    renderHoldPreview();
    renderNextPreview();
    updateOverlayHint();
  };

  mobileQuery.addEventListener("change", refreshMobileMode);

  showOverlay(
    isMobile ? "Tap Start, then use the D-pad to play" : "Press Space or Enter to start",
    "Start",
  );
  render();
  refreshMobileMode();
});
