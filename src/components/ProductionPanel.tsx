import React, { useState, useMemo } from "react";
import { toast } from "react-toastify";
import "./ProductionPanel.css";

interface ProductionPanelProps {
  tileData: any;
  playerBalance: number;
  onRecruitUnits: (unitType: string, quantity: number) => Promise<void>;
  onClose: () => void;
}

const ProductionPanel: React.FC<ProductionPanelProps> = ({ tileData, playerBalance, onRecruitUnits, onClose }) => {
  const [selectedUnitType, setSelectedUnitType] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [isProducing, setIsProducing] = useState<boolean>(false);

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

  return (
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
  );
};

export default ProductionPanel;
