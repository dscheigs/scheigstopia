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

## View Transitions API Implementation Attempt

### Goal

Implement smooth page transitions using the modern View Transitions API for navigation between pages (Home, About, Projects).

### The Challenge: Next.js Compatibility Issues

**Problem Encountered:**

- View Transitions API appears to be partially supported but doesn't work properly with Next.js 15
- `document.startViewTransition()` executes and reaches "ready" state but CSS animations don't apply
- Transition reaches "finished" state without visible animation effects
- Issue persists regardless of using inline `style` attributes or CSS classes for `view-transition-name`

**Browser Support Confirmed:**

- `document.startViewTransition` exists and is callable
- Meta tag `<meta name="view-transition" content="same-origin" />` properly added
- All transition lifecycle events fire (ready, finished)

**Solutions Attempted:**

1. ❌ **Inline `style` attributes** - `style={{ viewTransitionName: 'main-content' }}`
2. ❌ **CSS classes** - `.main-content { view-transition-name: main-content; }`
3. ❌ **Router navigation** - Using `router.push()` instead of `window.location.href`
4. ❌ **Extended animation duration** - Set to 5 seconds to ensure visibility
5. ❌ **Multiple debugging approaches** - Console logging all transition events

**Root Cause Analysis:**

The View Transitions API is extremely new (2023) and Next.js doesn't have built-in support yet. The API expects standard browser navigation but Next.js uses custom client-side routing that may interfere with the transition capture/playback process.

**Current Status:**

❌ **Abandoned** - View Transitions API incompatible with Next.js 15
✅ **Keeping project-level transitions** - Segmented control animations work fine for component-level transitions

### Key Learnings

1. **Cutting-Edge APIs**: Very new browser APIs often lack framework support
2. **Framework Limitations**: Even when browsers support a feature, SPA frameworks may have compatibility issues
3. **Transition Scope**: Component-level transitions work better than page-level transitions in SPAs
4. **Alternative Approaches**: Consider libraries like Framer Motion for complex animations in React

### Potential Future Solutions

- **Next.js Updates**: Wait for official View Transitions support
- **Third-party Libraries**: Explore `next-view-transitions` or similar packages
- **Custom Implementation**: Build page transition system using Framer Motion
- **Gradual Enhancement**: Implement for simple cases first, complex routing later

### Technical Implementation Details

**What Works:**

```jsx
// Component-level view transitions (like segmented control)
document.startViewTransition(() => {
    setSelectedSection(section);
});
```

**What Doesn't Work:**

```jsx
// Page-level navigation transitions
document.startViewTransition(() => {
    router.push('/about');
});
```

---

## CSS Anchor Positioning Implementation

### Goal

Create a smooth animated underline that follows hovered navigation links using the cutting-edge CSS Anchor Positioning API.

### The Challenge: Bleeding Edge Browser Features

**Implementation Journey:**

CSS Anchor Positioning is an experimental feature (2023) that allows elements to position themselves relative to other "anchor" elements anywhere in the DOM, breaking traditional parent-child positioning constraints.

**Key Concepts Learned:**

- **`anchor-name`**: Creates a named anchor point on an element
- **`anchor()`**: Positions another element relative to that anchor
- **`:has()` selector**: Detects state changes in child elements
- **CSS variables**: Used to dynamically switch between anchor targets

### Technical Implementation

**Final Working Code Structure:**

```css
/* Underline element that follows anchors */
.nav-links::before {
    content: '';
    position: absolute;
    left: anchor(var(--target) left);
    right: anchor(var(--target) right);
    bottom: anchor(var(--target) bottom);
    transition: all 0.3s;
    border-bottom: 0.2rem solid var(--foreground);
}

/* Hide when no links are hovered */
.nav-links:not(:has(a:hover, a:focus-visible))::before {
    visibility: hidden;
    opacity: 0;
}

/* Set anchor names on navigation items */
.nav-link a {
    anchor-name: var(--anchor);
}

/* Define anchor names for each item */
.nav-link:nth-child(1) {
    --anchor: --item-1;
}
.nav-link:nth-child(2) {
    --anchor: --item-2;
}

/* Set target when items are hovered */
.nav-links:has(.nav-link:nth-child(1) a:is(:hover, :focus-visible)) {
    --target: --item-1;
}
.nav-links:has(.nav-link:nth-child(2) a:is(:hover, :focus-visible)) {
    --target: --item-2;
}
```

### Debugging Process & Lessons Learned

**Major Issues Encountered:**

1. **CSS Variable Scope**: Initially `--target` wasn't being set due to incorrect `:has()` selector logic
2. **Selector Syntax**: Missing class prefixes and extra parentheses broke CSS parsing
3. **Hide Logic Error**: Original logic `has(a:not(:hover))` meant "hide if ANY link is not hovered" instead of "hide if NO links are hovered"
4. **Anchor Positioning Support**: Required Chrome 125+ with experimental flag enabled

**Browser Support Requirements:**

- **Chrome 125+** with "CSS Anchor Positioning" flag enabled in `chrome://flags`
- **Feature Detection**: `CSS.supports('left', 'anchor(--test left)')` returns `true` when supported
- **Not widely supported yet** - cutting-edge experimental feature

### Current Limitations

**Vertical Positioning Issues:**

- **Problem**: `left`/`right` anchor transitions work smoothly, but `bottom` anchor transitions are jumpy
- **Root Cause**: Different coordinate systems and reference points for vertical vs horizontal positioning
- **Known Limitation**: CSS Anchor Positioning vertical transitions are less reliable than horizontal ones
- **Workarounds**: Use `top` instead of `bottom`, or combine with `transform` for fine-tuning

### Key Learnings

1. **Experimental APIs**: Bleeding-edge features require extensive debugging and may have unexpected limitations
2. **Browser Flags**: Testing new features requires enabling experimental flags and specific browser versions
3. **CSS Logic Complexity**: Advanced selectors like `:has()` and `:not()` require careful logical thinking
4. **Fallback Planning**: Experimental features need robust fallback strategies for production use
5. **Reference Implementation**: Following official demos closely helps avoid syntax pitfalls

### Production Considerations

**Current Status:**
✅ **Working** - Smooth horizontal underline animation
⚠️ **Partial** - Vertical positioning has transition issues
🔬 **Experimental** - Requires browser flags, not production-ready

**Future Implementation:**

- Monitor browser support expansion
- Consider JavaScript fallback for production
- Explore alternative CSS-only solutions for broader compatibility

---

## Development Environment Notes

- **Chrome Version**: 138.0.7204.93
- **Next.js**: 15 with App Router
- **Tailwind CSS**: Latest version
- **Build Tool**: Turbopack (development)

---

_This file will be updated as development continues..._
