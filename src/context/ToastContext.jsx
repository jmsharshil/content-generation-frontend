import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);

    // Auto remove after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast Container */}
      <div style={{
        position: 'fixed',
        bottom: '2rem',
        right: '2rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        zIndex: 9999,
        pointerEvents: 'none' // Let clicks pass through empty space
      }}>
        {toasts.map(toast => {
          
          let Icon = Info;
          let borderColor = 'var(--color-primary)';
          let bg = 'rgba(59, 130, 246, 0.1)';
          
          if (toast.type === 'error') {
            Icon = AlertCircle;
            borderColor = 'var(--color-danger)';
            bg = 'rgba(239, 68, 68, 0.1)';
          } else if (toast.type === 'success') {
            Icon = CheckCircle2;
            borderColor = 'var(--color-accent)';
            bg = 'rgba(16, 185, 129, 0.1)';
          }

          return (
            <div 
              key={toast.id} 
              className="animate-slide-up"
              style={{
                background: 'var(--color-bg-secondary)',
                border: `1px solid ${borderColor}`,
                boxShadow: `0 8px 32px ${bg}`,
                borderRadius: 'var(--radius-md)',
                padding: '1rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                pointerEvents: 'auto', // Re-enable clicks for the toast itself
                minWidth: '300px',
                maxWidth: '400px'
              }}
            >
              <Icon size={20} style={{ color: borderColor }} />
              <p style={{ margin: 0, flex: 1, fontSize: '0.9rem', color: 'var(--color-text)' }}>
                {toast.message}
              </p>
              <button 
                onClick={() => removeToast(toast.id)}
                style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '0.2rem' }}
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};
