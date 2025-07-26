// framing.ts
import { Landmark, averageXY, minMaxX } from './landmarkUtils.js';

export interface FramingResult {
  isXFramed: boolean;
  isYFramed: boolean;
  isZFramed: boolean;
  isFramed: boolean;
  avgX: number;
  avgY: number;
  centerDistX: number;
  centerDistY: number;
  extremeDistX: number;
  minDist: number;
  maxDist: number;
}

export function computeFraming(
  landmarks: Landmark[],
  canvasWidth: number,
  canvasHeight: number,
  opts?: { minDist?: number; maxDist?: number; xThresh?: number; yThresh?: number }
): FramingResult {
  const { avgX, avgY } = averageXY(landmarks, canvasWidth, canvasHeight);
  const { minX, maxX } = minMaxX(landmarks, canvasWidth);
  const canvasCenterX = canvasWidth / 2;
  const canvasCenterY = canvasHeight / 1.5;
  
  // Use relative positioning instead of absolute distances
  const centerDistX = avgX - canvasCenterX;
  const centerDistY = avgY - canvasCenterY;
  const extremeDistX = maxX - minX;
  
  // Use relative thresholds based on canvas size
  const minDist = opts?.minDist ?? canvasWidth * 0.25;
  const maxDist = opts?.maxDist ?? canvasWidth * 0.35;
  const xThresh = opts?.xThresh ?? canvasWidth * 0.10;
  const yThresh = opts?.yThresh ?? canvasHeight * 0.10;

  // Simplified framing logic using relative positioning
  const isXFramed = centerDistX > -xThresh && centerDistX < xThresh;
  const isYFramed = centerDistY > -yThresh && centerDistY < yThresh;
  const isZFramed = extremeDistX > minDist && extremeDistX < maxDist;
  const isFramed = isXFramed && isYFramed && isZFramed;
  
  return {
    isXFramed,
    isYFramed,
    isZFramed,
    isFramed,
    avgX,
    avgY,
    centerDistX,
    centerDistY,
    extremeDistX,
    minDist,
    maxDist
  };
} 