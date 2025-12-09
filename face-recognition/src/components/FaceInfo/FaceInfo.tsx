import React from 'react';
import styles from './FaceInfo.module.css';
import { Face } from '../../types';

interface FaceInfoProps {
  face: Face;
}

const FaceInfo: React.FC<FaceInfoProps> = ({ face }) => {
  return (
    <div className={styles.faceInfo}>
      <p><strong>Name:</strong> {face.name}</p>
      <p><strong>Age:</strong> {face.age}</p>
      <p><strong>Gender:</strong> {face.gender}</p>
    </div>
  );
};

export default FaceInfo;