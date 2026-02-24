import { useRef, useCallback } from "react";

/**
 * Voice Activity Detection hook.
 * Monitors audio levels and calls onSilence after `silenceMs` of quiet.
 */
export function useVAD(onSilence: () => void, silenceMs = 2000, threshold = 0.01) {
  const contextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number>(0);
  const silenceStartRef = useRef<number>(0);
  const activeRef = useRef(false);

  const start = useCallback((stream: MediaStream) => {
    const ctx = new AudioContext();
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    source.connect(analyser);

    contextRef.current = ctx;
    analyserRef.current = analyser;
    silenceStartRef.current = 0;
    activeRef.current = true;

    const data = new Float32Array(analyser.fftSize);

    const check = () => {
      if (!activeRef.current) return;
      analyser.getFloatTimeDomainData(data);
      let rms = 0;
      for (let i = 0; i < data.length; i++) rms += data[i] * data[i];
      rms = Math.sqrt(rms / data.length);

      const now = Date.now();
      if (rms < threshold) {
        if (silenceStartRef.current === 0) silenceStartRef.current = now;
        else if (now - silenceStartRef.current > silenceMs) {
          activeRef.current = false;
          onSilence();
          return;
        }
      } else {
        silenceStartRef.current = 0;
      }
      rafRef.current = requestAnimationFrame(check);
    };

    rafRef.current = requestAnimationFrame(check);
  }, [onSilence, silenceMs, threshold]);

  const stop = useCallback(() => {
    activeRef.current = false;
    cancelAnimationFrame(rafRef.current);
    contextRef.current?.close();
    contextRef.current = null;
  }, []);

  return { start, stop };
}
