// Configuration constants
const DRAWING_CONFIG = {
  OVAL: {
    centerYRatio: 0.5,
    radiusRatio: 0.35,
    glowOffset: 10,
    glowAlpha: 0.15,
    mainAlpha: 0.12,
    borderAlpha: 0.8,
    dashAlpha: 0.4,
    lineWidth: 2,
    dashWidth: 1,
    dashPattern: [8, 8]
  },
  FACE_MESH: {
    alpha: 0.8,
    color: '#FF3030',
    lineWidth: 2,
    radius: 1.5
  },
  MESSAGE: {
    font: 'bold 24px -apple-system, BlinkMacSystemFont, sans-serif',
    shadowBlur: 4,
    shadowColor: 'rgba(0,0,0,0.5)',
    xOffset: 30
  },
  ARROW: {
    shadowBlur: 12,
    shadowOffset: 3,
    font: 'bold 24px -apple-system, BlinkMacSystemFont, sans-serif',
    labelOffset: 45,
    padding: 8,
    backgroundAlpha: 0.8
  },
  TARGET: {
    DEFAULT_RADIUS: 20,
    DEFAULT_MARGIN: 80,
    BOTTOM_OFFSET: 20
  },
  ANIMATION: {
    PULSE_FREQUENCY: 8,
    PULSE_AMPLITUDE: 0.2,
    SPARKLE_RATIO: 0.8
  }
};

export function drawHeadOvalGuide(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
  const centerX = canvas.width / 2;
  const centerY = canvas.height * DRAWING_CONFIG.OVAL.centerYRatio;
  const radiusX = canvas.width * DRAWING_CONFIG.OVAL.radiusRatio;
  const radiusY = canvas.height * DRAWING_CONFIG.OVAL.radiusRatio;
  
  ctx.save();
  
  // Draw outer glow
  ctx.shadowColor = 'rgba(0, 170, 255, 0.3)';
  ctx.shadowBlur = 20;
  ctx.globalAlpha = DRAWING_CONFIG.OVAL.glowAlpha;
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, radiusX + DRAWING_CONFIG.OVAL.glowOffset, radiusY + DRAWING_CONFIG.OVAL.glowOffset, 0, 0, 2 * Math.PI);
  ctx.fillStyle = '#00aaff';
  ctx.fill();
  
  // Draw main oval
  ctx.shadowBlur = 0;
  ctx.globalAlpha = DRAWING_CONFIG.OVAL.mainAlpha;
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
  ctx.fillStyle = '#00aaff';
  ctx.fill();
  
  // Draw border
  ctx.globalAlpha = DRAWING_CONFIG.OVAL.borderAlpha;
  ctx.lineWidth = DRAWING_CONFIG.OVAL.lineWidth;
  ctx.strokeStyle = '#00aaff';
  ctx.stroke();
  
  // Draw dashed inner guide
  ctx.setLineDash(DRAWING_CONFIG.OVAL.dashPattern);
  ctx.lineWidth = DRAWING_CONFIG.OVAL.dashWidth;
  ctx.globalAlpha = DRAWING_CONFIG.OVAL.dashAlpha;
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
  ctx.save();
  ctx.globalAlpha = DRAWING_CONFIG.FACE_MESH.alpha;
  drawLandmarks(ctx, landmarks, { 
    color: DRAWING_CONFIG.FACE_MESH.color, 
    lineWidth: DRAWING_CONFIG.FACE_MESH.lineWidth, 
    radius: DRAWING_CONFIG.FACE_MESH.radius 
  });
  ctx.restore();
}

