import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LoaderProvider } from './context/LoaderContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';

// Lazy load pages to prevent Vite from fetching everything at once and overloading the dev tunnel
const JmsAuth = React.lazy(() => import('./pages/JmsAuth'));
const MetaConnect = React.lazy(() => import('./pages/MetaConnect'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const BrandSetup = React.lazy(() => import('./pages/BrandSetup'));
const ContentStudio = React.lazy(() => import('./pages/ContentStudio'));
const History = React.lazy(() => import('./pages/History'));
const Profile = React.lazy(() => import('./pages/Profile'));
const AutoReply = React.lazy(() => import('./pages/AutoReply'));
const AdCampaigns = React.lazy(() => import('./pages/AdCampaigns'));

// A simple fallback to show while the specific page is being fetched
const PageLoader = () => (
  <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', background: 'var(--color-bg)' }}>
    <div style={{ width: '40px', height: '40px', border: '3px solid rgba(59,130,246,0.3)', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  </div>
);

function App() {
  return (
    <ThemeProvider>
      <LoaderProvider>
        <ToastProvider>
          <Router>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Navigate to="/auth" replace />} />
                <Route path="/auth" element={<JmsAuth />} />
                <Route path="/meta-connect" element={<MetaConnect />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/brand-setup" element={<BrandSetup />} />
                <Route path="/studio" element={<ContentStudio />} />
                <Route path="/history" element={<History />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/auto-reply" element={<AutoReply />} />
                <Route path="/ad-campaigns" element={<AdCampaigns />} />
              </Routes>
            </Suspense>
          </Router>
        </ToastProvider>
      </LoaderProvider>
    </ThemeProvider>
  );
}

export default App;
