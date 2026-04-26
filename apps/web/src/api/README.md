# api/

Real-backend boundary.

`client.ts` is the single place that owns `fetch`, base URL, and error shape. Per-feature api modules (`features/<x>/api/*.ts`) import it and expose typed function surfaces. Today those functions wrap `mocks/fixtures`; tomorrow they wrap `request()`.

Pages and components never import from this folder directly — they go through `features/<x>` hooks.
