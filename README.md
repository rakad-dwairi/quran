# Quran (Expo)

Cross-platform Quran app (Android/iOS via Expo development builds, plus web) built with **React Native + Expo Router + TypeScript**.

## What's included

- **Quran reading**: Surah list + reading view (Arabic Uthmani + translation)
- **Audio recitation**: play full Surah audio or verse-by-verse, with a dedicated `Player` screen
- **Search**: keyword search + jump to verse (e.g. `2:255`) + Surah name suggestions
- **Bookmarks & favorites**: saved locally (persisted) + Library screen
- **Offline downloads**: download Surah text + Surah audio, manage via Settings -> Downloads
- **Tafsir + AI**: Quran.com tafsir display + optional AI simplified summary (Gemini/Genkit backend)
- **Typography**: Inter (UI), Literata (translation), Noto Naskh Arabic (Arabic)
- **Styling**: NativeWind (Tailwind-style classes)

## Run the app

```bash
npm install
npm start
```

Expo Go can run most JavaScript-only screens, but AdMob and native Google/Facebook sign-in require a development build.

Useful commands:

```bash
npm run android
npm run web
```

## Configure AI (optional)

The mobile app will call `EXPO_PUBLIC_AI_TAFSIR_URL` when you press **Generate summary** on the Tafsir screen.

Backend setup lives in `backend/README.md`.

## Configure Cloud Sync (optional)

Cloud sync uses Firebase (email/password sign-in + manual Sync now).

Create a `.env` at repo root:

```bash
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...          # optional but recommended
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...       # optional
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...  # optional
EXPO_PUBLIC_FIREBASE_APP_ID=...               # optional
```

Then open Settings -> Cloud Sync.

## Configure Social Sign-In (optional)

Enable Google and Facebook in Firebase Console -> Authentication -> Sign-in method.

Add these values to `.env`:

```bash
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=...
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=...
EXPO_PUBLIC_GOOGLE_IOS_REVERSED_CLIENT_ID=...

EXPO_PUBLIC_FACEBOOK_APP_ID=...
EXPO_PUBLIC_FACEBOOK_CLIENT_TOKEN=...
```

Then rebuild the native app:

```bash
npx expo run:android
npx expo run:ios
```

Google and Facebook native sign-in do not run inside Expo Go because they require custom native code.