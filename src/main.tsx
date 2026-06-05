import { StrictMode, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import Login from '@/components/Login.tsx';
import './index.css';

function Root() {
  const [token, setToken] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('admin_token');
    if (savedToken) {
      // Verify the token is still valid with the server
      fetch(`/api/verify?token=${encodeURIComponent(savedToken)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.valid) {
            setToken(savedToken);
          } else {
            localStorage.removeItem('admin_token');
          }
          setIsChecking(false);
        })
        .catch(() => {
          // If server is not reachable, allow access in dev mode
          setToken(savedToken);
          setIsChecking(false);
        });
    } else {
      setIsChecking(false);
    }
  }, []);

  const handleLogin = (newToken: string) => {
    localStorage.setItem('admin_token', newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    const currentToken = localStorage.getItem('admin_token');
    if (currentToken) {
      fetch('/api/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: currentToken }),
      }).catch(() => {});
    }
    localStorage.removeItem('admin_token');
    setToken(null);
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-zinc-500 font-medium">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <StrictMode>
      <App onLogout={handleLogout} />
    </StrictMode>
  );
}

createRoot(document.getElementById('root')!).render(<Root />);
