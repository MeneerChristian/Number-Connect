Below is a **single, unified, production-ready game definition** that fully incorporates the corrected matching logic **and** the corrected “+” insertion behavior. This is meant to be handed directly to product owners and developers with no cross-referencing or interpretation required.

---

# Game Definition — Number Match (Complete Specification)

## 1. Game Overview

**Genre:** Casual logic puzzle
**Platform:** Mobile (portrait) using Ionic Capacitor
**Core Objective:** Clear all numbers from the board by removing valid matching pairs as efficiently as possible.
**Primary Skill:** Pattern recognition and spatial reasoning.
**Session Structure:** Endless or stage-based (depending on mode)

---

## 2. Board Model

### 2.1 Grid

* Rectangular grid with a **fixed number of columns** (e.g. 9).
* Rows may increase downward over time (infinitely long grid).
* Starting cell amount is **42**.
* Each cell has two independent states:

    * `isOccupied` (currently contains a number)
    * `wasEverOccupied` (has contained a number at any point in the run)

### 2.2 Cell Types

* **Occupied cell:** `isOccupied = true`
* **Cleared cell:** `isOccupied = false`, `wasEverOccupied = true`
* **Pristine empty cell:** `isOccupied = false`, `wasEverOccupied = false`

Only pristine empty cells define where new numbers may be appended.

### 2.3 Numbers

* Integers from **1 to 9** only.
* Exactly one number per occupied cell.
* No special tiles in the base mode.

---

## 3. Core Matching Rules

### 3.1 Value Rule

Two tiles can be matched if:

* The numbers are **equal**, OR
* The numbers **sum to 10**

### 3.2 Connectivity Rule

Two tiles that satisfy the value rule may be removed if there exists at least one valid **connection path** between them.

A valid path must:

* Pass **only through empty cells** (endpoints may be occupied)
* Never pass through any occupied cell
* Use one of the allowed path shapes below

---

### 3.3 Allowed Path Shapes

#### A) Straight Line (0 turns)

* Horizontal
* Vertical
* Diagonal (all 4 diagonal directions)

All intermediate cells along the line must be empty.

#### B) One-Turn Path (L-shape, 1 turn)

* Two straight orthogonal segments (horizontal + vertical)
* The corner cell must be empty
* All cells along both segments must be empty

#### C) Two-Turn Path (Z / S shape, 2 turns)

* Three straight orthogonal segments
* Maximum of **two direction changes**
* All intermediate cells must be empty
* Path direction is unrestricted (all rotations and mirrors allowed)

This includes cases like:

* right → down → right
* up → left → up
* down → right → down, etc.

#### D) Scan-Order Path (Row-major adjacency)

Two tiles are considered connected if **all cells between them in row-major order** (top-to-bottom, left-to-right) are empty. This allows connecting the end of one row to the beginning of a subsequent row if the path between them is clear.

### 3.4 Turn Limit

* Paths requiring **more than two turns are invalid** (except for Scan-Order paths which follow the grid flow)
* Diagonal movement is allowed **only** for straight-line (0-turn) paths

---

## 4. Player Interaction

1. Player selects a first tile.
2. Player selects a second tile.
3. The game validates:

    * Value rule
    * Connectivity rule
4. If valid:

    * Both tiles are removed
    * Their cells become cleared (`wasEverOccupied = true`)
5. If invalid:

    * Selection is reset or replaced

Optional UI:

* Highlight path on success
* Indicate blocked paths on failure

---

## 5. Visual Feedback & Animations

### 5.1 Match Path Visualization

When a valid match is made:

* A line is drawn between the two matched cells
* The line follows the actual connection path that was used for the match
* The line should be visually distinct (e.g., colored, animated)
* Line rendering should respect the path shape (straight, L-shape, or Z-shape)

### 5.2 Animation Requirements

**Tile Selection:**
* Highlight/scale effect when a tile is selected
* Visual indication of the first selected tile while choosing the second

**Successful Match:**
* Path line animation (draw from first to second tile)
* Tile removal animation (fade out, scale down, or similar)
* Smooth transition for any row removal

