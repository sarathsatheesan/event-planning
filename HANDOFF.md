# EventOps — handoff

India Cultural Center of Utah · last updated 10 October 2026 · `main`

<!-- No commit hash here on purpose: this file is edited in the same commit it
     would name, so any hash written above is wrong the moment it is committed.
     Use `git log -1 --format=%h -- HANDOFF.md` for the commit that last
     touched it. -->

Operational state and the things that cost time to learn. Product direction and
the ranked gap list live in [ROADMAP.md](./ROADMAP.md); this file is for
whoever has to run, deploy or debug the thing.

---

## After every change — three things, not one

A shipped change is not finished when it is committed. Three records go stale
otherwise, and each of them is read by someone who was not in the room:

1. **This file.** Anything that changed where data lives, how something
   deploys, or that cost time to work out. New gotchas go in the gotchas
   section with what the symptom looked like, not just the fix.
2. **The project memory** — the `Event Planning` project doc
   `claude/eventops-handoff.md`, which is this file's content. Overwrite it
   with the updated HANDOFF.md rather than hand-editing a second copy; two
   drifting versions are worse than one stale one.
3. **The status dashboard** — `eNoVo_Feature_Dashboard/index.html`, the
   `"EventOps"` entry in the `PRODUCTS` registry. Add or flip the feature rows
   (`features`), add a dated `calendar` entry for anything a reader would call
   a milestone, and refresh `EVENTOPS_CODEBASE` line counts and the tagline.
   Feature text is **escaped** when rendered — write real `’ “ ” —`
   characters, never HTML entities, which is the opposite of `lede`, `meta`
   and `footer` on the same object. Check any new `MODULE_ICONS` name actually
   exists in that page's lucide build: a missing one renders as blank space,
   and the way to find it is to query the DOM for `[data-lucide]` elements with
   no child `<svg>`.

The deploy itself (`./push-to-github.sh`, then `firebase deploy --only
functions` if `functions/` changed) comes after all three.

---

## What is live and where

| | |
| --- | --- |
| App | <https://icceventops.web.app> |
| Old GitHub Pages site | `sarathsatheesan.github.io/event-planning` — **deliberately frozen**, do not revive. Its workflow was deleted; it serves its last good build. |
| Repo | `sarathsatheesan/event-planning`, branch `main` |
| Firebase project | `event-planning-de705` (Blaze), owned by `utahindiacc@gmail.com` |
| Hosting deploys | **Automatic.** Push to `main` → GitHub Actions → Firebase Hosting (~1 min) |
| Function deploys | **Manual.** `firebase deploy --only functions`. Not in CI. |
| Rules deploys | **Manual.** `firebase deploy --only firestore:rules,storage` |

## Tab names

One list in `EventDetail.jsx` names the tabs; nothing per-event stores a name,
so a change there reaches every event including newly created ones with no
migration. Two rules the committee asked for and that are easy to undo by
accident:

- **No phase numbers.** The four stages are *Pre-Event Planning*, *Day-Of
  Command Center*, *Vendor & Resource Directory* and *Post-Event Wrap-Up* — the
  "Phase 1–4" prefixes came off on 7 Oct 2026, from the PDF and the export
  picker as well as the tab strip, so the printout says what the app says.
- **The food tab has two names.** *Food Stalls & Menu* on India Mela, plain
  *Menu* everywhere else, both driven by `event.needsFoodStalls`.

## Where the data lives

- **Org** — every event has one (`ICC` or `Temple`, from `ORGS` in
  `src/data/events.js`). Records without the field read as `ICC` via the default
  in `applyOverrides`; there is no migration script and none is needed. To add a
  third organisation, add it to `ORGS` — the filter builds itself from the data
  plus that list.
- **Committee** — every event has one (`COMMITTEES` in `src/data/events.js`,
  ids lower-case and stable, labels shown). Records without the field read as
  `cultural` through the same default in `applyOverrides` that backfills org,
  so there is nothing to run. Editable in the event header beside org, chosen
  when an event is created, and inherited when a previous event is used as a
  template. **Committee is not a second org**: org answers whose event it is,
  committee answers who runs it, and they cross — the kitchen cooks at both ICC
  and temple events. `filters.js` treats them as two independent axes and
  `filters.test.mjs` has the case that proves it.
