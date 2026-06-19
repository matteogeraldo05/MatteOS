import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'
import { AuthProvider } from './auth/AuthProvider'
import RequireAuth from './auth/RequireAuth'
import { ToastHost } from './ui/Toast'
import AppShell from './shell/AppShell'

// Auth pages
import LoginPage from './auth/LoginPage'
import MFASetupPage from './auth/MFASetupPage'
import OnboardingPage from './auth/OnboardingPage'

// Module pages
import DashboardPage from './modules/dashboard/DashboardPage'
import SleepPage from './modules/sleep/SleepPage'
import TodoPage from './modules/todo/TodoPage'
import JournalLibraryPage from './modules/journal/JournalLibraryPage'
import FinancePage from './modules/finance/FinancePage'
import BodyPage from './modules/body/BodyPage'
import FoodPage from './modules/food/FoodPage'
import WorkoutsPage from './modules/workouts/WorkoutsPage'
import WardrobePage from './modules/wardrobe/WardrobePage'
import SettingsPage from './modules/settings/SettingsPage'

function AuthedRoutes() {
  return (
    <RequireAuth>
      <AppShell>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/sleep" element={<SleepPage />} />
          <Route path="/todo" element={<TodoPage />} />
          <Route path="/journal" element={<JournalLibraryPage />} />
          <Route path="/library" element={<Navigate to="/journal?tab=library" replace />} />
          <Route path="/finance" element={<FinancePage />} />
          <Route path="/body" element={<BodyPage />} />
          <Route path="/food" element={<FoodPage />} />
          <Route path="/workouts" element={<WorkoutsPage />} />
          <Route path="/wardrobe" element={<WardrobePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
    </RequireAuth>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <ToastHost>
            <Routes>
              {/* Public auth routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/login/mfa" element={<MFASetupPage />} />
              <Route path="/onboarding" element={<OnboardingPage />} />

              {/* All protected routes */}
              <Route path="/*" element={<AuthedRoutes />} />
            </Routes>
          </ToastHost>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
