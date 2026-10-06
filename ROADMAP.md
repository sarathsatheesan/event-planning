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

### 3. Nothing ever told anyone anything — *fixed 1 Oct 2026*

Every milestone carried an assignee and a due date, and no reminder, digest or
nudge existed anywhere. For a volunteer committee where nobody is paid to check
a dashboard, this was the single highest-leverage gap.

A scheduled Cloud Function now emails the committee every Monday at 8am
Mountain: what is overdue and what is due within seven days, grouped by owner,
plus any event landing in the next fortnight. Mail goes out over Gmail SMTP from
the ICC's own address, so reminders arrive from a sender volunteers recognise
rather than a noreply.

**Not via the Trigger Email extension**, which was the obvious route and the
original plan. Firebase Extensions shuts down on 31 March 2027; already-installed
extensions keep running indefinitely, so it was not a cliff, but management
features disappear and the installation could never be edited or reconfigured
again. Google's own guidance is to move to plain 2nd-gen functions. Adopting a
dependency with an announced end-of-life was not worth it for roughly twenty
lines of nodemailer, and removing it took a moving part out of the system: no
extension, no intermediary `mail` collection, one less thing to understand.

The SMTP password is a Secret Manager secret bound to the function at deploy
time. It is not in this repository, not in an environment file, and the send
error path deliberately logs only the failure reason — logging the message
object would put the transport config, and therefore the password, into Cloud
Logging.

The digest is addressed to the ICC inbox with the committee bcc'd, rather than
thirty addresses in the To line: that would expose everyone's address to
everyone and invite a reply-all thread on an automated message. Replies land in
the ICC inbox, where somebody reads them.

**Send one now.** Admins get an *Email the committee* button on the My Work
view, with a choice of scope — this week, or everything including past events.
It calls the same `deliverDigest` the Monday schedule does, so a manual push
cannot quietly differ from the automatic one; there is one code path, not two.

Three guards on it, because sending is not undoable and spends both the
committee's attention and the ICC's sending reputation:

- **The function re-checks that the caller is an admin** against the roster. The
  button is hidden from everyone else, but a hidden button is not a permission.
- **A two-minute cooldown** between manual sends, so a stuck finger cannot email
  the committee four times.
- **A quiet result is reported, not sent.** If nothing is overdue, due soon or
  coming up, no email goes out and the person who pressed the button is told
  so — rather than wondering whether it worked.

Three judgements worth recording:

- **A quiet week sends nothing.** An email that arrives saying "nothing to
  report" teaches people to ignore it, and the one week it matters they will.
- **Sections cap at twelve rows** with "…and N more". The first real run
  produced thirty-one overdue items under a single heading, which is a wall,
  and a wall gets archived unread.
- **The digest logic is pure and tested** against the actual calendar at
  several dates, because the formatting of an email nobody sees until it
  arrives is exactly the kind of thing that rots silently. Testing it caught a
  missing charset declaration that would have delivered "Â·" and "â€¦" to every
  recipient.

### 3b. Assignees were names, not people — *fixed 1 Oct 2026*

The first real digest revealed something the app had been hiding: **all
thirty-one overdue milestones were unassigned**. Assignee was a free-text box,
so a name in it had no identity, no address, and no way to be chased.

Milestone owners and run-of-show owners are now picked from the committee
roster, storing the member's address alongside their name. The existing typed
names are not disturbed: one that matches a roster member resolves to them
automatically, and one that does not — "Chinmy", say — is kept and labelled
rather than wiped. With no roster loaded the field falls back to the free-text
box it replaced, because a dropdown with nothing in it cannot be used.

This was the prerequisite for per-person reminders, shipped below.


### 3c. One list for thirteen people — *fixed 1 Oct 2026*

The weekly digest mailed the identical committee-wide list to everybody, which
made every reminder somebody else's problem: thirty-one overdue milestones read
as organisational background noise rather than as four things you personally
owe.

The Monday run now sends **each member only their own milestones**, grouped by
event and nearest deadline first, and **admins additionally get the shared
overview** — because spotting what nobody owns is their job and it appears on no
individual's list. A member with nothing due gets no email at all; silence has
to mean something or the reminder that matters gets filed with the rest.

