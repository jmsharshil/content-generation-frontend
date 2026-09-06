import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LoaderProvider } from './context/LoaderContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import JmsAuth from './pages/JmsAuth';
import MetaConnect from './pages/MetaConnect';
import Dashboard from './pages/Dashboard';
import BrandSetup from './pages/BrandSetup';
import ContentStudio from './pages/ContentStudio';
import Profile from './pages/Profile';

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
                <Route path="/profile" element={<Profile />} />
              </Routes>
          </Router>
        </ToastProvider>
      </LoaderProvider>
    </ThemeProvider>
  );
}

export default App;
