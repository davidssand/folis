// Configuration constants
const DRAWING_CONFIG = {
  OVAL: {
    centerYRatio: 0.45,
    radiusRatio: 0.30,
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
    color: 'white',
    lineWidth: 2,
    radius: 2
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
    backgroundAlpha: 0.8,
    maxLength: 100,
    lengthRatio: 0.5,
    pulseAmplitude: 0.2
  },
  TARGET: {
    radius: 10,
    margin: 80,
    bottomOffset: 70,
    radiusRatio: 0.15
  },
  ANIMATION: {
    pulseFrequency: 8,
    pulseAmplitude: 0.2,
    sparkleRatio: 0.8
  }
};

// Export DRAWING_CONFIG for external use
export { DRAWING_CONFIG };

// Workflow state management
export interface WorkflowState {
  currentStep: number;
  completedSteps: boolean[];
  stepNames: string[];
  isComplete: boolean;
  holdStartTime: number | null;
  holdDuration: number;
  requiredHoldTime: number;
}

export const WORKFLOW_STEPS = {
  MIDDLE: 0,
  LEFT: 1,
  RIGHT: 2
};

export function createWorkflowState(): WorkflowState {
  return {
    currentStep: WORKFLOW_STEPS.MIDDLE,
    completedSteps: [false, false, false],
    stepNames: ['Acerte o alvo abaixo', 'Acerte o alvo no canto esquerdo', 'Acerte o alvo no canto direito'],
    isComplete: false,
    holdStartTime: null,
    holdDuration: 0,
    requiredHoldTime: 1000 // 1 second in milliseconds
  };
}

export function updateWorkflowState(workflowState: WorkflowState, targets: any[]): WorkflowState {
  const newState = { ...workflowState };
  const currentTime = Date.now();
  
  // Check if current target is hit
  if (targets[newState.currentStep]?.hit) {
    // Start or continue holding
    if (newState.holdStartTime === null) {
      newState.holdStartTime = currentTime;
    }
    
    // Calculate hold duration
    newState.holdDuration = currentTime - newState.holdStartTime;
    
    // Check if held long enough
    if (newState.holdDuration >= newState.requiredHoldTime && !newState.completedSteps[newState.currentStep]) {
      newState.completedSteps[newState.currentStep] = true;
      
      // Move to next step
      if (newState.currentStep < newState.stepNames.length - 1) {
        newState.currentStep++;
        // Reset hold state for next step
        newState.holdStartTime = null;
        newState.holdDuration = 0;
      } else {
        newState.isComplete = true;
      }
    }
  } else {
    // Not hitting target, reset hold state
    newState.holdStartTime = null;
    newState.holdDuration = 0;
  }
  
  return newState;
}

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

export function drawArrow(ctx: CanvasRenderingContext2D, startX: number, startY: number, deltaX: number, deltaY: number, color: string) {
  ctx.save();
  
  const arrowAngle = Math.atan2(deltaY, deltaX);
  const arrowLength = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  const headLength = Math.min(arrowLength * 0.25, 20);
  
  // Calculate shaft end (before arrowhead)
  const shaftEndX = startX + deltaX - (headLength * Math.cos(arrowAngle));
  const shaftEndY = startY + deltaY - (headLength * Math.sin(arrowAngle));
  
  // Enhanced shadow for better visibility
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 15;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;

  // Create gradient for the arrow shaft
  const gradient = ctx.createLinearGradient(startX, startY, shaftEndX, shaftEndY);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, '#ffffff');

  // Draw the main arrow shaft with gradient (stopping before arrowhead)
  ctx.strokeStyle = gradient;
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(shaftEndX, shaftEndY);
  ctx.stroke();

  // Draw arrowhead with separate gradient
  const headGradient = ctx.createRadialGradient(
    startX + deltaX, startY + deltaY, 0,
    startX + deltaX, startY + deltaY, headLength
  );
  headGradient.addColorStop(0, color);
  headGradient.addColorStop(1, '#ff8c69');
  
  const headAngle = Math.PI / 6; // 30 degrees
  
  ctx.fillStyle = headGradient;
  ctx.shadowColor = color;
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.moveTo(startX + deltaX, startY + deltaY);
  ctx.lineTo(
    shaftEndX - headLength * 0.8 * Math.cos(arrowAngle - headAngle),
    shaftEndY - headLength * 0.8 * Math.sin(arrowAngle - headAngle)
  );
  ctx.lineTo(
    shaftEndX - headLength * 0.8 * Math.cos(arrowAngle + headAngle),
    shaftEndY - headLength * 0.8 * Math.sin(arrowAngle + headAngle)
  );
  ctx.closePath();
  ctx.fill();

  // Add glow effect to shaft
  ctx.shadowColor = color;
  ctx.shadowBlur = 20;
  ctx.globalAlpha = 0.3;
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(shaftEndX, shaftEndY);
  ctx.stroke();

  // Add subtle inner glow to arrowhead
  ctx.globalAlpha = 0.6;
  ctx.shadowBlur = 15;
  ctx.beginPath();
  ctx.moveTo(startX + deltaX, startY + deltaY);
  ctx.lineTo(
    shaftEndX - headLength * 0.6 * Math.cos(arrowAngle - headAngle),
    shaftEndY - headLength * 0.6 * Math.sin(arrowAngle - headAngle)
  );
  ctx.lineTo(
    shaftEndX - headLength * 0.6 * Math.cos(arrowAngle + headAngle),
    shaftEndY - headLength * 0.6 * Math.sin(arrowAngle + headAngle)
  );
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/**
 * Returns an array of targets and which (if any) are hit by the given point.
 * Each target is {x, y, radius}. Returns [{x, y, radius, hit: boolean}, ...]
 */
