export async function setupCamera(video: HTMLVideoElement): Promise<void> {
  const stream = await navigator.mediaDevices.getUserMedia({ 
    video: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 30 }
    } 
  });
  video.srcObject = stream;
  return new Promise<void>((resolve) => {
    video.onloadedmetadata = () => {
      // Set canvas size to match video resolution
      const canvas = document.getElementById('output') as HTMLCanvasElement;
      if (canvas) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }
      resolve();
    };
  });
} 