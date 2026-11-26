import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.kinetix.tracker",
  appName: "Kinetix",
  webDir: "out",
  backgroundColor: "#08090d",
  ios: {
    contentInset: "automatic",
    preferredContentMode: "mobile",
  },
  android: {
    backgroundColor: "#08090d",
  },
  plugins: {
    StatusBar: {
      style: "DARK",
      backgroundColor: "#08090d",
    },
  },
};

export default config;
