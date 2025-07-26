// pose.ts
// Utilities for face pose estimation and nose line calculation

export type Landmark = { x: number, y: number, z: number };

// Configuration constants
const POSE_CONFIG = {
  ANGLE_OFFSET: 30, // degrees
  RAD_TO_DEG: 180 / Math.PI
};

export function normalizeVec(vector: { x: number, y: number, z: number }) {
  const vectorLength = Math.sqrt(vector.x * vector.x + vector.y * vector.y + vector.z * vector.z);
  return { x: vector.x / vectorLength, y: vector.y / vectorLength, z: vector.z / vectorLength };
}

export function computePoseAngles(leftEye: Landmark, rightEye: Landmark, nose: Landmark, mouth: Landmark) {
  // X axis: from right eye to left eye
  const eyesVector = {
    x: leftEye.x - rightEye.x,
    y: leftEye.y - rightEye.y,
    z: leftEye.z - rightEye.z
  };
  // Y axis: from nose to mouth
  const noseMouthVector = {
    x: mouth.x - nose.x,
    y: mouth.y - nose.y,
    z: mouth.z - nose.z
  };
  // Z axis: cross product of X and Y
  const crossProductVector = {
    x: eyesVector.y * noseMouthVector.z - eyesVector.z * noseMouthVector.y,
    y: eyesVector.z * noseMouthVector.x - eyesVector.x * noseMouthVector.z,
    z: eyesVector.x * noseMouthVector.y - eyesVector.y * noseMouthVector.x
  };
  const normalizedXAxis = normalizeVec(eyesVector);
  const normalizedYAxis = normalizeVec(noseMouthVector);
  const normalizedZAxis = normalizeVec(crossProductVector);

  // Extract Euler angles (pitch, yaw, roll) from rotation matrix
  // Using the Tait-Bryan angles (Y-X-Z, yaw-pitch-roll)
  let pitchAngle = Math.asin(-normalizedZAxis.y);
  let yawAngle = Math.atan2(normalizedZAxis.x, normalizedZAxis.z);
  let rollAngle = Math.atan2(normalizedXAxis.y, normalizedYAxis.y);
  
  // Convert to degrees and apply offset
  pitchAngle = pitchAngle * POSE_CONFIG.RAD_TO_DEG + POSE_CONFIG.ANGLE_OFFSET;
  yawAngle = yawAngle * POSE_CONFIG.RAD_TO_DEG;
  rollAngle = rollAngle * POSE_CONFIG.RAD_TO_DEG;
  
  return { pitch: pitchAngle, yaw: yawAngle, roll: rollAngle, zN: normalizedZAxis };
}

export function computeNoseLine(nose: Landmark, normalizedZAxis: { x: number, y: number, z: number }, canvasWidth: number, canvasHeight: number, yBias: number, lineLength: number) {
  const noseCanvasX = nose.x * canvasWidth;
  const noseCanvasY = nose.y * canvasHeight;
  const lineEndX = noseCanvasX + normalizedZAxis.x * lineLength;
  const lineEndY = noseCanvasY + (normalizedZAxis.y - yBias) * lineLength;
  return { noseCanvasX, noseCanvasY, endX: lineEndX, endY: lineEndY };
}

// Smoothing state (module-level)
let previousLineEndX: number | null = null;
let previousLineEndY: number | null = null;

/**
 * Returns a smoothed endpoint for the nose line using exponential moving average.
 * Call this every frame with the new (endX, endY).
 */
export function getSmoothedNoseLineEnd(endX: number, endY: number, smoothingFactor = 0.2) {
  if (previousLineEndX === null || previousLineEndY === null) {
    previousLineEndX = endX;
    previousLineEndY = endY;
  }
  const smoothedEndX = smoothingFactor * endX + (1 - smoothingFactor) * previousLineEndX;
  const smoothedEndY = smoothingFactor * endY + (1 - smoothingFactor) * previousLineEndY;
  previousLineEndX = smoothedEndX;
  previousLineEndY = smoothedEndY;
  return { smoothedEndX, smoothedEndY };
}
