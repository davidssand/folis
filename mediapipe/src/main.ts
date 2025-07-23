// Minimal Mediapipe Face Landmarks app in TypeScript
import { setupCamera } from './camera.js';
import { drawHeadOvalGuide, drawFaceMesh, drawCanvasMessage, drawArrow } from './drawing.js';
import { updateInfoTable, removeInfoTable } from './ui.js';
import { setupFaceMesh } from './faceMesh.js';
import { computePoseAngles, computeNoseLine, getSmoothedNoseLineEnd, getTargetsAndHits } from './pose.js';

let prevLineEndX: number | null = null;
let prevLineEndY: number | null = null;


// Load drawing utils and face mesh scripts
const drawingUtilsScript = document.createElement('script');
drawingUtilsScript.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js';
document.head.appendChild(drawingUtilsScript);

const faceMeshScript = document.createElement('script');
faceMeshScript.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js';
document.head.appendChild(faceMeshScript);

Promise.all([
  new Promise<void>(resolve => drawingUtilsScript.onload = () => resolve()),
  new Promise<void>(resolve => faceMeshScript.onload = () => resolve())
]).then(() => {
  // @ts-ignore
  const { FaceMesh } = window as any;
  // @ts-ignore
  const { drawConnectors, drawLandmarks } = window as any;

  const video = document.getElementById('video') as HTMLVideoElement;
  const canvas = document.getElementById('output') as HTMLCanvasElement;
  const ctx = canvas.getContext('2d')!;

  // Landmark indices for key points
  const leftEyeIdx = 468;
  const rightEyeIdx = 473;
  const mouthIdx = 13;
  const noseIdx = 1;

  // Add this helper function near the top (after imports):
  function drawTarget(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, hit: boolean) {
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

  // Main detection and drawing logic
  function onResults(results: any) {
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

    // Draw oval target (head guide)
    drawHeadOvalGuide(ctx, canvas);

    // If no face, clear info table and alert
    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
      removeInfoTable();
      ctx.restore();
      return;
    }

    // Use the first detected face for info and checks
    const landmarks = results.multiFaceLandmarks[0];
    const leftEye = landmarks[leftEyeIdx];
    const rightEye = landmarks[rightEyeIdx];
    const mouth = landmarks[mouthIdx];
    const nose = landmarks[noseIdx];

    // If any key point is missing, skip
    if (!leftEye || !rightEye || !mouth || !nose) {
      removeInfoTable();
      ctx.restore();
      return;
    }

    // Calculate key coordinates
    const lx = leftEye.x * canvas.width, ly = leftEye.y * canvas.height;
    const rx = rightEye.x * canvas.width, ry = rightEye.y * canvas.height;
    const mx = mouth.x * canvas.width, my = mouth.y * canvas.height;
    const nx = nose.x * canvas.width, ny = nose.y * canvas.height;

    // 3D coordinates for pose estimation
    const { pitch, yaw, roll, zN } = computePoseAngles(leftEye, rightEye, nose, mouth);
    const noseLineLength = 100; // pixels
    const yBias = 0.45;
    const { noseCanvasX, noseCanvasY, endX, endY } = computeNoseLine(nose, zN, canvas.width, canvas.height, yBias, noseLineLength);

    const { smoothedEndX, smoothedEndY } = getSmoothedNoseLineEnd(endX, endY, 0.2);

    ctx.save();
    ctx.strokeStyle = "#00ccff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(noseCanvasX, noseCanvasY);
    ctx.lineTo(smoothedEndX, smoothedEndY);
    ctx.stroke();
    ctx.restore();

    // --- Face centered detection (both in x and y) using average of all landmarks ---
    // Compute average x and y of all face landmarks
    let avgX = 0;
    let avgY = 0;
    let minX = Infinity, maxX = -Infinity;
    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
      const landmarks = results.multiFaceLandmarks[0];
      for (const lm of landmarks) {
        const x = lm.x * canvas.width;
        avgX += x;
        avgY += lm.y * canvas.height;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
      }
      avgX /= landmarks.length;
      avgY /= landmarks.length;
    }
    const faceCenterX = avgX;
    const faceCenterY = avgY;
    const canvasCenterX = canvas.width / 2;
    const canvasCenterY = canvas.height / 1.5;
    const centerDistX = Math.abs(faceCenterX - canvasCenterX);
    const centerDistY = Math.abs(faceCenterY - canvasCenterY);
    const extremeDistX = maxX - minX;

    // --- Face distance detection (not too close, not too far) ---
    const minDist = 0.25 * canvas.width;
    const maxDist = 0.35 * canvas.width;
    let isZFramed = false;
    let alertMsg = '';
    let alertColor = '';
    if (extremeDistX > minDist) {
        if (extremeDistX < maxDist) {
            isZFramed = true;
        } else {
            alertMsg = 'Farther';
            alertColor = '#ff3333';
        }
    } else {
      alertMsg = 'Closer';
      alertColor = '#ff3333';
    }

    if (alertMsg) {
        ctx.save();
        ctx.font = 'bold 38px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.globalAlpha = 0.92;
        ctx.fillStyle = '#bba000';
        ctx.fillText(alertMsg, canvas.width / 2, canvas.height / 3);
        ctx.restore();
    }

    // Draw animated arrows instead of text alerts
    // Animation: arrows pulse in length
    const t = Date.now() / 500;
    const pulse = 1 + 0.2 * Math.sin(t);
    const arrowLength = 32 * pulse;
    const arrowColor = '#ff3333';

    let isXFramed = false;
    if (centerDistX < (0.10 * canvas.width)) {
      isXFramed = true;
    } else {
      if (faceCenterX > canvasCenterX) {
        // Too far right, move left
        drawArrow(ctx, canvas.width - 60, canvas.height / 2, -arrowLength, 0, arrowColor, 'Left');
      } else {
        // Too far left, move right
        drawArrow(ctx, 60, canvas.height / 2, arrowLength, 0, arrowColor, 'Right');
      }
    }
    let isYFramed = false;
    if (centerDistY < (0.10 * canvas.height)) {
      isYFramed = true;
    } else {
      if (faceCenterY > canvasCenterY) {
        // Too low, move up
        drawArrow(ctx, canvas.width / 2, canvas.height - 50, 0, -arrowLength, arrowColor, 'Up');
      } else {
        // Too high, move down
        drawArrow(ctx, canvas.width / 2, 0, 0, arrowLength, arrowColor, 'Down');
      }
    }
    let isFramed = false;
    if (isZFramed && isXFramed && isYFramed) {
      isFramed = true;
    }

    // --- Draw targets if isFramed ---
    if (isFramed) {
      const targets = getTargetsAndHits(canvas.width, canvas.height, smoothedEndX, smoothedEndY, { radius: 10, margin: 60 });
      for (const t of targets) {
        drawTarget(ctx, t.x, t.y, t.radius, t.hit);
      }
    }

    updateInfoTable({
      lx, ly, rx, ry, centerDistX, extremeDistX, minDist, maxDist,
      isXFramed, isYFramed, isZFramed, isFramed,
      canvasWidth: canvas.width, nx, ny, 
      pitch, yaw, roll
    });

    for (const faceLandmarks of results.multiFaceLandmarks) {
      drawFaceMesh(ctx, faceLandmarks, canvas, drawConnectors, drawLandmarks, FaceMesh);
    }

    ctx.restore();
  }

  // Start the camera and face mesh
  async function main() {
    await setupCamera(video);
    video.play();
    await setupFaceMesh(video, canvas, ctx, onResults, FaceMesh, drawConnectors, drawLandmarks);
  }

  main();
}); 