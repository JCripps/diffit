# Line Alignment Limitation: N:M Mappings

## Overview

The current line alignment logic in `src/lib/utils/diff.ts` has a known limitation when handling modifications where the number of original lines differs from the number of modified lines (N:M mappings where N ≠ M).

## The Problem

### Current Behavior

The alignment logic at `src/lib/utils/diff.ts:142-158` assumes 1:1 line correspondence for modifications:

```typescript
} else if (leftChange?.type === 'modified' || rightChange?.type === 'modified') {
  // Both indices increment equally
  leftIdx++;
  rightIdx++;
}
```

### Example of Misalignment

**Original (2 lines):**
```
function foo() {
}
```

**Modified (4 lines):**
```
function foo() {
  console.log("added line 1");
  console.log("added line 2");
}
```

**Expected alignment:**
```
Left Panel              Right Panel
─────────────────────   ─────────────────────────────
function foo() {        function foo() {
                          console.log("added line 1");
                          console.log("added line 2");
}                       }
```

**Actual behavior:**
The current code may misalign because it increments both left and right indices equally, not accounting for the 2:4 line mapping.

## Why This Happens

The VS Code diff algorithm outputs `DetailedLineRangeMapping` objects that correctly represent N:M mappings:

```typescript
DetailedLineRangeMapping {
  original: LineRange(1, 3),      // 2 lines (1-2 inclusive)
  modified: LineRange(1, 5),      // 4 lines (1-4 inclusive)
  innerChanges: RangeMapping[]    // Character-level changes
}
```

However, diff-it's `utils/diff.ts` transforms this into flat `LineDiff[]` arrays using a line-by-line Map approach that doesn't preserve the full range relationship.

## How VS Code Handles This

VS Code uses a fundamentally different rendering approach:

1. **Two Monaco Editor instances** - Each side is a full code editor
2. **View Zones** - Invisible DOM elements inserted between lines to create spacing
3. **Dynamic alignment** - Computed at render time, not pre-flattened

```
VS Code Architecture:
┌─────────────────────────────────────────────────┐
│              DiffEditorWidget                   │
│  ┌──────────────────┐  ┌──────────────────┐    │
│  │  Monaco Editor   │  │  Monaco Editor   │    │
│  │                  │  │                  │    │
│  │  Line 1          │  │  Line 1          │    │
│  │  [View Zone 2h]  │  │  Line 2          │    │
│  │                  │  │  Line 3          │    │
│  │  Line 2          │  │  Line 4          │    │
│  └──────────────────┘  └──────────────────┘    │
└─────────────────────────────────────────────────┘
```

The view zone on the left creates empty space to align Line 2 (left) with Line 4 (right).

## Potential Solutions

### Option 1: Targeted Fix (Recommended)

Modify `utils/diff.ts` to process changes sequentially and handle N:M cases by inserting placeholder lines:

```typescript
// Pseudocode
for (const change of diffResult.changes) {
  const origCount = change.original.length;
  const modCount = change.modified.length;

  // Pair lines while both sides have content
  const paired = Math.min(origCount, modCount);
  for (let i = 0; i < paired; i++) {
    // Add paired modified lines
  }

  // Handle extra original lines (more deletions)
  for (let i = paired; i < origCount; i++) {
    leftLines.push(originalLine);
    rightLines.push(placeholder);  // Empty placeholder
  }

  // Handle extra modified lines (more additions)
  for (let i = paired; i < modCount; i++) {
    leftLines.push(placeholder);   // Empty placeholder
    rightLines.push(modifiedLine);
  }
}
```

**Pros:** Minimal change, fixes the issue
**Cons:** Custom logic, not from VS Code

### Option 2: View Zone Approach

Refactor to pass `DetailedLineRangeMapping[]` directly to components and compute alignment in Svelte, similar to VS Code's `DiffEditorViewZones`:

```svelte
<!-- Pseudocode -->
{#each computeViewZones(changes, 'left') as item}
  {#if item.type === 'line'}
    <DiffLine {item} />
  {:else}
    <div class="view-zone" style="height: {item.height}px" />
  {/if}
{/each}
```

**Pros:** Closer to VS Code architecture
**Cons:** Larger refactor, more complexity

### Option 3: Use Monaco Editor

Replace custom textarea/overlay with Monaco's built-in diff editor:

```typescript
import * as monaco from 'monaco-editor';

const diffEditor = monaco.editor.createDiffEditor(container, options);
diffEditor.setModel({
  original: monaco.editor.createModel(originalText),
  modified: monaco.editor.createModel(modifiedText),
});
```

**Pros:** Perfect VS Code parity, all edge cases handled
**Cons:** ~2-3MB bundle size increase, less UI control

## Impact Assessment

### When does this occur?

The N:M case happens when:
- Lines are added within a modified block
- Lines are removed within a modified block
- A refactor changes line count (e.g., splitting/joining lines)

### How common is it?

- **Pure additions/deletions:** ✓ Handled correctly
- **1:1 modifications:** ✓ Handled correctly (most common case)
- **N:M modifications:** ⚠ May misalign (less common)

For typical "compare two versions of text" use cases, the limitation rarely manifests noticeably.

## Workaround

Users experiencing alignment issues can:
1. Compare smaller sections of text
2. Accept that some complex changes may not align perfectly
3. Use VS Code's built-in diff for complex comparisons

## References

- VS Code View Zones: `vscode-main/src/vs/editor/browser/widget/diffEditor/components/diffEditorViewZones/`
- Current alignment logic: `diff-it/src/lib/utils/diff.ts:103-174`
- DetailedLineRangeMapping: `diff-it/src/lib/diff/algorithm/rangeMapping.ts`
