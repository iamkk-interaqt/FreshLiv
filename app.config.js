const base = require("./app.json");

module.exports = {
  ...base,
  expo: {
    ...base.expo,
    plugins: [
      "expo-router",
      "expo-location",
      ["react-native-maps", {
        androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_MOBILE_API_KEY,
        iosGoogleMapsApiKey: process.env.GOOGLE_MAPS_MOBILE_API_KEY
      }],
      ["expo-notifications", { defaultChannel: "orders" }]
    ]
  }
};
