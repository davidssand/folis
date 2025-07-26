export function drawHeadOvalGuide(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
  const ovalCenterX = canvas.width / 2;
  const ovalCenterY = canvas.height / 2;
  const ovalRadiusX = canvas.width * 0.40;
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

export function drawFaceMesh(
    ctx: CanvasRenderingContext2D,
    landmarks: any[],
    canvas: HTMLCanvasElement,
    drawConnectors: any,
    drawLandmarks: any,
    FaceMesh: any
) {
  drawLandmarks(ctx, landmarks, { color: '#FF3030', lineWidth: 1, radius: 0.5 });
}

export function drawCanvasMessage(ctx: CanvasRenderingContext2D, msg: string, color: string, y: number) {
  ctx.save();
  ctx.font = 'bold 32px sans-serif';
  ctx.fillStyle = color;
  ctx.fillText(msg, 30, y);
  ctx.restore();
} 

export function drawArrow(ctx: CanvasRenderingContext2D, x: number, y: number, dx: number, dy: number, color: string, label?: string) {
  ctx.save();
  // Add shadow for better visibility
  ctx.shadowColor = 'rgba(0,0,0,0.25)';
  ctx.shadowBlur = 4;

  // Arrow shaft
  ctx.strokeStyle = color;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + dx, y + dy);
  ctx.stroke();

  // Arrowhead (smaller, more pointy)
  const len = Math.sqrt(dx * dx + dy * dy);
  const headLength = 22; // longer
  const headWidth = 7;   // narrower
  const angle = Math.atan2(dy, dx);
  const hx = x + dx;
  const hy = y + dy;
  ctx.beginPath();
  ctx.moveTo(hx, hy);
  ctx.lineTo(
    hx - headLength * Math.cos(angle - Math.PI / 9),
    hy - headLength * Math.sin(angle - Math.PI / 9)
  );
  ctx.lineTo(
    hx - headWidth * Math.cos(angle),
    hy - headWidth * Math.sin(angle)
  );
  ctx.lineTo(
    hx - headLength * Math.cos(angle + Math.PI / 9),
    hy - headLength * Math.sin(angle + Math.PI / 9)
  );
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.92;
  ctx.fill();

  // Draw label if provided
  if (label) {
    ctx.globalAlpha = 1.0;
    ctx.shadowBlur = 0;
    ctx.font = 'bold 10px sans-serif';
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // Place label a bit past the arrowhead
    const labelOffset = 20;
    ctx.fillText(label, hx + labelOffset * Math.cos(angle), hy + labelOffset * Math.sin(angle));
  }
  ctx.restore();
}