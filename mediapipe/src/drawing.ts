export function drawHeadOvalGuide(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
  const ovalCenterX = canvas.width / 2;
  const ovalCenterY = canvas.height / 2;
  const ovalRadiusX = canvas.width * 0.22;
  const ovalRadiusY = canvas.height * 0.40;
  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.beginPath();
  ctx.ellipse(ovalCenterX, ovalCenterY, ovalRadiusX, ovalRadiusY, 0, 0, 2 * Math.PI);
  ctx.fillStyle = '#00aaff';
  ctx.fill();
  ctx.globalAlpha = 1.0;
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#0077bb';
  ctx.stroke();
  ctx.restore();
}

export function drawFaceMesh(ctx: CanvasRenderingContext2D, landmarks: any[], canvas: HTMLCanvasElement, highlightPoints: {idx: number, color: string}[], drawConnectors: any, drawLandmarks: any, FaceMesh: any) {
  drawConnectors(ctx, landmarks, FaceMesh.FACEMESH_TESSELATION, { color: '#C0C0C070', lineWidth: 1 });
  drawLandmarks(ctx, landmarks, { color: '#FF3030', lineWidth: 1, radius: 0.5 });
  for (const { idx, color } of highlightPoints) {
    const pt = landmarks[idx];
    if (pt) {
      ctx.beginPath();
      ctx.arc(pt.x * canvas.width, pt.y * canvas.height, 6, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
}

export function drawCanvasMessage(ctx: CanvasRenderingContext2D, msg: string, color: string, y: number) {
  ctx.save();
  ctx.font = 'bold 32px sans-serif';
  ctx.fillStyle = color;
  ctx.fillText(msg, 30, y);
  ctx.restore();
} 