**Failed Match:**
* Brief shake or color flash to indicate invalid selection
* Clear visual reset of selection state

**"+" Button (Adding Numbers):**
* Animate new numbers appearing on the board
* Stagger the animation for multiple numbers
* Clear visual indication of where new numbers are being placed

**Row Removal:**
* Animate the removal of completely cleared rows
* Smooth animation of rows moving up to fill gaps

All animations should be smooth, quick (avoiding gameplay delays), and enhance the user experience without being distracting.

---

## 6. Row Removal

After any successful match:

* The game checks if any row has become completely empty (no `isOccupied` cells).
* If a row is cleared, it is removed from the grid.
* Rows below the removed row move up to fill the gap.
* Numbers never move down within their columns (traditional gravity is NOT used).
* `wasEverOccupied` state: When a row is removed, its cells are gone. Remaining cells preserve their `wasEverOccupied` state.

---

## 7. "+" Button — Adding Numbers

### 6.1 Source List Creation

When the player presses **“+”**:

* Scan the grid **row-major** (top → bottom, left → right)
* Collect all currently occupied numbers into a list `L`, preserving order

### 6.2 Insertion Start Position

* Flatten the grid in scan order
* Find the **last pristine empty cell**
  (`isOccupied = false AND wasEverOccupied = false`)
* Let `insertIndex = index of that cell + 1`

If no pristine empty cell exists:

* `insertIndex = 0`

### 6.3 Placement Rules

* Starting at `insertIndex`, place numbers from `L` into cells that are **pristine empty** (`wasEverOccupied = false`)
* Placement follows scan order
* For each placed number:

    * `isOccupied = true`
    * `wasEverOccupied = true`

New numbers:

* May appear **within an existing row**
* May appear after already occupied cells in that row
* Only extend the board if there are not enough empty cells remaining

### 6.4 Board Growth

If required:

* Append new rows of pristine empty cells at the bottom
* Continue placement until all numbers from `L` are placed

---

## 8. Deadlock Detection

* The game continuously checks for valid matches.
* If no valid match exists:

    * The player must use the “+” button or a hint.
* Deadlock detection uses the same connectivity rules as player matching.

---

## 9. Hint System

* Highlights one valid removable pair
* Does not perform the match automatically
* Uses the same solver as deadlock detection
* Optional usage limits or cooldowns

---

## 10. Progression & End Conditions

### 9.1 Board Clear

* A stage is complete when **no occupied cells remain**
* Board resets or advances to next stage

### 9.2 Game End (design choice)

* Endless mode (no failure, score only)

---

## 11. Scoring

* Scoring (optional):

    * Points per match
    * Bonuses for streaks or clearing without using “+”
    * Penalties or no bonus for “+” usage

---

## 12. Technical Constraints (Non-Negotiable)

* Matching must be **deterministic**
* No randomness in core mechanics
* Connectivity must respect:

    * Empty-cell-only paths
    * Maximum of 2 turns
    * Diagonal only for straight paths
* `wasEverOccupied` must be tracked per cell

---

## 13. Design Intent Summary

This game is designed to:

* Be easy to learn but hard to master
* Reward spatial foresight
* Avoid soft locks through deterministic recovery
* Scale difficulty without introducing randomness

---

## 14. UI/UX Design Specification

### 14.1 Visual Design Principles

**Core Aesthetic:**
* Clean, minimalist design with generous whitespace
* Flat design with subtle shadows for depth
* Modern mobile-first interface
* Clear visual hierarchy emphasizing gameplay
* Calming color palette to reduce cognitive load during puzzle solving

**Platform:**
* Primary: Mobile portrait (360px - 428px width)
* Orientation: Portrait only (lock orientation)
* Safe area: Respect notch/status bar margins

---

### 14.2 Layout Structure & Visual Hierarchy

#### Overall Layout (Portrait)

