// landmarkUtils.ts
// Utilities for landmark math

export type Landmark = { x: number, y: number, z?: number };

export function averageXY(landmarks: Landmark[], canvasWidth: number, canvasHeight: number) {
  const sumCoordinates = landmarks.reduce((accumulator, landmark) => ({
    x: accumulator.x + landmark.x * canvasWidth,
    y: accumulator.y + landmark.y * canvasHeight
  }), { x: 0, y: 0 });
  
  return {
    avgX: sumCoordinates.x / landmarks.length,
    avgY: sumCoordinates.y / landmarks.length
  };
}

export function minMaxX(landmarks: Landmark[], canvasWidth: number) {
  const xCoordinates = landmarks.map(landmark => landmark.x * canvasWidth);
  return { 
    minX: Math.min(...xCoordinates), 
    maxX: Math.max(...xCoordinates) 
  };
}

export function minMaxY(landmarks: Landmark[], canvasHeight: number) {
  const yCoordinates = landmarks.map(landmark => landmark.y * canvasHeight);
  return { 
    minY: Math.min(...yCoordinates), 
    maxY: Math.max(...yCoordinates) 
  };
}

export function distance2D(x1: number, y1: number, x2: number, y2: number) {
  return Math.hypot(x1 - x2, y1 - y2);
} 