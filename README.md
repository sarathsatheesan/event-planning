# EventOps — Annual Event Operations Hub

A React + Tailwind CSS implementation of the EventOps PRD: a master calendar of
recurring annual events, per-event Pre-Event Planning checklists, a live
Day-Of Command Center, a Vendor & Resource Directory, and Post-Event Wrap-Up.

## Stack

- React 19 + Vite
- Tailwind CSS v4 (via `@tailwindcss/postcss`)
- Google Fonts: Big Shoulders Display (display), IBM Plex Sans (body), IBM Plex Mono (data/timestamps)

## Run it

```bash
npm install
npm run dev       # local dev server
npm run build     # production build to dist/
npm run preview   # preview the production build
npm run lint      # oxlint
```

## Structure

```
src/
  data/events.js               seed data (4 sample annual events)
  components/
    Dashboard.jsx               Master Hub — annual overview
    EventDetail.jsx             per-event shell + phase tab strip
    ReadinessGauge.jsx          circular readiness indicator
    StatusPill.jsx              status badge
    tabs/
      PreEventPlanning.jsx      Phase 1 — T-90…T-1 checklist, category filters
      DayOfCommandCenter.jsx    Phase 2 — live run of show, single-tap checks
      VendorDirectory.jsx       Phase 3 — vendor/resource contact cards
      PostEventWrapUp.jsx       Phase 4 — reconciliation + retrospective
  index.css                     design tokens (light/dark) + Tailwind
.github/workflows/deploy.yml    GitHub Pages build & deploy
```

All data is local seed data in `src/data/events.js` — swap it for a real API
or database layer to make this production-ready. The "live" event and its
Day-Of clock are anchored to Aug 21, 2026 in `src/App.jsx` (`DEMO_NOW`) for
the demo; wire that to `new Date()` and real event statuses in production.

State changes (advancing a checklist item, ticking off a run-of-show step) live
in component state only and reset on reload — there is no persistence layer yet.

## Deploying to GitHub Pages

The workflow in `.github/workflows/deploy.yml` builds the site and publishes it
on every push to `main`. To turn it on:

1. In the repo, go to **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **GitHub Actions**.
3. Push to `main` (or run the workflow manually from the **Actions** tab).

The site publishes to `https://<user>.github.io/<repo>/`.

### Why the base path matters

GitHub Pages serves a project site from a sub-path, so built asset URLs have to
be prefixed with the repo name. The workflow reads that prefix from
`actions/configure-pages` and passes it to Vite as `BASE_PATH`; `vite.config.js`
applies it only for `build`, so `npm run dev` and `npm run preview` stay at `/`.
If the site later moves to a custom domain or a `<user>.github.io` repo, nothing
needs changing — `base_path` resolves to empty and the base becomes `/`.
