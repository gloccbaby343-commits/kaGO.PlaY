import React, { useEffect, useRef } from 'react';
import { audioEngine } from '../services/audioEngine';

interface VisualizerCanvasProps {
  isPlaying: boolean;
  mode?: 'bars' | 'wave';
  barColor?: string;
  className?: string;
  barCount?: number;
}

export const VisualizerCanvas: React.FC<VisualizerCanvasProps> = ({
  isPlaying,
  mode = 'bars',
  className = 'w-full h-16',
  barCount = 32,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dataArray = new Uint8Array(64);
    let phase = 0;

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        const targetW = Math.floor(rect.width);
        const targetH = Math.floor(rect.height);
        if (canvas.width !== targetW || canvas.height !== targetH) {
          canvas.width = targetW;
          canvas.height = targetH;
        }
      }

      const width = canvas.width || 400;
      const height = canvas.height || 60;
      ctx.clearRect(0, 0, width, height);

      if (isPlaying) {
        if (mode === 'bars') {
          audioEngine.getVisualizerData(dataArray);
          let sum = 0;
          for (let i = 0; i < 16; i++) sum += dataArray[i];

          // If streaming via YouTube or external stream, provide lively rhythmic spectrum
          if (sum === 0) {
            phase += 0.08;
            for (let i = 0; i < 64; i++) {
              const beat = Math.sin(phase * 1.8) > 0.2 ? 190 : 80;
              const rhythm = Math.sin(phase * 2.5 + i * 0.35) * 55 + 95;
              dataArray[i] = Math.min(240, Math.max(30, (i < 8 ? beat : rhythm) + Math.random() * 25));
            }
          }

          const count = Math.min(barCount, 40);
          const barWidth = (width / count) * 0.72;
          const gap = (width / count) * 0.28;

          for (let i = 0; i < count; i++) {
            const val = dataArray[i] || 0;
            const barHeight = Math.max(2, (val / 255) * height * 0.95);
            const x = i * (barWidth + gap);
            const y = height - barHeight;

            // Electric Crimson & Ruby Gradient per bar
            const grad = ctx.createLinearGradient(0, height, 0, 0);
            grad.addColorStop(0, '#500724');
            grad.addColorStop(0.4, '#b91c1c');
            grad.addColorStop(0.8, '#ff3e3e');
            grad.addColorStop(1, '#f2efeb');

            ctx.fillStyle = grad;
            ctx.shadowBlur = 6;
            ctx.shadowColor = 'rgba(255, 62, 62, 0.4)';

            ctx.beginPath();
            ctx.roundRect(x, y, barWidth, barHeight, [2, 2, 0, 0]);
            ctx.fill();
          }
        } else {
          // Wave mode
          audioEngine.getWaveformData(dataArray);
          ctx.beginPath();
          ctx.lineWidth = 2;
          const grad = ctx.createLinearGradient(0, 0, width, 0);
          grad.addColorStop(0, '#7f1d1d');
          grad.addColorStop(0.5, '#ff3e3e');
          grad.addColorStop(1, '#f87171');
          ctx.strokeStyle = grad;
          ctx.shadowBlur = 8;
          ctx.shadowColor = 'rgba(255, 62, 62, 0.5)';

          const sliceWidth = width / dataArray.length;
          let x = 0;
          for (let i = 0; i < dataArray.length; i++) {
            const v = dataArray[i] / 128.0;
            const y = (v * height) / 2;
            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
            x += sliceWidth;
          }
          ctx.stroke();
        }
      } else {
        // Idle gentle breathing sine wave
        phase += 0.035;
        ctx.beginPath();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = 'rgba(255, 62, 62, 0.25)';
        for (let x = 0; x < width; x += 4) {
          const y = height / 2 + Math.sin(x * 0.04 + phase) * 3;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isPlaying, mode, barCount]);

  return (
    <canvas
      ref={canvasRef}
      className={`${className} block`}
      aria-label="Real-time Audio Visualizer Spectrum"
    />
  );
};
