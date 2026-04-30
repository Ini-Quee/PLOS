import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider, useAuth } from './lib/auth';
import { pageTransitions } from './styles/motion';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Journal from './pages/Journal';
import JournalDashboard from './pages/JournalDashboard';
import JournalPage from './pages/JournalPage';
import Schedule from './pages/Schedule';
import Calendar from './pages/Calendar';
import Projects from './pages/Projects';
import Books from './pages/Books';
import Jobs from './pages/Jobs';
import ContentPlanner from './pages/ContentPlanner';
import YearPlan from './pages/YearPlan';
import Contacts from './pages/Contacts';
import MfaSetup from './pages/MfaSetup';
import Settings from './pages/Settings';
import TalkToLumi from './pages/TalkToLumi';
import ColorPreview from './pages/ColorPreview';
import DesignSystemPreview from './pages/DesignSystemPreview';
import LivingBackground from './components/LivingBackground';
import { useState, useEffect } from 'react';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0F2027',
      }}>
        <div style={{ color: 'white', fontSize: 18 }}>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0F2027',
      }}>
        <div style={{ color: 'white', fontSize: 18 }}>Loading...</div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function AnimatedRoute({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ type: 'tween', ease: [0.25, 0.1, 0.25, 1], duration: 0.4 }}
      style={{ width: '100%', height: '100%' }}
    >
      {children}
    </motion.div>
  );
}

function AppRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <AnimatedRoute>
                <Login />
              </AnimatedRoute>
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <AnimatedRoute>
                <Register />
              </AnimatedRoute>
            </PublicRoute>
          }
        />
<Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <AnimatedRoute>
                  <Dashboard />
                </AnimatedRoute>
              </ProtectedRoute>
            }
          />
      <Route
        path="/journal"
        element={
          <ProtectedRoute>
            <AnimatedRoute>
              <JournalDashboard />
            </AnimatedRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/journal/write/:journalType"
        element={
          <ProtectedRoute>
            <AnimatedRoute>
              <Journal />
            </AnimatedRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/journal/page"
        element={
          <ProtectedRoute>
            <AnimatedRoute>
              <JournalPage />
            </AnimatedRoute>
          </ProtectedRoute>
        }
      />
        <Route
          path="/mfa-setup"
          element={
            <ProtectedRoute>
              <AnimatedRoute>
                <MfaSetup />
              </AnimatedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <AnimatedRoute>
                <Settings />
              </AnimatedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/schedule"
          element={
            <ProtectedRoute>
              <AnimatedRoute>
                <Schedule />
              </AnimatedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/calendar"
          element={
            <ProtectedRoute>
              <AnimatedRoute>
                <Calendar />
              </AnimatedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects"
          element={
            <ProtectedRoute>
              <AnimatedRoute>
                <Projects />
              </AnimatedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/books"
          element={
            <ProtectedRoute>
              <AnimatedRoute>
                <Books />
              </AnimatedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/job-tracker"
          element={
            <ProtectedRoute>
              <AnimatedRoute>
                <Jobs />
              </AnimatedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/content-planner"
          element={
            <ProtectedRoute>
              <AnimatedRoute>
                <ContentPlanner />
              </AnimatedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/year-plan"
          element={
            <ProtectedRoute>
              <AnimatedRoute>
                <YearPlan />
              </AnimatedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/contacts"
          element={
            <ProtectedRoute>
              <AnimatedRoute>
                <Contacts />
              </AnimatedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/talk-to-lumi"
          element={
            <ProtectedRoute>
              <AnimatedRoute>
                <TalkToLumi />
              </AnimatedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/color-preview"
          element={<AnimatedRoute><ColorPreview /></AnimatedRoute>}
        />
        <Route
          path="/design-system"
          element={<AnimatedRoute><DesignSystemPreview /></AnimatedRoute>}
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  const [livingBackgroundEnabled, setLivingBackgroundEnabled] = useState(false);
  const [backgroundTheme, setBackgroundTheme] = useState('auto');
  const [motionIntensity, setMotionIntensity] = useState('full');

  // Load Living Background settings from localStorage
  useEffect(() => {
    const enabled = localStorage.getItem('plos_living_background') === 'true';
    const theme = localStorage.getItem('plos_bg_theme') || 'auto';
    const intensity = localStorage.getItem('plos_bg_intensity') || 'full';

    setLivingBackgroundEnabled(enabled);
    setBackgroundTheme(theme);
    setMotionIntensity(intensity);

    // Add body class when Living Background is enabled
    if (enabled) {
      document.body.classList.add('living-background-enabled');
    } else {
      document.body.classList.remove('living-background-enabled');
    }
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        {livingBackgroundEnabled && (
          <LivingBackground
            theme={backgroundTheme}
            enabled={true}
            intensity={motionIntensity}
          />
        )}
        <div style={{ position: 'relative', zIndex: 10 }}>
          <AppRoutes />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}