Both emails come from one `buildDigest` call path with a `forPerson` option, so
the personal list and the overview cannot disagree about what "overdue" means.
Ownership is resolved by address when the milestone was assigned from the roster
picker, and by **exact** name match otherwise — the stale typed names are the
ones most worth chasing, but "Hari" must never collect "Hari Prasad"'s work.

Capping had to change too. Filling twelve rows greedily spent all of them on one
event and hid nineteen items belonging to three others, so a personal section now
reserves two rows per event before anything is filled greedily. The overview
keeps the greedy order: the person who owes the most is read first.

**Preview Monday** (My work, admins only) shows the dry run: who gets an email
and with what subject, who gets silence, how much work reaches nobody, and —
the one that is otherwise invisible — which milestones carry a typed name
matching no committee member. Those look assigned in the app and are chased by
no one. The preview function binds no mail secret, so it cannot send.

**Ad-hoc "Email the committee" is unchanged** — that button is for "everyone look
at this", and it still sends the shared list to the whole roster.

### 3d. The event lead was still a typed name — *fixed 2 Oct 2026*

Milestone and run-of-show owners were picked from the roster; the **event lead**
was not. That was the wrong field to leave as free text, because the lead is the
one person every other owner escalates to. It now picks from the committee and
stores `leadEmail` alongside the name, on the same rules as every other person
field: a typed name that matches a member resolves to them, one that does not is
kept and labelled.

### 3e. Vendors had a phone number and nothing else — *2 Oct 2026*

The directory held contact, phone, load-in, balance and a contract link. Chasing
a caterer the week of an event means email; checking a DJ is real means their
page. Added **email, website, Instagram and Facebook**. Optional fields are
hidden rather than dashed when read-only — nine rows of "—" on every card is
noise on a phone at the venue. The PDF stacks the person and the handles into
two columns rather than growing to ten.

### 3f. One calendar, two organisations — *2 Oct 2026*

Events now carry an **Org** — `ICC` or `Temple` — set on the event, chosen when
one is created, and carried over when a previous event is used as a template.

The backfill is a default applied where events are read, not a migration
script. Every record that predates the field reads as ICC from the moment this
ships — the fifteen seed events, events created by an older build, and override
documents already in Firestore — with nothing to run, nothing to re-run, and no
window where half the rows have the field and half do not. An event saved after
this point persists the value for real. A record that already says `Temple` is
never rewritten.

The calendar gained filters: **search by name** (native typeahead, no
dependency), **year**, **org**, and — the suggested addition — **status**.
Status earns its place because it is already derived for every event and
answers "what is in flight", which is the question the list is usually opened
with. Month was considered and dropped: with fifteen events a year it splits
the list into ones and twos, and year plus status already does the narrowing.

The summary stats follow the filter — narrowing to the temple and still being
shown the ICC's average readiness would answer a question nobody asked — and
the count reads "2 of 17 events" so the hidden ones are accounted for rather
than silently gone. Filter state lives in `App`, not `Dashboard`, because the
dashboard unmounts whenever an event is opened and filters that reset on every
back-navigation are filters nobody uses.

Desktop puts the controls on the heading row. Below `sm` they collapse behind a
**Filters** button carrying a count of how many are active: a filtered list with
its controls hidden is how people conclude their events have vanished.

### 3g. A board view, and the follow-ups a retro loses — *6 Oct 2026*

A committee member asked for Kanban. Three findings from reading the code before
building it:

**Pre-Event earns it outright.** Milestones already carry four statuses, so the
board is lanes over data that already exists. It sits behind a List / Board
toggle and inherits the category and owner filters — a filter that applied to
only one view is a filter people stop trusting.

**Day-Of keeps the timeline as its default.** The run of show is sorted by time,
and on the day that chronology *is* the product. A board regrouped by status is
useful the morning before, for triage; at 4pm it loses the only ordering that
matters. Board is offered, never imposed.

**Post-Event had nothing to put on a board.** It is three free-text lists and a
budget reconciliation — no owners, no statuses, nothing to move. So rather than
a board with nothing on it, the wrap-up gained **follow-up actions**: what the
debrief decided to do, with an owner and a due date. That is the half of a retro
that normally evaporates. Those actions flow into My Work and into the weekly
reminder like any other milestone — and deliberately from *every* event,
including completed ones, because a follow-up outlives its event by definition.

