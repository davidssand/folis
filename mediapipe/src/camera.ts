// Configuration constants
const CAMERA_CONFIG = {
  IDEAL: {
    width: 1280,
    height: 720,
    frameRate: 30,
    aspectRatio: 16/9
  },
  MAX: {
    width: 1920,
    height: 1080,
    frameRate: 60
  },
  FALLBACK: {
    minWidth: 640,
    minHeight: 480
  }
};

export async function setupCamera(video: HTMLVideoElement): Promise<void> {
  const constraints = {
    video: {
      width: { ideal: CAMERA_CONFIG.IDEAL.width, max: CAMERA_CONFIG.MAX.width },
      height: { ideal: CAMERA_CONFIG.IDEAL.height, max: CAMERA_CONFIG.MAX.height },
      frameRate: { ideal: CAMERA_CONFIG.IDEAL.frameRate, max: CAMERA_CONFIG.MAX.frameRate },
      facingMode: 'user',
      aspectRatio: { ideal: CAMERA_CONFIG.IDEAL.aspectRatio }
    } 
  };

  const fallbackConstraints = {
    video: {
      facingMode: 'user',
      width: { min: CAMERA_CONFIG.FALLBACK.minWidth, ideal: CAMERA_CONFIG.IDEAL.width },
      height: { min: CAMERA_CONFIG.FALLBACK.minHeight, ideal: CAMERA_CONFIG.IDEAL.height }
    }
  };

  async function setupStream(constraints: any, isFallback = false) {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;
    
    return new Promise<void>((resolve) => {
      video.onloadedmetadata = () => {
        const canvas = document.getElementById('output') as HTMLCanvasElement;
        if (canvas) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          console.log(`Camera initialized${isFallback ? ' (fallback)' : ''}: ${video.videoWidth}x${video.videoHeight}`);
        }
        resolve();
      };
    });
  }

  try {
    return await setupStream(constraints);
  } catch (error) {
    console.error('Camera setup failed:', error);
    return await setupStream(fallbackConstraints, true);
  }
} 