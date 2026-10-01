# EventOps — product review and roadmap

India Cultural Center of Utah · reviewed 1 October 2026

A candid assessment of where the MVP stands and what it needs to become an
operations platform rather than a record-keeping tool. Written from the
perspective of an event management director who has to run fifteen events a
year with a volunteer committee.

---

## Where it actually stands

EventOps is a good **record-keeping** tool and not yet an **operations** tool.

It captures what should happen with real rigour: fifteen events, a reusable
T-minus template, 130 India Mela tasks, artist vetting with recorded rationale,
per-event PDF export, and a Firestore backend behind a committee allowlist.

What it does not yet do is make anything happen. Every workflow assumes a
committee member proactively opens a browser and goes looking. Volunteers do
not do that. The gap between this MVP and an enterprise-ready platform is not
sophistication — it is **reach and reliability**: getting the right information
to people who are not logged in, and not losing their work when the venue wifi
drops.

---

## Critical gaps

Ranked by how soon each one causes real damage.

### 1. "Clone as template" was a lie — *fixed 1 Oct 2026*

The button showed a toast saying the event had been cloned for next year's
cycle. It cloned nothing; the handler only called `showToast`. The product's
own tagline promises year-over-year blueprints and the feature delivering that
was a no-op with a **false success confirmation**, which is worse than no
feature at all — someone would have relied on it.

Removed rather than patched. Real cloning requires events that users create,
and the current model layers overrides on top of an immutable seed list
(`applyOverrides(seedEvents, overrides)`), so a new event has nowhere to live.
That is a storage-model change, scheduled below.

### 2. The Day-Of Command Center cannot be used by the people it was built for

The command centre is explicitly designed for floor volunteers — big tap
targets, single-tap status advance, "Single-tap mode for floor volunteers".

But `firestore.rules` requires authentication to **read**, and the allowlist
has three addresses on it. A volunteer opening the link sees the blank seed
template, not the real run of show. The headline day-of feature is unusable by
its intended users. This is the sharpest contradiction in the product.

### 3. Nothing ever tells anyone anything

Every milestone carries an assignee and a due date. No reminder, digest or
nudge exists anywhere in the system. For a volunteer committee where nobody is
paid to check a dashboard, this is the single highest-leverage missing
capability.

### 4. No cross-event view — *first version shipped 1 Oct 2026*

Tasks could be filtered by owner *within* one event. There was no way to ask
"what is Pavithra responsible for across all fifteen events" or "what is due
this week" — which is the chair's actual job.

A **My Work** view now answers this. Still to come: tying it to the signed-in
identity rather than a name picker (assignees are free text, so there is no
mapping from `sarath.s1884@gmail.com` to "Sarath" yet).

### 5. Day-of has no resilience

Venue wifi fails; that is the norm, not the exception. Status changes debounce
800ms and fire once. A dropped connection surfaces a toast and the change is
lost on reload. No offline queue, no retry, no screen wake-lock. The one hour
the app must not fail is the hour it is least equipped for.

### 6. Deletion was instant and permanent — *mitigated 1 Oct 2026*

One `×` per row on a 130-row checklist, no confirmation, no undo, no trash.
Firestore has no recycle bin and scheduled backups were declined on cost
grounds — a reasonable call, but the two decisions compounded badly.

Undo now covers every destructive action. A proper soft-delete with a restore
window is still worth building.

### 7. Last-write-wins, silently

Two people editing the same event overwrite each other at 800ms granularity
with no indication that it happened. Survivable at three people. Not at fifteen.

### 8. Administration requires a developer

Adding one committee member means editing `firebaseConfig.js`,
`firestore.rules` and `storage.rules`, then running two deploys and a push.
Four files and two deploys for what should be an admin screen. Firestore
security rules can read a config document, so the allowlist can live in the
database and be managed in-app.

### 9. No audit trail except artist rationale

Provenance was built for exactly one decision. Budgets, assignees and dates
change with no record of who changed them or when.

### 10. Unexplained numbers

The readiness percentage appears on every tile and in the event header with no
label. During development the question "what is the percentage value showing in
each tile?" came up — that is the evidence.

---

## Build order

### Now — before India Mela 2027 planning begins

| Item | Why it is first |
| --- | --- |
| ~~Remove the false clone control~~ ✅ | Correctness; it actively misinforms |
| ~~Undo on destructive actions~~ ✅ | Cheapest protection against the worst outcome |
| ~~My Work cross-event view~~ ✅ | Answers the chair's daily question |
| Committee management in-app | Removes the developer dependency for an admin task |
| Notifications and weekly digests | Converts a record into a system that drives work |

### Next

- **Public read-only day-of view.** A per-event share link or PIN exposing only
  the run of show. Unblocks volunteers without opening the vendor directory's
  phone numbers.
- **Offline-tolerant day-of mode.** Queue status changes locally, sync on
  reconnect, show pending state honestly.
- **Real cloning.** Requires user-created events: a storage-model change so
  events can exist outside the seed list. Then roll dates to next year's
  equivalent weekday, carry checklist and vendors, reset statuses.

### Later

- Audit log of field-level changes with author and timestamp.
- Budget rollups, vendor payment status, receipt attachments.
- Post-event metrics compared across years.

---

## What we are deliberately not building

"Enterprise-ready" invites expensive mistakes. These are declined on purpose:

- **SSO / SAML / SCIM.** The users are a few dozen volunteers with Gmail
  addresses. Google sign-in plus the email-link path already covers everyone,
  including shared mailboxes that are not Google accounts.
- **Granular RBAC matrices.** Three roles — admin, committee, volunteer — not a
  permissions grid.
- **Multi-tenancy or white-labelling.** There is one organisation. Building for
  an imaginary second tenant doubles the cost of every feature.
- **Gantt charts, resource levelling, workflow builders.** The T-minus template
  *is* the workflow, and it fits the domain better than a generic engine would.
- **Native mobile apps.** Spend that budget on offline support in the web app.
- **An analytics suite.** One honest number — did we hit our milestones on time
  — beats a dashboard nobody opens.

---

## Architectural notes for whoever picks this up

- **Seed plus overrides.** `src/data/events.js` is immutable seed data;
  `eventOverrides/{eventId}` in Firestore holds the edits, layered at render by
  `applyOverrides`. This is why "reset" always has an original to fall back to,
  and why new events cannot yet exist.
- **One document per event**, deliberately: two people editing different events
  would otherwise contend, and India Mela's 130-task checklist would push a
  combined document toward Firestore's 1MB limit.
- **Three allowlists must stay in step:** `COMMITTEE_EMAILS` in
  `src/lib/firebaseConfig.js`, `firestore.rules`, and `storage.rules`. Moving
  this into Firestore is scheduled above precisely because three copies is two
  too many.
- **Poster and bio URLs are shareable.** `getDownloadURL()` returns a token URL
  that works for anyone holding it regardless of storage rules. Only committee
  members can obtain one, but treat a poster link as public once it exists.
