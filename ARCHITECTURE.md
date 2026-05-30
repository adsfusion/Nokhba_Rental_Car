# Nokhba Rental Car - Frontend Architecture Guidelines

## Core Layout Rules

### 1. The Min-Content Collapse Prevention Rule (Locked: 2026-05-30)
**Context:** When deeply nesting flex or grid containers, elements with `w-full` can suffer from severe cross-axis text collapse (wrapping word-by-word) because the rendering engine forces the component to its `min-content` intrinsic size.

**Strict Architectural Rule:**
- **All Empty States, Modals, and Centered Blocker screens MUST bypass raw flexible/grid cross-axis wrapping.**
- **Use explicit bounded block layouts** (`block w-full max-w-[...] mx-auto` or explicit inline pixel widths) to mathematically prevent browser min-content collapsing.
- **NEVER use naked `items-center` on flex-columns for text containers.** This implicitly shrinks the flex items to their intrinsic widths and aggressively ignores `w-full` declarations under complex DOM trees.
- If centering text inside a block, use standard `margin: 0 auto` (`mx-auto`) and `text-align: center` (`text-center`).
