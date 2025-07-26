// Minimal Mediapipe Face Landmarks app in TypeScript
import { setupCamera } from './camera.js';
import { 
  drawHeadOvalGuide, 
  drawFaceMesh, 
  drawArrow, 
  getTargetsAndHits, 
  drawTarget, 
  ARROW_CONFIG, 
  TARGET_CONFIG,
  createWorkflowState,
  updateWorkflowState,
  drawCurrentWorkflowTarget,
  drawCompletedTargetsOnly,
  WorkflowState
} from './drawing.js';
import { updateInfoTable, removeInfoTable } from './ui.js';
import { setupFaceMesh } from './faceMesh.js';
import { computePoseAngles, computeNoseLine, getSmoothedNoseLineEnd, LANDMARK_INDICES, NOSE_LINE_CONFIG } from './pose.js';
import { computeFraming } from './framing.js';

let isInitialized = false;
let workflowState: WorkflowState = createWorkflowState();

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
  const framingAlert = document.getElementById('framing-alert') as HTMLDivElement;
  const stepAlert = document.getElementById('step-alert') as HTMLDivElement;
  const completionAlert = document.getElementById('completion-alert') as HTMLDivElement;
  const statusIndicator = document.getElementById('status-indicator') as HTMLDivElement;
  const loadingElement = document.getElementById('loading') as HTMLDivElement;
  const resetButton = document.getElementById('reset-button') as HTMLButtonElement;

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

  // Show framing alert
  function showFramingAlert(message: string) {
    if (framingAlert) {
      framingAlert.textContent = message;
      framingAlert.classList.add('show');
    }
  }

  // Show step alert
  function showStepAlert(message: string) {
    if (stepAlert) {
      stepAlert.textContent = message;
      stepAlert.classList.add('show');
    }
  }

  // Show completion alert
  function showCompletionAlert(message: string) {
    if (completionAlert) {
      completionAlert.textContent = message;
      completionAlert.classList.add('show');
    }
  }

  // Hide all alerts
  function hideAllAlerts() {
    if (framingAlert) framingAlert.classList.remove('show');
    if (stepAlert) stepAlert.classList.remove('show');
    if (completionAlert) completionAlert.classList.remove('show');
  }

  // Hide specific alert
  function hideAlert(alertElement: HTMLDivElement) {
    if (alertElement) {
      alertElement.classList.remove('show');
    }
  }

  // Reset workflow
  function resetWorkflow() {
    workflowState = createWorkflowState();
    hideAllAlerts();
  }

  // Simplified alert logic
  function handleAlerts(framing: any) {
    const { isZFramed, extremeDistX, minDist, maxDist, isTooLeft, isTooRight, isTooHigh, isTooLow } = framing;
    
    // Always prioritize framing alerts over workflow alerts
    if (!isZFramed) {
      const message = extremeDistX <= minDist ? 'Aproxime-se' : 'Afaste-se';
      showFramingAlert(message);
      hideAlert(stepAlert);
      hideAlert(completionAlert);
    } else {
        hideAlert(framingAlert)
    }
    if (isTooLeft || isTooRight || isTooHigh || isTooLow || workflowState.isComplete) {
      // Hide all alerts when positioning arrows are shown or workflow is complete
      hideAllAlerts();
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
      hideAllAlerts();
      updateStatusIndicator(false);
      // Reset workflow state when no face is detected
      workflowState = createWorkflowState();
      ctx.restore();
      return;
    }

    // Use the first detected face for info and checks
    const landmarks = results.multiFaceLandmarks[0];
    const leftEyePoint = landmarks[LANDMARK_INDICES.leftEye];
    const rightEyePoint = landmarks[LANDMARK_INDICES.rightEye];
    const mouthPoint = landmarks[LANDMARK_INDICES.mouth];
    const nosePoint = landmarks[LANDMARK_INDICES.nose];

    // If any key point is missing, skip
    if (!leftEyePoint || !rightEyePoint || !mouthPoint || !nosePoint) {
      removeInfoTable();
      hideAllAlerts();
      updateStatusIndicator(false);
      ctx.restore();
      return;
    }

    // 3D coordinates for pose estimation
    const { pitch, yaw, roll, zN } = computePoseAngles(leftEyePoint, rightEyePoint, nosePoint, mouthPoint);
    const noseLineLength = canvas.width * NOSE_LINE_CONFIG.lengthMultiplier;
    const { noseCanvasX, noseCanvasY, endX, endY } = computeNoseLine(
      nosePoint, zN, canvas.width, canvas.height, 
      NOSE_LINE_CONFIG.yBias, noseLineLength
    );

    const { smoothedEndX, smoothedEndY } = getSmoothedNoseLineEnd(
      endX, endY, NOSE_LINE_CONFIG.smoothingAlpha
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
    const framing = computeFraming(landmarks, canvas.width, canvas.height);
    
    const { isTooLeft, isTooRight, isTooLow, isTooHigh, isZFramed, isFramed, avgX, avgY } = framing;
    const canvasCenterX = canvas.width / 2;
    const canvasCenterY = canvas.height / 2;
    
    // Update status indicator
    updateStatusIndicator(isFramed);

    // Handle alerts - framing alerts take priority
    handleAlerts(framing);

    // Draw animated arrows
    const currentTime = Date.now() / 500;
    const pulseFactor = 1 + ARROW_CONFIG.pulseAmplitude * Math.sin(currentTime);
    const arrowLength = Math.min(ARROW_CONFIG.maxLength, canvas.width * ARROW_CONFIG.lengthRatio) * pulseFactor;
    const arrowColor = '#ff6b35';
    
    if (isTooLeft || isTooRight) {
      const arrowPositionX = isTooRight ? canvas.width - 60 : 60;
      const arrowDirectionX = isTooRight ? -arrowLength : arrowLength;
      drawArrow(ctx, arrowPositionX, canvas.height / 2, arrowDirectionX, 0, arrowColor);
    }
    
    if (isTooLow || isTooHigh) {
      const arrowPositionY = isTooLow ? canvas.height * 0.8 : canvas.height * 0.2;
      const arrowDirectionY = isTooLow ? -arrowLength : arrowLength;
      drawArrow(ctx, canvas.width / 2, arrowPositionY, 0, arrowDirectionY, arrowColor);
    }

    // Always calculate targets for hit detection, regardless of framing
    const targetRadius = canvas.width * TARGET_CONFIG.radiusRatio;
    const targets = getTargetsAndHits(
      canvas.width, canvas.height, smoothedEndX, smoothedEndY, 
      { radius: targetRadius, margin: TARGET_CONFIG.margin }
    );
    
    // Update workflow state based on target hits (even when not framed)
    workflowState = updateWorkflowState(workflowState, targets);
    
        // Draw targets based on framing status
    if (isFramed) {
      // When framed: show current target and completed targets
      drawCurrentWorkflowTarget(ctx, targets, workflowState);
      
      // Show workflow progress only when framed
      if (!workflowState.isComplete) {
        const currentStepName = workflowState.stepNames[workflowState.currentStep];
        
        // Show hold progress if currently holding
        if (workflowState.holdStartTime !== null && workflowState.holdDuration > 0) {
          const progressPercent = Math.round((workflowState.holdDuration / workflowState.requiredHoldTime) * 100);
          showStepAlert(`Step ${workflowState.currentStep + 1}/3: ${currentStepName} (${progressPercent}%)`);
        } else {
          showStepAlert(`Step ${workflowState.currentStep + 1}/3: ${currentStepName}`);
        }
      }
    } else if (workflowState.completedSteps.some(step => step)) {
      // When not framed but has completed targets: show only completed targets
      drawCompletedTargetsOnly(ctx, targets, workflowState);
    }

    if (workflowState.isComplete) {
        showCompletionAlert('Workflow Complete! All targets hit!');
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
      
      // Add reset button event listener
      if (resetButton) {
        resetButton.addEventListener('click', resetWorkflow);
      }
      
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