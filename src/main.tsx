import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { QueryClient } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import App from './App'
import { AuthProvider } from './features/auth/AuthProvider'
import { ToastProvider } from './components/Toast'
import { CACHE_KEY, CACHE_MAX_AGE_MS, CACHE_VERSION } from './lib/offlineCache'
import { idbPersister } from './lib/idbPersister'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, gcTime: CACHE_MAX_AGE_MS, retry: 1, refetchOnWindowFocus: false },
  },
})

// الصور بتتحمّل من نسخة محلية لما مفيش نت، فلازم الاستعلامات دي تشتغل حتى بدون اتصال
queryClient.setQueryDefaults(['signed-url'], { networkMode: 'always' })
queryClient.setQueryDefaults(['thumb'], { networkMode: 'always' })

// النسخة القديمة (localStorage) مبقيناش نستخدمها
try {
  localStorage.removeItem(CACHE_KEY)
} catch {
  // تجاهل
}

// نسخة من بيانات المختبر بتتخزن على الجهاز (IndexedDB) عشان تفضل ظاهرة بدون إنترنت، وبتتمسح عند تسجيل الخروج.
// روابط الصور الموقّعة مش بتتخزن لأنها بتنتهي بسرعة (الصور نفسها ليها كاش منفصل).
const persister = idbPersister

// HashRouter عشان الموقع يشتغل على GitHub Pages من غير إعدادات إعادة توجيه للمسارات
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: CACHE_MAX_AGE_MS,
        buster: CACHE_VERSION,
        dehydrateOptions: {
          shouldDehydrateQuery: (query) => query.state.status === 'success' && query.queryKey[0] !== 'signed-url' && query.queryKey[0] !== 'thumb',
        },
      }}
    >
      <HashRouter>
        <AuthProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </AuthProvider>
      </HashRouter>
    </PersistQueryClientProvider>
  </React.StrictMode>,
)