- **Events** — `src/data/events.js` is immutable seed. Edits layer on top as
  `eventOverrides/{eventId}` in Firestore. An override whose id is *not* in the
  seed and that carries a name and date **is** a user-created event; see
  `applyOverrides` in `src/data/storage.js`.
- **Committee roster** — `config/committee` in Firestore: `emails`, `admins`
  (flat lower-case lists the security rules read) and `members` (for the UI).
  Managed in-app via the **Committee** button. No longer in source.
  Each `members[]` entry now also carries `committees` — an array of ids from
  `COMMITTEES` in `src/data/events.js`, set by an admin with the chips on each
  member row. Read it with `committeeIdsOf()` in `src/lib/committee.js`, which
  accepts both an array and a map so a later move to per-committee roles
  (`{ kitchen: 'manager' }`) is not a migration. **Nothing filters on it yet**:
  an untagged member behaves exactly as they did before, which is what makes it
  safe to fill the list in over weeks. `emails` and `admins` are untouched by
  this — they are the two lists the security rules read, so a committee tag can
  never cost anyone their access.
- **Artist files** — Cloud Storage under `artistPosters/` and `artistBios/`.
- **Food stalls** — `event.foodVendors[]`, each with a nested `menu[]`. Gated by
  `event.needsFoodStalls`, like artists. That same flag now also picks the
  **shape** of the tab: India Mela has it and gets the full thing, called
  *Food Stalls & Menu*; every other event gets a tab called *Menu* showing
  stall, trading name, contact, mobile, email and the menu, with the type,
  confirmation status, special requests, the eight paperwork checkboxes and
  the status filters not rendered (`simple` prop on `FoodStalls`). The fields
  are hidden, not dropped — anything already entered survives, so turning
  `needsFoodStalls` on for an event restores the full view with its data. India Mela's 24 stalls and 82 items are
  seeded in `src/data/melaFood.js`, consolidated from the committee's workbook
  (tabs *Food Vendors 2026* and *Food Menu2026*). Duplicate detection lives in
  `src/lib/menu.js` and is tested against that real menu; the three tints it
  drives are in `src/lib/clashTone.js`, shared so the stall list and the menu
  board cannot disagree about what red means.
  `specialRequests` was added 6 Oct 2026 and is absent on records written
  before it — read it as `vendor.specialRequests ?? ''`. Neither workbook tab
  had such a column; the only request it records came off the *2026 Food Stall
  ICC Prep Work* sheet, and only The Melting Mango's survived into a stall.
  Menus can be imported rather than typed: `src/lib/menuImport.js` is the pure
  parser (text or a grid of cells in, candidate dishes out) and
  `src/lib/menuFiles.js` the three file shells. `read-excel-file` and
  `pdfjs-dist` are **dynamically imported**, so they are separate chunks
  (45KB and 431KB) that a visitor opening the calendar never downloads — keep
  them that way. Two upgrade traps are written into the code comments: since
  read-excel-file v9 the default export returns every sheet, so the call is
  `readSheet`, and in pdfjs v6 `destroy` lives on the loading task, not the
  document proxy.
  `BAPS` was retired from the type list and Aroma's value cleared,
  but `InlineSelect` would silently blank any value the list no longer offers,
  so `FoodStalls` appends an unknown stored type back onto the options rather
  than letting the next save eat it. Keep that guard if the list changes again.
- **Business vendor booths** — `event.businessVendors[]`, gated by
  `event.needsBusinessVendors`, which is true only for India Mela — strictly,
  with no `|| editable`, so the tab does not appear on the other fourteen at
  all. `blueprint.js` carries the flag and the vendors when an event is created
  from a previous one, which is how next year's Mela gets the tab; status,
  payment, booth and comments reset.
  The 30 rows in `src/data/businessVendors.js` come from **two tables on one
  sheet**: the outreach list (rows 2–22, headings on row 1) and "2026 Business
  Vendor Booths" (rows 55–63, headings on row 54, with tax IDs and services).
  They are kept separate rather than merged — four vendors appear in both by
  email, and Sagar has two booths in the second table, so a blanket merge would
  decide things the committee has not. The seed header names all four.
  Booth Number is a new closed list, 1–25, blank on every row; a vendor on the
  same booth as another is counted in the summary and tinted.
