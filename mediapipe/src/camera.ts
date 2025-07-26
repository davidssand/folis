export async function setupCamera(video: HTMLVideoElement): Promise<void> {
  // Mobile-optimized camera constraints
  const constraints = {
    video: {
      width: { ideal: 1280, max: 1920 },
      height: { ideal: 720, max: 1080 },
      frameRate: { ideal: 30, max: 60 },
      facingMode: 'user', // Use front camera on mobile
      aspectRatio: { ideal: 16/9 }
    } 
  };

  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;
    
    return new Promise<void>((resolve) => {
      video.onloadedmetadata = () => {
        // Set canvas size to match video resolution
        const canvas = document.getElementById('output') as HTMLCanvasElement;
        if (canvas) {
          // Use the actual video dimensions
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          // Log camera info for debugging
          console.log(`Camera initialized: ${video.videoWidth}x${video.videoHeight}`);
        }
        resolve();
      };
    });
  } catch (error) {
    console.error('Camera setup failed:', error);
    
    // Fallback to basic constraints if the ideal ones fail
    const fallbackConstraints = {
      video: {
        facingMode: 'user',
        width: { min: 640, ideal: 1280 },
        height: { min: 480, ideal: 720 }
      }
    };
    
    const stream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
    video.srcObject = stream;
    
    return new Promise<void>((resolve) => {
      video.onloadedmetadata = () => {
        const canvas = document.getElementById('output') as HTMLCanvasElement;
        if (canvas) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          console.log(`Camera initialized (fallback): ${video.videoWidth}x${video.videoHeight}`);
        }
        resolve();
      };
    });
  }
} 