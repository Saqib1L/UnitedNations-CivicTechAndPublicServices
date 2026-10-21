# API operations

This reference describes the implemented demo API. Run the app and open `/api/docs` for generated request schemas or `/api/openapi.json` for OpenAPI. All paths below include `/api`. JSON commands use `Content-Type: application/json`; uploads use multipart form data.

## Session and response conventions

Login/registration set an HTTP-only `estate_session` cookie. Authenticated requests must retain this cookie; the browser frontend does this through the same-origin Next.js proxy. There are no bearer API keys. Role, case membership and document visibility checks happen on the server.

Most errors are `{"detail":"Explanation"}`; Pydantic validation errors use a `detail` array. Common responses are `400` invalid content/action, `401` not signed in, `403` forbidden, `404` absent resource, `409` conflicting state and `422` invalid request schema. Role checks still apply even if an ID or action is known. Successful creation normally returns `200`, not `201`.

| Method and route | Access | Input / result |
| --- | --- | --- |
| `GET /api/health` | Public | Health and proof-of-concept mode; does not perform an external service readiness check. |
| `POST /api/auth/register` | Public | `{name,email,password}`; creates family account and session. Password length 8–200. |
| `POST /api/auth/login` | Public | `{email,password}`; profile and session cookie. |
| `POST /api/auth/logout` | Session cookie if present | Revokes session; `{ok:true}`. |
| `GET /api/auth/me` | Signed in | Profile `{id,name,email,role,organisation}`. |
| `GET /api/overview` | Signed in | Accessible estates, applicant's intakes / lawyer enquiry queue and own notifications. Officer inventory comes from a published snapshot. |
| `GET /api/cases/{id}` | Case access | Filtered estate, records grouped by kind, visible documents, submission history, members/invitations where permitted, coordinator flag. |
| `GET /api/cases/{id}/summary` | Case access | Downloadable printable HTML with simulation notice; not an official order. Officer version uses published inventory. |

## Intake, cases and invitations

| Method and route | Access | Input / result |
| --- | --- | --- |
| `POST /api/intakes` | Family | `{data:{...},submit:false}`; saved draft, or submitted if `submit:true`. |
| `PUT /api/intakes/{id}` | Owning family | Same body; editable only in `draft` or `information_requested`. Submission requires `data.deceased` and truthy `data.confirmed`. |
| `POST /api/intakes/{id}/review` | Lawyer | `{action:"accept"}` creates case/membership retaining intake; `request` / `decline` require `data.reason`. Single demo enquiry queue, not a marketplace. |
| `POST /api/cases` | Lawyer | `{deceased,jurisdiction?,religion?}`; new preparation-stage estate. Defaults: Kuala Lumpur and Muslim. |
| `PUT /api/cases/{id}/details` | Coordinator/lawyer | `{data:{story,family,assets,documents,nomination,death_date,confirmed}}`; only listed fields are merged. |
| `POST /api/cases/{id}/invitations` | Case lawyer | `{email,coordinator:false}`; random token bound to invited email. No outbound email. |
| `GET /api/invitations/{token}` | Invited account | Returns email, deceased and acceptance state; wrong account receives `403`. |
| `POST /api/invitations/{token}/accept` | Invited family account | Adds membership once and returns `{estate_id}`. |

The intake data JSON stores entered facts; it is not a validated nationwide legal schema. Confirming facts is an app acknowledgement, not a binding signature or executed consent.

## Files and reviews

| Method and route | Access | Input / result |
| --- | --- | --- |
| `POST /api/cases/{id}/documents` | Case family/lawyer | Multipart: `file`, `category` (default Supporting document), `visibility` (`shared` or `private`), optional `supersedes_id`. Returns metadata without filesystem path. |
| `GET /api/documents/{id}/file` | Case access plus file visibility | Inline authenticated file; officers only see exact published revision IDs. |
| `POST /api/documents/{id}/review` | Case lawyer | `{action,data:{comment?}}`, where action is `accepted`, `under_review` or `correction_requested`; correction comment required and creates task. Only latest revision can be reviewed. |

Uploads accept `.pdf`, `.png`, `.jpg`, `.jpeg` and `.txt`; non-empty and at most 10 MiB. Validation uses extension/size, not malware scanning or proof of authentic contents. A family member can revise only their own document; the lawyer may revise case documents. Revision inherits original category, visibility and owner; an already superseded revision cannot be revised again.

## Case records

`POST /api/cases/{id}/records` accepts `{kind,data,owner_id?}`. Supported kinds: `person`, `asset`, `liability`, `task`, `fee`, `note`. Each needs `data.name` or `data.title`. Financial `data.value` must be finite, non-negative and at most `1e12`. Lawyer can create all these kinds; coordinator can create person/asset/liability only. Tasks require a case assignee. Notes become private; fees are simulated; new assets start `identified` and reopen completed cases.

`POST /api/records/{id}/action` uses the common command envelope:

```json
{"action":"respond","data":{"response":"The clearer certificate has been uploaded."}}
```

| Record kind / action | Actor | Required data / gate |
| --- | --- | --- |
| Task / `assign` | Lawyer | `owner_id`: case member or assigned lawyer; completed tasks cannot be reassigned. |
| Task / `respond` | Assignee | Non-empty `response`; task cannot be completed already. |
| Task / `complete` | Lawyer | Must be `responded`; repeat completion returns unchanged task. |
| Asset / `status` | Lawyer | `status` must follow transitions in [architecture](architecture.md); release also requires non-empty `evidence`. |
| Fee / `paid` | Lawyer | Records simulated payment; no money moves. |
| Query / `resolve` | Assigned officer | A newer submission revision must exist. |
| Notification / `read` | Recipient | Marks own notification read. |

## Case commands

`POST /api/cases/{id}/actions` accepts `{action,data?}` and returns `{stage,message}`. Case access plus the specific action role are required.

| Action | Actor | Data and gate |
| --- | --- | --- |
| `ready` | Lawyer | At least one asset and all current shared revisions accepted; stage 0–2. |
| `submit` | Lawyer | Stage 2 or 3; accepted current shared documents. Repeat submission allowed only after agency correction request. Creates fixed snapshot and increments revision. |
| `query` | Officer | Stage 3 with assigned submission; `reason` required, optional `owner_id` (defaults assigned lawyer). Creates linked task and marks submission correction-requested. |
| `hearing` | Officer | Stage 3 with submission; parseable ISO `date` and non-empty `location`; records simulated appointment. |
| `decision` | Officer | Stage 3, all queries resolved, hearing exists and `reason` notes required. Records simulated order, stage 4. |
| `implement` | Lawyer | Stage 4; moves to asset implementation, stage 5. |
| `complete` | Lawyer | Stage 5; at least one asset, all released with evidence, all tasks completed; stage 6. |

Example hearing command:

```json
{"action":"hearing","data":{"date":"2026-11-20T10:30","location":"Demo hearing room"}}
```

The demo assigns submissions to the first seeded officer, not an external routing service. Review/decision gates are collaboration rules and do not establish legal validity. Read [architecture](architecture.md) for visibility and persistence details and [demo guide](demo-guide.md) for an end-to-end exercise.
