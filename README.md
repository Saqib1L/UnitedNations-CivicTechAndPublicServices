# Estate Unlock

A lawyer-led estate-processing proof of concept with family collaboration and a simulated government workspace. Built with Next.js, TypeScript, FastAPI and SQLAlchemy/PostgreSQL. The interface follows the repo's Apple design skill.

## Start with Docker

```bash
docker compose up --build
```

Open **http://localhost:3000**. PostgreSQL and uploaded files use persistent volumes. The API reference is at **http://localhost:3000/api/docs** (or port 8000).

Reset the fictional dataset while preserving the application setup:

```bash
docker compose exec api python -m backend.seed --reset
```

Restart the API after resetting if other sessions were open. Reset removes application records and recreates the seed dataset; use only for this demo.

## Start without Docker

Node.js 22+ and Python 3.12+ are recommended. This path uses the supported SQLite fallback; Docker uses PostgreSQL.

```bash
python3 -m venv .venv
.venv/bin/pip install -r backend/requirements.txt
npm ci
```

Run these in two terminals from the repository root:

```bash
.venv/bin/uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

```bash
npm run dev
```

Open **http://localhost:3000**. Data is stored in the ignored `data/` directory. Do not run the reset command against a non-demo database.

```bash
.venv/bin/python -m backend.seed --reset
```

To use a separately managed PostgreSQL database, set `DATABASE_URL` before starting the API. See `.env.example`; the API reads environment variables directly, while Next.js also reads `.env.local`. `API_URL` is the server-side proxy destination. `APP_ORIGINS` must include the frontend origin if using a hostname other than localhost. The default session cookie is HTTP-only and SameSite=Lax; `COOKIE_SECURE=true` is available for HTTPS deployments.

## Demo accounts

All seeded accounts use **`Demo2026!`**. The sign-in screen can fill the first three accounts' credentials; click Sign in to authenticate.

| Account | Email | Purpose |
| --- | --- | --- |
| Sarah Rahman | `sarah@demo.my` | Lawyer; estate cases, intake queue, evidence review and submissions |
| Aina Abdullah | `aina@demo.my` | Family coordinator; uploads and assigned requests |
| Daniel Azman | `daniel@demo.my` | Officer; assigned submissions, queries, hearings and decisions |
| Farid Abdullah | `farid@demo.my` | Overseas family member; own private document and task |
| Mei Tan | `mei@demo.my` | Separate family estate and public intake example |

Officer applications are initially empty because the main estate is in legal review. Publish an application as Sarah to populate Daniel's queue. This demonstrates the actual assignment boundary.

## Demo walkthrough

1. **Lawyer dashboard:** sign in as Sarah. Open Ahmad bin Abdullah's estate and inspect people, assets, liabilities, private notes and tasks.
2. **Family correction:** sign in as Aina. Open Documents → Marriage certificate → Upload new revision. Use a non-empty PDF/image/text file. Respond to the corresponding task.
3. **Professional review:** as Sarah, accept the new shared revision and complete the responded task. Complete legal review and submit the application. Farid can separately respond to his overseas-contact task; Sarah reviews completion.
4. **Officer query:** as Daniel, open the assigned application and raise a correction query. As Sarah, reassign its linked task to Aina if appropriate. The assignee responds; Sarah reviews and completes it, then publishes a resubmission. A new file is only needed when the query calls for revised documentary evidence.
5. **Decision:** Daniel reviews the new revision, resolves the query, schedules a simulated hearing and issues a simulated order with notes.
6. **Asset implementation:** Sarah starts implementation. Move each asset through its claim stages. Record a release or registration reference for each asset. Complete outstanding tasks, then reconcile and complete the estate.
7. **Public intake:** register a family account, start an enquiry, save a draft and submit confirmed facts. Sarah can request more information, decline with a reason or accept to create a case retaining the intake.
8. **Invitation path:** Sarah creates a separate case and invitation for a family email. Copy its link, sign in/register with that email, then accept. No outbound email is sent.

## Verification

See the [verification record](docs/verification.md) for completed checks and environment limits.

```bash
npm run typecheck
npm run build
.venv/bin/python -m pytest backend/tests -q
```

Browser smoke testing uses an optional Playwright client and an installed Chromium binary:

```bash
.venv/bin/pip install -r tests/requirements.txt
.venv/bin/python -m playwright install chromium
.venv/bin/python tests/browser_smoke.py
```

Run both servers with a freshly reset demo dataset first: the walkthrough changes the fictional case through completion and creates test accounts. Use the reset command above before repeating it. Use `CHROMIUM_PATH` if pointing to an existing browser. Browser artifacts are written to ignored `test-results/`.

## Design and boundaries

See [the service blueprint, permissions, wireframes and state models](docs/product-design.md), [the project brief](estate-unlock-project.md), and [jurisdiction research](inheritance-workflows/README.md).

Authentication, authorisation, persistence, enquiries, invitations, uploads, revisions, task responses, submission snapshots, queries, hearings, decision records, notifications and asset status changes work. Fees, agency processing and asset releases are **simulated records**. Entitlements require professional review; the app does not calculate legal shares or submit official applications. Assisted intake uses a labelled deterministic fictional example, not an AI API. Preparation summaries download as printable HTML, not official grants or executed consent documents.

BM/English navigation and common actions are available. Detailed explanations and seeded case content remain English. Demo hearing dates and receipt references are operator-entered simulations rather than verified external events. The app has not been hardened for real client information or public production deployment.