```
┌─────────────────────────┐
│   Header Bar            │ 56px height
├─────────────────────────┤
│   Large Score Display   │ 80px height
├─────────────────────────┤
│   Stats Bar             │ 72px height
├─────────────────────────┤
│                         │
│   Game Board            │ Flexible (fills available space)
│   (9 columns grid)      │
│                         │
├─────────────────────────┤
│   Bottom Controls       │ 80px + safe area
└─────────────────────────┘
```

#### Z-Index Hierarchy (lowest to highest)
1. Background (0)
2. Game board grid (1)
3. Board numbers (2)
4. Selection highlight (3)
5. Match path visualization (4)
6. Header & controls (5)
7. Modals/overlays (100)

---

### 14.3 Color Palette

#### Primary Colors

| Usage | Color Name | Hex | RGB | Notes |
|-------|-----------|-----|-----|-------|
| Primary Blue | Bright Blue | `#2196F3` | rgb(33, 150, 243) | Interactive elements, selected state |
| Primary Background | White | `#FFFFFF` | rgb(255, 255, 255) | Main background |
| Surface | Light Gray | `#F5F5F5` | rgb(245, 245, 245) | Card backgrounds, subtle areas |

#### Text Colors

| Usage | Color Name | Hex | RGB | Opacity |
|-------|-----------|-----|-----|---------|
| Primary Text | Dark Gray | `#212121` | rgb(33, 33, 33) | 100% |
| Secondary Text | Medium Gray | `#757575` | rgb(117, 117, 117) | 87% |
| Disabled Text | Light Gray | `#BDBDBD` | rgb(189, 189, 189) | 60% |
| Cleared Numbers | Very Light Gray | `#E0E0E0` | rgb(224, 224, 224) | 40% |

#### Accent Colors

| Usage | Color Name | Hex | RGB |
|-------|-----------|-----|-----|
| Success/Match | Green | `#4CAF50` | rgb(76, 175, 80) |
| Error/Failed Match | Red/Coral | `#FF5252` | rgb(255, 82, 82) |
| Warning | Amber | `#FFC107` | rgb(255, 193, 7) |
| Hint Highlight | Yellow | `#FFEB3B` | rgb(255, 235, 59) |

#### Special States

| State | Background | Border/Outline |
|-------|-----------|----------------|
| Selected Cell | `#E3F2FD` (Blue 50) | `#2196F3` 2px solid |
| Hover/Touch | `#F5F5F5` | None |
| Match Path | `#2196F3` 3px line | N/A |
| Hint Overlay | `#FFEB3B` 30% opacity | `#FFC107` 2px dashed |

---

### 14.4 Typography

#### Font Stack
```css
Primary: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif
Numbers: 'Roboto Mono', 'SF Mono', 'Consolas', monospace
```

#### Type Scale

| Element | Size | Weight | Line Height | Letter Spacing |
|---------|------|--------|-------------|----------------|
| Large Score | 48px | 700 (Bold) | 1.2 | -0.5px |
| Board Numbers | 32px | 500 (Medium) | 1.0 | 0 |
| Header Score | 20px | 600 (Semi-bold) | 1.2 | 0 |
| Stats Numbers | 16px | 600 (Semi-bold) | 1.4 | 0 |
| Stats Labels | 12px | 400 (Regular) | 1.4 | 0.5px (uppercase) |
| Button Labels | 14px | 500 (Medium) | 1.4 | 0.25px |
| Small Text | 11px | 400 (Regular) | 1.4 | 0.3px |

#### Text Styles

**All Time Score:**
- Font size: 16px
- Font weight: 600
- Color: `#757575`
- Includes trophy icon prefix

**Stage Label:**
- Font size: 14px
- Font weight: 500
- Color: `#212121`
- Format: "Stage {number}"

**Numbers Cleared:**
- Font size: 12px
- Font weight: 400
- Color: `#757575`
- Visual tracker below

---

### 14.5 Component Specifications

#### 14.5.1 Header Bar

**Dimensions:**
- Height: 56px
- Padding: 0 16px
- Background: `#FFFFFF`
- Border bottom: 1px solid `#E0E0E0`

**Layout:**
```
[Back Button]  [Score with Star]  [Settings Icon]
     24px          Center            24px
```

