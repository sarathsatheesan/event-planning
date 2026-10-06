# EventOps — handoff

India Cultural Center of Utah · last updated 6 October 2026 · `main`

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

## Where the data lives

- **Org** — every event has one (`ICC` or `Temple`, from `ORGS` in
  `src/data/events.js`). Records without the field read as `ICC` via the default
  in `applyOverrides`; there is no migration script and none is needed. To add a
  third organisation, add it to `ORGS` — the filter builds itself from the data
  plus that list.
- **Events** — `src/data/events.js` is immutable seed. Edits layer on top as
  `eventOverrides/{eventId}` in Firestore. An override whose id is *not* in the
  seed and that carries a name and date **is** a user-created event; see
  `applyOverrides` in `src/data/storage.js`.
- **Committee roster** — `config/committee` in Firestore: `emails`, `admins`
  (flat lower-case lists the security rules read) and `members` (for the UI).
  Managed in-app via the **Committee** button. No longer in source.
- **Artist files** — Cloud Storage under `artistPosters/` and `artistBios/`.
- **Food stalls** — `event.foodVendors[]`, each with a nested `menu[]`. Gated by
  `event.needsFoodStalls`, like artists. India Mela's 24 stalls and 82 items are
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
- **Sponsors** — `event.sponsors[]`, on **every** event rather than gated by a
  flag like artists and food stalls. India Mela's 77 are seeded in
  `src/data/sponsors.js`, from the workbook's *2026 Sponsors* tab. Absent on
  records written before 6 Oct 2026; read it as `event.sponsors ?? []`, which
  `applyOverrides` already does.
  The sheet's columns had drifted from its own headers and the seed is not a
  straight copy — *Contacted* held who made the approach (now the single person
  column, **Temple POC**, on the roster dropdown), *Temple POC* held the
  outcome (now **Response**), and the four agreed sponsors had tier, amount and
  payment note each one column to the left. Every correction is written into
  that file's header. If the committee disputes one, the header is the record
  of what was changed and why.
  `Category` is a new column with no counterpart in the sheet and is blank on
  all 77 rows on purpose.
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

`npm test` at the repo root covers the calendar filters, the org backfill and
the menu-duplicate matcher; `npm test` in `functions/` covers the digests and
runs against the **immutable seed**, not Firestore — neither can see owners
assigned in the app, which is what **Preview Monday** is for.

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
14. **Three allowlists used to exist** (config, Firestore rules, Storage rules).
   Now one Firestore document. What remains in source is the permanent owner
   `utahindiacc@gmail.com` — hardcoded in both rule files so the committee can
   never lock itself out — and a pre-roster fallback.

## How this codebase gets tested

No test framework. Two approaches, both worth continuing:

- **Pure logic in Node.** `functions/digest.test.mjs` runs the digest against
  the real calendar at several dates; `functions/mailer.test.mjs` checks message
  shape and that the password cannot leak into anything loggable. `npm test` in
  `functions/`.
- **UI driven headless.** Build with the Firebase `apiKey` blanked so the app
  falls into local mode and the editable path is reachable without network, then
  drive it with Playwright. This is how the read-only gating, the person picker's
  tolerance of legacy names, and the committee dialog's guards were verified.

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
- **Sponsors are not in the PDF export.** The export's section picker has no
  entry for them, so a committee meeting handout leaves the sponsor pipeline
  out. Nobody has asked for it yet.
- **A scanned PDF menu cannot be read** and the dialog says so rather than
  importing nothing silently. OCR would fix it and is not worth the weight;
  the answer is to ask the vendor for a spreadsheet.
- **The food-stall paperwork checkboxes render as disabled inputs** for a
  signed-out visitor, where every other field renders as text. 192 dead
  controls on India Mela's tab. Pre-dates the food work and is cosmetic, but it
  is the one place the read-only rule is not kept.
- **Per-organisation permissions.** Events carry an org (ICC / Temple) but
  access does not distinguish them: every committee member can edit both.
