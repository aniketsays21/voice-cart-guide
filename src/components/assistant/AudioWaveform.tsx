import React, { useEffect, useRef } from "react";

interface AudioWaveformProps {
  stream: MediaStream | null;
  isActive: boolean;
  barCount?: number;
  className?: string;
}

const AudioWaveform: React.FC<AudioWaveformProps> = ({ stream, isActive, barCount = 24, className = "" }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!stream || !isActive || !canvasRef.current) return;

    const audioCtx = new AudioContext();
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 64;
    analyser.smoothingTimeConstant = 0.75;
    source.connect(analyser);

    ctxRef.current = audioCtx;
    analyserRef.current = analyser;

    const data = new Uint8Array(analyser.frequencyBinCount);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;

    const draw = () => {
      if (!analyserRef.current) return;
      analyserRef.current.getByteFrequencyData(data);

      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      const gap = 2;
      const barW = (w - (barCount - 1) * gap) / barCount;
      const centerY = h / 2;

      // Get primary color from CSS
      const style = getComputedStyle(document.documentElement);
      const primary = style.getPropertyValue("--primary").trim();

      for (let i = 0; i < barCount; i++) {
        const dataIndex = Math.floor((i / barCount) * data.length);
        const val = data[dataIndex] / 255;
        const barH = Math.max(2, val * (h * 0.8));

        const x = i * (barW + gap);
        const y = centerY - barH / 2;

        // Opacity based on amplitude
        const opacity = 0.3 + val * 0.7;
        ctx.fillStyle = `hsla(${primary}, ${opacity})`;
        ctx.beginPath();
        ctx.roundRect(x, y, barW, barH, barW / 2);
        ctx.fill();
      }

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
      analyserRef.current = null;
      audioCtx.close();
      ctxRef.current = null;
    };
  }, [stream, isActive, barCount]);

  if (!isActive || !stream) return null;

  return (
    <canvas
      ref={canvasRef}
      className={`w-full ${className}`}
      style={{ height: 40 }}
    />
  );
};

export default AudioWaveform;
