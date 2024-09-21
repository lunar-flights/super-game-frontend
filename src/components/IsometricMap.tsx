import React, { useEffect, useState, useMemo } from "react";
import { PublicKey } from "@solana/web3.js";
import Tile from "./Tile";
import "./IsometricMap.css";
import { TILE_DISPLAY_WIDTH, TILE_DISPLAY_HEIGHT } from "./constants";
import { getAdjacentTiles } from "./helpers";
import soundManager from "../SoundManager";
import useProgram from "../hooks/useProgram";

const IsometricMap: React.FC<{ gameData: any; playerPublicKey: PublicKey | null; fetchGameData: () => void }> = ({
  gameData,
  playerPublicKey,
  fetchGameData,
}) => {
  const program = useProgram();
  const [selectedTile, setSelectedTile] = useState<any | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<boolean>(false);
  const [effectTile, setEffectTile] = useState<any | null>(null);
  const [controlledTiles, setControlledTiles] = useState<Set<string>>(new Set());

  useEffect(() => {
    const initialControlledTiles = new Set("");
    setControlledTiles(initialControlledTiles);
  }, [gameData]);

  const gridMap = useMemo(() => {
    const map = new Map<string, any>();

    gameData.tiles.forEach((rowTiles: any[], rowIndex: number) => {
      rowTiles.forEach((tileData: any, colIndex: number) => {
        if (tileData) {
          const { owner, level, units, isBase } = tileData;
          const isControlled = owner.toBase58() === playerPublicKey?.toBase58();

          map.set(`${rowIndex}-${colIndex}`, {
            row: rowIndex,
            col: colIndex,
            level,
            isBase: isBase || false,
            basePlayer: isControlled ? owner : undefined,
            units,
            controlledBy: owner,
          });
        }
      });
    });

    return map;
  }, [gameData, playerPublicKey]);

  const adjacentTiles = useMemo(() => {
    if (!selectedTile || !selectedTile.units) return [];

    const unitStamina = selectedTile.units.stamina;

    return getAdjacentTiles(selectedTile.row, selectedTile.col, gridMap, unitStamina);
  }, [selectedTile, gridMap]);

  const handleMoveUnit = async (fromRow: number, fromCol: number, toRow: number, toCol: number) => {
    try {
      if (!program || !playerPublicKey) return;

      const gamePublicKey = new PublicKey(gameData.gamePda);

      await program.methods
        .moveUnit(fromRow, fromCol, toRow, toCol)
        .accounts({
          game: gamePublicKey,
          player: playerPublicKey,
        })
        .rpc();

      fetchGameData();
    } catch (error) {
      console.error("Error moving unit:", error);
    }
  };

  const handleTileClick = async (row: number, col: number) => {
    const tileKey = `${row}-${col}`;
    const tileData = gridMap.get(tileKey);

    if (tileData && tileData.units && !selectedUnit) {
      if (playerPublicKey && tileData.controlledBy.toBase58() === playerPublicKey.toBase58()) {
        setSelectedUnit(true);
        setSelectedTile(tileData);
        soundManager.play("select");
      }
    } else if (selectedUnit && isAdjacentTile(row, col)) {
      const fromRow = selectedTile.row;
      const fromCol = selectedTile.col;

      setSelectedUnit(false);
      setSelectedTile(null);

      const isControlled =
        tileData && tileData.controlledBy && tileData.controlledBy.toBase58() === playerPublicKey?.toBase58();

      if (isControlled) {
        soundManager.play("walk");
        await handleMoveUnit(fromRow, fromCol, row, col);
      } else {
        setEffectTile({ row, col });
        soundManager.play("shots");
        await handleMoveUnit(fromRow, fromCol, row, col);
        setEffectTile(null);
        soundManager.stop("shots");
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

  const tiles: any[] = [];

  gameData.tiles.forEach((rowTiles: any[], rowIndex: number) => {
    rowTiles.forEach((tileData: any, colIndex: number) => {
      if (!tileData) {
        // Skip empty tiles (for diamond shaped map)
        return;
      }

      const tileKey = `${rowIndex}-${colIndex}`;
      const tileInfo = gridMap.get(tileKey);
      const isBase = tileInfo?.isBase || false;
      const basePlayer = tileInfo?.basePlayer;

      const xOffset = (colIndex - rowIndex) * (TILE_DISPLAY_WIDTH / 2);
      const yOffset = (colIndex + rowIndex) * (TILE_DISPLAY_HEIGHT / 2) - (isBase ? 48 : 0);

      const isSelected = selectedTile?.row === rowIndex && selectedTile?.col === colIndex;
      const isAdjacent = adjacentTiles.some((tile) => tile.row === rowIndex && tile.col === colIndex);
      const hasEffect = effectTile?.row === rowIndex && effectTile?.col === colIndex;

      tiles.push(
        <Tile
          key={`tile-${rowIndex}-${colIndex}`}
          rowIndex={rowIndex}
          colIndex={colIndex}
          xOffset={xOffset}
          yOffset={yOffset}
          isSelected={isSelected}
          isAdjacent={isAdjacent}
          hasEffect={hasEffect}
          controlledBy={tileInfo.controlledBy}
          isBase={isBase}
          basePlayer={basePlayer}
          units={tileInfo.units}
          level={tileInfo.level}
          onClick={() => handleTileClick(rowIndex, colIndex)}
        />
      );
    });
  });

  return (
    <div className="grid-wrapper">
      <div className="isometric-grid">{tiles}</div>
    </div>
  );
};

export default IsometricMap;
