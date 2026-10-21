# Demo and testing guide

Use fictional information only. This walkthrough exercises working collaboration and saved changes; government decisions, hearing records, payments and institutional releases are simulations.

## Start and reset

Use [README](../README.md) for Docker or local startup and environment settings. Open `http://localhost:3000`. All seed accounts use `Demo2026!`.

| Role | Account | Expected access |
| --- | --- | --- |
| Lawyer | `sarah@demo.my` | Rahman & Partners cases, enquiries and private firm notes |
| Family coordinator | `aina@demo.my` | Ahmad's case, shared files and Aina's tasks/private files |
| Overseas family member | `farid@demo.my` | Ahmad's shared summary, Farid's private identity file and own task |
| Officer | `daniel@demo.my` | Assigned published applications; initially no applications |
| Separate family | `mei@demo.my` | Separate case/intake; no access to Ahmad's estate |

Reset a demo database before repeating the full journey. This drops/recreates application tables, invalidates sessions and restores seed rows. It does not clean up every previously uploaded file. Stop/restart the API if other sessions were open; sign in again after reset.

```bash
# Local SQLite (or the DATABASE_URL configured in this shell)
.venv/bin/python -m backend.seed --reset
```

```bash
# Docker Compose database
docker compose exec api python -m backend.seed --reset
```

## Main journey: evidence to asset completion

The main estate is **Ahmad bin Abdullah**, reference **EU-2026-0042**, in legal review. It has four assets: home, savings, ASNB holdings and vehicle; one illustrative financing liability; four family people records; Aina's document correction and Farid's overseas-contact task. Farid's identity file is private. None of the seeded values are official charges or legal entitlements.

| Step | Actor and action | Expected result |
| --- | --- | --- |
| 1 | Sarah opens Ahmad's case and reviews people, assets/liability, tasks and documents. | Private firm note is visible to lawyer; shared marriage certificate needs correction. |
| 2 | Aina opens the marriage certificate and uploads a new revision using a non-empty PDF/image/text file under 10 MiB. She responds to her correction task. | New revision appears; old revision remains; response survives reload. Farid's private file stays hidden from Aina. |
| 3 | Farid signs in and responds to his overseas-contact task. | He sees his own private file and own request. Response does not complete professional review automatically. |
| 4 | Sarah accepts the latest shared marriage certificate and completes the responded tasks. She completes legal review and submits. | Current shared evidence must be accepted. Submission revision 1 freezes published evidence IDs/inventory; Daniel now sees the application. |
| 5 | Daniel raises an agency correction with a clear reason. | Query links to an assigned task; submission requires correction. Private notes and unpublished files remain hidden. |
| 6 | Sarah assigns the linked task to Aina or responds if she remains assignee. Assignee supplies the response and any needed new evidence; Sarah accepts evidence and completes task review. | Owner, request and response are visible in the permitted workspace. Completing the task does not itself publish it. |
| 7 | Sarah resubmits. Daniel reviews the new submission and resolves the query. | Revision 2 is created; revision 1 survives. Completed public query responses appear in the new snapshot. Query cannot be resolved before a newer revision exists. |
| 8 | Daniel records hearing date/location and decision notes, then issues the simulated order. | Outstanding queries block decision. Order moves to stage 4; asset work remains visible. |
| 9 | Sarah starts asset implementation and advances each asset through evidence checked, claim prepared, submitted, approved and released. | Every release needs a recorded evidence/reference; all records are simulated. Use the query/resubmit branch for an asset correction if desired. |
| 10 | Sarah completes remaining responded tasks and completes the estate. | Completion is blocked if any asset lacks release/evidence or any task is unfinished. Adding a new asset afterward reopens implementation. |

Preparation summaries are downloaded as printable HTML. They are not government grants, legally executed consent or share calculations.

## Entry path: family has no lawyer

1. Register a new family account and start an enquiry.
2. Describe circumstances; use the labelled assisted-extraction example if desired, then correct/confirm facts. It is deterministic demo text, not an AI call.
3. Enter known family/assets/documents and uncertainty about nominations. Save a draft, reload, then submit confirmed facts.
4. Sarah opens the enquiry. Request more information with a reason to exercise the return path; the applicant edits and resubmits.
5. Sarah accepts. The applicant receives coordinator membership in the new case and the intake facts are retained. Acceptance cannot create duplicate estates.

The newly accepted case uses the same collaboration workspace. It does not receive Ahmad's fictional assets/documents automatically; add that case's own records and evidence.

## Entry path: existing lawyer

1. Sarah creates a new case, enters known details and creates a coordinator or member invitation for a family email.
2. Copy the invitation URL; no email is actually sent.
3. Sign out and register/sign in using that exact invited email, then open the invitation URL and accept.
4. The account gains membership only in the invited estate. Existing case details remain; no repeated public intake is required.
5. Try another signed-in email to confirm it cannot accept the invitation. Repeated acceptance by the correct account does not duplicate membership.

## Checks and commands

Run from the repository root:

```bash
npm run typecheck
npm run build
.venv/bin/python -m pytest backend/tests -q
docker compose config --quiet
```

The API tests create an isolated temporary SQLite database and reset it per test. They cover account/case isolation, private documents and notes, immutable submissions, query handoffs, task ownership, intake acceptance, invitation identity, file validation, origin/session controls and completion/reopening gates. They do not validate the whole country's law or external institutions.

Browser tests need both servers and a fresh demo dataset; they change the main case through completion and create accounts/cases:

```bash
.venv/bin/pip install -r tests/requirements.txt
.venv/bin/python -m playwright install chromium
.venv/bin/python tests/browser_smoke.py
```

Optional `APP_URL` points to another running frontend; `CHROMIUM_PATH` supplies an installed executable. Screenshots and results go in ignored `test-results/`. Reset/restart after the test before presenting the original scenario. Use [verification.md](verification.md) for actual completed checks and environment limits; this guide describes how to run them, not a new test result.

For a UI review, ask a first-time family user to find their next task, correct evidence, explain who acts next and locate released assets. Check mobile reflow, keyboard operation and readable focus/errors. Professional reviewers should locate a query's evidence and distinguish a published revision from later uploads without facilitator explanation. See [UI guidelines](ui-guidelines.md) for targets.

## Troubleshooting and limits

| Symptom | Check |
| --- | --- |
| Frontend loads but sign-in fails to connect | Start API on port 8000; check `/api/health` and `API_URL`. Docker needs a running Docker daemon. |
| Origin not allowed | Include the browser's exact scheme/host/port in API `APP_ORIGINS`. |
| Officer has no applications | Submit an accepted evidence pack as Sarah first. This is expected before publication. |
| Cannot complete legal review | Review the latest revision of every shared document and add at least one asset. |
| Cannot resolve a query or issue order | Publish a newer submission, resolve all queries, record hearing and supply decision notes. |
| Cannot close estate | Release all assets with evidence and professionally complete all tasks. |
| Existing credentials stop working after reset | Sign in again; old sessions were removed. |
| Summary is HTML | Open and print/save using the browser. It deliberately represents a preparation summary, not an official instrument. |

BM/English navigation and common actions are available; detailed content remains English. The app has no real payments, government APIs, legally binding signatures, outbound invitations, validated legal-share engine or production security hardening. See [architecture](architecture.md) for the exact implementation and extension gaps.