- **Sponsors** — `event.sponsors[]`, on **every** event rather than gated by a
  flag like artists and food stalls. India Mela's 77 are seeded in
  `src/data/sponsors.js`, from the workbook's *2026 Sponsors* tab.
  **Every event starts from the same 77.** The shell and the read-time default
  both point at `sponsorProspects` — `melaSponsors` with the outcomes stripped,
  names only. The list belongs to the ICC; who approached them, what they
  pledged and whether it arrived belong to one event, and showing the Mela's
  $8,250 as received on Republic Day would put the same money on twelve pages.
  India Mela overrides the default with the full list.
  The fallback in `applyOverrides` is `??`, not `||`, so an event whose list is
  deliberately cleared stays cleared rather than refilling on the next load.
  `sponsorProspects` is frozen because all fifteen events share the one array.
  One consequence worth knowing: editing a single sponsor on an event writes
  all 77 into that event's override document — about 20KB, well inside
  Firestore's 1MB limit, but it is why there are fifteen copies of the list
  rather than one shared document. A real sponsor directory with per-event
  outreach pointing at it is the shape to move to if this gets heavier.
  The sheet's columns had drifted from its own headers and the seed is not a
  straight copy — *Contacted* held who made the approach (now the single person
  column, **Temple POC**, on the roster dropdown), *Temple POC* held the
  outcome (now **Response**), and the four agreed sponsors had tier, amount and
  payment note each one column to the left. Every correction is written into
  that file's header. If the committee disputes one, the header is the record
  of what was changed and why.
  `Category` is a new column with no counterpart in the sheet and is blank on
  all 77 rows on purpose.
  **Whether a sponsor has paid is derived, not stored** — `isPaid()` in
  `src/data/sponsors.js` reads "Paid by" or "Paid on". The workbook's separate
  *Payment Rcvd* column carried nothing the mode did not: in the 2023 sheet the
  two were filled together on every row and never apart, and the date column
  was never filled at all. A stored flag could only ever agree with those two
  or contradict them. `isPaid` still reads a legacy `paymentReceived` as a last
  term, so a tick made before this changed is honoured.
- **Who owns a task** — `assignees: [{ name, email }]` on milestones and
  wrap-up follow-ups, read through `assigneesOf()` in `src/data/assignees.js`.
  It lives in `src/data` rather than `src/lib` because `copy-seed.mjs` stages
  that directory into `functions/`, and the digest needs the same definition
  the app uses. The old `assignee` / `assigneeEmail` scalars are **mirrored**
  from the first owner, not dropped: hosting deploys itself on push and
  functions never do, so there is always a window where a new client writes
  records an old digest has to read. The mirror makes that window cost the
  second and third owner a reminder instead of costing the first one too. The
  weekly digest emits **one row per owner** — three people on one job is three
  people who owe it — while **My Work shows one row per task**, because the
  same job listed three times reads as three jobs.
  `PeopleField` replaced `PersonField` wherever work can be shared.
  `PersonField` deliberately stays for the event lead, a sponsor's Temple POC
  and a run-of-show slot: those are one person by nature.
- **Wrap-up follow-ups** — `event.retro.actions[]`, shape
  `{id, action, assignee, assigneeEmail, due, status}`. Absent on every wrap-up
  written before 6 Oct 2026; read it as `retro.actions ?? []`. The digest and
  My Work pull these from **every** event including completed ones, unlike
  milestones — a follow-up outlives its event.
- **Mail password** — Secret Manager secret `SMTP_PASSWORD` (version 4 as of
  this writing). Never in the repo.
- **Mail sender config** — `functions/.env`, committed on purpose. It holds the
  from-address, which is printed on every email anyway.

## The three functions

All 2nd gen, Node 22, `us-central1` — the client calls that region explicitly,
so a region change needs the client updated or calls 404.

