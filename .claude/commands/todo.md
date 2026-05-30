Read the conversation so far and identify the current plan — the set of tasks, steps, or action items that were agreed upon or laid out this session.

Then:

1. Read `docs/session-todo.md` at the project root (create it if it doesn't exist).
2. Check `git log --oneline -20` to see what has been committed this session.
3. Build the "This Session" section:
   - List each plan item as a markdown checkbox: `- [ ] item`
   - If a plan item appears completed based on git commit messages or the conversation (e.g., it was implemented, merged, or explicitly marked done), render it with strikethrough instead: `- [x] ~~item~~`
   - Preserve any items already struck through in the existing "This Session" section.
4. Replace the existing "This Session" section in `docs/session-todo.md` (or insert it after the `# Chew's Meridian TODO` header if the section doesn't exist yet) with the updated version.
5. Leave all other sections in `docs/session-todo.md` untouched.

Keep item descriptions concise (one line each). Do not add commentary or explanations — just the updated file.
