// Minimal Mediapipe Face Landmarks app in TypeScript
import { setupCamera } from './camera.js';
import { drawHeadOvalGuide, drawFaceMesh, drawArrow, getTargetsAndHits, drawTarget } from './drawing.js';
import { updateInfoTable, removeInfoTable } from './ui.js';
import { setupFaceMesh } from './faceMesh.js';
import { computePoseAngles, computeNoseLine, getSmoothedNoseLineEnd } from './pose.js';
import { computeFraming } from './framing.js';

// Configuration constants
const CONFIG = {
  LANDMARK_INDICES: {
    leftEye: 468,
    rightEye: 473,
    mouth: 13,
    nose: 1
  },
  NOSE_LINE: {
    lengthMultiplier: 1.35,
    yBias: 0.70,
    smoothingAlpha: 0.3
  },
  FRAMING: {
    minDistRatio: 0.47,
    maxDistRatio: 0.55,
    xThreshRatio: 0.10,
    yThreshRatio: 0.10
  },
  TARGET: {
    radiusRatio: 0.15,
    margin: 80
  },
  ARROW: {
    maxLength: 50,
    lengthRatio: 0.25,
    pulseAmplitude: 0.2
  }
};

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
      statusIndicator.classList.toggle('framed', isFramed);
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

  // Simplified alert logic
  function handleAlerts(framing: any) {
    const { isZFramed, extremeDistX, minDist, maxDist } = framing;
    
    if (!isZFramed) {
      const message = extremeDistX <= minDist ? 'Move Closer' : 'Move Back';
      showAlert(message, '#ff6b35');
    } else {
      hideAlert();
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
    const { leftEye, rightEye, mouth, nose } = CONFIG.LANDMARK_INDICES;
    const leftEyePoint = landmarks[leftEye];
    const rightEyePoint = landmarks[rightEye];
    const mouthPoint = landmarks[mouth];
    const nosePoint = landmarks[nose];

    // If any key point is missing, skip
    if (!leftEyePoint || !rightEyePoint || !mouthPoint || !nosePoint) {
      removeInfoTable();
      hideAlert();
      updateStatusIndicator(false);
      ctx.restore();
      return;
    }

    // 3D coordinates for pose estimation
    const { pitch, yaw, roll, zN } = computePoseAngles(leftEyePoint, rightEyePoint, nosePoint, mouthPoint);
    const noseLineLength = canvas.width * CONFIG.NOSE_LINE.lengthMultiplier;
    const { noseCanvasX, noseCanvasY, endX, endY } = computeNoseLine(
      nosePoint, zN, canvas.width, canvas.height, 
      CONFIG.NOSE_LINE.yBias, noseLineLength
    );

    const { smoothedEndX, smoothedEndY } = getSmoothedNoseLineEnd(
      endX, endY, CONFIG.NOSE_LINE.smoothingAlpha
    );

    // Draw nose line
    ctx.save();
    ctx.strokeStyle = "#00ccff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(noseCanvasX, noseCanvasY);
    ctx.lineTo(smoothedEndX, smoothedEndY);
    ctx.stroke();
    ctx.restore();

    // Compute framing
    const framing = computeFraming(
      results.multiFaceLandmarks[0],
      canvas.width,
      canvas.height,
      {
        minDist: CONFIG.FRAMING.minDistRatio * canvas.width,
        maxDist: CONFIG.FRAMING.maxDistRatio * canvas.width,
        xThresh: CONFIG.FRAMING.xThreshRatio * canvas.width,
        yThresh: CONFIG.FRAMING.yThreshRatio * canvas.height
      }
    );
    
    const { isXFramed, isYFramed, isZFramed, isFramed, avgX, avgY } = framing;
    const canvasCenterX = canvas.width / 2;
    const canvasCenterY = canvas.height / 2;
    
    // Update status indicator
    updateStatusIndicator(isFramed);

    // Handle alerts
    handleAlerts(framing);

    // Draw animated arrows
    const currentTime = Date.now() / 500;
    const pulseFactor = 1 + CONFIG.ARROW.pulseAmplitude * Math.sin(currentTime);
    const arrowLength = Math.min(CONFIG.ARROW.maxLength, canvas.width * CONFIG.ARROW.lengthRatio) * pulseFactor;
    const arrowColor = '#ff6b35';
    
    if (!isXFramed) {
      const isTooRight = avgX > canvasCenterX;
      const arrowPositionX = isTooRight ? canvas.width - 60 : 60;
      const arrowDirectionX = isTooRight ? -arrowLength : arrowLength;
      const arrowLabel = isTooRight ? '←' : '→';
      drawArrow(ctx, arrowPositionX, canvas.height / 2, arrowDirectionX, 0, arrowColor, arrowLabel);
    }
    
    if (!isYFramed) {
      const isTooLow = avgY > canvasCenterY;
      const arrowPositionY = isTooLow ? canvas.height * 0.8 : canvas.height * 0.2;
      const arrowDirectionY = isTooLow ? -arrowLength : arrowLength;
      const arrowLabel = isTooLow ? '↑' : '↓';
      drawArrow(ctx, canvas.width / 2, arrowPositionY, 0, arrowDirectionY, arrowColor, arrowLabel);
    }

    // Draw targets if framed
    if (isFramed) {
      const targetRadius = canvas.width * CONFIG.TARGET.radiusRatio;
      const targets = getTargetsAndHits(
        canvas.width, canvas.height, smoothedEndX, smoothedEndY, 
        { radius: targetRadius, margin: CONFIG.TARGET.margin }
      );
      for (const target of targets) {
        drawTarget(ctx, target.x, target.y, target.radius, target.hit);
      }
    }

    // Draw face mesh
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