**Back Button:**
- Icon: Left arrow/chevron
- Size: 24px × 24px
- Color: `#212121`
- Touch target: 48px × 48px (includes padding)
- Ripple effect on tap

**Score Display (Center):**
- Layout: [Star Icon] [Score Number]
- Star icon: 20px, color `#FFC107`
- Score: 20px, weight 600, color `#212121`
- Background: `#F5F5F5` rounded rectangle (border-radius: 16px)
- Padding: 8px 16px
- Min-width: 80px

**Settings Icon:**
- Icon: Gear/cog
- Size: 24px × 24px
- Color: `#212121`
- Touch target: 48px × 48px
- Ripple effect on tap

---

#### 14.5.2 Large Score Display

**Container:**
- Height: 80px
- Background: `#FFFFFF`
- Centered content

**Score Number:**
- Font size: 48px
- Font weight: 700
- Color: `#2196F3`
- Center aligned
- Monospace font for number stability
- Animated on change (count-up effect)

**Label (optional):**
- "Current Score" or "Score"
- Font size: 12px
- Color: `#757575`
- Positioned above score number
- Letter spacing: 0.5px, uppercase

---

#### 14.5.3 Stats Bar

**Container:**
- Height: 72px
- Padding: 12px 16px
- Background: `#F5F5F5`
- Border: 1px solid `#E0E0E0` (top and bottom)

**Layout (3 columns):**
```
┌──────────────┬──────────────────┬──────────────┐
│ Stage 2      │ Numbers Cleared  │ All Time     │
│              │   [1][2][3]...   │ 🏆 4,589     │
└──────────────┴──────────────────┴──────────────┘
```

**Stage Indicator (Left):**
- Label: "Stage"
- Number: Current stage
- Font size: 14px (label), 20px (number)
- Weight: 500 (label), 600 (number)
- Color: `#212121`
- Layout: Stacked vertically

**Numbers Cleared (Center):**
- Label: "Numbers Cleared"
- Font size: 11px
- Color: `#757575`
- Visual tracker: 9 small circles (one for each number 1-9)
- Circle dimensions: 20px diameter
- Spacing: 4px between circles
- States:
  - Not cleared: `#E0E0E0` background, number in `#BDBDBD`
  - Cleared: `#4CAF50` background, number in `#FFFFFF`
  - Font size in circles: 10px, weight 600

**All Time Score (Right):**
- Icon: Trophy (16px)
- Label: "All Time"
- Score: Comma-formatted number
- Font size: 11px (label), 16px (score)
- Color: `#757575` (label), `#212121` (score)
- Trophy color: `#FFC107`
- Layout: Stacked, icon next to score

---

#### 14.5.4 Game Board

**Container:**
- Flexible height (fills available space)
- Minimum height: 400px
- Padding: 16px
- Background: `#FFFFFF`
- Centered content

**Grid:**
- Columns: 9 (fixed)
- Rows: Dynamic (starts at 5, grows as needed)
- Cell size: Square, calculated as `(container-width - padding) / 9`
- Typical cell size: ~36px × 36px (on 375px screen)
- Gap between cells: 2px
- Grid background: `#FAFAFA`
- Grid borders: 1px solid `#E0E0E0`

**Cell Specifications:**

**Base Cell:**
- Size: Square (dynamic)
- Background: `#FFFFFF`
- Border: 1px solid `#E0E0E0`
- Border-radius: 4px
- Transition: all 200ms ease

**Occupied Cell:**
- Background: `#FFFFFF`
- Number font size: 32px (scales with cell size)
- Number color: `#212121`
- Number weight: 500
- Centered (flex center)

**Cleared Cell (was occupied):**
- Background: `#FAFAFA`
- Number (ghost): `#E0E0E0`
- Number weight: 400
- Opacity: 0.4

**Pristine Empty Cell:**
- Background: `#FFFFFF`
- No content
- Subtle pattern (optional): Diagonal stripes in `#FAFAFA`

