import React, { useState } from "react";
import { PublicKey } from "@solana/web3.js";
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
  controlledBy?: any;
  controlledByIndex?: number;
  isBase: boolean;
  basePlayer?: number;
  units?: { quantity: number; stamina: number; unitType: any };
  level: number;
  selectedUnit: boolean;
  selectedTile: any;
  playerPublicKey: any;
  building: any;
  onClick: () => void;
}

// temp utility function to test the map generation
function getPlayerColor(playerNumber?: number): string {
  switch (playerNumber) {
    case 0:
      return "red";
    case 1:
      return "orange";
    case 2:
      return "green";
    case 3:
      return "blue";
    default:
      return "orange";
  }
}

function getGroundImage(playerNumber?: number): string {
  switch (playerNumber) {
    case 0:
      return "/tiles/ground-red.png";
    case 1:
      return "/tiles/ground-orange.png";
    case 2:
      return "/tiles/ground-green.png";
    case 3:
      return "/tiles/ground-blue.png";
    default:
      return "/tiles/ground.png";
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
    controlledByIndex,
    isBase,
    basePlayer,
    units,
    level,
    selectedUnit,
    selectedTile,
    playerPublicKey,
    building,
    onClick,
  }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const [tooltipContent, setTooltipContent] = useState("");

    const getUnitStrength = (unitType: any): number => {
      if (unitType.infantry) return 1;
      if (unitType.mutants) return 1;
      if (unitType.tank) return 3;
      if (unitType.plane) return 5;
      return 0;
    };

    const getBuildingStrength = (building: any): number => {
      if (building.buildingType.base) {
        switch (building.level) {
          case 1:
            return 12;
          case 2:
            return 16;
          case 3:
            return 24;
          default:
            return 0;
        }
      }
      if (building.buildingType.fort) return 7;
      return 0;
    };

    const getTileBonus = (level: number, owner: any): number => {
      const defaultPubkey = new PublicKey(new Uint8Array(32).fill(0));
      if (owner.equals(defaultPubkey)) {
        return 0;
      }

      switch (level) {
        case 1:
          return 1;
        case 2:
          return 2;
        case 3:
          return 3;
        default:
          return 0;
      }
    };

    const handleMouseEnter = () => {
      if (!selectedUnit || !selectedTile || !isAdjacent) return;

      if (controlledBy && playerPublicKey && controlledBy.toBase58() !== playerPublicKey.toBase58()) {
        const playerUnits = selectedTile.units;
        const playerUnitQuantity = playerUnits.quantity;
        const playerUnitStrength = getUnitStrength(playerUnits.unitType);
        const playerStrength = playerUnitQuantity * playerUnitStrength;

        let enemyStrength = 0;

        if (units) {
          const enemyUnitQuantity = units.quantity;
          const enemyUnitStrength = getUnitStrength(units.unitType);
          enemyStrength += enemyUnitQuantity * enemyUnitStrength;
        }

        const tileBonus = getTileBonus(level, controlledBy);
        enemyStrength += tileBonus;

        if (building) {
          const buildingStrength = getBuildingStrength(building);
          console.log("buildingStrength", buildingStrength);
          enemyStrength += buildingStrength;
        }

        const content = `Your Strength: ${playerStrength}\nEnemy Strength: ${enemyStrength}`;
        setTooltipContent(content);
        setShowTooltip(true);
      }
    };

    const handleMouseLeave = () => {
      setShowTooltip(false);
    };

    const playerColor = controlledByIndex !== undefined ? PLAYER_COLORS[controlledByIndex] : null;

    const tileImage = isBase ? `/tiles/base-${getPlayerColor(controlledByIndex)}.png` : "/tiles/ground.png"; // getGroundImage(controlledByIndex);

    const tileClass = `tile-container ${isBase ? "base" : "ground"} ${isSelected ? "selected adjacent" : ""} ${
      isAdjacent ? "adjacent" : ""
    }`;

    const showControlOverlay = !isBase && controlledByIndex !== undefined;
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
      <div
        className={tileClass}
        style={{ left: `${xOffset}px`, top: `${yOffset}px` }}
        onClick={onClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <img src={tileImage} alt="Tile" className="tile" />

        {hasEffect && <img src="/effects/attack.gif" alt="attack" className="effect" />}
        {showControlOverlay && playerColor && (
          <div className="tile-control-overlay" style={{ backgroundColor: playerColor }}></div>
        )}
        {infantry > 0 && (
          <>
            <p className={`units-amount ${unitClass}`}>{infantry}</p>
            <img
              src="/units/infantry-icon.png"
              alt="Infantry"
              className="unit"
              style={{ borderColor: playerColor || "none" }}
            />
          </>
        )}
        {mutants > 0 && (
          <>
            <p className="units-amount">{mutants}</p>
            <img src="/units/alien-icon.png" alt="Mutants" className="unit mutants" />
          </>
        )}

        {!infantry && mutants === 0 && <div className="tile-overlay">LVL {level}</div>}
        {showTooltip && <div className="tooltip">{tooltipContent}</div>}
      </div>
    );
  }
);

export default Tile;
