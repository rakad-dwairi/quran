# Store Release Checklist

This repo is now configured with app branding assets, Android notification icon branding, adaptive icon assets, and release build profiles.

## Public policy URLs

- Privacy Policy: https://docs.google.com/document/d/e/2PACX-1vTsojOYB-ExhkLCN7t8-TCVqdz1E-vWk0RUd7v9SUmPCClcZqd2jFhK_DOVg2HOUDjke4zSLkj_nMSU/pub
- Data Deletion Instructions: https://docs.google.com/document/d/e/2PACX-1vSJHma-fJ-4Qon-BEspKS31QqTmruq8sxnlIDqiCFYS4cEhqE_ReYiWsl6aE05KkWitb5QQkB44JWgG/pub

## Already handled in code/config

- App icon: `assets/icon.png`
- Splash branding: `assets/splash.png`
- Android adaptive icon foreground: `assets/adaptive-icon.png`
- Android monochrome icon: `assets/monochrome-icon.png`
- Android notification icon: `assets/notification-icon.png`
- Notification tint color: `#0E4E39`
- iOS location usage message configured in `app.json`
- Location permission pre-prompt added before native location permission requests
- Notification permission pre-prompt added before native notification permission requests
- Interstitial ads have launch delay, action count, and cooldown guards
- Privacy & Data, Terms & Disclaimers, and About & Support screens are linked from Settings
- In-app account deletion is available from Settings -> Cloud Sync / Account
- EAS build profiles configured in `eas.json`
- App UI localization foundation for English, Arabic, and Spanish is in place

## Important platform note

- In **Expo Go**, notifications and launcher branding can still show Expo branding.
- Your real app logo appears in a **development build**, **preview build**, or **production build** created with EAS.
- This repo currently contains an `ios/` native project folder. Because of that, EAS Build will not automatically sync all values from `app.json` / `app.config.js` into iOS native files during cloud builds. Before shipping iOS changes to icons, splash, permissions, plugins, notifications, or URL schemes, sync and verify the native iOS project first.

## Required manual items before App Store / Play Store submission

### Apple App Store

- Create an EAS production iOS build.
- Verify app icon, splash, and notification appearance on a physical iPhone.
- Fill App Store Connect metadata:
  - app description
  - keywords
  - support URL
  - privacy policy URL
  - screenshots for supported device sizes
- Complete App Privacy questionnaire in App Store Connect.
- Include demo account credentials in App Review notes if reviewers need to test Cloud Sync.
- Verify account deletion works after a fresh sign-in.
- If ads are enabled, answer tracking/privacy questions correctly.
- If Facebook login will be shipped, finish the Facebook provider setup before submission.

### Google Play

- Create an EAS production Android build / AAB.
- If this is the first-ever Play upload for the app, create the Play Console app listing first and expect the first binary upload to be done in Play Console before API-based submissions are fully automated.
- Verify launcher icon, adaptive icon, notification icon, and notification color on a physical Android device.
- Fill Play Console metadata:
  - short description
  - full description
  - screenshots
  - feature graphic
  - privacy policy URL
- Complete Data safety form.
- Add the Data Deletion Instructions URL in the Play Console account deletion section.
- Verify the web deletion instructions do not require Google sign-in.
- Declare ads usage if AdMob is enabled in production.
- If Google Sign-In is used on Android, make sure Play signing SHA-1 / SHA-256 fingerprints are added in Firebase.

## Real-device smoke test

Run this on at least one physical iPhone and one physical Android device:

- Fresh install opens without crashes.
- Localization/onboarding completes.
- Sign up, sign in, sync, sign out, sign back in, and delete account.
- Quran tab opens, Surah list loads, Surah reader opens, and ad cooldown does not interrupt repeatedly.
- Search by keyword and direct verse key works.
- Notes, tags, collections, favorites, and memorization save and appear in Saved content.
- Audio plays, pauses, and opens Player.
- Offline download, offline badge, offline read, and remove download work.
- Prayer screen requests location only after the pre-prompt.
- Notification settings request permission only after the pre-prompt.
- AI tafsir button either works with production backend or clearly explains that AI is not configured.
- No-network mode opens the app and handles network errors gracefully.

## Data Safety / Privacy questionnaire reminders

Declare accurately if enabled in production:

- Email/account identifiers through Firebase Authentication.
- User-generated content such as notes, bookmarks, collections, memorization, and saved library data when Cloud Sync is used.
- Location for prayer times and Qibla when the user grants permission.
- Notifications for prayer alerts, daily ayah, and reading reminders.
- Ad data through Google AdMob.
- Optional AI requests that send selected ayah, translation, and tafsir text to the configured backend.

## Localization review still recommended

The app now has the main multilingual structure, but before store submission you should still do a full pass on:

- auth screens
- downloads screen
- notifications settings screen
- player screen
- duas / tasbih / tafsir secondary screens
- any alert dialogs and error messages

## Release commands

```bash
npx eas build -p ios --profile production
npx eas build -p android --profile production
npx eas submit -p ios --profile production
npx eas submit -p android --profile production
```