**Selected Cell:**
- Background: `#E3F2FD` (Light Blue)
- Border: 2px solid `#2196F3`
- Number color: `#2196F3`
- Scale: 1.05 (slight zoom)
- Box-shadow: 0 2px 8px rgba(33, 150, 243, 0.3)
- Z-index: 3

**First Selected (waiting for second):**
- Persistent selection style
- Animated pulse effect (subtle)

**Hinted Cell:**
- Background: `rgba(255, 235, 59, 0.3)`
- Border: 2px dashed `#FFC107`
- Animated glow pulse

---

#### 14.5.5 Match Path Visualization

**Path Line:**
- Color: `#2196F3`
- Width: 3px
- Style: Solid
- Opacity: 0.8
- Line cap: Round
- Line join: Round
- Draw animation: 300ms ease-out (from first cell to second)
- Fade out: 200ms after match completes

**Path Rendering:**
- Canvas overlay or SVG layer
- Connects cell centers
- Follows actual path algorithm (straight, L-shape, Z-shape, scan-order)
- Smooth curves on corners (optional, radius: 8px)

---

#### 14.5.6 Bottom Controls

**Container:**
- Height: 80px + safe area bottom
- Background: `#FFFFFF`
- Border top: 1px solid `#E0E0E0`
- Padding: 16px 24px + safe area
- Fixed position at bottom

**Layout:**
```
┌────────────────────────────┐
│  [+ Button]    [Hint Btn]  │
│     24px          24px     │
└────────────────────────────┘
```

**Add Numbers Button ("+"):**
- Shape: Circle
- Size: 56px diameter
- Background: `#2196F3`
- Icon: "+" symbol (28px, white)
- Shadow: 0 4px 8px rgba(33, 150, 243, 0.4)
- Position: Bottom-left area
- Badge (count):
  - Size: 20px diameter
  - Background: `#FF5252`
  - Color: `#FFFFFF`
  - Font size: 11px, weight 600
  - Position: Top-right corner of button
  - Border: 2px solid `#FFFFFF`

**Hint Button (Lightbulb):**
- Shape: Circle
- Size: 56px diameter
- Background: `#FFC107`
- Icon: Lightbulb (28px, white)
- Shadow: 0 4px 8px rgba(255, 193, 7, 0.4)
- Position: Bottom-right area
- Badge (available hints):
  - Size: 20px diameter
  - Background: `#4CAF50`
  - Color: `#FFFFFF`
  - Font size: 11px, weight 600
  - Position: Top-right corner
  - Border: 2px solid `#FFFFFF`
  - Show star icon if hint costs currency

---

### 14.6 Interaction States

#### 14.6.1 Button States

**Normal State:**
- Full color as specified
- Drop shadow as specified

**Hover/Touch Down:**
- Scale: 0.95
- Brightness: 110%
- Shadow: 0 2px 4px (reduced)
- Transition: 100ms ease-out

**Active/Pressed:**
- Scale: 0.90
- Brightness: 120%
- Shadow: 0 1px 2px (minimal)

**Disabled:**
- Background: `#E0E0E0`
- Icon/text color: `#BDBDBD`
- Shadow: None
- Cursor: not-allowed
- Opacity: 0.6

**Loading:**
- Spinner animation (circular progress)
- Color: White (for colored buttons) or `#2196F3` (for white buttons)
- Size: 24px
- Rotation: 360° in 1s, infinite

---

#### 14.6.2 Cell Interaction States

**Idle:**
- Default appearance
- Cursor: pointer (if clickable)

**Hover (Desktop/Tablet):**
- Background: `#F5F5F5`
- Border: 1px solid `#BDBDBD`
- Transition: 150ms

**Touch Start (Mobile):**
- Immediate visual feedback
- Ripple effect from touch point
- Ripple color: `rgba(33, 150, 243, 0.2)`
- Duration: 300ms

**Selected (First):**
- Blue background and border
- Scale 1.05
- Pulse animation (subtle, infinite)

**Selected (Second, Valid Match):**
- Green tint overlay: `rgba(76, 175, 80, 0.2)`
- Border: 2px solid `#4CAF50`
- Brief hold (100ms) before path animation

