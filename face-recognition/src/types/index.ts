export interface Face {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface CameraSettings {
  facingMode: 'user' | 'environment';
  width: number;
  height: number;
}