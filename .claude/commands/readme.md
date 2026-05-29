You are updating README.md at the project root. Do NOT do a full rewrite — append new changelog entries, correct stale content in place, and bump the version in the heading.

**Versioning rule:** each merged PR = +0.1 version bump. The current version is shown in the `# Chew's Meridian · vX.X` heading.

**Step 1 — Read current state**
Read the following:
- `README.md` — note the current version and the last changelog entry
- `CLAUDE.md` — authoritative list of current features and architecture
- `ARCHITECTURE.md` — for the tech stack table

**Step 2 — Check git log for unreleased work**
Run: `git log --oneline --merges`
Find all merged PRs with commit messages not yet in the changelog. For each missing PR, identify what it introduced from the commit message and nearby non-merge commits.

**Step 3 — Draft new changelog entries**
For each unreleased PR (oldest first), write a `### vX.X` entry with:
- A `[vX.X](PR URL)` link if the PR number is in the merge commit message
- 3–5 bullet points describing user-visible changes
- Use past tense, feature-first language ("Added X", "Fixed Y")
- Do not describe implementation details unless they are architecturally significant

Also note any unreleased commits on `main` that are not from a PR — these are in-flight and can be grouped into the next version entry without a PR link.

**Step 4 — Check for stale content**
- **Environment variables:** compare `README.md` env var list against `.env.local` structure described in `CLAUDE.md`. Add missing vars, remove deleted ones.
- **Tech stack table:** update any changed versions or new libraries.
- **What's Next:** check if any listed items have been completed. Remove completed items and add new ones from open issues or `CLAUDE.md` notes.
- **Architecture section:** README has a condensed architecture summary. If major new products or flows were added, update the summary diagram. The link to `ARCHITECTURE.md` already exists — do not duplicate deep detail.

**Step 5 — Update version heading**
Change `# Chew's Meridian · vX.X` to the new version after counting PRs.

**Step 6 — Apply all changes**
Append changelog entries at the top of the `## Changelog` section (newest first). Apply in-place edits to stale sections. Show the user a brief summary of what changed before writing.
