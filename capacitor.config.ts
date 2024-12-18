import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.jkperezstudio.weekly',
  appName: 'weeklymenu',
  webDir: 'www',
  plugins: {
    Camera: {
      allowEditing: true,  // Permite editar la imagen
      resultType: 'uri',   // Devuelve la URI de la imagen
      quality: 90          // Calidad de la imagen
    }
  }
};

export default config;
