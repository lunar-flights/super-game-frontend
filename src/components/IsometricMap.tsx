import React, { useState, useMemo } from "react";
import Tile from "./Tile";
import "./IsometricMap.css";
import { TILE_DISPLAY_WIDTH, TILE_DISPLAY_HEIGHT } from "./constants";
import { getAdjacentTiles } from "./helpers";

const IsometricMap: React.FC = () => {
  const tileCountsPerRow = [3, 5, 7, 9, 9, 9, 7, 5, 3];
  const totalRows = tileCountsPerRow.length;
  const maxTilesInRow = Math.max(...tileCountsPerRow);

  const [unitPosition, setUnitPosition] = useState<{ row: number; col: number }>({
    row: 4,
    col: 4,
  });

  const [selectedTile, setSelectedTile] = useState<{ row: number; col: number } | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<boolean>(false);

  const gridMap = useMemo(() => {
    const map = new Map<string, { row: number; col: number }>();
    for (let rowIndex = 0; rowIndex < totalRows; rowIndex++) {
      const tilesInRow = tileCountsPerRow[rowIndex];
      const emptySpaces = maxTilesInRow - tilesInRow;
      const startCol = Math.floor(emptySpaces / 2);

      for (let i = 0; i < tilesInRow; i++) {
        const colIndex = startCol + i;
        map.set(`${rowIndex}-${colIndex}`, { row: rowIndex, col: colIndex });
      }
    }
    return map;
  }, []);

  const adjacentTiles = useMemo(() => {
    if (!selectedTile) return [];
    return getAdjacentTiles(selectedTile.row, selectedTile.col, gridMap);
  }, [selectedTile, gridMap]);

  const handleTileClick = (row: number, col: number) => {
    if (unitPosition.row === row && unitPosition.col === col) {
      // Select unit on a tile
      setSelectedUnit(true);
      setSelectedTile({ row, col });
    } else if (selectedUnit && isAdjacentTile(row, col)) {
      // Move unit to adjacent tile
      setUnitPosition({ row, col });
      setSelectedUnit(false);
      setSelectedTile(null);
    } else {
      // Deselect unit and tile
      setSelectedUnit(false);
      setSelectedTile(null);
    }
  };

  const isAdjacentTile = (row: number, col: number) => {
    return adjacentTiles.some((tile) => tile.row === row && tile.col === col);
  };

  const tiles = [];
  for (let rowIndex = 0; rowIndex < totalRows; rowIndex++) {
    const tilesInRow = tileCountsPerRow[rowIndex];
    const emptySpaces = maxTilesInRow - tilesInRow;
    const startCol = Math.floor(emptySpaces / 2);

    for (let i = 0; i < tilesInRow; i++) {
      const colIndex = startCol + i;

      const xOffset = (colIndex - rowIndex) * (TILE_DISPLAY_WIDTH / 2);
      const yOffset = (colIndex + rowIndex) * (TILE_DISPLAY_HEIGHT / 2);

      const isSelected = selectedTile?.row === rowIndex && selectedTile?.col === colIndex;
      const isAdjacent = adjacentTiles.some((tile) => tile.row === rowIndex && tile.col === colIndex);
      const hasUnit = unitPosition.row === rowIndex && unitPosition.col === colIndex;

      tiles.push(
        <Tile
          key={`tile-${rowIndex}-${colIndex}`}
          rowIndex={rowIndex}
          colIndex={colIndex}
          xOffset={xOffset}
          yOffset={yOffset}
          isSelected={isSelected}
          isAdjacent={isAdjacent}
          hasUnit={hasUnit}
          onClick={() => handleTileClick(rowIndex, colIndex)}
        />
      );
    }
  }

  return (
    <div className="grid-wrapper">
      <div className="isometric-grid">{tiles}</div>
    </div>
  );
};

export default IsometricMap;
