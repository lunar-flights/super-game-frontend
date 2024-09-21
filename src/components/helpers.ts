export const getAdjacentTiles = (row: number, col: number, gridMap: Map<string, any>, stamina: number): any[] => {
  // UP, DOWN, LEFT, RIGHT
  // UP-LEFT, UP-RIGHT, DOWN-LEFT, DOWN-RIGHT
  // diagonal movement costs 2 stamina, normal movement costs 1
  const directions = [
    { dr: -1, dc: 0, cost: 1 },
    { dr: 1, dc: 0, cost: 1 },
    { dr: 0, dc: -1, cost: 1 },
    { dr: 0, dc: 1, cost: 1 },
    { dr: -1, dc: -1, cost: 2 },
    { dr: -1, dc: 1, cost: 2 },
    { dr: 1, dc: -1, cost: 2 },
    { dr: 1, dc: 1, cost: 2 },
  ];

  const adjacentTiles: any[] = [];

  directions.forEach(({ dr, dc, cost }) => {
    if (cost > stamina) {
      return;
    }

    const newRow = row + dr;
    const newCol = col + dc;
    const tileKey = `${newRow}-${newCol}`;
    const tile = gridMap.get(tileKey);

    if (tile) {
      adjacentTiles.push({ ...tile, moveCost: cost });
    }
  });

  return adjacentTiles;
};
