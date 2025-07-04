# Project Personal Notes

## Purpose

This file contains development notes, troubleshooting insights, and lessons learned while building my personal portfolio website. These notes will help me remember context for future blog posts and serve as a reference for similar challenges.

---

## Scroll-Driven Animations Implementation

### Goal

Create a smooth scroll-driven animation in the header where "Daniel Scheigert" condenses to "DS" as the user scrolls down the page.

### The Challenge: CSS Scroll-Driven Animations vs Tailwind CSS

**Problem Encountered:**

- Modern CSS scroll-driven animations (`animation-timeline: scroll()`) were not working despite Chrome 138 supporting them
- CSS was being crossed out in DevTools with warning triangles
- `CSS.supports('animation-timeline', 'scroll()')` returned `true`, confirming browser support

**Root Cause:**
Tailwind CSS was processing and interfering with the scroll-driven animation CSS, preventing the browser from recognizing the new syntax properly.

**Solutions Attempted:**

1. ✅ **Inline `<style>` tags** - This worked! Bypassed Tailwind processing entirely
2. ❌ **External CSS files** (animations.css, globals.css) - All processed by Tailwind
3. ❌ **@supports feature detection** - Still processed by Tailwind
4. ❌ **Different syntax variations** (`scroll(root)`, `scroll(root block)`) - Same issue

**Final Implementation:**

```jsx
<style>{`
  .scroll-name-fade {
    animation: simple-fade linear both;
    animation-timeline: scroll();
    animation-range: 0 150px;
  }
  .s-letter {
    animation: s-slide linear both;
    animation-timeline: scroll();
    animation-range: 150px 200px;
  }
`}</style>
```

### Key Learnings

1. **Build Tool Interference**: Modern CSS features may work in browsers but fail due to build tool processing
2. **Inline CSS as Workaround**: Sometimes the "wrong" approach (inline styles) is the practical solution
3. **Progressive Enhancement Testing**: Always test new CSS features in isolation before integrating with frameworks
4. **Animation Sequencing**: Used separate animation ranges to create multi-stage effects:
    - 0-150px: Fade out letters
    - 150-200px: Slide "S" closer to "D"

### Technical Details

**Animation Breakdown:**

- "Daniel Scheigert" → "D S" (letters fade out)
- "D S" → "DS" (S slides left to close the gap)

**Browser Support:**

- Works in Chrome 138+
- Requires feature detection for production use
- Fallback: JavaScript-based scroll listeners

---

## Typography System Integration

### Font Setup

- **Sans-serif**: Inter (UI elements, headers)
- **Serif**: Lora (body text, reading content)
- **Monospace**: JetBrains Mono (code blocks)

### Challenge: Font Loading with Next.js

**Issue**: Font variables not being recognized when referenced from CSS variables
**Solution**: Define fonts directly in CSS rather than referencing Next.js font variables

### Custom Typography Classes

Implemented responsive typography system using CSS custom properties with clamp() for fluid scaling.

---

## Development Environment Notes

- **Chrome Version**: 138.0.7204.93
- **Next.js**: 15 with App Router
- **Tailwind CSS**: Latest version
- **Build Tool**: Turbopack (development)

---

_This file will be updated as development continues..._
