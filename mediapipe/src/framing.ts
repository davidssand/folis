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
  const centerDistX = Math.abs(avgX - canvasCenterX);
  const centerDistY = Math.abs(avgY - canvasCenterY);
  const extremeDistX = maxX - minX;
  const minDist = opts?.minDist ?? 0.25 * canvasWidth;
  const maxDist = opts?.maxDist ?? 0.35 * canvasWidth;
  const xThresh = opts?.xThresh ?? 0.10 * canvasWidth;
  const yThresh = opts?.yThresh ?? 0.10 * canvasHeight;

  const isXFramed = centerDistX < xThresh;
  const isYFramed = centerDistY < yThresh;
  let isZFramed = false;
  if (extremeDistX > minDist) {
    if (extremeDistX < maxDist) {
      isZFramed = true;
    }
  }
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