// landmarkUtils.ts
// Utilities for landmark math

export type Landmark = { x: number, y: number, z?: number };

export function averageXY(landmarks: Landmark[], width: number, height: number) {
  const sum = landmarks.reduce((acc, lm) => ({
    x: acc.x + lm.x * width,
    y: acc.y + lm.y * height
  }), { x: 0, y: 0 });
  
  return {
    avgX: sum.x / landmarks.length,
    avgY: sum.y / landmarks.length
  };
}

export function minMaxX(landmarks: Landmark[], width: number) {
  const xValues = landmarks.map(lm => lm.x * width);
  return { 
    minX: Math.min(...xValues), 
    maxX: Math.max(...xValues) 
  };
}

export function minMaxY(landmarks: Landmark[], height: number) {
  const yValues = landmarks.map(lm => lm.y * height);
  return { 
    minY: Math.min(...yValues), 
    maxY: Math.max(...yValues) 
  };
}

export function distance2D(x1: number, y1: number, x2: number, y2: number) {
  return Math.hypot(x1 - x2, y1 - y2);
} 