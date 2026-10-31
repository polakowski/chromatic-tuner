import { useCallback, useEffect, useRef, useState } from 'react';

import type { MicStatus, MicStreamControls, MicStreamOptions } from './micStream.types';

/** Samples the worklet batches up before posting to the main thread. */
const BATCH_SIZE = 1024;
const PROCESSOR_NAME = 'tuner-mic-forward';

/**
 * Worklet tylko zbiera próbki w paczki i przesyła je na główny wątek —
 * cały DSP zostaje w zwykłym JS, tak samo jak na Androidzie.
 */
const WORKLET_SOURCE = `
class MicForward extends AudioWorkletProcessor {
  constructor() {
    super();
    this.batch = new Float32Array(${BATCH_SIZE});
    this.offset = 0;
  }

  process(inputs) {
    const channel = inputs[0] && inputs[0][0];
    if (!channel) {
      return true;
    }
    for (let i = 0; i < channel.length; i++) {
      this.batch[this.offset++] = channel[i];
      if (this.offset === ${BATCH_SIZE}) {
        const out = this.batch;
        this.batch = new Float32Array(${BATCH_SIZE});
        this.offset = 0;
        this.port.postMessage(out, [out.buffer]);
      }
    }
    return true;
  }
}

registerProcessor('${PROCESSOR_NAME}', MicForward);
`;

interface WebGraph {
  context: AudioContext;
  mediaStream: MediaStream;
  source: MediaStreamAudioSourceNode;
  worklet: AudioWorkletNode;
}

export function useMicStream({ sampleRate, onBuffer }: MicStreamOptions): MicStreamControls {
  const [status, setStatus] = useState<MicStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const onBufferRef = useRef(onBuffer);
  useEffect(() => {
    onBufferRef.current = onBuffer;
  }, [onBuffer]);

  const graphRef = useRef<WebGraph | null>(null);
  const workletUrlRef = useRef<string | null>(null);

  const teardown = useCallback(() => {
    const graph = graphRef.current;
    graphRef.current = null;
    if (graph) {
      graph.worklet.port.onmessage = null;
      graph.worklet.disconnect();
      graph.source.disconnect();
      graph.mediaStream.getTracks().forEach((track) => track.stop());
      void graph.context.close();
    }
    if (workletUrlRef.current) {
      URL.revokeObjectURL(workletUrlRef.current);
      workletUrlRef.current = null;
    }
  }, []);

  const start = useCallback(async () => {
    if (graphRef.current) {
      return;
    }
    setStatus('starting');
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          // Przetwarzanie głosowe psułoby pomiar wysokości dźwięku.
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      const context = new AudioContext({ sampleRate });
      const url = URL.createObjectURL(new Blob([WORKLET_SOURCE], { type: 'text/javascript' }));
      workletUrlRef.current = url;
      await context.audioWorklet.addModule(url);

      const source = context.createMediaStreamSource(mediaStream);
      const worklet = new AudioWorkletNode(context, PROCESSOR_NAME);
      worklet.port.onmessage = (event: MessageEvent<Float32Array>) => {
        onBufferRef.current({
          data: event.data,
          sampleRate: context.sampleRate,
          channels: 1,
        });
      };
      source.connect(worklet);

      graphRef.current = { context, mediaStream, source, worklet };

      // Polityka autoplay może zostawić kontekst uśpiony do pierwszego gestu.
      if (context.state === 'suspended') {
        await context.resume();
      }

      setError(null);
      setStatus(context.state === 'running' ? 'running' : 'blocked');
    } catch (cause) {
      teardown();
      setError(cause instanceof Error ? cause.message : String(cause));
      setStatus('error');
    }
  }, [sampleRate, teardown]);

  const stop = useCallback(() => {
    teardown();
    setStatus('idle');
  }, [teardown]);

  useEffect(() => teardown, [teardown]);

  return { status, error, start, stop };
}
