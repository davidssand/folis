// landmarkUtils.ts
// Utilities for landmark math

export type Landmark = { x: number, y: number, z?: number };

export function averageXY(landmarks: Landmark[], width: number, height: number) {
  let sumX = 0, sumY = 0;
  for (const lm of landmarks) {
    sumX += lm.x * width;
    sumY += lm.y * height;
  }
  return {
    avgX: sumX / landmarks.length,
    avgY: sumY / landmarks.length
  };
}

export function minMaxX(landmarks: Landmark[], width: number) {
  let minX = Infinity, maxX = -Infinity;
  for (const lm of landmarks) {
    const x = lm.x * width;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
  }
  return { minX, maxX };
}

export function minMaxY(landmarks: Landmark[], height: number) {
  let minY = Infinity, maxY = -Infinity;
  for (const lm of landmarks) {
    const y = lm.y * height;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  return { minY, maxY };
}

export function distance2D(x1: number, y1: number, x2: number, y2: number) {
  return Math.hypot(x1 - x2, y1 - y2);
} 