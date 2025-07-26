// Minimal Mediapipe Face Landmarks app in TypeScript
import { setupCamera } from './camera.js';
import { drawHeadOvalGuide, drawFaceMesh, drawCanvasMessage, drawArrow } from './drawing.js';
import { updateInfoTable, removeInfoTable } from './ui.js';
import { setupFaceMesh } from './faceMesh.js';
import { computePoseAngles, computeNoseLine, getSmoothedNoseLineEnd, getTargetsAndHits, drawTarget } from './pose.js';
import { computeFraming } from './framing.js';

let prevLineEndX: number | null = null;
let prevLineEndY: number | null = null;
let isInitialized = false;

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
  const statusIndicator = document.getElementById('status-indicator') as HTMLDivElement;
  const loadingElement = document.getElementById('loading') as HTMLDivElement;

  // Landmark indices for key points
  const leftEyeIdx = 468;
  const rightEyeIdx = 473;
  const mouthIdx = 13;
  const noseIdx = 1;

  // Hide loading screen and show camera
  function hideLoading() {
    if (loadingElement) {
      loadingElement.style.opacity = '0';
      setTimeout(() => {
        loadingElement.style.display = 'none';
      }, 300);
    }
  }

  // Update status indicator
  function updateStatusIndicator(isFramed: boolean) {
    if (statusIndicator) {
      if (isFramed) {
        statusIndicator.classList.add('framed');
      } else {
        statusIndicator.classList.remove('framed');
      }
    }
  }

  // Show alert with animation
  function showAlert(message: string, color: string = '#ff3333') {
    if (alertContainer) {
      alertContainer.textContent = message;
      alertContainer.style.background = color;
      alertContainer.classList.add('show');
    }
  }

  // Hide alert
  function hideAlert() {
    if (alertContainer) {
      alertContainer.classList.remove('show');
    }
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
      hideAlert();
      updateStatusIndicator(false);
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
      hideAlert();
      updateStatusIndicator(false);
      ctx.restore();
      return;
    }

    // 3D coordinates for pose estimation
    const { pitch, yaw, roll, zN } = computePoseAngles(leftEye, rightEye, nose, mouth);
    const noseLineLength = canvas.width * 1.35; // pixels
    const yBias = 0.70;
    const { noseCanvasX, noseCanvasY, endX, endY } = computeNoseLine(nose, zN, canvas.width, canvas.height, yBias, noseLineLength);

    const { smoothedEndX, smoothedEndY } = getSmoothedNoseLineEnd(endX, endY, 0.3);

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
      { minDist: 0.47 * canvas.width, maxDist: 0.55 * canvas.width, xThresh: 0.10 * canvas.width, yThresh: 0.10 * canvas.height }
    );
    const { isXFramed, isYFramed, isZFramed, isFramed, avgX, avgY, centerDistX, centerDistY, extremeDistX, minDist, maxDist } = framing;
    const faceCenterX = avgX;
    const faceCenterY = avgY;
    const canvasCenterX = canvas.width / 2;
    const canvasCenterY = canvas.height / 1.5;
    
    // Update status indicator
    updateStatusIndicator(isFramed);

    // Handle alerts
    let alertMsg = '';
    let alertColor = '#ff3333';
    
    if (!isZFramed) {
      if (extremeDistX <= minDist) {
        alertMsg = 'Move Closer';
        alertColor = '#ff6b35';
      } else if (extremeDistX >= maxDist) {
        alertMsg = 'Move Back';
        alertColor = '#ff6b35';
      }
    }

    if (alertMsg) {
      showAlert(alertMsg, alertColor);
    } else {
      hideAlert();
    }

    // Draw animated arrows instead of text alerts
    // Animation: arrows pulse in length
    const t = Date.now() / 500;
    const pulse = 1 + 0.2 * Math.sin(t);
    const arrowLength = Math.min(50, canvas.width * 0.25) * pulse; // Much larger arrows
    const arrowColor = '#ff6b35';
    if (!isXFramed) {
      if (faceCenterX > canvasCenterX) {
        // Too far right, move left
        drawArrow(ctx, canvas.width - 60, canvas.height / 2, -arrowLength, 0, arrowColor, '←');
      } else {
        // Too far left, move right
        drawArrow(ctx, 60, canvas.height / 2, arrowLength, 0, arrowColor, '→');
      }
    }
    if (!isYFramed) {
      if (faceCenterY > canvasCenterY) {
        // Too low, move up - much more prominent position
        drawArrow(ctx, canvas.width / 2, canvas.height * 0.8, 0, -arrowLength, arrowColor, '↑');
      } else {
        // Too high, move down - much more prominent position
        drawArrow(ctx, canvas.width / 2, canvas.height * 0.2, 0, arrowLength, arrowColor, '↓');
      }
    }

    // --- Draw targets if isFramed ---
    if (isFramed) {
      const targetRadius = canvas.width * 0.15; // Increased target size
      const targets = getTargetsAndHits(canvas.width, canvas.height, smoothedEndX, smoothedEndY, { radius: targetRadius, margin: 80 });
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
    try {
      await setupCamera(video);
      video.play();
      await setupFaceMesh(video, canvas, ctx, onResults, FaceMesh, drawConnectors, drawLandmarks);
      
      // Hide loading screen after initialization
      if (!isInitialized) {
        isInitialized = true;
        hideLoading();
      }
    } catch (error) {
      console.error('Failed to initialize camera:', error);
      if (loadingElement) {
        loadingElement.innerHTML = `
          <div style="color: #ff6b6b; margin-bottom: 1rem;">⚠️</div>
          <div>Camera access denied</div>
          <div style="font-size: 0.8rem; margin-top: 0.5rem; opacity: 0.8;">Please allow camera access and refresh</div>
        `;
      }
    }
  }

  main();
}); 