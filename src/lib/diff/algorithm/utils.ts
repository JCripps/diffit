/**
 * Utility classes and functions for diff algorithms.
 * Ported from VS Code.
 */

/**
 * Character codes for common characters.
 */
export const CharCode = {
  Space: 32,
  Tab: 9,
  LineFeed: 10,
  CarriageReturn: 13,
  a: 97,
  z: 122,
  A: 65,
  Z: 90,
  Digit0: 48,
  Digit9: 57,
  Comma: 44,
  Semicolon: 59,
} as const;

/**
 * Checks if a character code represents a space or tab.
 */
export function isSpace(charCode: number): boolean {
  return charCode === CharCode.Space || charCode === CharCode.Tab;
}

/**
 * 2D array implementation for dynamic programming.
 */
export class Array2D<T> {
  private readonly array: T[] = [];

  constructor(
    public readonly width: number,
    public readonly height: number
  ) {
    this.array = new Array<T>(width * height);
  }

  get(x: number, y: number): T {
    return this.array[x + y * this.width];
  }

  set(x: number, y: number, value: T): void {
    this.array[x + y * this.width] = value;
  }
}

/**
 * Calls the callback for each element and its neighbors.
 */
export function forEachWithNeighbors<T>(
  array: readonly T[],
  callback: (prev: T | undefined, current: T, next: T | undefined) => void
): void {
  for (let i = 0; i < array.length; i++) {
    callback(array[i - 1], array[i], array[i + 1]);
  }
}

/**
 * Groups adjacent elements in an array based on a predicate.
 */
export function groupAdjacentBy<T>(
  items: readonly T[],
  shouldBeGrouped: (item1: T, item2: T) => boolean
): T[][] {
  const result: T[][] = [];
  let currentGroup: T[] | undefined;

  for (const item of items) {
    if (currentGroup && shouldBeGrouped(currentGroup[currentGroup.length - 1], item)) {
      currentGroup.push(item);
    } else {
      currentGroup = [item];
      result.push(currentGroup);
    }
  }

  return result;
}

/**
 * Finds the last index where the predicate is true using binary search.
 * Returns -1 if no element satisfies the predicate.
 */
export function findLastIdxMonotonous<T>(array: readonly T[], predicate: (item: T) => boolean): number {
  let lo = 0;
  let hi = array.length - 1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (predicate(array[mid])) {
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return hi;
}

/**
 * Finds the first index where the predicate is true using binary search.
 * Returns array.length if no element satisfies the predicate.
 */
export function findFirstIdxMonotonousOrArrLen<T>(
  array: readonly T[],
  predicate: (item: T) => boolean
): number {
  let lo = 0;
  let hi = array.length;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (predicate(array[mid])) {
      hi = mid;
    } else {
      lo = mid + 1;
    }
  }
  return lo;
}

/**
 * Finds the last element where the predicate is true using binary search.
 */
export function findLastMonotonous<T>(
  array: readonly T[],
  predicate: (item: T) => boolean
): T | undefined {
  const idx = findLastIdxMonotonous(array, predicate);
  return idx === -1 ? undefined : array[idx];
}

/**
 * Finds the first element where the predicate is true using binary search.
 */
export function findFirstMonotonous<T>(
  array: readonly T[],
  predicate: (item: T) => boolean
): T | undefined {
  const idx = findFirstIdxMonotonousOrArrLen(array, predicate);
  return idx === array.length ? undefined : array[idx];
}
