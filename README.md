# Tom AI Coach

Tom AI Coach is a web application that lets users chat with an AI strength coach, request structured workouts, and manage drafts through an interactive workspace. The front end is built with React and Vite, backed by Netlify serverless functions that call Google's Gemini models.

## Features
- **Conversational coaching** – Chat with Tom to request routines, revisions, or general fitness guidance. Responses reference stored profile data when available.
- **Structured workouts** – Workouts are emitted as JSON payloads inside action tokens (`CREATE_WORKOUT`, `UPDATE_WORKOUT`, `DELETE_WORKOUT`). The client parses these tokens and stores each draft. (;)
- **Workout Workspace** – A slide-in panel shows every draft for the current or any previous conversation. Users can rename workouts, mark favourites, save them to their library, or delete drafts without leaving the chat.
- **Persistence** – Conversation history and workouts are synchronised to `localStorage`, so drafts survive page reloads and can be reopened later.
- **Profile-aware context** – When a user profile exists, it is injected into the system prompt so the assistant can tailor recommendations.

## Project Structure
- `src/AIChatAssistant.jsx` – Main chat component that orchestrates conversations, handles Gemini responses, and triggers workspace updates.
- `src/context/ArtifactPanelContext.jsx` – Manages workout artifacts per conversation, panel state, and exposes helper actions for the workspace UI.
- `src/components/workout/WorkoutArtifactPanel.jsx` – Slide-in panel that renders drafts, validation controls, and conversation history.
- `netlify/functions/ai-chat.js` – Serverless function that calls Gemini, builds the system prompt, and returns raw model text.
- `src/WorkoutContext.jsx` – Handles saved workouts, active sessions, and persistence to `localStorage`.

## Action Tokens
The AI must wrap structured data in explicit tokens. The front end parses these and feeds the data into the artifact store.

```text
[[CREATE_WORKOUT]]
{
  "id": "workout-unique-id",
  "name": "Workout Name",
  "description": "Short summary",
  "exercises": [
    {
      "name": "Exercise",
      "sets": [
        { "reps": 8, "weight": 60, "type": "normal" }
      ]
    }
  ]
}
[[/CREATE_WORKOUT]]
```

`UPDATE_WORKOUT` and `DELETE_WORKOUT` follow the same wrapping convention and must reference the original `id`.

## Getting Started
1. Install dependencies:
   ```bash
   npm install
   ```
2. Run the development server (includes Netlify dev functions):
   ```bash
   npm run dev
   ```
3. Build for production:
   ```bash
   npm run build
   ```

You'll need a valid `GEMINI_API_KEY` in the environment for the Netlify function to call Gemini. The dev server expects it in `.env` or your shell environment.

## Development Notes
- Artifacts are stored in `ArtifactPanelContext`; conversations only keep a serialised copy for persistence.
- The workspace can be opened even if the active conversation has no new workouts—it falls back to the latest conversation with drafts.
- Animations are powered by `framer-motion` to slide the workspace and fade the overlay.
- When saving a workout to the library, the validation controls collapse to avoid duplicate submissions.

## License
This project is provided as-is for personal and educational use.
