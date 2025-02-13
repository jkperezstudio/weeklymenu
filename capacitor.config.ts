import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.foodtrack.jkperezstudio',
  appName: 'Food Track',
  webDir: 'www',
  plugins: {
    Camera: {
      allowEditing: true,
      resultType: 'uri',
      quality: 90,
    },
    SplashScreen: {
      launchShowDuration: 2500,
      launchAutoHide: true,
      backgroundColor: "#ffffffff",
      androidSplashResourceName: "splash_dark",
      androidScaleType: "CENTER",
      showSpinner: true,
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small",
      spinnerColor: "#999999",
      splashFullScreen: true,
      splashImmersive: true,
      layoutName: "launch_screen",
      useDialog: true,
    },
  }

};

export default config;
