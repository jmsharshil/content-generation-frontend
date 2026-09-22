import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LoaderProvider } from './context/LoaderContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import JmsAuth from './pages/JmsAuth';
import MetaConnect from './pages/MetaConnect';
import Dashboard from './pages/Dashboard';
import BrandSetup from './pages/BrandSetup';
import ContentStudio from './pages/ContentStudio';
import History from './pages/History';
import Profile from './pages/Profile';
import AutoReply from './pages/AutoReply';
import AdCampaigns from './pages/AdCampaigns';

function App() {
  return (
    <ThemeProvider>
      <LoaderProvider>
        <ToastProvider>
          <Router>
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
          </Router>
        </ToastProvider>
      </LoaderProvider>
    </ThemeProvider>
  );
}

export default App;
