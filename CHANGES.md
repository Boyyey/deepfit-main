# Workspace and Assistant Updates

## Artifact management
- Move workout drafts into the artifact panel context so they persist independently of chat messages.
- Normalise artifacts (IDs, names, metadata) and keep conversations in sync for localStorage persistence.
- Add debug logging for create/update/delete flows to help validate action tokens.

## Workout workspace UI
- Rebuild the workspace panel with a manual toggle, empty state, and slide-in/out animations.
- Collapse validation actions after saving a workout and keep a confirmation banner visible.
- Show conversation titles and fallback information when viewing drafts from other threads.

## Assistant changes
- Provide Gemini with a workspace summary only when workouts change, so it has IDs for updates or deletes without bloating every request.
- Seed cached summaries and workspace state when loading existing conversations.
- Update the README with project overview, token format, and development instructions.
