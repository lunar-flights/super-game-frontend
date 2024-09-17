import React, { useEffect, useState, useMemo } from "react";
import { PublicKey } from "@solana/web3.js";
import Tile from "./Tile";
import "./IsometricMap.css";
import { TILE_DISPLAY_WIDTH, TILE_DISPLAY_HEIGHT } from "./constants";
import { getAdjacentTiles } from "./helpers";
import soundManager from "../SoundManager";

const IsometricMap: React.FC<{ gameData: any; playerPublicKey: PublicKey | null }> = ({
  gameData,
  playerPublicKey,
}) => {
  const smallMap = [3, 5, 7, 7, 7, 5, 3];
  const largeMap = [3, 5, 7, 9, 9, 9, 7, 5, 3];

  const tileCountsPerRow = gameData.mapSize.small ? smallMap : largeMap;
  const totalRows = tileCountsPerRow.length;
  const maxTilesInRow = Math.max(...tileCountsPerRow);

  const [selectedTile, setSelectedTile] = useState<any | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<boolean>(false);
  const [effectTile, setEffectTile] = useState<any | null>(null);
  const [controlledTiles, setControlledTiles] = useState<Set<string>>(new Set());

  // useEffect(() => {
  //   const initialControlledTiles = new Set("");
  //   setControlledTiles(initialControlledTiles);
  // }, [gameData]);

  const gridMap = useMemo(() => {
    const map = new Map<string, any>();
    let tileIndex = 0;
    for (let rowIndex = 0; rowIndex < totalRows; rowIndex++) {
      const tilesInRow = tileCountsPerRow[rowIndex];
      const emptySpaces = maxTilesInRow - tilesInRow;
      const startCol = Math.floor(emptySpaces / 2);

      for (let i = 0; i < tilesInRow; i++) {
        const colIndex = startCol + i;

        const tileData = gameData.tiles[tileIndex];
        const { owner, level, mutants, units, isBase } = tileData;
        const isControlled = owner.toBase58() === playerPublicKey?.toBase58();

        map.set(`${rowIndex}-${colIndex}`, {
          row: rowIndex,
          col: colIndex,
          tileIndex,
          level,
          mutants,
          isBase: isBase || false,
          basePlayer: isControlled ? owner : undefined,
          units,
          controlledBy: owner,
        });

        tileIndex++;
      }
    }
    return map;
  }, [gameData, totalRows, tileCountsPerRow, maxTilesInRow]);

  const adjacentTiles = useMemo(() => {
    if (!selectedTile) return [];
    return getAdjacentTiles(selectedTile.row, selectedTile.col, gridMap);
  }, [selectedTile, gridMap]);

  const handleTileClick = (row: number, col: number) => {
    const tileData = gridMap.get(`${row}-${col}`);
    if (tileData && tileData.units && tileData.units.infantry > 0) {
      // Check if the current player owns this unit
      if (playerPublicKey && tileData.controlledBy.toBase58() === playerPublicKey.toBase58()) {
        setSelectedUnit(true);
        setSelectedTile({ row, col });
        soundManager.play("select");
      }
    } else if (selectedUnit && isAdjacentTile(row, col)) {
      // Move unit to adjacent tile if it belongs to the current player
      setSelectedUnit(false);
      setSelectedTile(null);

      const tileKey = `${row}-${col}`;
      const isControlled = controlledTiles.has(tileKey);

      if (isControlled) {
        soundManager.play("walk");
      } else {
        setEffectTile({ row, col });
        soundManager.play("shots");

        // TESTING: Simulate on-chain transaction with 1 second delay
        setTimeout(() => {
          setEffectTile(null);
          soundManager.stop("shots");

          // TESTING: player captured the tile
          const newTileKey = `${row}-${col}`;
          setControlledTiles((prevControlledTiles) => {
            const updatedControlledTiles = new Set(prevControlledTiles);
            updatedControlledTiles.add(newTileKey);
            return updatedControlledTiles;
          });
        }, 1000);
      }
    } else {
      // Deselect unit and tile
      setSelectedUnit(false);
      setSelectedTile(null);
      soundManager.play("select");
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

      const tileKey = `${rowIndex}-${colIndex}`;
      const tileData = gridMap.get(tileKey);
      const isBase = tileData?.isBase || false;
      const basePlayer = tileData?.basePlayer;

      const xOffset = (colIndex - rowIndex) * (TILE_DISPLAY_WIDTH / 2);
      const yOffset = (colIndex + rowIndex) * (TILE_DISPLAY_HEIGHT / 2) - (isBase ? 48 : 0);

      const isSelected = selectedTile?.row === rowIndex && selectedTile?.col === colIndex;
      const isAdjacent = adjacentTiles.some((tile) => tile.row === rowIndex && tile.col === colIndex);
      const hasUnit = tileData?.units?.infantry > 0 || tileData?.units?.tank > 0 || tileData?.units?.plane > 0;
      const hasEffect = effectTile?.row === rowIndex && effectTile?.col === colIndex;

      // const controlledBy = tileData?.controlledBy;
      const isControlled = controlledTiles.has(tileKey);

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
          hasEffect={hasEffect}
          controlledBy={isControlled ? 4 : undefined}
          isBase={isBase}
          basePlayer={basePlayer}
          units={tileData.units}
          mutants={tileData.mutants}
          level={tileData.level}
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
