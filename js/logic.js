document.addEventListener(`DOMContentLoaded`, () => {
  const canvas = document.querySelector(`canvas`);
  const ctx = canvas.getContext("2d");
  let isGameRunning = false;
  let timerId;
  let score = 0;
  let currentTetromino;

  const setCanvasSize = () => {
    //   Dynamic grid for mobile sizes
    const grid = window.innerWidth <= 430 ? 45 : 30;
    //   Dynamic canvas sizes
    canvas.width = grid * 10; // 10 columns
    canvas.height = grid * 20; // 20 rows
    return grid;
  };

  const displayMessage = (message) => {
    ctx.fillStyle = `black`;
    ctx.globalAlpha = 0.75;
    ctx.fillRect(0, canvas.height / 2 - 30, canvas.width, 60);

    ctx.globalAlpha = 1;
    ctx.fillStyle = `white`;
    ctx.font = `36px Michroma`;
    ctx.textAlign = `center`;
    ctx.textBaseline = `middle`;
    ctx.fillText(`${message}`, canvas.width / 2, canvas.height / 2);
  };

  let grid = setCanvasSize();

  const row = Math.floor(canvas.height / grid);
  const col = Math.floor(canvas.width / grid);
  const board = Array.from({length: row}, () => Array(col).fill(0));


  displayMessage("Start Game");

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
    I: "cyan", // Neon cyan
    J: "blue", // Neon blue
    L: "orange", // Neon orange
    O: "yellow", // Neon yellow
    S: "green", // Neon green
    T: "purple", // Neon purple
    Z: "red", // Neon pink/red
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

  const draw = () => {
    if (isGameRunning) {
      drawBoard();
      drawGrid();
      // Here you would draw the current tetromino and the board
      // For example:
      // drawTetromino(currentTetromino);
      drawTetromino(
        currentTetromino.shape,
        currentTetromino.x,
        currentTetromino.y,
      ); // Example to draw tetromino I at position (0, 0)
    }
  };

  const drawBoard = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < row; y++) {
      for (let x = 0; x < col; x++) {
        if (board[y][x]) {
          drawSquare(x, y, board[y][x]);
        }
      }
    }
  };

  const drawSquare = (x, y, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(x * grid, y * grid, grid, grid);
    ctx.strokeStyle = "#333";
    ctx.strokeRect(x * grid, y * grid, grid, grid);
  };

  const drawTetromino = (tetromino, offSetX, offSetY) => {
    tetromino.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value) {
          drawSquare(
            x + offSetX,
            y + offSetY,
            colors[currentTetromino.randomlySelectedKey],
          );
        }
      });
    });
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
    } else {
      mergeTetromino();
      newTetromino();
      if (
        collisionDetection(
          currentTetromino.shape,
          currentTetromino.x,
          currentTetromino.y,
        )
      ) {
        isGameRunning = false;
        clearInterval(timerId);
        displayMessage("Game over!!");
      }
    }
  };
  const rotateTetromino = () => {
    const tempShape = currentTetromino.shape;
    currentTetromino.shape = rotateMatrix(tempShape);
  };

  const rotateMatrix = (matrix) => {
    return matrix[0].map((_, i) => matrix.map((row) => row[i]).reverse());
  };
  const gameLoop = () => {
    if (isGameRunning) {
      draw();
      //   We place moveDown to make the tetromino move down automatically, every time the game starts
      moveDown();
    }
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

  //   BONUS FUNCTION
  const drawGrid = () => {
    ctx.lineWidth = 1.1;
    ctx.strokeStyle = "#232332";
    ctx.shadowBlur = 0;

    for (let i = 1; i < row; i++) {
      let f = (canvas.width / col) * i;
      ctx.beginPath();
      ctx.moveTo(f, 0);
      ctx.lineTo(f, canvas.height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, f);
      ctx.lineTo(canvas.width, f);
      ctx.stroke();
      ctx.closePath();
    }
  };

  

  window.addEventListener("keydown", (event) => {
    if (
      !isGameRunning &&
      (event.key == "" || event.code === "Space" || event.key === 32)
    ) {
      isGameRunning = true;
      score = 0;
      updateScore();
      board.forEach((row) => row.fill(0));
      newTetromino();
      timerId = setInterval(gameLoop, 500);
    }
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
      }
      //   draw();
    }
  });

  document.addEventListener("resize", () => {
    grid = setCanvasSize();
  });
});