export function getTargetsAndHits(canvasWidth: number, canvasHeight: number, pointX: number, pointY: number, opts?: {radius?: number, margin?: number}) {
    const targetRadius = opts?.radius ?? DRAWING_CONFIG.TARGET.radius;
    const targetMargin = opts?.margin ?? DRAWING_CONFIG.TARGET.margin;
    const targetBottomY = canvasHeight - targetRadius - DRAWING_CONFIG.TARGET.bottomOffset;
    
    const targets = [
      { x: canvasWidth / 2, y: targetBottomY, radius: targetRadius },
      { x: canvasWidth - targetMargin, y: targetBottomY, radius: targetRadius },
      { x: targetMargin, y: targetBottomY, radius: targetRadius }
    ];
    
    return targets.map(target => ({ 
      ...target, 
      hit: Math.hypot(pointX - target.x, pointY - target.y) < targetRadius 
    }));
  }

/**
 * Draw only the current workflow target
 */
export function drawCurrentWorkflowTarget(ctx: CanvasRenderingContext2D, targets: any[], workflowState: WorkflowState) {
  if (workflowState.isComplete) {
    // Draw all targets as completed
    targets.forEach((target, index) => {
      drawTarget(ctx, target.x, target.y, target.radius, true);
    });
    return;
  }
  
  // Draw only the current target
  const currentTarget = targets[workflowState.currentStep];
  if (currentTarget) {
    const isHolding = workflowState.holdStartTime !== null && workflowState.holdDuration > 0;
    drawTarget(ctx, currentTarget.x, currentTarget.y, currentTarget.radius, currentTarget.hit, isHolding, workflowState.holdDuration, workflowState.requiredHoldTime);
  }
  
  // Draw completed targets with a different style
  workflowState.completedSteps.forEach((completed, index) => {
    if (completed && index !== workflowState.currentStep) {
      const target = targets[index];
      drawCompletedTarget(ctx, target.x, target.y, target.radius);
    }
  });
}

/**
 * Draw only completed targets (for when user is not framed)
 */
export function drawCompletedTargetsOnly(ctx: CanvasRenderingContext2D, targets: any[], workflowState: WorkflowState) {
  // Draw only completed targets with checkmark style
  workflowState.completedSteps.forEach((completed, index) => {
    if (completed) {
      const target = targets[index];
      drawCompletedTarget(ctx, target.x, target.y, target.radius);
    }
  });
}

/**
 * Draw a completed target with a different visual style
 */
