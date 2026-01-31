# Move Detection Feature

## Overview

Move detection identifies when a block of code has been relocated from one position to another within a file, rather than treating it as a separate deletion and insertion. This is a planned feature that exists in VS Code's diff implementation but has not yet been ported to diff-it.

## Current Behavior

Without move detection, relocated code appears as two separate changes:

```
Original                    Modified
─────────────────────────   ─────────────────────────
function foo() { }  [-]     function bar() { }
function bar() { }          function baz() { }
function baz() { }          function foo() { }  [+]
```

The user sees `foo()` deleted at line 1 and a new `foo()` added at line 3, with no indication they are the same code.

## Desired Behavior

With move detection enabled, the diff would recognize that `foo()` was moved:

```
Original                    Modified
─────────────────────────   ─────────────────────────
function foo() { }  [→]     function bar() { }
function bar() { }          function baz() { }
function baz() { }          function foo() { }  [←]
```

VS Code visually connects moved blocks with curved lines in the diff editor.

## VS Code Implementation Reference

### Source Files

The move detection logic is located in:

```
vscode-main/src/vs/editor/common/diff/defaultLinesDiffComputer/computeMovedLines.ts
```

### Key Functions

| Function | Purpose |
|----------|---------|
| `computeMovesFromSimpleDeletionsToSimpleInsertions()` | Matches deleted blocks to inserted blocks |
| `computeUnchangedMoves()` | Finds unchanged blocks that were repositioned |
| `joinCloseConsecutiveMoves()` | Merges nearby moves into single logical moves |
| `removeMovesInSameDiff()` | Filters out invalid move detections |

### Algorithm

1. **Identify candidates**: Find all "simple" deletions (blocks removed without replacement) and "simple" insertions (blocks added without replacing anything)

2. **Content matching**: Compare content using histogram-based similarity matching
   - Similarity threshold: 0.90 (90% match required)
   - Minimum size: 15 characters
   - Minimum lines: 2+ lines with 2+ characters each

3. **Link matches**: Create `MovedText` objects linking original and new positions

4. **Merge adjacent**: Join consecutive or nearby moves into single logical moves

### Data Structures

```typescript
// From VS Code's linesDiffComputer.ts
interface MovedText {
  readonly lineRangeMapping: LineRangeMapping;
  readonly changes: readonly DetailedLineRangeMapping[];
}

interface LinesDiff {
  readonly changes: readonly DetailedLineRangeMapping[];
  readonly moves: readonly MovedText[];  // <-- Move information
  readonly hitTimeout: boolean;
}
```

## Implementation Plan for diff-it

### Phase 1: Algorithm Port

1. Create `src/lib/diff/algorithm/computeMovedLines.ts`
2. Port the following from VS Code:
   - `LineRangeFragment` class for similarity measurement
   - `computeMovesFromSimpleDeletionsToSimpleInsertions()`
   - `computeUnchangedMoves()`
   - Helper functions for histogram matching

3. Update `DefaultLinesDiffComputer.computeDiff()` to call move detection when `options.computeMoves` is true

4. Update `LinesDiff` interface to include `moves` array

### Phase 2: UI Types

1. Update `src/lib/types/diff.ts`:

```typescript
export interface MovedBlock {
  originalLineStart: number;
  originalLineEnd: number;
  modifiedLineStart: number;
  modifiedLineEnd: number;
}

export interface DiffResult {
  leftLines: LineDiff[];
  rightLines: LineDiff[];
  stats: { additions: number; deletions: number; modified: number };
  hitTimeout: boolean;
  moves: MovedBlock[];  // <-- Add this
}
```

2. Update `src/lib/utils/diff.ts` to extract move information

### Phase 3: UI Visualization

Options for displaying moves:

#### Option A: Indicator Icons
- Add move indicators (arrows) in the gutter next to moved lines
- Color-code moved blocks differently from regular changes
- Show tooltip on hover explaining the move

#### Option B: Connecting Lines (VS Code style)
- Render SVG/Canvas overlay between the two panels
- Draw curved lines connecting moved blocks
- Requires careful positioning and scroll synchronization

#### Option C: Highlighting Only
- Simply highlight moved blocks with a distinct color
- Add a legend explaining the color meaning
- Simplest to implement

### Phase 4: Configuration

1. Add UI toggle for move detection (may impact performance on large files)
2. Make similarity threshold configurable
3. Add option to show/hide move connections

## Performance Considerations

Move detection adds computational overhead:
- Worst case O(n²) for comparing all deletion/insertion pairs
- Histogram building for each candidate block
- Consider disabling by default for files > 5000 lines
- May want to run in Web Worker for large files

## Testing

Test cases to verify:

```typescript
// Test 1: Simple function move
const original = `function a() {}
function b() {}
function c() {}`;

const modified = `function b() {}
function c() {}
function a() {}`;
// Expected: 1 move detected (a from line 1 to line 3)

// Test 2: Move with modifications
const original = `function foo() {
  return 1;
}`;

const modified = `function bar() {}
function foo() {
  return 2;  // changed
}`;
// Expected: Move detected with inner changes

// Test 3: No move (too different)
const original = `function foo() { return 1; }`;
const modified = `function foo() { return completelyDifferent(); }`;
// Expected: No move (below similarity threshold)
```

## References

- VS Code source: `src/vs/editor/common/diff/defaultLinesDiffComputer/computeMovedLines.ts`
- VS Code UI: `src/vs/editor/browser/widget/diffEditor/features/movedBlocksLinesFeature.ts`
- Original analysis: `VSCODE_DIFF_ANALYSIS.md` (section on Move Detection)
