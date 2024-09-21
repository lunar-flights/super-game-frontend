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
  hasEffect: boolean;
  controlledBy?: number;
  isBase: boolean;
  basePlayer?: number;
  units?: { quantity: number; stamina: number; unitType: any };
  level: number;
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
    xOffset,
    yOffset,
    isSelected,
    isAdjacent,
    hasEffect,
    controlledBy,
    isBase,
    basePlayer,
    units,
    level,
    onClick,
  }) => {
    const playerColor = controlledBy ? PLAYER_COLORS[controlledBy] : null;

    const tileImage = isBase ? `/tiles/base-${getPlayerColor(basePlayer)}.png` : `/tiles/ground.png`;

    const tileClass = `tile-container ${isBase ? "base" : "ground"} ${isSelected ? "selected" : ""} ${
      isAdjacent ? "adjacent" : ""
    }`;

    const showControlOverlay = !isBase && controlledBy;
    const infantry = units?.unitType.infantry ? units.quantity : 0;
    const mutants = units?.unitType.mutants ? units.quantity : 0;
    const stamina = units?.stamina;
    let unitClass = "";
    switch (stamina) {
      case 0:
        unitClass += " no-stamina";
        break;
      case 1:
        unitClass += " one-stamina";
        break;
    }

    return (
      <div className={tileClass} style={{ left: `${xOffset}px`, top: `${yOffset}px` }} onClick={onClick}>
        <img src={tileImage} alt="Tile" className="tile" />

        {hasEffect && <img src="/effects/attack.gif" alt="attack" className="effect" />}
        {showControlOverlay && playerColor && (
          <div className="tile-control-overlay" style={{ backgroundColor: playerColor }}></div>
        )}
        {infantry > 0 && (
          <>
            <p className={`units-amount ${unitClass}`}>{infantry}</p>
            <img src="/units/infantry-icon.png" alt="Infantry" className="unit" />
          </>
        )}
        {mutants > 0 && (
          <>
            <p className="units-amount">{mutants}</p>
            <img src="/units/alien-icon.png" alt="Mutants" className="unit mutants" />
          </>
        )}

        {!infantry && mutants === 0 && <div className="tile-overlay">LVL {level}</div>}
      </div>
    );
  }
);

export default Tile;
