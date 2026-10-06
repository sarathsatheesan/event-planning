#!/usr/bin/env bash
# Publishes the EventOps app to https://github.com/sarathsatheesan/event-planning
#
#   cd ~/Event\ Planning/eventops
#   bash push-to-github.sh
#
# Safe to re-run. It never force-pushes and never touches your source files.

set -euo pipefail

# The username is part of the URL on purpose. This Mac has two GitHub accounts
# in its keychain — itbeginsfromutah (the eNoVo business account, which owns the
# enovoapp org) and sarathsatheesan (personal, which owns THIS repo). Without a
# username git asks the keychain for "a github.com credential" and gets the
# business one, which has no access here: "Permission denied to
# itbeginsfromutah", 403. With it, each account gets its own keychain entry and
# both keep working.
REMOTE_URL="https://sarathsatheesan@github.com/sarathsatheesan/event-planning.git"
BRANCH="main"

cd "$(dirname "$0")"

if [ ! -f package.json ] || [ ! -d src ]; then
  echo "error: run this from the eventops folder (no package.json/src here)." >&2
  exit 1
fi

echo "==> Working in: $(pwd)"

# The Claude desktop bridge cannot delete files, so it may have left stale git
# lock files and a half-finished rebase behind. Your shell can clear them.
if [ -d .git ]; then
  rm -f .git/index.lock .git/HEAD.lock .git/objects/maintenance.lock
  # The bridge can only move a lock aside, never delete it, so it parks them here.
  rm -rf .git/_stale
  rm -rf .git/rebase-merge .git/rebase-apply
  find .git/objects -name 'tmp_obj_*' -delete 2>/dev/null || true
  echo "==> Cleared any stale git locks"
fi

if [ ! -d .git ]; then
  git init -b "$BRANCH"
fi

# Use your existing global git identity; fall back only if none is set.
if ! git config user.email >/dev/null 2>&1 && ! git config --global user.email >/dev/null 2>&1; then
  git config user.name "Sarath Satheesan"
  git config user.email "sarath.s1884@gmail.com"
fi

git checkout -q -B "$BRANCH"

if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "$REMOTE_URL"
else
  git remote add origin "$REMOTE_URL"
fi
echo "==> Remote: $(git remote get-url origin)"

git add -A
if ! git diff --cached --quiet || ! git rev-parse HEAD >/dev/null 2>&1; then
  git commit -m "EventOps: annual event operations hub

React 19 + Vite + Tailwind v4 app with a master event calendar and four
per-event phases: pre-event checklist, day-of command center, vendor
directory, and post-event wrap-up.

Adds GitHub Pages deployment via Actions, a repo-aware Vite base path,
a favicon, and a readiness-gauge label fix at 100%."
  echo "==> Committed"
else
  echo "==> Nothing new to commit"
fi

# The repo already has a stub "Initial commit" with a one-line README.
# Replay our work on top of it, keeping our README if they collide.
echo "==> Fetching origin/$BRANCH"
git fetch origin "$BRANCH"

if git rev-parse --verify -q "origin/$BRANCH" >/dev/null; then
  echo "==> Rebasing onto origin/$BRANCH (our README wins any conflict)"
  git rebase -X theirs "origin/$BRANCH"
fi

echo "==> Pushing"
git push -u origin "$BRANCH"

cat <<'DONE'

Pushed.

Last step — turn Pages on (one time only):
  1. https://github.com/sarathsatheesan/event-planning/settings/pages
  2. Build and deployment -> Source -> "GitHub Actions"

The deploy workflow then runs on this push and every push after it.
Watch it: https://github.com/sarathsatheesan/event-planning/actions
Live at:  https://sarathsatheesan.github.io/event-planning/
DONE
