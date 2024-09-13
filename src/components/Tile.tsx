import React from "react";
import "./Tile.css";

interface TileProps {
  rowIndex: number;
  colIndex: number;
  xOffset: number;
  yOffset: number;
  isSelected: boolean;
  isAdjacent: boolean;
  hasUnit: boolean;
  onClick: () => void;
}

const Tile: React.FC<TileProps> = React.memo(
  ({ rowIndex, colIndex, xOffset, yOffset, isSelected, isAdjacent, hasUnit, onClick }) => {
    return (
      <div
        className={`tile-container ${isSelected ? "selected" : ""} ${isAdjacent ? "adjacent" : ""}`}
        style={{ left: `${xOffset}px`, top: `${yOffset}px` }}
        onClick={onClick}
      >
        <img src={process.env.PUBLIC_URL + "/tiles/ground.png"} alt="Tile" className="tile" />
        {hasUnit && <img src={process.env.PUBLIC_URL + "/units/unit.png"} alt="Unit" className="unit" />}
        <div className="tile-overlay">
          {rowIndex}, {colIndex}
        </div>
      </div>
    );
  }
);

export default Tile;