**Selected (Second, Invalid Match):**
- Red tint overlay: `rgba(255, 82, 82, 0.2)`
- Shake animation (3 quick oscillations)
- Duration: 300ms
- Return to normal state

---

#### 14.6.3 Special Interaction Feedback

**Successful Match:**
1. Both cells flash green tint (100ms)
2. Path line draws from cell 1 to cell 2 (300ms)
3. Path line pulses once (200ms)
4. Cells fade out with scale down (200ms)
5. Score increment animation (count up)

**Failed Match:**
1. Second cell shakes (300ms)
2. Both cells flash red tint (200ms)
3. Selection clears
4. Cells return to normal

**No Available Moves:**
- Global message overlay
- Semi-transparent backdrop: `rgba(0, 0, 0, 0.5)`
- Message card:
  - Background: `#FFFFFF`
  - Padding: 24px
  - Border-radius: 12px
  - Shadow: 0 8px 16px rgba(0, 0, 0, 0.2)
  - Message: "No moves available. Use + or Hint."
  - Button: "OK" or "Use +" button

---

### 14.7 Responsive Design

#### Breakpoints

| Size | Width Range | Notes |
|------|-------------|-------|
| Small Phone | 320px - 359px | iPhone SE, older devices |
| Standard Phone | 360px - 413px | Most common mobile devices |
| Large Phone | 414px - 428px | iPhone Plus, Pro Max |
| Tablet Portrait | 600px - 768px | Optional support |

#### Scaling Rules

**Small Phone (320px - 359px):**
- Board cell size: ~32px
- Board numbers: 28px
- Large score: 40px
- Reduce padding throughout (12px instead of 16px)
- Bottom button size: 52px

**Standard Phone (360px - 413px):**
- Default sizes as specified
- Board cell size: ~36px
- Optimal experience target

**Large Phone (414px+):**
- Board cell size: ~42px
- Increased touch targets
- More breathing room
- Can show larger numbers (36px on board)

**Tablet Portrait (600px+):**
- Max content width: 480px (centered)
- Larger touch targets across all elements
- Increased spacing
- Board cell size: 48px max

---

### 14.8 Animation Specifications

#### 14.8.1 Core Principles
- Duration: Fast (100-200ms) for feedback, Medium (300-400ms) for transitions
- Easing: `ease-out` for entrances, `ease-in` for exits, `ease-in-out` for movements
- Respect user preferences: Honor `prefers-reduced-motion`
- Performance: Use `transform` and `opacity` for GPU acceleration

---

#### 14.8.2 Specific Animations

**Cell Selection:**
```css
transition: all 200ms ease-out;
transform: scale(1.05);
box-shadow: 0 2px 8px rgba(33, 150, 243, 0.3);
```

**Match Success:**
1. **Path Draw** (300ms, ease-out)
   - SVG stroke-dasharray animation
   - Draws from first cell to second
2. **Tile Removal** (200ms, ease-in, delay: 100ms)
   - opacity: 0
   - transform: scale(0.8)
3. **Score Increment** (400ms, ease-out)
   - Count-up animation
   - Slight scale pulse (1.0 → 1.1 → 1.0)

**Match Failure:**
```css
animation: shake 300ms ease-in-out;

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-8px); }
  75% { transform: translateX(8px); }
}
```

**Row Removal:**
1. Removed row fades out (200ms)
2. Rows above slide down (300ms, ease-out)
3. Stagger: 50ms delay per row

**Add Numbers ("+"):**
1. New numbers fade in (200ms each)
2. Stagger: 50ms delay between numbers
3. Scale from 0.8 to 1.0
4. Pop effect with slight bounce

**Hint Pulse:**
```css
animation: hint-pulse 2s ease-in-out infinite;

@keyframes hint-pulse {
  0%, 100% {
    background: rgba(255, 235, 59, 0.3);
    transform: scale(1);
  }
  50% {
    background: rgba(255, 235, 59, 0.6);
    transform: scale(1.05);
  }
}
```

