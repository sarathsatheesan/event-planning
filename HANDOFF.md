# EventOps — handoff

India Cultural Center of Utah · last updated 1 October 2026 · HEAD `e776962`

Operational state and the things that cost time to learn. Product direction and
the ranked gap list live in [ROADMAP.md](./ROADMAP.md); this file is for
whoever has to run, deploy or debug the thing.

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

- **Events** — `src/data/events.js` is immutable seed. Edits layer on top as
  `eventOverrides/{eventId}` in Firestore. An override whose id is *not* in the
  seed and that carries a name and date **is** a user-created event; see
  `applyOverrides` in `src/data/storage.js`.
- **Committee roster** — `config/committee` in Firestore: `emails`, `admins`
  (flat lower-case lists the security rules read) and `members` (for the UI).
  Managed in-app via the **Committee** button. No longer in source.
- **Artist files** — Cloud Storage under `artistPosters/` and `artistBios/`.
- **Mail password** — Secret Manager secret `SMTP_PASSWORD` (version 4 as of
  this writing). Never in the repo.
- **Mail sender config** — `functions/.env`, committed on purpose. It holds the
  from-address, which is printed on every email anyway.

## The two functions

Both 2nd gen, Node 22, `us-central1` — the client calls that region explicitly,
so a region change needs the client updated or calls 404.

- `weeklyDigest` — Cloud Scheduler, `0 8 * * 1` **America/Denver**. Overdue and
  due-within-7-days grouped by owner, plus events within 14 days.
- `sendDigestNow` — callable, admin-only, from **My work → Email the
  committee**. Shares `deliverDigest` with the schedule so the manual email
  cannot differ from the automatic one. Two-minute cooldown.

Digest windows: **7 days** forward for tasks, **14 days** for events,
**unbounded** backwards for overdue, **12 rows** shown per section. Completed
events excluded unless the manual send asks for "Everything".

Mail goes **to** the ICC inbox with the committee **bcc'd** — not thirty
addresses in the To line.

---

## Gotchas that cost real time

1. **`rm -f .git/*.lock` before any git command.** The desktop bridge cannot
   delete files, so lock files accumulate and block every subsequent git
   operation. This bites constantly.
2. **`cd "~/Event Planning/eventops"` does not work** — `~` is not expanded
   inside quotes. Use `cd ~/"Event Planning/eventops"`.
3. **Hosting header globs match the path the browser requested**, before any
   rewrite. A rule on `/index.html` never matches a visit to `/`, so the
   no-cache header silently did nothing and deploys appeared not to land for up
   to an hour. Both paths are listed now. If "my change isn't live" ever
   returns, check the live `Cache-Control` header before blaming the browser.
4. **`firebase functions:secrets:destroy KEY` with no `@version` destroys the
   latest version.** Always name the version.
5. **`functions:secrets:prune` diffs against *deployed* functions.** With
   nothing deployed it considers every version unused, including the current
   one. Deploy first, prune after.
6. **Cloud Run creation fails with a generic "internal error" if APIs were
   enabled in the same run.** Wait a few minutes and re-run; it is propagation,
   not a real failure.
7. **Pushing anything under `.github/workflows/` needs the `workflow` scope** on
   the PAT, or GitHub refuses the push.
8. **Firebase Extensions shuts down 31 March 2027.** Do not adopt one. Mail is
   sent directly from the function with nodemailer for this reason.
9. **Three allowlists used to exist** (config, Firestore rules, Storage rules).
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

- **31 overdue milestones have no owner.** The assignee picker makes this quick,
  but somebody has to do the pass once. Until then every digest says
  "Unassigned — 31".
- **Per-person reminders** are unblocked now that milestones carry an owner's
  address, but not built.
- **Signed-out visitors see seed data, not the real plan**, because the rules
  require membership to read. This makes the Day-Of Command Center unusable by
  the floor volunteers it was designed for. Decision deferred deliberately.
- **No offline support on the day-of view**, which is the one hour the app must
  not fail.
