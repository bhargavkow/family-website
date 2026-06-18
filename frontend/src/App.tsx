import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import BottomNavbar from './components/BottomNavbar';
import ProtectedRoute from './components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';

import { lazy, Suspense } from 'react';

const Home = lazy(() => import('./pages/Home'));
const Members = lazy(() => import('./pages/Members'));
const MemberProfile = lazy(() => import('./pages/MemberProfile'));
const Search = lazy(() => import('./pages/Search'));
const Messages = lazy(() => import('./pages/Messages'));
const Login = lazy(() => import('./pages/Login'));
const Admin = lazy(() => import('./pages/Admin'));
const ProfileRedirect = lazy(() => import('./pages/ProfileRedirect'));

function AppContent() {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  const match = location.pathname.match(/^\/members\/([^/]+)$/);
  const isOtherMemberProfile = match ? match[1].toLowerCase() !== user?.username?.toLowerCase() : false;

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#000000',
        color: '#fff'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid rgba(255,255,255,0.1)',
          borderTopColor: 'var(--color-primary, #7c5cfc)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    );
  }

  // Show only Login form when not authenticated
  if (!user) {
    return (
      <Suspense fallback={null}>
        <Login />
      </Suspense>
    );
  }

  // Show full site after successful login
  return (
    <>
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/members" element={<Members />} />
          <Route path="/members/:username" element={<MemberProfile />} />
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={<ProfileRedirect />} />

          <Route
            path="/search"
            element={
              <ProtectedRoute>
                <Search />
              </ProtectedRoute>
            }
          />

          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <Messages />
              </ProtectedRoute>
            }
          />

          <Route
            path="/messages/:userId"
            element={
              <ProtectedRoute>
                <Messages />
              </ProtectedRoute>
            }
          />

          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/*" element={<Admin />} />
        </Routes>
      </Suspense>

      {!isOtherMemberProfile && <BottomNavbar />}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ScrollToTop />
          <AppContent />

          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: 'var(--color-surface)',
                color: 'var(--color-text)',
                border: '1px solid var(--color-border)',
                borderRadius: '12px',
                fontSize: '14px',
              },
              success: { iconTheme: { primary: 'var(--color-success)', secondary: '#fff' } },
              error: { iconTheme: { primary: 'var(--color-error)', secondary: '#fff' } },
            }}
          />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
