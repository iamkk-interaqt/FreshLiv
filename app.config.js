const base = require("./app.json");

module.exports = {
  ...base,
  expo: {
    ...base.expo,
    android: {
      ...base.expo.android,
      config: {
        ...base.expo.android?.config,
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY || process.env.GOOGLE_MAPS_MOBILE_API_KEY
        }
      }
    },
    plugins: [
      "expo-router",
      "expo-location",
      ["expo-notifications", { defaultChannel: "orders" }]
    ]
  }
};