- `weeklyDigest` — Cloud Scheduler, `0 8 * * 1` **America/Denver**. Sends
  **one email per committee member** containing only their own overdue and
  due-within-7-days milestones, grouped by event; then **one shared overview to
  admins** (grouped by owner, plus events within 14 days). A member with nothing
  due gets nothing. Both are `buildDigest` — the personal one with `forPerson`.
- `sendDigestNow` — callable, admin-only, from **My work → Email the
  committee**. Still the **shared** list to the whole roster, which is what that
  button is for. Two-minute cooldown.
- `previewMondayReminders` — callable, admin-only, from **My work → Preview
  Monday**. Returns exactly what the schedule would send, from live Firestore
  data, and **binds no secret**, so it has no SMTP password and cannot send. Use
  it instead of a Force run when the question is "who would get this".

Wrap-up follow-ups (`event.retro.actions[]`) are chased alongside milestones and
come from **every** event including completed ones — a follow-up outlives its
event.

Digest windows: **7 days** forward for tasks, **14 days** for events,
**unbounded** backwards for overdue, **12 rows** shown per section. Completed
events excluded unless the manual send asks for "Everything".

The shared overview goes **to** the ICC inbox with the committee **bcc'd** —
not thirty addresses in the To line. A personal reminder goes straight **to**
that one person with `replyTo` on the ICC inbox and nobody copied.

Both test suites run against the **immutable seed**, not Firestore, so neither
can see owners assigned in the app — which is what **Preview Monday** is for.
See *How this codebase gets tested* for what each one covers.

A partially failed weekly run is **not** retried: the schedule throws only when
every send failed. Retrying a partial run would re-send to everyone who already
got theirs, and a duplicate reminder costs more trust than a missed one. Failed
addresses are in the logs — search `Reminder send failed`.

---

## Gotchas that cost real time

1. **Clear the git locks before any git command.** The desktop bridge cannot
   delete files, so lock files accumulate and block every subsequent git
   operation. This bites constantly. From a Claude session, where `rm` fails
   outright, move them aside instead:

   ```sh
   cd .git && mkdir -p _stale
   for f in HEAD.lock index.lock objects/maintenance.lock; do
     [ -e "$f" ] && mv "$f" "_stale/$(basename $f).$(date +%s%N)"
   done
   ```

   It is not only `index.lock` — `HEAD.lock` and `objects/maintenance.lock`
   appear too, and each fails with a different message, so clear all three
   rather than chasing them one at a time. `push-to-github.sh` already does
   `rm -rf .git/_stale` on every run. The `unable to unlink ... Operation not
   permitted` warnings that follow a successful command are noise; confirm with
   `git log --oneline -1`.
2. **`sr-only` inside a horizontally scrolling strip drags the whole page
   sideways.** `sr-only` is `position: absolute`, so with no positioned
   ancestor its containing block is the page. A lane sitting 8,000px along the
   menu board put its remove buttons' hidden labels 8,000px along the
   *document*, and the page scrolled: the header slid away and left white
   space. Every lane measured the right width and `document.body.scrollWidth`
   stayed at 390, which is why it took a while to find — only
   `document.documentElement.scrollWidth` showed it. Any lane, card or row
   that holds a `RemoveButton` needs `relative` on it.
3. **Never run `npm audit fix --force` here.** npm's "fix" for the
   `@grpc/grpc-js` advisories is to **downgrade firebase from 12.x to 9.14**,
   which is three major versions back and would break the whole app. Plain
   `npm audit fix` is safe and is what cleared the dompurify and source-map-js
   advisories; it leaves four grpc findings standing. Those four are inert
   here: `@grpc/grpc-js` only ships in Firestore's **Node** path, and the
   browser bundle talks to Firestore over WebChannel, so the code the
   advisories describe is never loaded. They clear when Firebase ships a
   release carrying grpc-js > 1.13.5. Do not chase them.
4. **A bridge file write can report success and not land.** `device_commit_files`
   returned the path under `written`, and the file on disk was still the old
   one — `git status` then showed a clean tree and the change was simply
   missing. Re-sending the same file worked. After committing files through
   the bridge, check the content arrived (`wc -l`, or grep for a string only
   the new version has) before trusting a clean `git status`.
