import React from 'react';

interface ControlsProps {
  onStart: () => void;
  onStop: () => void;
}

const Controls: React.FC<ControlsProps> = ({ onStart, onStop }) => {
  return (
    <div className="controls">
      <button onClick={onStart}>Start Webcam</button>
      <button onClick={onStop}>Stop Webcam</button>
    </div>
  );
};

export default Controls;