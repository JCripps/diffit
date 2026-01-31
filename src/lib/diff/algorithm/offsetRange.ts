/**
 * A range of offsets (0-based).
 * Ported from VS Code's OffsetRange class.
 */
export class OffsetRange {
  public static fromTo(start: number, endExclusive: number): OffsetRange {
    return new OffsetRange(start, endExclusive);
  }

  public static equals(r1: OffsetRange, r2: OffsetRange): boolean {
    return r1.start === r2.start && r1.endExclusive === r2.endExclusive;
  }

  public static tryCreate(start: number, endExclusive: number): OffsetRange | undefined {
    if (start > endExclusive) {
      return undefined;
    }
    return new OffsetRange(start, endExclusive);
  }

  public static ofLength(length: number): OffsetRange {
    return new OffsetRange(0, length);
  }

  public static ofStartAndLength(start: number, length: number): OffsetRange {
    return new OffsetRange(start, start + length);
  }

  public static emptyAt(offset: number): OffsetRange {
    return new OffsetRange(offset, offset);
  }

  constructor(
    public readonly start: number,
    public readonly endExclusive: number
  ) {
    if (start > endExclusive) {
      throw new Error(`Invalid range: [${start}, ${endExclusive})`);
    }
  }

  get isEmpty(): boolean {
    return this.start === this.endExclusive;
  }

  public delta(offset: number): OffsetRange {
    return new OffsetRange(this.start + offset, this.endExclusive + offset);
  }

  public deltaStart(offset: number): OffsetRange {
    return new OffsetRange(this.start + offset, this.endExclusive);
  }

  public deltaEnd(offset: number): OffsetRange {
    return new OffsetRange(this.start, this.endExclusive + offset);
  }

  public get length(): number {
    return this.endExclusive - this.start;
  }

  public toString(): string {
    return `[${this.start}, ${this.endExclusive})`;
  }

  public equals(other: OffsetRange): boolean {
    return this.start === other.start && this.endExclusive === other.endExclusive;
  }

  public containsRange(other: OffsetRange): boolean {
    return this.start <= other.start && other.endExclusive <= this.endExclusive;
  }

  public contains(offset: number): boolean {
    return this.start <= offset && offset < this.endExclusive;
  }

  /**
   * Creates a range that spans both this and the other range.
   */
  public join(other: OffsetRange): OffsetRange {
    return new OffsetRange(
      Math.min(this.start, other.start),
      Math.max(this.endExclusive, other.endExclusive)
    );
  }

  /**
   * Returns the intersection of this and the other range, or undefined if they don't intersect.
   */
  public intersect(other: OffsetRange): OffsetRange | undefined {
    const start = Math.max(this.start, other.start);
    const end = Math.min(this.endExclusive, other.endExclusive);
    if (start <= end) {
      return new OffsetRange(start, end);
    }
    return undefined;
  }

  public intersectionLength(range: OffsetRange): number {
    const start = Math.max(this.start, range.start);
    const end = Math.min(this.endExclusive, range.endExclusive);
    return Math.max(0, end - start);
  }

  /**
   * Returns true if there exists a number n so that both ranges contain n.
   */
  public intersects(other: OffsetRange): boolean {
    const start = Math.max(this.start, other.start);
    const end = Math.min(this.endExclusive, other.endExclusive);
    return start < end;
  }

  public intersectsOrTouches(other: OffsetRange): boolean {
    const start = Math.max(this.start, other.start);
    const end = Math.min(this.endExclusive, other.endExclusive);
    return start <= end;
  }

  public isBefore(other: OffsetRange): boolean {
    return this.endExclusive <= other.start;
  }

  public isAfter(other: OffsetRange): boolean {
    return this.start >= other.endExclusive;
  }

  public slice<T>(arr: readonly T[]): T[] {
    return arr.slice(this.start, this.endExclusive);
  }

  public substring(str: string): string {
    return str.substring(this.start, this.endExclusive);
  }

  /**
   * Returns the given value if it is contained in this instance, otherwise the closest value.
   */
  public clip(value: number): number {
    if (this.isEmpty) {
      throw new Error(`Invalid clipping range: ${this.toString()}`);
    }
    return Math.max(this.start, Math.min(this.endExclusive - 1, value));
  }

  public map<T>(f: (offset: number) => T): T[] {
    const result: T[] = [];
    for (let i = this.start; i < this.endExclusive; i++) {
      result.push(f(i));
    }
    return result;
  }

  public forEach(f: (offset: number) => void): void {
    for (let i = this.start; i < this.endExclusive; i++) {
      f(i);
    }
  }
}
