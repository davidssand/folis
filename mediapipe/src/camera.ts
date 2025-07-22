export async function setupCamera(video: HTMLVideoElement): Promise<void> {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;
  return new Promise<void>((resolve) => {
    video.onloadedmetadata = () => resolve();
  });
} 