**Button Press:**
```css
transition: transform 100ms ease-out;
active { transform: scale(0.90); }
```

**Loading Spinner:**
```css
animation: spin 1s linear infinite;

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

**Score Count-Up:**
- Duration: 400ms
- Easing: ease-out
- Update frequency: 60fps
- Display integers only (no decimals)

---

### 14.9 Icon Requirements

#### 14.9.1 Icon System
- Style: Material Design Icons or similar
- Format: SVG (scalable, crisp on all displays)
- Size variants: 16px, 20px, 24px, 28px
- Color: Inherit from parent (use currentColor)

#### 14.9.2 Required Icons

| Icon | Name | Size | Usage | Notes |
|------|------|------|-------|-------|
| ← | Back/Arrow Left | 24px | Header back button | Chevron or arrow |
| ⚙️ | Settings/Gear | 24px | Header settings | Cog icon |
| ⭐ | Star | 20px | Header score | Filled star |
| 🏆 | Trophy | 16px | All-time score | Achievement icon |
| ➕ | Plus | 28px | Add numbers button | Bold, centered |
| 💡 | Lightbulb | 28px | Hint button | Filled bulb |
| ✓ | Check | 20px | Success indicators | Optional |
| ✕ | Close/X | 20px | Error/cancel | Optional |
| ℹ️ | Info | 20px | Help/information | Optional |
| ⟲ | Refresh | 20px | Retry/restart | Optional |

#### 14.9.3 Icon States
- **Normal:** Base color
- **Hover:** Brightness +10%
- **Active:** Brightness +20%
- **Disabled:** Opacity 40%, color `#BDBDBD`

---

### 14.10 Accessibility

#### 14.10.1 Color Contrast
- All text meets WCAG AA standards (4.5:1 for normal text, 3:1 for large text)
- Primary text on white: `#212121` (16.1:1 ratio)
- Blue interactive elements: `#2196F3` on white (3.1:1, acceptable for large/bold)
- Error red: `#FF5252` ensure sufficient contrast

#### 14.10.2 Touch Targets
- Minimum size: 48px × 48px (per Material Design guidelines)
- Spacing between targets: 8px minimum
- Grid cells: Minimum 36px for comfortable tapping
- Buttons: 56px diameter

#### 14.10.3 Screen Reader Support
- All interactive elements have aria-labels
- Game state announcements (matches, score changes)
- Cell values announced on focus
- Error messages announced via aria-live regions

#### 14.10.4 Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

### 14.11 Visual Effects & Polish

#### 14.11.1 Shadows
- Small elevation: `0 2px 4px rgba(0, 0, 0, 0.1)`
- Medium elevation: `0 4px 8px rgba(0, 0, 0, 0.15)`
- High elevation: `0 8px 16px rgba(0, 0, 0, 0.2)`
- Floating buttons: Colored shadow matching button color at 40% opacity

#### 14.11.2 Borders
- Standard: 1px solid `#E0E0E0`
- Focus/Active: 2px solid `#2196F3`
- Error: 2px solid `#FF5252`
- Success: 2px solid `#4CAF50`

#### 14.11.3 Border Radius
- Small elements: 4px
- Buttons/cards: 8px
- Pills/badges: 12px
- Circular buttons: 50%
- Modals: 12px

#### 14.11.4 Backdrop Filters (optional, if supported)
```css
backdrop-filter: blur(10px);
background: rgba(255, 255, 255, 0.9);
```

---

### 14.12 Special States & Overlays

#### 14.12.1 Win State Modal
- Full-screen overlay: `rgba(0, 0, 0, 0.7)`
- Celebration animation: Confetti or stars
- Content card:
  - Background: `#FFFFFF`
  - Border-radius: 16px
  - Padding: 32px
  - Shadow: 0 16px 32px rgba(0, 0, 0, 0.3)
  - Max-width: 320px
  - Centered
- Elements:
  - "🎉 Stage Complete!" heading (32px, bold)
  - Final score (48px, `#2196F3`)
  - Stars earned (visual, 3 stars max)
  - "Next Stage" button (primary)
  - "Restart" button (secondary)