export function drawArrow(ctx: CanvasRenderingContext2D, x: number, y: number, dx: number, dy: number, color: string, label?: string) {
  ctx.save();
  
  // Enhanced shadow for better visibility on mobile
  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = DRAWING_CONFIG.ARROW.shadowBlur;
  ctx.shadowOffsetX = DRAWING_CONFIG.ARROW.shadowOffset;
  ctx.shadowOffsetY = DRAWING_CONFIG.ARROW.shadowOffset;

  const angle = Math.atan2(dy, dx);
  const hx = x + dx;
  const hy = y + dy;

  // Draw label if provided (using emoji arrows for mobile)
  if (label) {
    ctx.globalAlpha = 1.0;
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.font = DRAWING_CONFIG.ARROW.font;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Place label near the arrowhead
    const labelX = hx + DRAWING_CONFIG.ARROW.labelOffset * Math.cos(angle);
    const labelY = hy + DRAWING_CONFIG.ARROW.labelOffset * Math.sin(angle);
    
    // Add background for better readability
    const textMetrics = ctx.measureText(label);
    const padding = DRAWING_CONFIG.ARROW.padding;
    ctx.fillStyle = `rgba(0,0,0,${DRAWING_CONFIG.ARROW.backgroundAlpha})`;
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

/**
 * Returns an array of targets and which (if any) are hit by the given point.
 * Each target is {x, y, radius}. Returns [{x, y, radius, hit: boolean}, ...]
 */
export function getTargetsAndHits(canvasWidth: number, canvasHeight: number, pointX: number, pointY: number, opts?: {radius?: number, margin?: number}) {
    const radius = opts?.radius ?? DRAWING_CONFIG.TARGET.DEFAULT_RADIUS;
    const margin = opts?.margin ?? DRAWING_CONFIG.TARGET.DEFAULT_MARGIN;
    const bottomY = canvasHeight - radius - DRAWING_CONFIG.TARGET.BOTTOM_OFFSET;
    
    const targets = [
      { x: canvasWidth / 2, y: bottomY, radius },
      { x: canvasWidth - margin, y: bottomY, radius },
      { x: margin, y: bottomY, radius }
    ];
    
    return targets.map(target => ({ 
      ...target, 
      hit: Math.hypot(pointX - target.x, pointY - target.y) < radius 
    }));
  }
  
  // Enhanced target drawing for mobile
  export function drawTarget(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, hit: boolean) {
      ctx.save();
      
      // Animation timing
      const t = Date.now() / 1000;
      const pulse = hit ? 1 + DRAWING_CONFIG.ANIMATION.PULSE_AMPLITUDE * Math.sin(t * DRAWING_CONFIG.ANIMATION.PULSE_FREQUENCY) : 1;
      const animatedRadius = radius * pulse;
      
      // Enhanced shadow for mobile visibility
      const shadowColor = hit ? 'rgba(0, 255, 136, 0.6)' : 'rgba(0, 170, 255, 0.4)';
      const shadowBlur = hit ? 20 : 12;
      ctx.shadowColor = shadowColor;
      ctx.shadowBlur = shadowBlur;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      
      // Outer ring with gradient
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, animatedRadius);
      if (hit) {
        gradient.addColorStop(0, '#00ff88');
        gradient.addColorStop(0.7, '#00cc44');
        gradient.addColorStop(1, 'rgba(0, 204, 68, 0.3)');
      } else {
        gradient.addColorStop(0, '#00aaff');
        gradient.addColorStop(0.7, '#0088cc');
        gradient.addColorStop(1, 'rgba(0, 136, 204, 0.3)');
      }
      
      // Draw outer ring
      ctx.beginPath();
      ctx.arc(x, y, animatedRadius, 0, 2 * Math.PI);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 3;
      ctx.globalAlpha = hit ? 1.0 : 0.8;
      ctx.stroke();
      
      // Draw inner circle
      ctx.beginPath();
      ctx.arc(x, y, animatedRadius * 0.6, 0, 2 * Math.PI);
      ctx.fillStyle = hit ? '#00ff88' : '#00aaff';
      ctx.globalAlpha = hit ? 0.3 : 0.2;
      ctx.fill();
      
      // Draw center dot
      ctx.beginPath();
      ctx.arc(x, y, animatedRadius * 0.2, 0, 2 * Math.PI);
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = hit ? 0.9 : 0.6;
      ctx.fill();
      
      // Add sparkle effect when hit
      if (hit) {
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 0.8;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        
        // Draw cross lines for sparkle effect
        const sparkleLength = animatedRadius * DRAWING_CONFIG.ANIMATION.SPARKLE_RATIO;
        ctx.beginPath();
        ctx.moveTo(x - sparkleLength, y);
        ctx.lineTo(x + sparkleLength, y);
        ctx.moveTo(x, y - sparkleLength);
        ctx.lineTo(x, y + sparkleLength);
        ctx.stroke();
      }
      
      ctx.restore();
  }