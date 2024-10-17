import React, { useState, useMemo } from "react";
import { toast } from "react-toastify";
import { Tooltip as ReactTooltip } from "react-tooltip";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShieldHalved } from "@fortawesome/free-solid-svg-icons";
import BuildModal from "./BuildModal";
import "./ProductionPanel.css";

interface ProductionPanelProps {
  tileData: any;
  playerBalance: number;
  onRecruitUnits: (unitType: string, quantity: number) => Promise<void>;
  onUpgradeBase: () => Promise<void>;
  onBuildConstruction: (buildingType: any) => Promise<void>;
  onClose: () => void;
}

const ProductionPanel: React.FC<ProductionPanelProps> = ({
  tileData,
  playerBalance,
  onRecruitUnits,
  onUpgradeBase,
  onBuildConstruction,
  onClose,
}) => {
  const [selectedUnitType, setSelectedUnitType] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [isProducing, setIsProducing] = useState<boolean>(false);
  const [isUpgrading, setIsUpgrading] = useState<boolean>(false);
  const [isBuildModalOpen, setIsBuildModalOpen] = useState<boolean>(false);

  const isBaseTile = useMemo(() => {
    return tileData && tileData.building && tileData.building.buildingType.base;
  }, [tileData]);

  const baseLevel = isBaseTile ? tileData.building.level : 0;

  const getUpgradeCost = (currentLevel: number): number => {
    if (currentLevel === 1) return 12;
    if (currentLevel === 2) return 22;
    return 0;
  };

  const getTileYield = (tileData: any): number => {
    if (!tileData) return 0;
    const { level, building } = tileData;
    let tileYield = 0;
    if (level === 3) {
      tileYield = 1;
    }
    if (building && building.buildingType.base) {
      switch (building.level) {
        case 1:
          tileYield += 3;
          break;
        case 2:
          tileYield += 4;
          break;
        case 3:
          tileYield += 6;
          break;
        default:
          tileYield += 0;
      }
    }
    if (building && building.buildingType.gasPlant) {
      tileYield += 1;
    }

    return tileYield;
  };

  const getTileDefense = (tileData: any): number => {
    if (!tileData) return 0;
    const { level, building } = tileData;
    let tileDefense = level;
    if (building && building.buildingType.base) {
      switch (building.level) {
        case 1:
          tileDefense += 12;
          break;
        case 2:
          tileDefense += 16;
          break;
        case 3:
          tileDefense += 24;
          break;
        default:
          tileDefense += 0;
      }
    }
    return tileDefense;
  };

  const getNextCapitalStats = (tileData: any): string => {
    if (!tileData) return "";
    const { building } = tileData;
    let stats = "";
    if (building && building.buildingType.base) {
      switch (building.level) {
        case 1:
          stats = "+4 defense, +1 yield";
          break;
        case 2:
          stats = "+8 defense, +2 yield";
          break;
        case 3:
          stats = "Max level";
          break;
        default:
          stats = "";
      }
    }
    return stats;
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

  const handleBuildConstruction = async (buildingType: string) => {
    const buildingTypeMap: { [key: string]: any } = {
      GasPlant: { gasPlant: {} },
      TankFactory: { tankFactory: {} },
      PlaneFactory: { planeFactory: {} },
    };

    const selectedBuildingType = buildingTypeMap[buildingType];

    if (!selectedBuildingType) {
      toast.error("Invalid building type selected.");
      return;
    }

    if (playerBalance < 12) {
      toast.error("Not enough balance to build this structure.");
      return;
    }

    try {
      await onBuildConstruction(selectedBuildingType);
      setIsBuildModalOpen(false);
    } catch (error) {
      console.error("Error building construction:", error);
      toast.error("Error building construction.");
    }
  };

  const handleOpenBuildModal = () => {
    setIsBuildModalOpen(true);
  };

  const handleCloseBuildModal = () => {
    setIsBuildModalOpen(false);
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
            data-tooltip-id="infantry-tooltip"
            data-tooltip-content="Infantry: 1 strength, 1 stamina"
          />
          <div
            data-tooltip-id="tank-tooltip"
            data-tooltip-content={availableUnitTypes.Tank ? "Tank: 3 strength, 3 stamina" : "Tank factory needed"}
          >
            <img
              src="/units/tank-icon.png"
              alt="Tank"
              className={`unit-icon ${availableUnitTypes.Tank ? "" : "disabled"} ${
                selectedUnitType === "Tank" ? "selected" : ""
              }`}
              onClick={() => handleUnitTypeSelect("Tank")}
            />
          </div>
          <div
            data-tooltip-id="tank-tooltip"
            data-tooltip-content={availableUnitTypes.Tank ? "Plane: 4 strength, 5 stamina" : "Plane factory needed"}
          >
            <img
              src="/units/plane-icon.png"
              alt="Plane"
              className={`unit-icon ${availableUnitTypes.Plane ? "" : "disabled"} ${
                selectedUnitType === "Plane" ? "selected" : ""
              }`}
              onClick={() => handleUnitTypeSelect("Plane")}
            />
          </div>
          <ReactTooltip place="top" id="infantry-tooltip" />
          <ReactTooltip place="top" id="tank-tooltip" />
          <ReactTooltip place="top" id="plane-tooltip" />
        </div>
        {!selectedUnitType && <p className="production-hint">Select unit type</p>}
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
        <div className="tile-info">
          <div className="tile-stats">
            <div className="tile-info-item" data-tooltip-id={`defense-bonus`} data-tooltip-content="Defense bonus">
              <FontAwesomeIcon icon={faShieldHalved} />
              <span>{getTileDefense(tileData)}</span>
            </div>
            <div className="tile-info-item" data-tooltip-id={`yield-per-turn`} data-tooltip-content="Yield per turn">
              <img src="/ui/credits.png" width="16" alt="Yield" />
              <span>{getTileYield(tileData)}</span>
            </div>
            <ReactTooltip place="top" id="defense-bonus" />
            <ReactTooltip place="top" id="yield-per-turn" />
          </div>

          {isBaseTile && (
            <div className="upgrade-section">
              {maxLevelReached ? (
                <button className="upgrade-button" disabled>
                  Max level
                </button>
              ) : (
                <div data-tooltip-id="capital-stats" data-tooltip-content={getNextCapitalStats(tileData)}>
                  <button className="upgrade-button" onClick={handleUpgradeBase} disabled={!canUpgrade || isUpgrading}>
                    {isUpgrading ? (
                      <>
                        <span className="spinner"></span>
                      </>
                    ) : (
                      <>
                        Upgrade:
                        <span className="upgrade-cost">
                          {upgradeCost}
                          <img src="/ui/credits.png" width="16" alt="Credits" />
                        </span>
                      </>
                    )}
                  </button>
                  <ReactTooltip place="top" id="capital-stats" />
                </div>
              )}
            </div>
          )}
          {!isBaseTile && (
            <div className="upgrade-section">
              <button className="upgrade-button" onClick={handleOpenBuildModal}>
                Build
              </button>
            </div>
          )}
        </div>
      </div>
      {isBuildModalOpen && (
        <BuildModal playerBalance={playerBalance} onBuild={handleBuildConstruction} onClose={handleCloseBuildModal} />
      )}
    </div>
  );
};

export default ProductionPanel;