#### 14.12.2 Pause/Settings Modal
- Overlay: `rgba(0, 0, 0, 0.5)`
- Modal card: Same styling as win state
- Settings options:
  - Sound toggle
  - Music toggle
  - Vibration toggle
  - Theme selection (if applicable)
- Buttons: Large touch targets (56px height)

#### 14.12.3 No Moves Available Prompt
- Inline alert at top of board
- Background: `#FFF3E0` (Amber 50)
- Border-left: 4px solid `#FFC107`
- Padding: 16px
- Icon: Warning triangle
- Message: "No moves available"
- Actions: "+ Add Numbers" or "Get Hint" buttons

---

### 14.13 Performance Considerations

#### 14.13.1 Optimization Guidelines
- Use CSS transforms for animations (GPU accelerated)
- Debounce rapid interactions
- Virtual scrolling for very large grids (if needed)
- Lazy load assets
- Minimize repaints/reflows during animations
- Use `will-change` property sparingly

#### 14.13.2 Asset Optimization
- SVG icons: Optimized and minified
- Fonts: Subset to needed glyphs
- Images: Compressed, multiple sizes for different DPR
- Critical CSS: Inline for above-fold content

---

### 14.14 Implementation Notes

#### 14.14.1 CSS Variables
Define all colors, sizes, and timing as CSS custom properties for easy theming:

```css
:root {
  /* Colors */
  --color-primary: #2196F3;
  --color-success: #4CAF50;
  --color-error: #FF5252;
  --color-warning: #FFC107;
  --color-text-primary: #212121;
  --color-text-secondary: #757575;
  --color-text-disabled: #BDBDBD;
  --color-background: #FFFFFF;
  --color-surface: #F5F5F5;
  --color-border: #E0E0E0;
  
  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  
  /* Timing */
  --duration-fast: 100ms;
  --duration-medium: 200ms;
  --duration-slow: 300ms;
  
  /* Shadows */
  --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 8px rgba(0, 0, 0, 0.15);
  --shadow-lg: 0 8px 16px rgba(0, 0, 0, 0.2);
  
  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 50%;
}
```

#### 14.14.2 Component Structure (Suggested)
- Header Component
- ScoreDisplay Component
- StatsBar Component
- GameBoard Component
  - Grid Component
  - Cell Component
- BottomControls Component
  - AddButton Component
  - HintButton Component
- PathVisualizer Component (SVG/Canvas overlay)
- Modal Components (Win, Settings, etc.)

#### 14.14.3 State Management
- Track selected cells
- Track hint state
- Track animation queues
- Manage modal visibility
- Handle responsive breakpoint changes

---

### 14.15 Design Deliverables Checklist

For developers implementing this specification:

- [ ] Typography system configured (Roboto, Roboto Mono)
- [ ] Color palette defined as CSS variables
- [ ] Icon set imported (Material Design or equivalent)
- [ ] Component structure established
- [ ] Responsive breakpoints implemented
- [ ] Animation keyframes and transitions defined
- [ ] Accessibility features implemented (aria-labels, focus states)
- [ ] Touch target sizes verified (48px minimum)
- [ ] Color contrast ratios verified (WCAG AA)
- [ ] Reduced motion support implemented
- [ ] All interaction states tested
- [ ] Performance benchmarks met (60fps animations)
- [ ] Cross-device testing completed

---

### 14.16 Future Enhancements (Optional)

**Dark Mode:**
- Inverse color scheme
- Background: `#121212`
- Surface: `#1E1E1E`
- Primary text: `#FFFFFF`
- Reduced contrast for comfort
- Blue primary remains but slightly desaturated

**Themes:**
- Color scheme variations
- Seasonal themes (holiday colors)
- User customization options

**Haptic Feedback:**
- Match success: Medium impact
- Match failure: Light impact
- Button press: Selection feedback
- Use Capacitor Haptics plugin

**Sound Effects:**
- Match success (pleasant chime)
- Match failure (subtle error tone)
- Row clear (rewarding sound)
- Win state (celebration sound)
- Optional background music
