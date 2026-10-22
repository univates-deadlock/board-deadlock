# Responsive interface design

Follow the consuming project's responsive strategy first. Mobile-first CSS can be effective, but do not rewrite an established desktop-first or component-query strategy merely to match a generic preference.

## Layout

Prefer layouts that adapt naturally through flexbox, grid, intrinsic sizing, wrapping, and fluid constraints before adding breakpoint-specific overrides. Reuse existing breakpoints and design tokens when they exist.

Do not choose breakpoints by device brand. Add a breakpoint when the content or layout requires a structural change.

## Overflow and long content

Test long labels, validation messages, names, URLs, translated copy, and user-generated content. Protect against accidental horizontal page overflow caused by fixed widths, unbreakable content, media, grids, or positioned elements.

Scrollable regions should be intentional and discoverable rather than an accidental escape hatch for broken layout.

## Navigation

Responsive navigation must remain operable by keyboard and touch. Preserve visible focus, understandable expanded/collapsed state, and access to every destination. Do not hide essential navigation merely because the viewport is narrow.

## Forms

Allow labels, help text, errors, and controls to reflow without overlap. Avoid layouts that require side-by-side fields when the content no longer fits comfortably. Preserve logical source/tab order when the visual layout changes.

## Tables and dense data

For wide tables, first determine which behavior the product already uses: horizontal scrolling, column prioritization, stacked/card presentation, or another responsive pattern. Do not remove important data silently at narrow widths.

When horizontal scrolling is appropriate, keep the table readable and avoid causing the entire page to overflow.

## Touch targets

Interactive targets should be large and separated enough to operate reliably on touch devices. Do not shrink controls solely to fit a desktop-oriented layout into a small viewport.

## Media and images

Keep images/media within their containers and preserve meaningful aspect ratios. Use the project's Next.js image strategy where applicable rather than introducing a competing pattern.

## Validation

Test the viewports defined by the project. If none are documented, inspect existing breakpoints and validate representative narrow and wide widths plus intermediate transitions. Also check zoom/content growth when practical; a layout that works only with ideal text is not robust.
