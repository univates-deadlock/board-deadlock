# Accessibility for React and Next.js interfaces

Accessibility is an implementation requirement. Component abstractions and App Router boundaries do not change the underlying browser semantics.

## Native semantics before ARIA

Prefer native elements and behavior first:

- `<button>` for actions;
- `<a href>` / the project's navigation link abstraction for navigation;
- headings in a logical hierarchy;
- landmarks such as `main`, `nav`, `header`, and `footer` where they describe the page;
- native form controls with labels.

Use ARIA when native HTML cannot express the required state, relationship, or accessible name. Keep ARIA state synchronized with React state.

## Keyboard interaction

Every interactive feature must work without a pointing device. Check tab order, Enter/Space behavior where native controls provide it, Escape handling for modal patterns, and arrow-key behavior when a composite widget's established interaction pattern requires it.

Do not recreate button/link keyboard behavior on generic elements when a native control solves the problem.

## Focus

Keep a visible focus indicator. Avoid removing outlines without an accessible replacement.

Manage focus when an interaction changes context significantly, such as opening a modal dialog, closing it back to its trigger, or surfacing a blocking form error. Do not move focus after ordinary React renders simply because state changed.

Route transitions should preserve a coherent reading/focus experience according to the application's existing navigation behavior.

## Forms

- Associate each control with an accessible label.
- Connect field errors to controls when practical.
- Do not rely on placeholder text as the only label.
- Communicate required/invalid state in more than color alone.
- Ensure submit progress and result feedback are available to users who do not see visual changes.

## Images and icons

Informative images need useful alternative text. Decorative images should not add redundant announcements. Icon-only controls need an accessible name on the control even when the icon itself is decorative.

Use the project's existing image/component abstraction without losing `alt` semantics.

## Dialogs and overlays

A modal dialog should expose dialog semantics and an accessible name, move focus into the dialog when opened, keep modal focus behavior coherent, close through expected controls such as Escape when appropriate, and restore focus sensibly when closed.

Do not apply modal focus trapping to non-modal drawers, popovers, or inline regions unless their interaction model actually requires it.

## Menus and disclosure UI

Choose semantics based on behavior, not appearance. Many site-navigation dropdowns are disclosure controls rather than application-style ARIA menus. Reuse the project's established accessible pattern instead of adding `role="menu"` by habit.

Keep `aria-expanded`, `aria-controls`, `aria-current`, and similar state accurate when used.

## Motion

Respect `prefers-reduced-motion` for non-essential animation. Reduced motion should remove or simplify motion that could be distracting without hiding content or breaking state transitions.

## Dynamic UI

Loading, validation, success, and error updates should remain understandable when they occur without a full navigation. Use the project's established live-region/status patterns where users need an announcement; do not mark large changing regions live indiscriminately.

## Review questions

- Is native HTML doing as much work as possible?
- Can every interaction be completed by keyboard?
- Is focus visible and moved only when context requires it?
- Are forms labeled and errors understandable?
- Are dialogs/disclosures using the correct interaction pattern?
- Are icon and image names appropriate?
- Does reduced-motion preference remain usable?
