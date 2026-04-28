'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { PoseLandmark, DetectionState } from '@/hooks/usePoseLandmarker';

interface PoseOverlayProps {
  pose: { id: string; name: string };
  canvasWidth: number;
  canvasHeight: number;
  landmarks?: PoseLandmark[];
  detectionState?: DetectionState;
}

// Landmark indices
const LEFT_SHOULDER = 11;
const RIGHT_SHOULDER = 12;
const LEFT_HIP = 23;
const RIGHT_HIP = 24;
const LEFT_KNEE = 25;
const RIGHT_KNEE = 26;
const LEFT_ANKLE = 27;
const RIGHT_ANKLE = 28;
const LEFT_WRIST = 15;
const RIGHT_WRIST = 16;
const LEFT_ELBOW = 13;
const RIGHT_ELBOW = 14;

const POINT_RADIUS = 5;
const LINE_WIDTH = 2;
const POINT_COLOR = '#6366F1';
const LINE_COLOR = 'rgba(99, 102, 241, 0.5)';
const GREEN_COLOR = '#1D9E75';
const YELLOW_COLOR = '#EF9F27';

function toPixelX(landmark: PoseLandmark, width: number): number {
  return landmark.x * width;
}

function toPixelY(landmark: PoseLandmark, height: number): number {
  return landmark.y * height;
}

function drawCircle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  fillColor: string
) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI);
  ctx.fillStyle = fillColor;
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  width: number = LINE_WIDTH
) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function drawMeasurementLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  label: string,
  color: string
) {
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;

  // Draw the line
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Draw end markers
  drawCircle(ctx, x1, y1, 4, color);
  drawCircle(ctx, x2, y2, 4, color);

  // Draw label
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.fillText(label, midX, midY - 8);
}

