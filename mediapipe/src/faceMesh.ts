// Configuration constants
const FACE_MESH_CONFIG = {
  maxNumFaces: 1,
  refineLandmarks: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5,
  cdnBase: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/'
};

export async function setupFaceMesh(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  onResults: (results: any) => void,
  FaceMesh: any,
  drawConnectors: any,
  drawLandmarks: any
) {
  const faceMesh = new FaceMesh({
    locateFile: (file: string) => `${FACE_MESH_CONFIG.cdnBase}${file}`
  });
  
  faceMesh.setOptions({
    maxNumFaces: FACE_MESH_CONFIG.maxNumFaces,
    refineLandmarks: FACE_MESH_CONFIG.refineLandmarks,
    minDetectionConfidence: FACE_MESH_CONFIG.minDetectionConfidence,
    minTrackingConfidence: FACE_MESH_CONFIG.minTrackingConfidence
  });
  
  faceMesh.onResults(onResults);
  
  async function detect() {
    await faceMesh.send({ image: video });
    requestAnimationFrame(detect);
  }
  
  detect();
} 