---
name: emil-design-eng
description: Emil Kowalski's philosophy on UI polish, component design, animation decisions, and invisible details that make software feel great.
---

# Design Engineering

## Core Philosophy

**Taste is trained, not innate.** It's the ability to see beyond the obvious. Develop it by studying great work, reverse-engineering animations, and practicing relentlessly.

**Unseen details compound.** Most details users never consciously notice — that's the point. The aggregate of invisible correctness creates interfaces people love without knowing why.

**Beauty is leverage.** People select tools based on overall experience, not just functionality.

## The Animation Decision Framework

### 1. Should this animate at all?

| Frequency | Decision |
|-----------|----------|
| 100+/day (keyboard shortcuts, command palette) | No animation. Ever. |
| Tens/day (hover, list navigation) | Remove or drastically reduce |
| Occasional (modals, drawers, toasts) | Standard animation |
| Rare (onboarding, celebrations) | Can add delight |

Never animate keyboard-initiated actions. Raycast has no open/close animation — that's optimal for something used hundreds of times a day.

### 2. What is the purpose?

Every animation must answer: spatial consistency, state indication, explanation, feedback, or preventing jarring changes. If the purpose is "it looks cool" and users see it often, don't animate.

### 3. What easing?

- **Entering** → ease-out (starts fast, feels responsive)
- **Moving/morphing on screen** → ease-in-out
- **Hover/color** → ease
- **Constant motion (marquee, progress)** → linear

Use custom easing curves (built-in CSS easings are too weak):
```
--ease-out: cubic-bezier(0.23, 1, 0.32, 1);
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);
```

Never use ease-in for UI animations — it starts slow, making the interface feel sluggish.

### 4. How fast?

| Element | Duration |
|---------|----------|
| Button press feedback | 100-160ms |
| Tooltips, small popovers | 125-200ms |
| Dropdowns, selects | 150-250ms |
| Modals, drawers | 200-500ms |

UI animations should stay under 300ms.

## Component Building Principles

- **Buttons must feel responsive**: `transform: scale(0.97)` on `:active` with `transition: transform 160ms ease-out`
- **Never animate from scale(0)**: start from `scale(0.95)` + `opacity: 0`
- **Popovers: origin-aware** — use `transform-origin: var(--radix-popover-content-transform-origin)`. Exception: modals stay centered.
- **Tooltips: skip delay on subsequent hovers** — once one tooltip opens, adjacent tooltips open instantly
- **Use CSS transitions over keyframes for interruptible UI** — transitions retarget mid-animation, keyframes restart from zero
- **Use blur to mask imperfect transitions**: subtle `filter: blur(2px)` during crossfades bridges visual gaps
- **Animate enter states with `@starting-style`**: replaces `useEffect` mounted pattern
- **`clip-path: inset()`** is ideal for tab color transitions, hold-to-delete, image reveals, comparison sliders

## CSS Performance Rules

- Only animate `transform` and `opacity` — these skip layout/paint, run on GPU
- CSS variables are inheritable — updating a parent triggers recalc on all children. Update `transform` directly on the element instead
- Framer Motion `x`/`y`/`scale` are NOT hardware accelerated (use `transform: "translateX()"` for HW accel)
- CSS animations beat JS under load (run off main thread)
- WAAPI gives JS control with CSS performance: `element.animate()`

## Accessibility

- `prefers-reduced-motion: reduce` — keep opacity/color transitions, remove movement/position animations
- Gate hover animations: `@media (hover: hover) and (pointer: fine)`

## Gesture & Drag

- Momentum-based dismissal: if velocity > ~0.11, dismiss regardless of distance
- Damping at boundaries — things don't suddenly stop, they slow down
- Pointer capture during drag
- Multi-touch protection: ignore additional touch points after initial drag
- Friction instead of hard stops

## The Sonner Principles

1. Developer experience is key — no hooks, no context, no complex setup
2. Good defaults matter more than options
3. Handle edge cases invisibly (pause timers when tab hidden, fill gaps with pseudo-elements)
4. Use transitions, not keyframes, for dynamic UI
5. Asymmetric enter/exit timing: slow where user decides (hold-to-delete: 2s), fast where system responds (release: 200ms)
6. Review your work the next day with fresh eyes

## Review Checklist

| Issue | Fix |
|-------|-----|
| `transition: all` | Specify exact properties: `transition: transform 200ms ease-out` |
| `scale(0)` entry | Start from `scale(0.95)` + `opacity: 0` |
| `ease-in` on UI element | Switch to `ease-out` or custom curve |
| `transform-origin: center` on popover | Set to trigger location (modals exempt) |
| Animation on keyboard action | Remove entirely |
| Duration > 300ms on UI element | Reduce to 150-250ms |
| Hover without media query | Add `@media (hover: hover) and (pointer: fine)` |
| Keyframes on rapidly-triggered element | Use CSS transitions |
| Framer Motion `x`/`y` under load | Use `transform: "translateX()"` |
| Same enter/exit speed | Exit faster than enter |
| Elements appear at once | Add stagger delay (30-80ms) |
