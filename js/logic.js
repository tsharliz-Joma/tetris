document.addEventListener(`DOMContentLoaded`, () => {
  const canvas = document.querySelector(`canvas`);
  const ctx = canvas.getContext("2d");
  let isGameRunning = false;
  let timerId;
  let score = 0;
  const grid = 30;
  const row = canvas.height / grid;
  const col = Math.floor(canvas.width / grid);
  let currentTetromino;
  const board = Array.from({length: row}, () => Array(col).fill(0));

  console.log(board);
  console.log(ctx);

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
    S: [[0, 1, 1, [1, 1, 0]]],
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

  window.addEventListener("keydown", (event) => {
    if (
      !isGameRunning &&
      (event.key == "" || event.code === "Space" || event.key === 32)
    ) {
      isGameRunning = true;
      newTetromino();
      draw();
    }
  });

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
  };

  const drawTetromino = (tetromino, offSetX, offSetY) => {
    tetromino.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value) {
        }
      });
    });
  };
});