5. **The mount drops the executable bit.** `./push-to-github.sh` fails with
   `Permission denied` after a session has touched the folder. `bash
   push-to-github.sh` always works; `chmod +x` plus
   `git update-index --chmod=+x` fixes it for the next clone.
6. **This Mac has two GitHub accounts, and git picks the wrong one.**
   `itbeginsfromutah` is the eNoVo business account (owns the `enovoapp` org);
   `sarathsatheesan` is personal and owns **this** repo. Asked for "a
   github.com credential" the keychain returns the business one, and the push
   fails with `Permission to sarathsatheesan/event-planning.git denied to
   itbeginsfromutah` — a 403, not an auth prompt, so it looks like a permissions
   bug rather than a wrong-account bug. The fix is the username in the remote
   URL (`https://sarathsatheesan@github.com/...`), which gives each account its
   own keychain entry; `push-to-github.sh` now sets it that way. Do **not**
   `git credential-osxkeychain erase` — that logs you out of the business
   account too. To check which account is cached:
   `security find-internet-password -s github.com | grep acct`.
7. **`cd "~/Event Planning/eventops"` does not work** — `~` is not expanded
   inside quotes. Use `cd ~/"Event Planning/eventops"`.
8. **Hosting header globs match the path the browser requested**, before any
   rewrite. A rule on `/index.html` never matches a visit to `/`, so the
   no-cache header silently did nothing and deploys appeared not to land for up
   to an hour. Both paths are listed now. If "my change isn't live" ever
   returns, check the live `Cache-Control` header before blaming the browser.
9. **`firebase functions:secrets:destroy KEY` with no `@version` destroys the
   latest version.** Always name the version.
10. **`functions:secrets:prune` diffs against *deployed* functions.** With
   nothing deployed it considers every version unused, including the current
   one. Deploy first, prune after.
11. **Cloud Run creation fails with a generic "internal error" if APIs were
   enabled in the same run.** Wait a few minutes and re-run; it is propagation,
   not a real failure.
12. **Pushing anything under `.github/workflows/` needs the `workflow` scope** on
   the PAT, or GitHub refuses the push.
13. **Firebase Extensions shuts down 31 March 2027.** Do not adopt one. Mail is
   sent directly from the function with nodemailer for this reason.
14. **`functions/seed/` must carry every module `events.js` imports.**
   Symptom: `cd functions && npm test` dies with `ERR_MODULE_NOT_FOUND` for
   `functions/seed/melaFood.js`, and a deployed `weeklyDigest` would throw on
   import for the same reason. `copy-seed.mjs` staged only `events.js`,
   `template.js` and `storage.js`, but `events.js` imports `melaFood.js`,
   `sponsors.js` and `businessVendors.js` — it has since the Food Stalls tab
   landed. All six are listed now. If events.js ever imports something new,
   add it there too, and run `npm test` in `functions/` to prove it.
15. **`npm run build` cannot run through the device bridge.** Symptom:
   `Cannot find native binding ... @rolldown/binding-linux-arm64-gnu`. The
   `node_modules` in the repo was installed on macOS, and the bridge's shell is
   a Linux VM, so the bundler's native binary is the wrong platform. `npm test`
   is unaffected (pure Node). To verify a build from a session, clone the repo
   in the cloud container, copy the changed files over, and `npm install &&
   npm run build` there — the repo is public, so the clone needs no credential.
   Do not run `npm install` in the mounted folder: it would replace the Mac's
   binaries with Linux ones and break the build on the laptop.
16. **`filters.test.mjs` and `digest.test.mjs` both end in `process.exit`, so
   anything appended after it never runs.** Symptom: a new block of checks prints nothing and the suite
   still says ALL PASS — the worst kind of green, because it looks like
   coverage. New checks go *above* the two summary lines at the bottom. Worth
   reading the output and counting, not just trusting the exit code.
17. **Three allowlists used to exist** (config, Firestore rules, Storage rules).
   Now one Firestore document. What remains in source is the permanent owner
   `utahindiacc@gmail.com` — hardcoded in both rule files so the committee can
   never lock itself out — and a pre-roster fallback.

## How this codebase gets tested

No test framework. Two approaches, both worth continuing:

