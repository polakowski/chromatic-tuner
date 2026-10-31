/**
 * Fixed-capacity ring buffer for mono float samples.
 *
 * Trzyma tylko ostatnie `capacity` próbek — starsze są nadpisywane.
 */
export class RingBuffer {
  private readonly data: Float32Array;
  private writeIndex = 0;
  private written = 0;

  constructor(readonly capacity: number) {
    if (capacity <= 0) {
      throw new Error('RingBuffer capacity must be positive');
    }
    this.data = new Float32Array(capacity);
  }

  /** Number of valid samples currently held (saturates at `capacity`). */
  get size(): number {
    return Math.min(this.written, this.capacity);
  }

  get isFull(): boolean {
    return this.written >= this.capacity;
  }

  write(samples: Float32Array, length = samples.length): void {
    const { capacity, data } = this;

    // Nadmiarowe próbki i tak zostałyby nadpisane — bierzemy tylko ogon.
    const start = length > capacity ? length - capacity : 0;
    for (let i = start; i < length; i++) {
      data[this.writeIndex] = samples[i];
      this.writeIndex = this.writeIndex + 1 === capacity ? 0 : this.writeIndex + 1;
    }
    this.written += length - start;
  }

  /**
   * Copies the most recent `out.length` samples into `out`, oldest first.
   * Returns false (leaving `out` untouched) when not enough samples are buffered yet.
   */
  readLatest(out: Float32Array): boolean {
    const count = out.length;
    if (count > this.size) {
      return false;
    }
    const { capacity, data } = this;
    let read = (this.writeIndex - count + capacity) % capacity;
    for (let i = 0; i < count; i++) {
      out[i] = data[read];
      read = read + 1 === capacity ? 0 : read + 1;
    }
    return true;
  }

  reset(): void {
    this.data.fill(0);
    this.writeIndex = 0;
    this.written = 0;
  }
}
