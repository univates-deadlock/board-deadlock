# Express application structure

Trace the app the repository actually runs before adding a route. Locate the API
package, module configuration, bootstrap, app factory/module, router mounts,
middleware, schemas, persistence client, and error handler. Follow a different
functional folder arrangement when the project uses one.

## Bootstrap and request flow

Bootstrap usually loads validated configuration, initializes dependencies, starts
the listener, and handles shutdown. App assembly registers middleware and routes.
Separate these when importing the app for tests or another runtime requires it;
do not restructure an otherwise adequate app merely to match this example.

An adaptable flow is:

`route → middleware → controller → schema → service → persistence`

- Routes define methods, paths, and middleware composition.
- Middleware establishes verified identity and enforces relevant policies.
- Controllers handle HTTP input/output and invoke boundary validation.
- Schemas describe permitted transport input, not arbitrary database writes.
- Services contain business rules and queries when the project has that boundary.
- Persistence uses the existing shared client or data-access convention. Direct
  Prisma queries are valid; a repository layer or classes are not prerequisites.

Schema validation may instead live in middleware in an existing project. Preserve
that placement. Database models do not prove that routers or CRUD handlers exist.

## Typed authenticated context

Reuse typed `res.locals.user` or the existing typed `req.user` extension. Set it
from server-verified identity and let downstream handlers consume it. Locals are
request-scoped server state; assigning them does not automatically send JSON.
Select response fields explicitly, rather than serialize the whole context.

This Express 5/TypeScript fragment assumes existing identity and error helpers;
adapt their imports and types to the package's module resolution. It illustrates
assembly only, not a complete authentication implementation:

```ts
import express, { type RequestHandler } from "express";
import { resolveIdentity, unauthorized, errorHandler } from "./http.js";
import { listItems } from "./items.js";

type Identity = { id: string };
type AuthLocals = { user?: Identity };

const requireIdentity: RequestHandler<{}, unknown, unknown, {}, AuthLocals> =
  async (req, res, next) => {
    const user = await resolveIdentity(req); // Verifies the session/token.
    if (!user) throw unauthorized();
    res.locals.user = user;
    next();
  };

const app = express();
const items = express.Router();
items.get("/", requireIdentity, listItems);
app.use("/api/items", items); // GET /api/items, not /api/items/api/items.
app.get("/health", (_req, res) => { res.json({ status: "ok" }); });
app.use(errorHandler);
```

The existing `listItems` handler should use the same locals type and account for
an absent identity; TypeScript does not infer middleware execution from router
order. If the project already augments `Express.Request` for `req.user`, preserve
that extension instead of migrating it to locals.

## Middleware order and router mounts

Determine ordering from each handler's contract:

1. Register general policies such as request logging, CORS, and applicable rate
   limits at the scope where they must apply.
2. Mount library handlers according to their documented body/raw-stream and
   middleware requirements. A handler that owns body parsing may need to precede
   `express.json()`; do not apply that ordering to every library automatically.
3. Install parsers before the application routes that need them, then compose
   identity/authorization middleware and handlers on protected paths.
4. Keep fallback/not-found handling and the global error middleware after routes.

Review full effective paths by combining router-local paths with mount prefixes.
Keep health endpoints aligned with deployment probes and project policies rather
than changing their path or authentication by habit.

## Error propagation

Inspect the installed Express version and existing async wrapper. Express 5
forwards rejected promises returned by handlers to error middleware; redundant
try/catch is unnecessary. Express 4 needs explicit forwarding such as the
project's async wrapper or `catch(next)`. Callback/timer errors still need to
reach `next`; detached promises are not handled merely because a function is
marked async. Keep the global error handler's four-argument signature and the
project's safe response/logging conventions.

See the official [Express error handling guide](https://expressjs.com/en/guide/error-handling/)
for the installed version's behavior.
