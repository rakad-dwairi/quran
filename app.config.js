const googleIosUrlScheme = process.env.EXPO_PUBLIC_GOOGLE_IOS_REVERSED_CLIENT_ID;
const facebookAppID = process.env.EXPO_PUBLIC_FACEBOOK_APP_ID;
const facebookClientToken = process.env.EXPO_PUBLIC_FACEBOOK_CLIENT_TOKEN;

function hasValue(value) {
  return typeof value === "string" && value.trim().length > 0;
}

module.exports = ({ config }) => {
  const plugins = [...(config.plugins ?? [])];

  if (!plugins.includes("expo-localization")) {
    plugins.push("expo-localization");
  }

  plugins.push([
    "expo-notifications",
    {
      icon: "./assets/notification-icon.png",
      color: "#0E4E39",
    },
  ]);

  if (hasValue(googleIosUrlScheme)) {
    plugins.push([
      "@react-native-google-signin/google-signin",
      {
        iosUrlScheme: googleIosUrlScheme,
      },
    ]);
  }

  if (hasValue(facebookAppID) && hasValue(facebookClientToken)) {
    plugins.push([
      "react-native-fbsdk-next",
      {
        appID: facebookAppID,
        clientToken: facebookClientToken,
        displayName: config.name ?? "Quran",
        scheme: `fb${facebookAppID}`,
        advertiserIDCollectionEnabled: false,
        autoLogAppEventsEnabled: false,
        isAutoInitEnabled: false,
      },
    ]);
  }

  return {
    ...config,
    plugins,
  };
};
