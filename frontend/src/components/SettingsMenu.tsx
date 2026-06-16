import { useEffect } from 'react';
import { Moon, Sun, LogOut, Bookmark } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface Props {
  onClose: () => void;
  onLogout: () => void;
  onOpenSaved: () => void;
}

export default function SettingsMenu({ onClose, onLogout, onOpenSaved }: Props) {
  const { theme, toggleTheme } = useTheme();

  // Lock body scroll while sheet is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 1200,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
        }}
      />

      {/* Bottom Sheet */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        zIndex: 1201,
        background: 'var(--color-surface)',
        borderRadius: '20px 20px 0 0',
        padding: '12px 0 0',
        animation: 'slideUpSheet 0.28s cubic-bezier(0.32,0.72,0,1)',
        boxShadow: '0 -4px 32px rgba(0,0,0,0.4)',
      }}>
        {/* Handle bar */}
        <div style={{
          width: 40, height: 4, borderRadius: 99,
          background: 'var(--color-border-light)',
          margin: '0 auto 16px',
        }} />

        {/* Title */}
        <p style={{
          textAlign: 'center', fontWeight: 700, fontSize: 16,
          color: 'var(--color-text)', paddingBottom: 16,
          borderBottom: '1px solid var(--color-border)',
        }}>Settings</p>

        {/* Dark / Light Mode toggle */}
        <div
          onClick={toggleTheme}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '18px 24px', cursor: 'pointer',
            borderBottom: '1px solid var(--color-border)',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-surface-2)')}
          onMouseLeave={e => (e.currentTarget.style.background = '')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {theme === 'dark'
              ? <Moon size={20} color="var(--color-text)" />
              : <Sun size={20} color="var(--color-text)" />}
            <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--color-text)' }}>
              {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
            </span>
          </div>
          {/* Toggle pill */}
          <div style={{
            width: 44, height: 24,
            background: theme === 'dark' ? 'var(--color-primary)' : 'var(--color-surface-2)',
            border: `1px solid ${theme === 'dark' ? 'var(--color-primary)' : 'var(--color-border)'}`,
            borderRadius: 20, position: 'relative',
            transition: 'background 0.3s, border-color 0.3s',
          }}>
            <div style={{
              width: 18, height: 18, background: 'white', borderRadius: '50%',
              position: 'absolute', top: 2, left: 2,
              transform: theme === 'dark' ? 'translateX(20px)' : 'translateX(0)',
              transition: 'transform 0.3s',
              boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
            }} />
          </div>
        </div>

        {/* Saved Posts */}
        <div
          onClick={() => {
            onClose();
            onOpenSaved();
          }}
          style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '18px 24px', cursor: 'pointer',
            borderBottom: '1px solid var(--color-border)',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-surface-2)')}
          onMouseLeave={e => (e.currentTarget.style.background = '')}
        >
          <Bookmark size={20} color="var(--color-text)" />
          <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--color-text)' }}>Saved Posts</span>
        </div>

        {/* Log Out */}
        <div
          onClick={onLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '18px 24px', cursor: 'pointer',
            color: 'var(--color-error)',
            borderBottom: '1px solid var(--color-border)',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-surface-2)')}
          onMouseLeave={e => (e.currentTarget.style.background = '')}
        >
          <LogOut size={20} />
          <span style={{ fontSize: 16, fontWeight: 500 }}>Log Out</span>
        </div>

        {/* Cancel */}
        <button
          onClick={onClose}
          style={{
            width: '100%', background: 'none', border: 'none',
            padding: '18px 24px', cursor: 'pointer',
            color: 'var(--color-text-2)', fontSize: 16, fontWeight: 600,
            marginBottom: 'env(safe-area-inset-bottom, 8px)',
          }}
        >
          Cancel
        </button>
      </div>

      <style>{`
        @keyframes slideUpSheet {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
