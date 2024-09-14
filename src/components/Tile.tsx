import React from "react";
import "./Tile.css";
import { PLAYER_COLORS } from "./constants";

interface TileProps {
  rowIndex: number;
  colIndex: number;
  xOffset: number;
  yOffset: number;
  isSelected: boolean;
  isAdjacent: boolean;
  hasUnit: boolean;
  hasEffect: boolean;
  controlledBy?: number;
  isBase: boolean;
  basePlayer?: number;
  onClick: () => void;
}

// temp utility function to test the map generation
function getPlayerColor(playerNumber?: number): string {
  switch (playerNumber) {
    case 1:
      return "red";
    case 2:
      return "orange";
    case 3:
      return "green";
    case 4:
      return "blue";
    default:
      return "orange";
  }
}

const Tile: React.FC<TileProps> = React.memo(
  ({
    rowIndex,
    colIndex,
    xOffset,
    yOffset,
    isSelected,
    isAdjacent,
    hasUnit,
    hasEffect,
    controlledBy,
    isBase,
    basePlayer,
    onClick,
  }) => {
    const playerColor = controlledBy ? PLAYER_COLORS[controlledBy] : null;

    const tileImage = isBase ? `/tiles/base-${getPlayerColor(basePlayer)}.png` : `/tiles/ground.png`;

    const tileClass = `tile-container ${isBase ? "base" : "ground"} ${isSelected ? "selected" : ""} ${
      isAdjacent ? "adjacent" : ""
    }`;

    const showControlOverlay = !isBase && controlledBy;

    return (
      <div className={tileClass} style={{ left: `${xOffset}px`, top: `${yOffset}px` }} onClick={onClick}>
        <img src={tileImage} alt="Tile" className="tile" />

        {hasEffect && <img src="/effects/attack.gif" alt="attack" className="effect" />}
        {showControlOverlay && playerColor && (
          <div className="tile-control-overlay" style={{ backgroundColor: playerColor }}></div>
        )}
        {hasUnit && (
          <>
            <p className="units-amount">12</p>
            <img src="/units/unit.png" alt="Unit" className="unit" />
          </>
        )}
        <div className="tile-overlay" style={{ display: "none" }}>
          {rowIndex}, {colIndex}
        </div>
      </div>
    );
  }
);

export default Tile;
