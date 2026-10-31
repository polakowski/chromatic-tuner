import { setAudioModeAsync, useAudioStream, type AudioStreamBuffer } from 'expo-audio';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { MicStatus, MicStreamControls, MicStreamOptions } from './micStream.types';

export function useMicStream({ sampleRate, onBuffer }: MicStreamOptions): MicStreamControls {
  const [status, setStatus] = useState<MicStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const onBufferRef = useRef(onBuffer);
  useEffect(() => {
    onBufferRef.current = onBuffer;
  }, [onBuffer]);

  const { stream } = useAudioStream({
    sampleRate,
    channels: 1,
    encoding: 'float32',
    onBuffer: (buffer: AudioStreamBuffer) => {
      onBufferRef.current({
        data: new Float32Array(buffer.data),
        sampleRate: buffer.sampleRate,
        channels: buffer.channels,
      });
    },
  });

  const start = useCallback(async () => {
    setStatus('starting');
    try {
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await stream.start();
      setError(null);
      setStatus('running');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
      setStatus('error');
    }
  }, [stream]);

  const stop = useCallback(() => {
    stream.stop();
    setStatus('idle');
  }, [stream]);

  return { status, error, start, stop };
}
