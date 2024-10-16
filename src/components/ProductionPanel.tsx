import React, { useState, useMemo } from "react";
import { toast } from "react-toastify";
import { Tooltip as ReactTooltip } from "react-tooltip";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShieldHalved } from "@fortawesome/free-solid-svg-icons";
import "./ProductionPanel.css";

interface ProductionPanelProps {
  tileData: any;
  playerBalance: number;
  onRecruitUnits: (unitType: string, quantity: number) => Promise<void>;
  onUpgradeBase: () => Promise<void>;
  onClose: () => void;
}

const ProductionPanel: React.FC<ProductionPanelProps> = ({
  tileData,
  playerBalance,
  onRecruitUnits,
  onUpgradeBase,
  onClose,
}) => {
  const [selectedUnitType, setSelectedUnitType] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [isProducing, setIsProducing] = useState<boolean>(false);
  const [isUpgrading, setIsUpgrading] = useState<boolean>(false);

  const isBaseTile = useMemo(() => {
    return tileData && tileData.building && tileData.building.buildingType.base;
  }, [tileData]);

  const baseLevel = isBaseTile ? tileData.building.level : 0;

  const getUpgradeCost = (currentLevel: number): number => {
    if (currentLevel === 1) return 12;
    if (currentLevel === 2) return 22;
    return 0;
  };

  const upgradeCost = getUpgradeCost(baseLevel);
  const canUpgrade = baseLevel < 3 && playerBalance >= upgradeCost;
  const maxLevelReached = baseLevel >= 3;

  // Infantry can be recruited on any tile controlled by the player
  // Tank and Plane can be recruited only on tiles with tank and plane factories
  const availableUnitTypes = useMemo(() => {
    const types: { [key: string]: boolean } = {
      Infantry: true,
      Tank: false,
      Plane: false,
    };
    const building = tileData.building;
    if (building) {
      if (building.buildingType.tankFactory) {
        types.Tank = true;
      }
      if (building.buildingType.planeFactory) {
        types.Plane = true;
      }
    }
    return types;
  }, [tileData]);

  const unitCosts: { [key: string]: number } = {
    Infantry: 1,
    Tank: 3,
    Plane: 5,
  };

  const maxQuantity = useMemo(() => {
    if (!selectedUnitType) return 0;
    const unitCost = unitCosts[selectedUnitType];
    return Math.floor(playerBalance / unitCost);
  }, [selectedUnitType, playerBalance]);

  const handleUnitTypeSelect = (unitType: string) => {
    if (availableUnitTypes[unitType]) {
      setSelectedUnitType(unitType);
      setQuantity(1);
    }
  };

  const handleQuantityChange = (value: number) => {
    const newValue = Math.max(1, Math.min(value, maxQuantity));
    setQuantity(newValue);
  };

  const handleProduce = async () => {
    if (selectedUnitType && quantity > 0) {
      const unitCost = unitCosts[selectedUnitType];
      const totalCost = unitCost * quantity;

      if (playerBalance < totalCost) {
        toast.error("Not enough balance to produce units");
        return;
      }

      setIsProducing(true);
      try {
        await onRecruitUnits(selectedUnitType, quantity);
      } catch (error) {
        console.error("Error producing units:", error);
        toast.error("Error producing units.");
      } finally {
        setIsProducing(false);
      }
    }
  };

  const handleUpgradeBase = async () => {
    setIsUpgrading(true);
    try {
      await onUpgradeBase();
    } catch (error) {
      console.error("Error upgrading base:", error);
      toast.error("Error upgrading base.");
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <div>
      <div className="production-panel">
        <div className="production-title">PRODUCTION</div>
        <div className="unit-icons">
          <img
            src="/units/infantry-icon.png"
            alt="Infantry"
            className={`unit-icon ${availableUnitTypes.Infantry ? "" : "disabled"} ${
              selectedUnitType === "Infantry" ? "selected" : ""
            }`}
            onClick={() => handleUnitTypeSelect("Infantry")}
          />
          <img
            src="/units/tank-icon.png"
            alt="Tank"
            className={`unit-icon ${availableUnitTypes.Tank ? "" : "disabled"} ${
              selectedUnitType === "Tank" ? "selected" : ""
            }`}
            onClick={() => handleUnitTypeSelect("Tank")}
          />
          <img
            src="/units/plane-icon.png"
            alt="Plane"
            className={`unit-icon ${availableUnitTypes.Plane ? "" : "disabled"} ${
              selectedUnitType === "Plane" ? "selected" : ""
            }`}
            onClick={() => handleUnitTypeSelect("Plane")}
          />
        </div>
        {selectedUnitType && (
          <>
            <div className="quantity-selector">
              <input
                type="range"
                min="1"
                max={maxQuantity}
                value={quantity}
                onChange={(e) => handleQuantityChange(parseInt(e.target.value))}
              />
              <input
                type="number"
                min="1"
                max={maxQuantity}
                value={quantity}
                onChange={(e) => handleQuantityChange(parseInt(e.target.value))}
              />
            </div>
            <button className="produce-button" onClick={handleProduce} disabled={isProducing}>
              {isProducing ? (
                <>
                  <span className="spinner"></span>
                </>
              ) : (
                "PRODUCE"
              )}
            </button>
          </>
        )}
        <button className="close-button" onClick={onClose}>
          X
        </button>
      </div>
      <div className="tile-info-container">
        {isBaseTile && (
          <div className="upgrade-section">
            {maxLevelReached ? (
              <button className="upgrade-button" disabled>
                Max level reached
              </button>
            ) : (
              <button className="upgrade-button" onClick={handleUpgradeBase} disabled={!canUpgrade || isUpgrading}>
                {isUpgrading ? (
                  <>
                    <span className="spinner"></span>
                  </>
                ) : (
                  `Upgrade Capital for ${upgradeCost}`
                )}
              </button>
            )}
          </div>
        )}
        {!isBaseTile && (
          <div className="tile-info">
            <div className="tile-info-item" data-tooltip-id={`defense-bonus`} data-tooltip-content="Defense bonus">
              <FontAwesomeIcon icon={faShieldHalved} />
              <span>{` ${tileData.level}`}</span>
            </div>
            <div className="tile-info-item" data-tooltip-id={`yield-per-turn`} data-tooltip-content="Yield per turn">
              <img src="/ui/credits.png" width="16" alt="Yield" />
              <span>{tileData.level === 3 ? 1 : 0}</span>
            </div>
            <ReactTooltip place="top" id="defense-bonus" />
            <ReactTooltip place="top" id="yield-per-turn" />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductionPanel;
