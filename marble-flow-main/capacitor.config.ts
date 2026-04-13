import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sribalaji.marbleflow',
  appName: 'Balaji Tiles',
  webDir: 'dist',
  server: {
    url: 'https://balajitiles.net',
    cleartext: false,
  },
};

export default config;
