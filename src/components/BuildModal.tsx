import React from "react";
import "./BuildModal.css";

interface BuildModalProps {
  playerBalance: number;
  onBuild: (buildingType: string) => Promise<void>;
  onClose: () => void;
}

const BuildModal: React.FC<BuildModalProps> = ({ playerBalance, onBuild, onClose }) => {
  const buildings = [
    {
      type: "GasPlant",
      title: "Gas Plant",
      description: "Generates +1$ per turn.",
      image: "/tiles/gas-plant.png",
      cost: 12,
    },
    {
      type: "TankFactory",
      title: "Tank Factory",
      description: "Unlocks tanks.",
      image: "/tiles/tank-factory.png",
      cost: 12,
    },
    {
      type: "PlaneFactory",
      title: "Plane Factory",
      description: "Unlocks planes.",
      image: "/tiles/plane-factory.png",
      cost: 12,
    },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="build-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title"></h2>
        <div className="buildings-container">
          {buildings.map((building) => {
            const canAfford = playerBalance >= building.cost;
            return (
              <div key={building.type} className="building-card">
                <img src={building.image} alt={building.title} className="building-image" />
                <h3 className="building-title">{building.title}</h3>
                <p className="building-description">{building.description}</p>
                <button className="build-button" onClick={() => onBuild(building.type)} disabled={!canAfford}>
                  Build for {building.cost} <img src="/ui/credits.png" alt="Credits" className="credits-icon" />
                </button>
              </div>
            );
          })}
        </div>
        <button className="close-modal-button" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};

export default BuildModal;
