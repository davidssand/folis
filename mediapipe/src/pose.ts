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
  const radius = opts?.radius ?? 20; // Increased default radius
  const margin = opts?.margin ?? 80; // Increased margin
  const bottomY = canvasHeight - radius - 20; // Ensure targets are visible on screen
  const targets = [
    { x: canvasWidth / 2, y: bottomY, radius },
    { x: canvasWidth - margin, y: bottomY, radius },
    { x: margin, y: bottomY, radius }
  ];
  return targets.map(t => ({ ...t, hit: Math.hypot(pointX - t.x, pointY - t.y) < radius }));
}

// Enhanced target drawing for mobile
export function drawTarget(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, hit: boolean) {
    ctx.save();
    
    // Animation timing
    const t = Date.now() / 1000;
    const pulse = hit ? 1 + 0.2 * Math.sin(t * 8) : 1;
    const animatedRadius = radius * pulse;
    
    // Enhanced shadow for mobile visibility
    ctx.shadowColor = hit ? 'rgba(0, 255, 136, 0.6)' : 'rgba(0, 170, 255, 0.4)';
    ctx.shadowBlur = hit ? 20 : 12;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // Outer ring with gradient
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, animatedRadius);
    if (hit) {
      gradient.addColorStop(0, '#00ff88');
      gradient.addColorStop(0.7, '#00cc44');
      gradient.addColorStop(1, 'rgba(0, 204, 68, 0.3)');
    } else {
      gradient.addColorStop(0, '#00aaff');
      gradient.addColorStop(0.7, '#0088cc');
      gradient.addColorStop(1, 'rgba(0, 136, 204, 0.3)');
    }
    
    // Draw outer ring
    ctx.beginPath();
    ctx.arc(x, y, animatedRadius, 0, 2 * Math.PI);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 3;
    ctx.globalAlpha = hit ? 1.0 : 0.8;
    ctx.stroke();
    
    // Draw inner circle
    ctx.beginPath();
    ctx.arc(x, y, animatedRadius * 0.6, 0, 2 * Math.PI);
    ctx.fillStyle = hit ? '#00ff88' : '#00aaff';
    ctx.globalAlpha = hit ? 0.3 : 0.2;
    ctx.fill();
    
    // Draw center dot
    ctx.beginPath();
    ctx.arc(x, y, animatedRadius * 0.2, 0, 2 * Math.PI);
    ctx.fillStyle = hit ? '#ffffff' : '#ffffff';
    ctx.globalAlpha = hit ? 0.9 : 0.6;
    ctx.fill();
    
    // Add sparkle effect when hit
    if (hit) {
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 0.8;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      
      // Draw cross lines for sparkle effect
      const sparkleLength = animatedRadius * 0.8;
      ctx.beginPath();
      ctx.moveTo(x - sparkleLength, y);
      ctx.lineTo(x + sparkleLength, y);
      ctx.moveTo(x, y - sparkleLength);
      ctx.lineTo(x, y + sparkleLength);
      ctx.stroke();
    }
    
    ctx.restore();
}