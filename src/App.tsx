import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { AppDataProvider } from '@/context/AppDataContext';
import { ToastProvider } from '@/components/ui/Toast';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { Onboarding } from '@/components/auth/Onboarding';
import { AppLayout } from '@/components/layout/AppLayout';

const Dashboard = lazy(() => import('@/components/dashboard/Dashboard').then(m => ({ default: m.Dashboard })));
const Sessions = lazy(() => import('@/components/sessions/Sessions').then(m => ({ default: m.Sessions })));
const SharedTasks = lazy(() => import('@/components/tasks/SharedTasks').then(m => ({ default: m.SharedTasks })));
const SmartPlanner = lazy(() => import('@/components/planner/SmartPlanner').then(m => ({ default: m.SmartPlanner })));
const WeeklyPlan = lazy(() => import('@/components/planner/WeeklyPlan').then(m => ({ default: m.WeeklyPlan })));
const FocusMode = lazy(() => import('@/components/focus/FocusMode').then(m => ({ default: m.FocusMode })));
const Goals = lazy(() => import('@/components/goals/Goals').then(m => ({ default: m.Goals })));
const Analytics = lazy(() => import('@/components/analytics/Analytics').then(m => ({ default: m.Analytics })));
const Achievements = lazy(() => import('@/components/achievements/Achievements').then(m => ({ default: m.Achievements })));
const Calendar = lazy(() => import('@/components/calendar/Calendar').then(m => ({ default: m.Calendar })));
const Settings = lazy(() => import('@/components/pages/Settings').then(m => ({ default: m.Settings })));
const Notifications = lazy(() => import('@/components/notifications/Notifications').then(m => ({ default: m.Notifications })));

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="w-8 h-8 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function ProtectedRoutes() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  if (!user) {
    return <AuthScreen />;
  }

  if (!user.onboarded) {
    return <Onboarding />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/app" element={<Suspense fallback={<LoadingScreen />}><Dashboard /></Suspense>} />
          <Route path="/app/sessions" element={<Suspense fallback={<LoadingScreen />}><Sessions /></Suspense>} />
          <Route path="/app/tasks" element={<Suspense fallback={<LoadingScreen />}><SharedTasks /></Suspense>} />
          <Route path="/app/planner" element={<Suspense fallback={<LoadingScreen />}><SmartPlanner /></Suspense>} />
          <Route path="/app/weekly" element={<Suspense fallback={<LoadingScreen />}><WeeklyPlan /></Suspense>} />
          <Route path="/app/focus" element={<Suspense fallback={<LoadingScreen />}><FocusMode /></Suspense>} />
          <Route path="/app/goals" element={<Suspense fallback={<LoadingScreen />}><Goals /></Suspense>} />
          <Route path="/app/analytics" element={<Suspense fallback={<LoadingScreen />}><Analytics /></Suspense>} />
          <Route path="/app/achievements" element={<Suspense fallback={<LoadingScreen />}><Achievements /></Suspense>} />
          <Route path="/app/calendar" element={<Suspense fallback={<LoadingScreen />}><Calendar /></Suspense>} />
          <Route path="/app/settings" element={<Suspense fallback={<LoadingScreen />}><Settings /></Suspense>} />
          <Route path="/app/notifications" element={<Suspense fallback={<LoadingScreen />}><Notifications /></Suspense>} />
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppDataProvider>
          <ToastProvider>
            <ProtectedRoutes />
          </ToastProvider>
        </AppDataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
