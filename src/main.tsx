import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './ui/theme.css'
import App from './App.tsx'

function UpdateToast() {
  const [show, setShow] = useState(false);
  const [refresh, setRefresh] = useState<((reload?: boolean) => Promise<void>) | null>(null);
  useEffect(() => {
    const r = registerSW({
      onNeedRefresh: () => setShow(true),
      onOfflineReady: () => console.log('App ready to work offline'),
    });
    setRefresh(() => r);
  }, []);
  if (!show || !refresh) return null;
  return (
    <button className="btn" style={{ position: 'fixed', bottom: 12, left: 12, zIndex: 50, maxWidth: 220 }}
      onClick={() => refresh(true)}>
      Update available — reload
    </button>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <UpdateToast />
  </StrictMode>,
)
