// framing.ts
import { Landmark, averageXY, minMaxX } from './landmarkUtils.js';

// Threshold constants
const minDistThreshold = 0.40;
const maxDistThreshold = 0.50;
const XThreshold = 0.10;
const LowThreshold = 0.15;
const HighThreshold = 0.07;

export interface FramingResult {
  isTooLeft: boolean;
  isTooRight: boolean;
  isTooLow: boolean;
  isTooHigh: boolean;
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
): FramingResult {
  const { avgX, avgY } = averageXY(landmarks, canvasWidth, canvasHeight);
  const { minX, maxX } = minMaxX(landmarks, canvasWidth);
  const canvasCenterX = canvasWidth / 2;
  const canvasCenterY = canvasHeight / 2;
  
  // Use relative positioning instead of absolute distances
  const centerDistX = avgX - canvasCenterX;
  const centerDistY = avgY - canvasCenterY;
  const extremeDistX = maxX - minX;
  
  // Use relative thresholds based on canvas size
  const minDist = canvasWidth * minDistThreshold;
  const maxDist = canvasWidth * maxDistThreshold;
  const xThresh = canvasWidth * XThreshold;

  // Simplified framing logic using relative positioning
  const isTooLeft = centerDistX < -xThresh;
  const isTooRight = centerDistX > xThresh;
  const isTooLow = centerDistY > (canvasHeight * LowThreshold);
  const isTooHigh = centerDistY < -(canvasHeight * HighThreshold);
  const isZFramed = extremeDistX > minDist && extremeDistX < maxDist;
  const isFramed = !isTooLeft && !isTooRight && !isTooLow && !isTooHigh && isZFramed;
  
  return {
    isTooLeft,
    isTooRight,
    isTooLow,
    isTooHigh,
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