export function drawCompletedTarget(ctx: CanvasRenderingContext2D, targetX: number, targetY: number, targetRadius: number) {
  ctx.save();
  
  // Draw completed target with green color and checkmark effect
  const gradient = ctx.createRadialGradient(targetX, targetY, 0, targetX, targetY, targetRadius);
  gradient.addColorStop(0, '#00ff88');
  gradient.addColorStop(0.7, '#00cc44');
  gradient.addColorStop(1, 'rgba(0, 204, 68, 0.3)');
  
  // Draw outer ring
  ctx.beginPath();
  ctx.arc(targetX, targetY, targetRadius, 0, 2 * Math.PI);
  ctx.strokeStyle = gradient;
  ctx.lineWidth = 3;
  ctx.globalAlpha = 0.8;
  ctx.stroke();
  
  // Draw inner circle
  ctx.beginPath();
  ctx.arc(targetX, targetY, targetRadius * 0.6, 0, 2 * Math.PI);
  ctx.fillStyle = '#00ff88';
  ctx.globalAlpha = 0.3;
  ctx.fill();
  
  // Draw checkmark
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.moveTo(targetX - targetRadius * 0.3, targetY);
  ctx.lineTo(targetX - targetRadius * 0.1, targetY + targetRadius * 0.2);
  ctx.lineTo(targetX + targetRadius * 0.3, targetY - targetRadius * 0.2);
  ctx.stroke();
  
  ctx.restore();
}

  // Enhanced target drawing for mobile
  export function drawTarget(ctx: CanvasRenderingContext2D, targetX: number, targetY: number, targetRadius: number, isHit: boolean, isHolding: boolean = false, holdDuration: number = 0, requiredHoldTime: number = 0) {
      ctx.save();
      
      // Animation timing
      const currentTime = Date.now() / 1000;
      const pulseFactor = isHit ? 1 + DRAWING_CONFIG.ANIMATION.pulseAmplitude * Math.sin(currentTime * DRAWING_CONFIG.ANIMATION.pulseFrequency) : 1;
      const animatedRadius = targetRadius * pulseFactor;
      
      // Enhanced shadow for mobile visibility
      const shadowColor = isHit ? 'rgba(0, 255, 136, 0.6)' : 'rgba(0, 170, 255, 0.4)';
      const shadowBlur = isHit ? 20 : 12;
      ctx.shadowColor = shadowColor;
      ctx.shadowBlur = shadowBlur;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      
      // Outer ring with gradient
      const gradient = ctx.createRadialGradient(targetX, targetY, 0, targetX, targetY, animatedRadius);
      if (isHit) {
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
      ctx.arc(targetX, targetY, animatedRadius, 0, 2 * Math.PI);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 3;
      ctx.globalAlpha = isHit ? 1.0 : 0.8;
      ctx.stroke();
      
      // Draw inner circle
      ctx.beginPath();
      ctx.arc(targetX, targetY, animatedRadius * 0.6, 0, 2 * Math.PI);
      ctx.fillStyle = isHit ? '#00ff88' : '#00aaff';
      ctx.globalAlpha = isHit ? 0.3 : 0.2;
      ctx.fill();
      
      // Draw center dot
      ctx.beginPath();
      ctx.arc(targetX, targetY, animatedRadius * 0.2, 0, 2 * Math.PI);
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = isHit ? 0.9 : 0.6;
      ctx.fill();
      
      // Add sparkle effect when hit
      if (isHit) {
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 0.8;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        
        // Draw cross lines for sparkle effect
        const sparkleLength = animatedRadius * DRAWING_CONFIG.ANIMATION.sparkleRatio;
        ctx.beginPath();
        ctx.moveTo(targetX - sparkleLength, targetY);
        ctx.lineTo(targetX + sparkleLength, targetY);
        ctx.moveTo(targetX, targetY - sparkleLength);
        ctx.lineTo(targetX, targetY + sparkleLength);
        ctx.stroke();
      }

        // Draw loading animation for holding
        if (isHolding) {
          ctx.shadowBlur = 0;
          ctx.globalAlpha = 0.8;
          ctx.strokeStyle = '#00ff88'; // Green color for loading
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]); // Dashed line for loading
          ctx.beginPath();
          ctx.arc(targetX, targetY, animatedRadius, 0, 2 * Math.PI);
          ctx.stroke();
          ctx.setLineDash([]); // Reset line dash
          
          // Draw circular progress indicator
          const progress = Math.min(holdDuration / requiredHoldTime, 1);
          const progressRadius = animatedRadius + 8;
          const startAngle = -Math.PI / 2; // Start from top
          const endAngle = startAngle + (2 * Math.PI * progress);
          
          ctx.globalAlpha = 0.9;
          ctx.strokeStyle = '#00ff88';
          ctx.lineWidth = 3;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.arc(targetX, targetY, progressRadius, startAngle, endAngle);
          ctx.stroke();
          
          // Draw background circle for progress
          ctx.globalAlpha = 0.3;
          ctx.strokeStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(targetX, targetY, progressRadius, 0, 2 * Math.PI);
          ctx.stroke();
        }
      
      ctx.restore();
  }