import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './features/auth/AuthProvider'
import LoginPage from './features/auth/LoginPage'
import Layout from './components/Layout'
import { Spinner } from './components/ui'
import { MAIN_APP_URL } from './lib/mainApp'
import DashboardPage from './features/dashboard/DashboardPage'
import RecipesPage from './features/recipes/RecipesPage'
import RecipeDetailPage from './features/recipes/RecipeDetailPage'
import RecipeFormPage from './features/recipes/RecipeFormPage'
import SamplesPage from './features/samples/SamplesPage'
import SampleDetailPage from './features/samples/SampleDetailPage'
import SampleFormPage from './features/samples/SampleFormPage'
import AssistantPage from './features/assistant/AssistantPage'
import AccessPage from './features/access/AccessPage'

function NoAccessScreen() {
  const { me, signOut, refreshMe } = useAuth()
  return (
    <div
      className="flex min-h-[100dvh] items-center justify-center px-4"
      style={{ background: 'linear-gradient(160deg, var(--hd1), var(--hd2))' }}
    >
      <div className="card w-full max-w-sm space-y-4 text-center">
        <div className="text-4xl">🔒</div>
        <h1 className="text-lg font-extrabold">مفيش صلاحية لدخول المختبر</h1>
        <p className="text-sm text-mute">
          {me?.name ? `${me.name}، ` : ''}
          حسابك لسه مش مفعّل للمختبر. اطلب من المدير يفعّله لك من صفحة «الصلاحيات»، وبعدها اضغط تحديث.
        </p>
        <div className="flex gap-2">
          <button type="button" className="btn-primary flex-1" onClick={() => void refreshMe()}>
            تحديث
          </button>
          <button type="button" className="btn-secondary flex-1" onClick={() => void signOut()}>
            خروج
          </button>
        </div>
        <a href={MAIN_APP_URL} className="block text-sm font-bold text-brand-700">
          ← الرجوع لبرنامج المصنع
        </a>
      </div>
    </div>
  )
}

function Protected() {
  const { session, loading, canRead } = useAuth()
  if (loading) return <Spinner />
  if (!session) return <Navigate to="/login" replace />
  if (!canRead) return <NoAccessScreen />
  return <Layout />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<Protected />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/recipes" element={<RecipesPage />} />
        <Route path="/recipes/new" element={<RecipeFormPage />} />
        <Route path="/recipes/:id" element={<RecipeDetailPage />} />
        <Route path="/recipes/:id/edit" element={<RecipeFormPage />} />
        <Route path="/samples" element={<SamplesPage />} />
        <Route path="/samples/new" element={<SampleFormPage />} />
        <Route path="/samples/:id" element={<SampleDetailPage />} />
        <Route path="/samples/:id/edit" element={<SampleFormPage />} />
        <Route path="/assistant" element={<AssistantPage />} />
        <Route path="/access" element={<AccessPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
