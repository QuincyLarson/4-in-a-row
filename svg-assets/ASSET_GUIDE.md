# SVG Asset Guide

These assets are intentionally simple and static-friendly.

## Suggested usage
- Inline the SVG files as React components when possible.
- Or import `sprite.svg` and reference symbols with `<use href="#disc-human" />`.
- Prefer animating with CSS classes and `transform` rather than rewriting path data.

## Files
- `board-frame.svg` — board shell with hole cutouts; place chips behind this layer
- `disc-human.svg` — human chip with slash motif
- `disc-cpu.svg` — CPU chip with ring/dot motif
- `drop-preview.svg` — ghost chip + arrow for hover state
- `selection-ring.svg` — pulsing target ring
- `impact-ping.svg` — landing effect
- `confetti-burst.svg` — celebratory burst
- `coach-bubble.svg` — lesson prompt / coach panel art
- `boss-crown.svg` — boss icon
- `star-badge.svg` — progress and rewards
- `sprite.svg` — reusable symbol sheet

## Layering recommendation
1. chip layer
2. board-frame
3. selection ring / impact ping / win line overlays
4. confetti / badges

## Motion hooks
- apply `.is-dropping`, `.is-winning`, `.is-selected`, `.is-ghost`
- use `transform-origin: center`
- animate `translate`, `scale`, `opacity`, and `stroke-dashoffset`

## Accessibility
Human and CPU chips include different inner motifs so they can be differentiated without color.
