# Forms and UI states

Forms are interaction flows, not only collections of inputs. Preserve entered data, communicate progress and failure clearly, and support keyboard and assistive-technology users throughout the flow.

## Form structure

- Use semantic form controls and visible labels where possible.
- Group related controls with appropriate native structure when it improves meaning.
- Reuse the project's existing form primitives, validation strategy, and submission mechanism.
- Do not introduce a form library solely because a form exists.

## Validation

Validate early enough to help the user without making the interface noisy. Field-level errors should identify the problem and, when possible, be programmatically associated with the relevant control.

Frontend validation does not replace backend validation. When the server returns authoritative field errors, map them back into the form using the project's established pattern.

## Submission lifecycle

Represent the lifecycle explicitly when it applies:

1. ready/editing;
2. submitting;
3. success; or
4. validation/server failure.

Prevent accidental double submission while a submission is active. A disabled state must still leave the reason understandable; do not disable controls earlier or longer than necessary.

Do not clear the form after an error unless the product specifically requires it. On success, reset or preserve values according to the expected user workflow rather than automatically.

## Error focus and feedback

When a submission fails because of form errors, make the first actionable error easy to find. In longer or complex forms, moving focus to an error summary or first invalid control can be appropriate. Follow existing project behavior and avoid surprising focus jumps for minor inline validation.

Success feedback should confirm what happened. Error feedback should explain what the user can do next when that is known.

## UI state model

For screens driven by remote data or mutations, consider which states are materially different:

- **initial** — before work begins or before enough input exists;
- **loading** — data is being obtained;
- **success** — usable data/content is available;
- **empty** — the request succeeded but there is nothing to show;
- **validation error** — user input must be corrected;
- **server error** — the operation failed outside normal validation;
- **unauthorized/forbidden** — authentication or permission blocks the action;
- **disabled** — an action is currently unavailable;
- **submitting** — a mutation is in progress;
- **success feedback** — a mutation completed and the user needs confirmation.

Not every screen needs every state. The implementation should cover every state the real workflow can reach.

## Empty states

An empty state is not the same as an error. Explain the absence of data and provide a next action only when one is actually available. Avoid rendering an empty table/card shell that looks broken.

## Mutation consistency

After a successful mutation, ensure the visible UI reflects the authoritative result through the project's existing refresh, invalidation, navigation, or state-update mechanism. Avoid leaving stale data visible after a confirmed change.

## Review questions

- Can the form be completed and submitted with a keyboard?
- Are labels and error relationships correct?
- Can the user tell when submission is in progress?
- Is duplicate submission prevented without trapping the user?
- Are user-entered values preserved after recoverable errors?
- Do success, empty, validation, server-error, and authorization states behave distinctly where needed?
