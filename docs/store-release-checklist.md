# Store Release Checklist

This repo is now configured with app branding assets, Android notification icon branding, adaptive icon assets, and release build profiles.

## Already handled in code/config

- App icon: `assets/icon.png`
- Splash branding: `assets/splash.png`
- Android adaptive icon foreground: `assets/adaptive-icon.png`
- Android monochrome icon: `assets/monochrome-icon.png`
- Android notification icon: `assets/notification-icon.png`
- Notification tint color: `#0E4E39`
- iOS location usage message configured in `app.json`
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
- Declare ads usage if AdMob is enabled in production.
- If Google Sign-In is used on Android, make sure Play signing SHA-1 / SHA-256 fingerprints are added in Firebase.

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
