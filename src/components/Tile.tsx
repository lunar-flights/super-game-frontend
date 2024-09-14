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
  onClick: () => void;
}

const Tile: React.FC<TileProps> = React.memo(
  ({ rowIndex, colIndex, xOffset, yOffset, isSelected, isAdjacent, hasUnit, hasEffect, controlledBy, onClick }) => {
    const playerColor = controlledBy ? PLAYER_COLORS[controlledBy] : null;

    return (
      <div
        className={`tile-container ${isSelected ? "selected" : ""} ${isAdjacent ? "adjacent" : ""}`}
        style={{ left: `${xOffset}px`, top: `${yOffset}px` }}
        onClick={onClick}
      >
        <img src={process.env.PUBLIC_URL + "/tiles/ground.png"} alt="Tile" className="tile" />
        {hasEffect && <img src={process.env.PUBLIC_URL + "/effects/attack.gif"} alt="Effect" className="effect" />}
        {playerColor && <div className="tile-control-overlay" style={{ backgroundColor: playerColor }}></div>}
        {hasUnit && (
          <>
            <p className="units-amount">12</p>
            <img src={process.env.PUBLIC_URL + "/units/unit.png"} alt="Unit" className="unit" />
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
