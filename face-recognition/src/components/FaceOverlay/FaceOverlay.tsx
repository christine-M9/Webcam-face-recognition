import React from 'react';
import styles from './FaceOverlay.module.css';
import { Face } from '../../types';

interface FaceOverlayProps {
  faces: Face[];
}

const FaceOverlay: React.FC<FaceOverlayProps> = ({ faces }) => {
  return (
    <div className={styles.overlay}>
      {faces.map((face) => (
        <div
          key={face.id}
          className={styles.faceBox}
          style={{
            left: face.position.x,
            top: face.position.y,
            width: face.position.width,
            height: face.position.height,
          }}
        >
          <div className={styles.faceInfo}>
            <p>Name: {face.name}</p>
            <p>Age: {face.age}</p>
            <p>Gender: {face.gender}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FaceOverlay;