export default function PoseOverlay({
  pose,
  canvasWidth,
  canvasHeight,
  landmarks,
  detectionState = 'no_person',
}: PoseOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const pulseRef = useRef<number>(0);

  const isDetected = landmarks
    ? landmarks.filter(l => l.visibility > 0.5).length >= 10
    : false;

  const getOverlayColor = useCallback((): string => {
    if (!landmarks) return YELLOW_COLOR;

    const keyLandmarks = [
      landmarks[LEFT_SHOULDER],
      landmarks[RIGHT_SHOULDER],
      landmarks[LEFT_HIP],
      landmarks[RIGHT_HIP],
      landmarks[LEFT_KNEE],
      landmarks[RIGHT_KNEE],
      landmarks[LEFT_ANKLE],
      landmarks[RIGHT_ANKLE],
    ].filter(Boolean);

    if (keyLandmarks.length < 4) return YELLOW_COLOR;

    const allGood = keyLandmarks.every(l => l.visibility > 0.7);
    return allGood ? GREEN_COLOR : YELLOW_COLOR;
  }, [landmarks]);

  const drawMoveAwayArrows = useCallback((
    ctx: CanvasRenderingContext2D,
    state: DetectionState
  ) => {
    if (state !== 'too_close') return;

    pulseRef.current = (pulseRef.current + 1) % 60;
    const pulse = Math.sin(pulseRef.current * 0.1) * 0.3 + 0.7;

    const corners = [
      { x: canvasWidth * 0.15, y: canvasHeight * 0.2, angle: 45 },
      { x: canvasWidth * 0.85, y: canvasHeight * 0.2, angle: 135 },
      { x: canvasWidth * 0.15, y: canvasHeight * 0.8, angle: -45 },
      { x: canvasWidth * 0.85, y: canvasHeight * 0.8, angle: -135 },
    ];

    ctx.save();
    corners.forEach(corner => {
      ctx.save();
      ctx.translate(corner.x, corner.y);
      ctx.rotate((corner.angle * Math.PI) / 180);

      ctx.globalAlpha = pulse;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';

      ctx.beginPath();
      ctx.moveTo(-15, 0);
      ctx.lineTo(15, 0);
      ctx.moveTo(5, -8);
      ctx.lineTo(15, 0);
      ctx.lineTo(5, 8);
      ctx.stroke();

      ctx.restore();
    });

    // Draw "Aléjate" text
    ctx.globalAlpha = pulse;
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Aléjate', canvasWidth / 2, canvasHeight / 2);

    ctx.restore();
  }, [canvasWidth, canvasHeight]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    const color = getOverlayColor();

    // Draw pose name
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(pose.name, canvasWidth / 2, 24);

    // Draw move away arrows if too close
    if (detectionState === 'too_close' && landmarks && landmarks.length > 0) {
      drawMoveAwayArrows(ctx, detectionState);
      animationRef.current = requestAnimationFrame(draw);
      return;
    }

    if (!landmarks || landmarks.length < 8) {
      // Show detection message
      ctx.font = '14px system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.textAlign = 'center';
      ctx.fillText('Colócate frente a la cámara', canvasWidth / 2, canvasHeight / 2);
      animationRef.current = requestAnimationFrame(draw);
      return;
    }

    const lm = landmarks;

    // Helper to check if landmark exists and has good visibility
    const isGood = (idx: number): boolean => {
      return lm[idx] && lm[idx].visibility > 0.5;
    };

    // Draw skeleton connections
    const connections: [number, number][] = [
      // Left arm
      [LEFT_SHOULDER, LEFT_ELBOW],
      [LEFT_ELBOW, LEFT_WRIST],
      // Right arm
      [RIGHT_SHOULDER, RIGHT_ELBOW],
      [RIGHT_ELBOW, RIGHT_WRIST],
      // Left leg
      [LEFT_HIP, LEFT_KNEE],
      [LEFT_KNEE, LEFT_ANKLE],
      // Right leg
      [RIGHT_HIP, RIGHT_KNEE],
      [RIGHT_KNEE, RIGHT_ANKLE],
      // Shoulders
      [LEFT_SHOULDER, RIGHT_SHOULDER],
      // Hips
      [LEFT_HIP, RIGHT_HIP],
    ];

    connections.forEach(([start, end]) => {
      if (isGood(start) && isGood(end)) {
        const x1 = toPixelX(lm[start], canvasWidth);
        const y1 = toPixelY(lm[start], canvasHeight);
        const x2 = toPixelX(lm[end], canvasWidth);
        const y2 = toPixelY(lm[end], canvasHeight);
        drawLine(ctx, x1, y1, x2, y2, LINE_COLOR, LINE_WIDTH);
      }
    });

    // Draw measurement lines
    if (isGood(LEFT_SHOULDER) && isGood(RIGHT_SHOULDER)) {
      const x1 = toPixelX(lm[LEFT_SHOULDER], canvasWidth);
      const y1 = toPixelY(lm[LEFT_SHOULDER], canvasHeight);
      const x2 = toPixelX(lm[RIGHT_SHOULDER], canvasWidth);
      const y2 = toPixelY(lm[RIGHT_SHOULDER], canvasHeight);
      drawMeasurementLine(ctx, x1, y1, x2, y2, 'Hombros', color);
    }

    if (isGood(LEFT_HIP) && isGood(RIGHT_HIP)) {
      const x1 = toPixelX(lm[LEFT_HIP], canvasWidth);
      const y1 = toPixelY(lm[LEFT_HIP], canvasHeight);
      const x2 = toPixelX(lm[RIGHT_HIP], canvasWidth);
      const y2 = toPixelY(lm[RIGHT_HIP], canvasHeight);
      drawMeasurementLine(ctx, x1, y1, x2, y2, 'Caderas', color);
    }

    // Waist line - midpoint between shoulders and hips
    if (isGood(LEFT_SHOULDER) && isGood(RIGHT_SHOULDER) &&
        isGood(LEFT_HIP) && isGood(RIGHT_HIP)) {
      const shoulderMidX = (toPixelX(lm[LEFT_SHOULDER], canvasWidth) + toPixelX(lm[RIGHT_SHOULDER], canvasWidth)) / 2;
      const shoulderMidY = (toPixelY(lm[LEFT_SHOULDER], canvasHeight) + toPixelY(lm[RIGHT_SHOULDER], canvasHeight)) / 2;
      const hipMidX = (toPixelX(lm[LEFT_HIP], canvasWidth) + toPixelX(lm[RIGHT_HIP], canvasWidth)) / 2;
      const hipMidY = (toPixelY(lm[LEFT_HIP], canvasHeight) + toPixelY(lm[RIGHT_HIP], canvasHeight)) / 2;
      const waistMidX = (shoulderMidX + hipMidX) / 2;
      const waistMidY = (shoulderMidY + hipMidY) / 2;
      const waistHalfWidth = 50; // Fixed width for waist line representation

      drawMeasurementLine(
        ctx,
        waistMidX - waistHalfWidth,
        waistMidY,
        waistMidX + waistHalfWidth,
        waistMidY,
        'Cintura',
        color
      );
    }

    // Draw landmark points
    const keyPoints = [
      LEFT_SHOULDER, RIGHT_SHOULDER,
      LEFT_HIP, RIGHT_HIP,
      LEFT_KNEE, RIGHT_KNEE,
      LEFT_ANKLE, RIGHT_ANKLE,
      LEFT_WRIST, RIGHT_WRIST,
      LEFT_ELBOW, RIGHT_ELBOW,
    ];

    keyPoints.forEach((idx) => {
      if (isGood(idx)) {
        const x = toPixelX(lm[idx], canvasWidth);
        const y = toPixelY(lm[idx], canvasHeight);
        drawCircle(ctx, x, y, POINT_RADIUS, POINT_COLOR);
      }
    });

    // Detection status
    const statusColor = detectionState === 'good' ? GREEN_COLOR :
                        detectionState === 'too_close' ? YELLOW_COLOR :
                        'rgba(255,255,255,0.5)';
    const statusText = detectionState === 'good' ? 'Listo para capturar' :
                       detectionState === 'too_close' ? 'Aléjate de la cámara' :
                       detectionState === 'partial' ? 'Un poco más atrás...' :
                       'Buscando cuerpo...';
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillStyle = statusColor;
    ctx.textAlign = 'center';
    ctx.fillText(statusText, canvasWidth / 2, canvasHeight - 20);

    animationRef.current = requestAnimationFrame(draw);
  }, [pose, canvasWidth, canvasHeight, landmarks, detectionState, getOverlayColor, drawMoveAwayArrows]);

  useEffect(() => {
    draw();
    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      width={canvasWidth}
      height={canvasHeight}
      className="absolute inset-0 pointer-events-none"
      style={{ width: '100%', height: '100%', transform: 'scaleX(-1)' }}
    />
  );
}