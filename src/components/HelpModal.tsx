import React from "react";
import "./HelpModal.css";

interface HelpModalProps {
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="help-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-modal-button" onClick={onClose}>
          &times;
        </button>
        <div className="modal-content">
          <h2>The Goal</h2>
          <p>
            The goal is to destroy the capitals of other players and be the last player standing. When a player is
            eliminated, their base tile is captured by the player who destroyed it, while all their other tiles are
            removed from the game, creating "holes" in the grid.
          </p>

          <h2>Units</h2>
          <p>Each unit type has different costs, stamina, and strength. Mutants are neutral NPC units.</p>

          <table>
            <thead>
              <tr>
                <th>Unit Type</th>
                <th>Cost</th>
                <th>Stamina</th>
                <th>Strength</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Infantry</td>
                <td>1</td>
                <td>1</td>
                <td>1</td>
                <td>Basic unit that can be acquired on any tile controlled by a player.</td>
              </tr>
              <tr>
                <td>Tank</td>
                <td>3</td>
                <td>3</td>
                <td>3</td>
                <td>
                  Advanced unit that can be purchased only in a Tank Factory. Can attack diagonal tiles and move after
                  attacks.
                </td>
              </tr>
              <tr>
                <td>Plane</td>
                <td>5</td>
                <td>5</td>
                <td>4</td>
                <td>
                  Advanced unit that can be purchased only in a Plane Factory. Can attack diagonal tiles and move after
                  attacks.
                </td>
              </tr>
              <tr>
                <td>Mutants</td>
                <td>0</td>
                <td>0</td>
                <td>1</td>
                <td>Neutral units, same strength as infantry, cannot move.</td>
              </tr>
            </tbody>
          </table>

          <h2>Buildings</h2>
          <p>Buildings can either produce resources per turn or unlock advanced units for production.</p>

          <table>
            <thead>
              <tr>
                <th>Building Type</th>
                <th>Level</th>
                <th>Yield per Turn</th>
                <th>Unlocks / Description</th>
                <th>Strength</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Capital</td>
                <td>1</td>
                <td>3</td>
                <td>Players are eliminated if their Capital is destroyed.</td>
                <td>12</td>
              </tr>
              <tr>
                <td>Capital</td>
                <td>2</td>
                <td>4</td>
                <td></td>
                <td>16</td>
              </tr>
              <tr>
                <td>Capital</td>
                <td>3</td>
                <td>6</td>
                <td></td>
                <td>24</td>
              </tr>
              <tr>
                <td>Gas Plant</td>
                <td>-</td>
                <td>1</td>
                <td>Generates extra resources per turn.</td>
                <td>-</td>
              </tr>
              <tr>
                <td>Tank Factory</td>
                <td>-</td>
                <td>0</td>
                <td>Unlocks the ability to produce tanks.</td>
                <td>-</td>
              </tr>
              <tr>
                <td>Plane Factory</td>
                <td>-</td>
                <td>0</td>
                <td>Unlocks the ability to produce planes.</td>
                <td>-</td>
              </tr>
              <tr>
                <td>Fort</td>
                <td>-</td>
                <td>0</td>
                <td>Increases defense strength of a tile.</td>
                <td>7</td>
              </tr>
            </tbody>
          </table>

          <h2>Tile Types</h2>

          <table>
            <thead>
              <tr>
                <th>Tile Level</th>
                <th>Yield</th>
                <th>Defense Bonus (Non-Mutants)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td>0</td>
                <td>1</td>
              </tr>
              <tr>
                <td>2</td>
                <td>0</td>
                <td>2</td>
              </tr>
              <tr>
                <td>3</td>
                <td>1</td>
                <td>3</td>
              </tr>
            </tbody>
          </table>

          <ul>
            <li>
              <strong>Neutral Tiles</strong>: These tiles are occupied by mutants but offer no defense bonuses to them.
            </li>
            <li>
              <strong>Defense Bonus</strong>: The defense bonus applies to any player's troops positioned in a tile.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
