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
