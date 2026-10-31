/**
 * Wspólny kontrakt strumienia mikrofonowego.
 *
 * Implementacje są wybierane przez Metro po rozszerzeniu pliku:
 * `micStream.ts` (expo-audio) i `micStream.web.ts` (Web Audio API).
 * Hook `useAudioStream` z expo-audio jest na web tylko zaślepką, dlatego
 * przeglądarkowa ścieżka ma własną implementację.
 */

export interface MicBuffer {
  /** Interleaved PCM frames in the -1..1 range. */
  data: Float32Array;
  /** Actual capture rate; may differ from the requested one. */
  sampleRate: number;
  channels: number;
}

export interface MicStreamOptions {
  /** Desired capture rate in Hz. */
  sampleRate: number;
  onBuffer: (buffer: MicBuffer) => void;
}

export type MicStatus =
  /** Not started yet, or stopped. */
  | 'idle'
  /** start() in flight. */
  | 'starting'
  /** Delivering buffers. */
  | 'running'
  /** Needs a user gesture to begin (browser autoplay policy). */
  | 'blocked'
  | 'error';

export interface MicStreamControls {
  status: MicStatus;
  error: string | null;
  start: () => Promise<void>;
  stop: () => void;
}
