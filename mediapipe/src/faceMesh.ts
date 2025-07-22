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
    locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
  });
  faceMesh.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
  });
  faceMesh.onResults(onResults);
  async function detect() {
    await faceMesh.send({ image: video });
    requestAnimationFrame(detect);
  }
  detect();
} 