- **Pure logic in Node.** Five suites, no framework, ~124 assertions.
  At the repo root, `npm test` runs `src/lib/filters.test.mjs` (calendar
  filters, the org backfill, the sponsor and business-vendor seeds),
  `src/lib/menu.test.mjs` (the duplicate-dish matcher, against the committee's
  real 82-item menu) and `src/lib/menuImport.test.mjs` (the menu parser against
  realistically messy input). In `functions/`, `npm test` runs
  `digest.test.mjs` against the real calendar at several dates and
  `mailer.test.mjs` for message shape and that the password cannot leak into
  anything loggable. **Both** are worth running; the root one does not include
  the functions suites.
- **UI driven headless.** Build with the Firebase `apiKey` blanked so the app
  falls into local mode and the editable path is reachable without network,
  serve it with `vite preview`, then drive it with Playwright
  (`executablePath: '/opt/pw-browsers/chromium'`). Rebuild with the real key to
  check the signed-out read-only view in the same way. This is how the
  read-only gating, the person picker's tolerance of legacy names, the
  committee dialog's guards, the menu importer's four file formats and every
  tab's mobile layout were verified.
- **Look at the output.** The PDF export is checked by downloading it from the
  driven browser and rendering page one with `pdftoppm`, not by asserting on
  the generator. Horizontal overflow is checked by actually scrolling the page
  sideways and reading `window.scrollX` — `document.body.scrollWidth` reported
  390 while the page visibly slid.

Rendering the digest email to an image caught a missing charset declaration that
would have shipped `Â·` to every recipient. Look at output, do not just assert on it.

---

## Open items

Full list in ROADMAP.md. The ones most likely to matter next:

- **31 overdue milestones have no owner**, and whatever **Preview Monday** lists
  under *Assigned to nobody real* — a typed name matching no committee member.
  Until both are cleared the Monday run reaches only admins. This is data entry,
  not code, and it is the single thing standing between the reminder system and
  any effect.
- **Three rows in the Mela food vendor sheet had shifted columns** and two of
  them read like business vendors rather than food stalls. Carried across
  corrected; the committee should confirm whether they belong.
- **Signed-out visitors see seed data, not the real plan**, because the rules
  require membership to read. This makes the Day-Of Command Center unusable by
  the floor volunteers it was designed for. Decision deferred deliberately.
- **No offline support on the day-of view**, which is the one hour the app must
  not fail.
- **Three tabs are missing from the PDF export.** The picker offers artists and
  the four stages only, so a committee handout leaves out the sponsor pipeline,
  the food stalls and their menus, and the business booths — which between them
  are most of what a fundraising or Mela meeting is about. Adding a section is
  `EXPORT_SECTIONS` in `src/lib/exportPdf.js` plus a `startSection` block.
  Nobody has asked yet.
- **A scanned PDF menu cannot be read** and the dialog says so rather than
  importing nothing silently. OCR would fix it and is not worth the weight;
  the answer is to ask the vendor for a spreadsheet.
- **The food-stall paperwork checkboxes render as disabled inputs** for a
  signed-out visitor, where every other field renders as text. 192 dead
  controls — on **India Mela only** now, since the simple *Menu* variant does
  not render them at all. Cosmetic, but it is the one place the read-only rule
  is not kept.
- **Remove the `assignee` / `assigneeEmail` mirror.** Kept only so a digest
  that has not been redeployed still finds an owner on records written by the
  new client. Once `firebase deploy --only functions` has run with
  `src/data/assignees.js` staged, the two scalars are dead weight: drop them
  from `withAssignees()` and from `template.js`, and leave `assigneesOf()`
  reading them so records written before today keep working.
- **Per-organisation permissions.** Events carry an org (ICC / Temple) but
  access does not distinguish them: every committee member can edit both.
- **What an untagged member means, once committees are enforced.** Today a
  member with no `committees` behaves exactly as before, which is correct while
  nothing is hidden. When scoping ships, untagged has to mean either "sees
  everything" (fails open) or "sees nothing" (locks them out). The intended fix
  is a validation rule in `CommitteeDialog`, the same shape as the existing
  "keep at least one admin" guard: refuse to save a member with no committee.
  Not added yet, deliberately — it would block tagging people gradually.
