export const getAdjacentTiles = (row: number, col: number, gridMap: Map<string, { row: number; col: number }>) => {
  const potentialAdjacentTiles = [
    { row: row - 1, col },
    { row: row + 1, col },
    { row, col: col - 1 },
    { row, col: col + 1 },
  ];

  return potentialAdjacentTiles.filter(({ row, col }) => gridMap.has(`${row}-${col}`));
};
