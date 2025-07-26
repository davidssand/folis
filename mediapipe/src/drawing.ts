export function drawHeadOvalGuide(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
  const ovalCenterX = canvas.width / 2;
  const ovalCenterY = canvas.height / 2; // Adjusted for mobile
  const ovalRadiusX = canvas.width * 0.35; // Slightly smaller for mobile
  const ovalRadiusY = canvas.height * 0.35;
  
  ctx.save();
  
  // Draw outer glow
  ctx.shadowColor = 'rgba(0, 170, 255, 0.3)';
  ctx.shadowBlur = 20;
  ctx.globalAlpha = 0.15;
  ctx.beginPath();
  ctx.ellipse(ovalCenterX, ovalCenterY, ovalRadiusX + 10, ovalRadiusY + 10, 0, 0, 2 * Math.PI);
  ctx.fillStyle = '#00aaff';
  ctx.fill();
  
  // Draw main oval
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 0.12;
  ctx.beginPath();
  ctx.ellipse(ovalCenterX, ovalCenterY, ovalRadiusX, ovalRadiusY, 0, 0, 2 * Math.PI);
  ctx.fillStyle = '#00aaff';
  ctx.fill();
  
  // Draw border
  ctx.globalAlpha = 0.8;
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#00aaff';
  ctx.stroke();
  
  // Draw dashed inner guide
  ctx.setLineDash([8, 8]);
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.4;
  ctx.strokeStyle = '#ffffff';
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
  // Make face mesh more visible on mobile
  ctx.save();
  ctx.globalAlpha = 0.8; // Increased from 0.3 to 0.8
  drawLandmarks(ctx, landmarks, { color: '#FF3030', lineWidth: 2, radius: 1.5 }); // Increased lineWidth and radius
  ctx.restore();
}

export function drawCanvasMessage(ctx: CanvasRenderingContext2D, msg: string, color: string, y: number) {
  ctx.save();
  ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = color;
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 4;
  ctx.fillText(msg, 30, y);
  ctx.restore();
} 

export function drawArrow(ctx: CanvasRenderingContext2D, x: number, y: number, dx: number, dy: number, color: string, label?: string) {
  ctx.save();
  
  // Enhanced shadow for better visibility on mobile
  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetX = 3;
  ctx.shadowOffsetY = 3;

  const angle = Math.atan2(dy, dx);
  const hx = x + dx;
  const hy = y + dy;

  // Draw label if provided (using emoji arrows for mobile)
  if (label) {
    ctx.globalAlpha = 1.0;
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, sans-serif'; // Even larger font
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Place label near the arrowhead
    const labelOffset = 45; // Increased offset
    const labelX = hx + labelOffset * Math.cos(angle);
    const labelY = hy + labelOffset * Math.sin(angle);
    
    // Add background for better readability
    const textMetrics = ctx.measureText(label);
    const padding = 8; // More padding
    ctx.fillStyle = 'rgba(0,0,0,0.8)'; // Darker background
    ctx.fillRect(
      labelX - textMetrics.width/2 - padding,
      labelY - 12 - padding,
      textMetrics.width + padding * 2,
      24 + padding * 2
    );
    
    ctx.fillStyle = color;
    ctx.fillText(label, labelX, labelY);
  }
  
  ctx.restore();
}