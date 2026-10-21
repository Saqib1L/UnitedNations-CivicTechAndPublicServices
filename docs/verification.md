# Verification record

## UI simplification — 21 October 2026

The revised task-first interface passed the production build (including TypeScript), all 10 API regression tests and the connected browser walkthrough. The walkthrough additionally checked the family overview's single primary task action, expandable process stages, the waiting-for-review state, and all five family sections at both 320px and 390px without page-wide horizontal overflow. Both entry paths and the full query/resubmission/hearing/order/asset-release journey passed with no browser page errors.

Sign-in, the professional dashboard and the mobile family overview screenshots were visually inspected. A final copy adjustment labels the home-screen count as tasks in progress because it includes responses awaiting lawyer review. The implementation preserves existing data: browser checks used separate temporary SQLite databases. Test servers were stopped automatically afterward. Primary-source design references and the distinction between accessibility targets and verified conformance are documented in [UI guidelines](ui-guidelines.md); no usability study or full accessibility audit is claimed.

The whole-app documentation includes [architecture](architecture.md), [API operations](api.md), [demo/setup/testing](demo-guide.md), and the revised [service design](product-design.md). Local Markdown links and diff whitespace checks passed.

## Initial implementation — 20 October 2026

Verified on 20 October 2026 with Node.js 25.6, Python 3.12 and Chromium. The local running application used SQLite; Docker Compose is configured for PostgreSQL 17.

| Check | Result |
| --- | --- |
| TypeScript (`npm run typecheck`) | Passed |
| Production Next.js build (`npm run build`) | Passed |
| API regression suite (`.venv/bin/python -m pytest backend/tests -q`) | 10 passed |
| Connected browser walkthrough (`.venv/bin/python tests/browser_smoke.py`) | Passed; no browser page errors |
| Docker Compose configuration (`docker compose config --quiet`) | Passed |
| PostgreSQL schema compilation using SQLAlchemy's mock engine | All nine tables compiled |

The browser walkthrough covered family, lawyer and officer sign-in; BM/English navigation; private-document visibility; revised uploads; persisted task responses; keyboard dialog dismissal; the family overview at 390px; reduced motion; legal review; fixed submissions; agency queries and published responses; resubmission; hearing and order; all four asset releases; completion; public registration and intake acceptance; and an existing lawyer's invitation accepted by the invited account. Desktop and mobile screenshots were visually inspected. Generated screenshots and the JSON result are in the ignored `test-results/` directory.

API tests separately cover unrelated-account access, private file access, unpublished evidence, immutable submission snapshots, required query responses, unresolved-query decision gates, invitation account binding, task ownership, release/completion gates, reopening a completed case when an asset is added, origin checks and logout.

Live PostgreSQL and container startup were not tested: the Docker daemon is unavailable in this environment. Schema compilation and Compose validation do not replace those runtime checks. The API suite reports one upstream Starlette TestClient deprecation warning; it does not affect the passing results. The browser run uses reduced motion, so spring animation timing was not part of its assertions.

The fictional local dataset was reset after the walkthrough. Development and test servers were stopped. Start the app using the commands in the root README.
