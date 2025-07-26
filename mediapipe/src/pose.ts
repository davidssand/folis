// pose.ts
// Utilities for face pose estimation and nose line calculation

export type Landmark = { x: number, y: number, z: number };

// Configuration constants
const POSE_CONFIG = {
  ANGLE_OFFSET: 30, // degrees
  RAD_TO_DEG: 180 / Math.PI,
};

export function normalizeVec(v: { x: number, y: number, z: number }) {
  const len = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
  return { x: v.x / len, y: v.y / len, z: v.z / len };
}

export function computePoseAngles(leftEye: Landmark, rightEye: Landmark, nose: Landmark, mouth: Landmark) {
  // X axis: from right eye to left eye
  const eyesCenter = {
    x: leftEye.x - rightEye.x,
    y: leftEye.y - rightEye.y,
    z: leftEye.z - rightEye.z
  };
  // Y axis: from nose to mouth
  const noseMouthCenter = {
    x: mouth.x - nose.x,
    y: mouth.y - nose.y,
    z: mouth.z - nose.z
  };
  // Z axis: cross product of X and Y
  const crossProduct = {
    x: eyesCenter.y * noseMouthCenter.z - eyesCenter.z * noseMouthCenter.y,
    y: eyesCenter.z * noseMouthCenter.x - eyesCenter.x * noseMouthCenter.z,
    z: eyesCenter.x * noseMouthCenter.y - eyesCenter.y * noseMouthCenter.x
  };
  const xN = normalizeVec(eyesCenter);
  const yN = normalizeVec(noseMouthCenter);
  const zN = normalizeVec(crossProduct);

  // Extract Euler angles (pitch, yaw, roll) from rotation matrix
  // Using the Tait-Bryan angles (Y-X-Z, yaw-pitch-roll)
  let pitch = Math.asin(-zN.y);
  let yaw = Math.atan2(zN.x, zN.z);
  let roll = Math.atan2(xN.y, yN.y);
  
  // Convert to degrees and apply offset
  pitch = pitch * POSE_CONFIG.RAD_TO_DEG + POSE_CONFIG.ANGLE_OFFSET;
  yaw = yaw * POSE_CONFIG.RAD_TO_DEG;
  roll = roll * POSE_CONFIG.RAD_TO_DEG;
  
  return { pitch, yaw, roll, zN };
}

export function computeNoseLine(nose: Landmark, zN: { x: number, y: number, z: number }, canvasWidth: number, canvasHeight: number, yBias: number, length: number) {
  const noseCanvasX = nose.x * canvasWidth;
  const noseCanvasY = nose.y * canvasHeight;
  const endX = noseCanvasX + zN.x * length;
  const endY = noseCanvasY + (zN.y - yBias) * length;
  return { noseCanvasX, noseCanvasY, endX, endY };
}

// Smoothing state (module-level)
let prevLineEndX: number | null = null;
let prevLineEndY: number | null = null;

/**
 * Returns a smoothed endpoint for the nose line using exponential moving average.
 * Call this every frame with the new (endX, endY).
 */
export function getSmoothedNoseLineEnd(endX: number, endY: number, alpha = 0.2) {
  if (prevLineEndX === null || prevLineEndY === null) {
    prevLineEndX = endX;
    prevLineEndY = endY;
  }
  const smoothedEndX = alpha * endX + (1 - alpha) * prevLineEndX;
  const smoothedEndY = alpha * endY + (1 - alpha) * prevLineEndY;
  prevLineEndX = smoothedEndX;
  prevLineEndY = smoothedEndY;
  return { smoothedEndX, smoothedEndY };
}
