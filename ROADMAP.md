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

### 1. "Clone as template" was a lie — *fixed, then properly built 1 Oct 2026*

The button showed a toast saying the event had been cloned for next year's
cycle. It cloned nothing; the handler only called `showToast`. The product's
own tagline promises year-over-year blueprints and the feature delivering that
was a no-op with a **false success confirmation**, which is worse than no
feature at all — someone would have relied on it.

It was removed first, because real cloning needed events that users create and
the model layered overrides on an immutable seed list, so a new event had
nowhere to live.

That storage-model change has now landed, and the capability came back in a
better shape. **New event** on the calendar offers a *start from* choice: the
standard 23-milestone blueprint, or any previous event. Copying an event brings
across its checklist, run of show, vendor contacts, venue, owners, categories
and theme, re-spaces every due date around the new event date, and resets every
status to Not Started. A multi-day run keeps its length rather than its old
dates. What deliberately does **not** carry over: budget spend, the wrap-up,
artist candidates and the artist decision — a new cycle means new quotes and an
unwritten retrospective. Vendor balances reset to zero, since last year's
outstanding payment is not this year's problem.

Created events can be deleted, with undo. Seed events cannot — they would
simply reappear. Archiving them is noted below.

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

### 8. Administration required a developer — *fixed 1 Oct 2026*

Adding one committee member meant editing `firebaseConfig.js`,
`firestore.rules` and `storage.rules`, then running two deploys and a push.
Four files and two deploys for what should be an admin screen.

The roster now lives in Firestore at `config/committee` and is managed from a
**Committee** screen in the app, visible to admins. Both rule files read that
document — Firestore directly, Cloud Storage through cross-service rules — so
there is one list instead of three and adding an organiser is an administrative
act, not a release.

Two safeguards, because the document that decides who may edit the roster is
itself governed by the roster:

- **A permanent owner.** `utahindiacc@gmail.com` is hardcoded in both rule
  files and always admits. If the last admin removed themselves by mistake
  there would otherwise be no way back in. That address cannot be removed or
  demoted in the UI, since the rules would let it in regardless and the screen
  would merely be lying.
- **The list cannot be saved without an admin on it**, and a refused read of
  the roster is treated as "not a member" rather than silently falling back to
  the source list — otherwise removing someone would not actually remove them.

Before the document exists, both rule files honour the same addresses that were
previously hardcoded, so deploying the rules changes nothing until the first
save.

Cost note: each Cloud Storage rules evaluation now performs one billed Firestore
read. At this volume that is immaterial, but it is not free.

### 9. No audit trail except artist rationale

Provenance was built for exactly one decision. Budgets, assignees and dates
change with no record of who changed them or when.

### 9b. Deploys appeared not to land — *fixed 1 Oct 2026*

Across weeks of development the same complaint kept recurring: a change was
deployed, CI was green, and the live site still showed the old page. It was
always written off as browser cache.

It was a real defect. `firebase.json` set `Cache-Control: no-cache` on
`/index.html`, but Hosting matches header globs against **the path the browser
asked for**, before it resolves anything — and a visitor requests `/`. The
rewrite to `/index.html` happens afterwards, so the rule never matched and
Hosting's default `max-age=3600` applied. Every deploy was invisible to anyone
who had loaded the site within the hour.

Confirmed by reading the live response header, which said `max-age=3600` rather
than the configured value. Both `/` and `/index.html` are now listed, and the
three header rules are deliberately non-overlapping so rule precedence never
has to be reasoned about.

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
| ~~Create events, from a template or blank~~ ✅ | Delivers the year-over-year promise |
| ~~Committee management in-app~~ ✅ | Removes the developer dependency for an admin task |
| Notifications and weekly digests | Converts a record into a system that drives work |

### Next

- **Public read-only day-of view.** A per-event share link or PIN exposing only
  the run of show. Unblocks volunteers without opening the vendor directory's
  phone numbers.
- **Offline-tolerant day-of mode.** Queue status changes locally, sync on
  reconnect, show pending state honestly.
- **Archiving seed events.** Created events can be deleted; the fifteen seed
  events cannot, because the seed list is immutable and a deleted one would
  come back on the next load. An `archived` flag on the override would hide a
  retired event without rewriting the seed.
- **Recurrence rules.** India Mela is "the first Sunday of June"; Independence
  Day is a fixed date. Creating next year's event still means picking the date
  by hand. Worth encoding once the calendar spans more cycles.

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
  `applyOverrides`. This is why "reset" always has an original to fall back to.
- **Created events live in the same collection.** An entry whose id is not in
  the seed list holds a whole event rather than a patch, and `applyOverrides`
  materialises it. One collection, one sync path, one set of security rules
  instead of a parallel world for user-made events — and no rules change was
  needed to ship it. The guard is that an entry must carry both a name and a
  date before it becomes an event, so a half-written document cannot appear on
  the calendar as a ghost.
- **One document per event**, deliberately: two people editing different events
  would otherwise contend, and India Mela's 130-task checklist would push a
  combined document toward Firestore's 1MB limit.
- **One roster, in Firestore.** `config/committee` holds `members` (for the
  UI), `emails` and `admins` (flat lower-case lists, because the rules language
  cannot map over a list of objects to extract a field). Both rule files read
  it. What remains in source is only the permanent owner and the pre-roster
  fallback, which stop mattering after the first save.
- **Poster and bio URLs are shareable.** `getDownloadURL()` returns a token URL
  that works for anyone holding it regardless of storage rules. Only committee
  members can obtain one, but treat a poster link as public once it exists.