Follow-ups are future work by nature — pay the balance, ship the cheque, return
the hire gear — so they are created **dated two weeks out** rather than blank.
The reminder is built entirely from dates, so an undated action is chased by
nobody while looking identical in the app to one that is properly scheduled.
Where a date is cleared anyway, the row says *no date — nobody will be
reminded*, and Preview Monday counts undated open work beside the unowned and
the assigned-to-nobody-real. All three are the same failure: work that looks
tracked and reaches no inbox.

No drag-and-drop. HTML5 drag does not work on touch at all, and a library that
does costs ~40KB for a gesture nobody can use one-handed at a venue. Tapping the
status chip advances it exactly as the list does; the chevron beside it opens a
menu to jump straight to a lane.

On a phone the lanes snap-scroll sideways one at a time, lane headers stick while
you scroll a long one, and the board scrolls itself into view when you switch to
it — otherwise you tap Board below a tall header and the screen appears not to
change. Cards are text, not form controls: rendering four inputs per card made
each one 350px tall and clipped the milestone name inside a one-line box, which
on a board is the thing you are reading. Editing the fields stays in the list.

### 3h. Food stalls and menus, out of the workbook — *6 Oct 2026*

India Mela's food operation lived in two sheets that had to be read side by
side: **Food Vendors 2026** (who is coming, and how far through the paperwork
they are) and **Food Menu2026** (what each sells, laid out as eight pairs of
columns across the page). The question asked at every committee meeting — "is
anyone else selling that" — could only be answered by eye.

A **Food Stalls & Menu** tab now holds both, with each stall's menu under the
stall. 24 stalls and 82 items came across. The two sheets named the same stalls
differently — the vendor tab by organisation (`UTS`), the menu tab by trading
name (`UTS - Chennai Express`) — so both names are kept rather than one being
discarded. Three rows at the bottom of the vendor tab had their columns shifted
one to the left, putting an email address in the Contact column; they are
carried across corrected, and two of them read like business vendors rather
than food stalls, which is for the committee to confirm.

**Duplicate detection** flags a dish already offered elsewhere: red for the same
dish at another stall, amber for a near-match worth a look. The threshold is
0.90 rather than 0.85 because at 0.85 the real menu pairs "Masala Mor" with
"Masala Corn" — buttermilk and sweetcorn — while the pair actually worth
catching, "Aloo Bonda" and "Aaloo Bonda", scores 0.95. A false flag on every
screen teaches people to ignore the flags.

Testing the matcher against the real menu caught a bug that reading it would
not have: stripping digits and bracketed contents collapsed GTA's four combos
to the single word "combo", so they flagged each other. Digits and parentheses
are kept; square-bracket piece counts are not.

Every column with a fixed set of values is a dropdown (vendor type, status) or
a checkbox (the eight paperwork steps), because free text in a column that only
ever holds five values is how "Reg Org", "reg org" and "Registered Org" end up
meaning the same thing and sorting differently. Mobile numbers were in neither
sheet: the column exists and is empty.

Like artists, the tab is off unless an event sells food.

### 4. No cross-event view — *first version shipped 1 Oct 2026*

Tasks could be filtered by owner *within* one event. There was no way to ask
"what is Pavithra responsible for across all fifteen events" or "what is due
this week" — which is the chair's actual job.

A **My Work** view now answers this, and since 6 Oct the status pill there is
the control, not a label: filter to your own name and work down the list,
ticking things off without opening each event. It writes back to whichever
record the row came from — a milestone's checklist or a wrap-up's follow-ups —
through the same save path as tapping it inside the event, and the cycle itself
is now defined once in `events.js` rather than copied into each surface. Still
to come: tying it to the signed-in
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
| ~~Notifications and weekly digests~~ ✅ | Converts a record into a system that drives work |
| ~~Assignees linked to committee accounts~~ ✅ | Gives a task an address, not just a name |
| ~~Per-person weekly reminders~~ ✅ | Makes the reminder somebody's, not everybody's |

### Next

- **Backfill the owners.** Thirty-one overdue milestones have nobody on them,
  so today the per-person run would send **nobody** anything and only the admin
  overview would go out. The picker makes assigning them quick, but somebody has
  to do it once, and until then the feature is inert.
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
