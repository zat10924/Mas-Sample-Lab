import type { CapacitorConfig } from '@capacitor/cli'

// تطبيق أندرويد: نفس موقع الويب جوه WebView. البناء بيتم على GitHub (Actions > Build Android APK)
const config: CapacitorConfig = {
  appId: 'com.masceramic.lab',
  appName: 'مختبر الماس',
  webDir: 'dist',
  server: { androidScheme: 'https' },
  android: { backgroundColor: '#5E232E' },
}

export default config
