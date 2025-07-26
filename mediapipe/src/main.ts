// Minimal Mediapipe Face Landmarks app in TypeScript
import { setupCamera } from './camera.js';
import { drawHeadOvalGuide, drawFaceMesh, drawCanvasMessage, drawArrow } from './drawing.js';
import { updateInfoTable, removeInfoTable } from './ui.js';
import { setupFaceMesh } from './faceMesh.js';
import { computePoseAngles, computeNoseLine, getSmoothedNoseLineEnd, getTargetsAndHits, drawTarget } from './pose.js';
import { computeFraming } from './framing.js';

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
  const alertContainer = document.getElementById('alert-container') as HTMLDivElement;

  // Landmark indices for key points
  const leftEyeIdx = 468;
  const rightEyeIdx = 473;
  const mouthIdx = 13;
  const noseIdx = 1;

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

    // --- Modularized framing logic ---
    const framing = computeFraming(
      results.multiFaceLandmarks[0],
      canvas.width,
      canvas.height,
      { minDist: 0.50 * canvas.width, maxDist: 0.70 * canvas.width, xThresh: 0.10 * canvas.width, yThresh: 0.10 * canvas.height }
    );
    const { isXFramed, isYFramed, isZFramed, isFramed, avgX, avgY, centerDistX, centerDistY, extremeDistX, minDist, maxDist } = framing;
    const faceCenterX = avgX;
    const faceCenterY = avgY;
    const canvasCenterX = canvas.width / 2;
    const canvasCenterY = canvas.height / 1.5;
    let alertMsg = '';
    let alertColor = '';
    if (!isZFramed) {
      if (extremeDistX <= minDist) {
        alertMsg = 'Closer';
        alertColor = '#ff3333';
      } else if (extremeDistX >= maxDist) {
        alertMsg = 'Farther';
        alertColor = '#ff3333';
      }
    }

    if (alertMsg) {
        alertContainer.textContent = alertMsg;
        alertContainer.style.opacity = '0.92';
    } else {
        alertContainer.style.opacity = '0';
    }

    // Draw animated arrows instead of text alerts
    // Animation: arrows pulse in length
    const t = Date.now() / 500;
    const pulse = 1 + 0.2 * Math.sin(t);
    const arrowLength = 32 * pulse;
    const arrowColor = '#ff3333';

    if (!isXFramed) {
      if (faceCenterX > canvasCenterX) {
        // Too far right, move left
        drawArrow(ctx, canvas.width - 60, canvas.height / 2, -arrowLength, 0, arrowColor, 'Left');
      } else {
        // Too far left, move right
        drawArrow(ctx, 60, canvas.height / 2, arrowLength, 0, arrowColor, 'Right');
      }
    }
    if (!isYFramed) {
      if (faceCenterY > canvasCenterY) {
        // Too low, move up
        drawArrow(ctx, canvas.width / 2, canvas.height - 50, 0, -arrowLength, arrowColor, 'Up');
      } else {
        // Too high, move down
        drawArrow(ctx, canvas.width / 2, 0, 0, arrowLength, arrowColor, 'Down');
      }
    }

    // --- Draw targets if isFramed ---
    if (isFramed) {
      const targets = getTargetsAndHits(canvas.width, canvas.height, smoothedEndX, smoothedEndY, { radius: 10, margin: 60 });
      for (const t of targets) {
        drawTarget(ctx, t.x, t.y, t.radius, t.hit);
      }
    }

    // updateInfoTable({
    //   lx, ly, rx, ry, centerDistX, centerDistY, extremeDistX, minDist, maxDist,
    //   isXFramed, isYFramed, isZFramed, isFramed,
    //   canvasWidth: canvas.width, nx, ny, 
    //   pitch, yaw, roll
    // });

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