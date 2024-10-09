const GameOverModal = ({ winner, onClose }: { winner: any; onClose: () => void }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Game Over</h2>
        {winner ? <p>Winner: {winner.pubkey.toBase58()}</p> : <p>The game ended in a draw.</p>}
        <button onClick={onClose}>Return to Home Page</button>
      </div>
    </div>
  );
};

export default GameOverModal;
