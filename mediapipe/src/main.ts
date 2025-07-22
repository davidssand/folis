// Minimal Mediapipe Face Landmarks app in TypeScript
import { setupCamera } from './camera.js';
import { drawHeadOvalGuide, drawFaceMesh, drawCanvasMessage } from './drawing.js';
import { showAlert, clearAlert, updateInfoTable, removeInfoTable } from './ui.js';
import { setupFaceMesh } from './faceMesh.js';

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
      clearAlert();
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
      clearAlert();
      ctx.restore();
      return;
    }

    // Calculate key coordinates
    const lx = leftEye.x * canvas.width, ly = leftEye.y * canvas.height;
    const rx = rightEye.x * canvas.width, ry = rightEye.y * canvas.height;
    const mx = mouth.x * canvas.width, my = mouth.y * canvas.height;
    const nx = nose.x * canvas.width, ny = nose.y * canvas.height;

    // 3D coordinates for pose estimation
    const leftEye3D = leftEye;
    const rightEye3D = rightEye;
    const nose3D = nose;
    const mouth3D = mouth;

    // --- Face rotation estimation (pitch, yaw, roll) ---
    // Define face axes using 3D points
    // X axis: from right eye to left eye
    const eyesCenter = {
      x: leftEye3D.x - rightEye3D.x,
      y: leftEye3D.y - rightEye3D.y,
      z: leftEye3D.z - rightEye3D.z
    };
    // Y axis: from nose to mouth
    const noseMounthCenter = {
      x: mouth3D.x - nose3D.x,
      y: mouth3D.y - nose3D.y,
      z: mouth3D.z - nose3D.z
    };
    // Z axis: cross product of X and Y
    const crossProduct = {
      x: eyesCenter.y * noseMounthCenter.z - eyesCenter.z * noseMounthCenter.y,
      y: eyesCenter.z * noseMounthCenter.x - eyesCenter.x * noseMounthCenter.z,
      z: eyesCenter.x * noseMounthCenter.y - eyesCenter.y * noseMounthCenter.x
    };
    // Normalize axes
    function normalize(v: any) {
      const len = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
      return { x: v.x / len, y: v.y / len, z: v.z / len };
    }
    const xN = normalize(eyesCenter);
    const yN = normalize(noseMounthCenter);
    const zN = normalize(crossProduct);

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

    // Draw a line that starts at the nose and extends in the direction of the face (using zN, the face normal)
    // Nose position in canvas coordinates (unmirrored if needed)
    const noseCanvasX = nx; // or canvas.width - nx if unmirrored
    const noseCanvasY = ny;

    // Use zN (face normal) for direction
    const lineLength = 200; // pixels
    const yBias = 0.4; // Try values between 0.1 and 0.3 for your setup
    const endX = noseCanvasX + zN.x * lineLength;
    const endY = noseCanvasY + (zN.y - yBias) * lineLength;

    // Smooth the endpoint using exponential moving average
    const alpha = 0.2; // Smoothing factor (0.1-0.3 is typical)
    if (prevLineEndX === null || prevLineEndY === null) {
      prevLineEndX = endX;
      prevLineEndY = endY;
    }
    const smoothedEndX = alpha * endX + (1 - alpha) * prevLineEndX;
    const smoothedEndY = alpha * endY + (1 - alpha) * prevLineEndY;
    prevLineEndX = smoothedEndX;
    prevLineEndY = smoothedEndY;

    ctx.save();
    ctx.strokeStyle = "#00ccff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(noseCanvasX, noseCanvasY);
    ctx.lineTo(smoothedEndX, smoothedEndY);
    ctx.stroke();
    ctx.restore();


    // --- Face distance detection (not too close, not too far) ---
    const eyeDist = Math.hypot(lx - rx, ly - ry);
    const minEyeDist = 0.14 * canvas.width;
    const maxEyeDist = 0.19 * canvas.width;
    let isFaceClose = false;
    let alertMsg = '';
    let alertColor = '';
    if (eyeDist > minEyeDist) {
        if (eyeDist < maxEyeDist) {
            isFaceClose = true;
        } else {
            alertMsg = 'Move farther from the camera';
            alertColor = '#ff3333';
        }
    } else {
      alertMsg = 'Move closer to the camera';
      alertColor = '#ff3333';
    }

    // --- Face centered detection (both in x and y) ---
    const faceCenterX = (lx + rx) / 2;
    const faceCenterY = (ly + ry) / 2;
    const canvasCenterX = canvas.width / 2;
    const canvasCenterY = canvas.height / 2;
    const centerDistX = Math.abs(faceCenterX - canvasCenterX);
    const centerDistY = Math.abs(faceCenterY - canvasCenterY);
    let isXCentered = false;
    if (centerDistX < (0.07 * canvas.width)) {
      isXCentered = true;
    }
    let isYCentered = false;
    if (centerDistY < (0.07 * canvas.height)) {
      isYCentered = true;
    }

    // --- Symmetric triangle detection (eyes and mouth) ---
    // const A = eyeDist;
    // const B = Math.hypot(lx - mx, ly - my);
    // const C = Math.hypot(rx - mx, ry - my);
    // const symmetry = Math.abs(B - C) < 0.15 * A;
    // const eyesHorizontal = Math.abs(ly - ry) < 0.08 * A;
    // let isSymmetric = false;
    // if (symmetry && eyesHorizontal) {
    //   isSymmetric = true;
    // }

    let lookingStraight = false;
    let aimError = Math.abs(faceCenterX - nx)
    if (aimError < (0.03 * canvas.width)) {
        lookingStraight = true;
    }

    // --- Show "Take Picture!" if all conditions are met ---
    let cameraLook = false;
    if (isXCentered && isYCentered && lookingStraight && isFaceClose) {
      cameraLook = true;
      drawCanvasMessage(ctx, 'Camera look', '#3366ff', canvas.height - 70);
    }

    // --- Head tilt down detection (nose close to mouth vertically) ---
    const lookingDown = Math.abs(ny - my) < 0.05 * canvas.height
    let isHeadTiltedDown = false;
    if (isXCentered && lookingStraight && isFaceClose && lookingDown) {
        isHeadTiltedDown = true;
        drawCanvasMessage(ctx, 'Head tilted down – good for bald check!', '#bba000', canvas.height - 40);
    }

    // --- Head tilt down and right detection (for lateral hair) ---
    const lookingRight = (faceCenterX - nx > 0.03 * canvas.width)
    let isHeadTiltedDownRight = false;
    if (lookingDown && lookingRight) {
        isHeadTiltedDownRight = true;
        drawCanvasMessage(ctx, 'Head down & right – lateral hair view!', '#bb00aa', canvas.height - 20);
    }

    // --- Head tilt down and left detection (for lateral hair) ---
    const lookingLeft = (nx - faceCenterX > 0.03 * canvas.width)
    let isHeadTiltedDownLeft = false;
    if (lookingDown && lookingLeft) {
        isHeadTiltedDownLeft = true;
        drawCanvasMessage(ctx, 'Head down & left – lateral hair view!', '#00bbcc', canvas.height - 0);
    }

    // --- Show or clear alert ---
    if (alertMsg) {
      showAlert(alertMsg, alertColor);
    } else {
      clearAlert();
    }

    // --- Info Table ---
    updateInfoTable({
      lx, ly, rx, ry, eyeDist, isFaceClose, lookingStraight,
      isXCentered, isYCentered, isHeadTiltedDown, isHeadTiltedDownRight, isHeadTiltedDownLeft, cameraLook,
      canvasWidth: canvas.width, nx, ny, aimError,
      pitch, yaw, roll
    });

    // --- Draw all faces/landmarks ---
    const highlightPoints = [
      { idx: leftEyeIdx, color: '#00FF00' }, // Left eye center (green)
      { idx: rightEyeIdx, color: '#0000FF' }, // Right eye center (blue)
      { idx: noseIdx, color: '#FFFF00' },   // Nose tip (yellow)
      { idx: mouthIdx, color: '#FF00FF' },  // Mouth center (magenta)
    ];
    for (const faceLandmarks of results.multiFaceLandmarks) {
      drawFaceMesh(ctx, faceLandmarks, canvas, highlightPoints, drawConnectors, drawLandmarks, FaceMesh);
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