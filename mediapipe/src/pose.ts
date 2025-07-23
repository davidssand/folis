// pose.ts
// Utilities for face pose estimation and nose line calculation

export type Landmark = { x: number, y: number, z: number };

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

  // Rotation matrix (columns are axes)
  // [ xN.x yN.x zN.x ]
  // [ xN.y yN.y zN.y ]
  // [ xN.z yN.z zN.z ]
  // Extract Euler angles (pitch, yaw, roll) from rotation matrix
  // Using the Tait-Bryan angles (Y-X-Z, yaw-pitch-roll)
  let pitch = Math.asin(-zN.y);
  let yaw = Math.atan2(zN.x, zN.z);
  let roll = Math.atan2(xN.y, yN.y);
  // Convert to degrees
  pitch = pitch * 180 / Math.PI + 30;
  yaw = yaw * 180 / Math.PI;
  roll = roll * 180 / Math.PI;
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

/**
 * Returns an array of targets and which (if any) are hit by the given point.
 * Each target is {x, y, radius}. Returns [{x, y, radius, hit: boolean}, ...]
 */
export function getTargetsAndHits(canvasWidth: number, canvasHeight: number, pointX: number, pointY: number, opts?: {radius?: number, margin?: number}) {
  const radius = opts?.radius ?? 10;
  const margin = opts?.margin ?? 60;
  const bottomY = canvasHeight - 10;
  const targets = [
    { x: canvasWidth / 2, y: bottomY, radius },
    { x: canvasWidth - margin, y: bottomY, radius },
    { x: margin, y: bottomY, radius }
  ];
  return targets.map(t => ({ ...t, hit: Math.hypot(pointX - t.x, pointY - t.y) < radius }));
} 

// Add this helper function near the top (after imports):
export function drawTarget(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, hit: boolean) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.lineWidth = 5;
    ctx.strokeStyle = hit ? '#00cc44' : '#8888ff';
    ctx.globalAlpha = hit ? 1.0 : 0.7;
    ctx.shadowColor = hit ? '#00ff88' : 'transparent';
    ctx.shadowBlur = hit ? 16 : 0;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.5, 0, 2 * Math.PI);
    ctx.fillStyle = hit ? '#00ff88' : '#ccccff';
    ctx.globalAlpha = hit ? 0.5 : 0.2;
    ctx.fill();
    ctx.restore();
}