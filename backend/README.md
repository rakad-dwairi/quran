# AI Backend (Genkit + Gemini)

This folder hosts an optional backend used by the mobile app for the **AI Simplified Tafsir** feature.

## Setup

1) Create a Gemini API key (Google AI Studio) and set one of:

- `GEMINI_API_KEY`
- `GOOGLE_API_KEY`

2) Install and run:

```bash
cd backend
npm install
npm run dev
```

Server default: `http://localhost:3500/aiTafsirFlow`

## Connect the mobile app

Set this in your Expo env (e.g. `.env` at repo root):

```bash
EXPO_PUBLIC_AI_TAFSIR_URL=http://<YOUR-LAN-IP>:3500/aiTafsirFlow
```

Use your machine’s LAN IP so your phone (Expo Go) can reach it.

Optional model override:

```bash
GEMINI_MODEL=gemini-2.5-flash
```

