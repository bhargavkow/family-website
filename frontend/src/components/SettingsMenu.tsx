import { X, Moon, Sun, LogOut, ChevronRight } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface Props {
  onClose: () => void;
  onLogout: () => void;
}

export default function SettingsMenu({ onClose, onLogout }: Props) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal animate-scale-in" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
        <div className="modal-header">
          <h3 style={{ fontWeight: 700 }}>Settings</h3>
          <button className="icon-btn" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body" style={{ padding: '8px 0' }}>
          <div className="settings-item" onClick={toggleTheme}>
            <div className="settings-item-left">
              {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
              <span>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
            </div>
            <div className={`theme-toggle-pill ${theme}`}>
              <div className="toggle-dot" />
            </div>
          </div>

          <div className="divider" style={{ margin: '4px 0' }} />

          <div className="settings-item logout-item" onClick={onLogout}>
            <div className="settings-item-left">
              <LogOut size={20} />
              <span>Log Out</span>
            </div>
            <ChevronRight size={18} opacity={0.5} />
          </div>
        </div>
      </div>
      <style>{`
        .settings-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 20px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .settings-item:hover {
          background: var(--color-surface-2);
        }
        .settings-item-left {
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 500;
        }
        .logout-item {
          color: var(--color-error);
        }
        .theme-toggle-pill {
          width: 44px;
          height: 24px;
          background: var(--color-surface-2);
          border: 1px solid var(--color-border);
          border-radius: 20px;
          position: relative;
          transition: background 0.3s;
        }
        .theme-toggle-pill.dark {
          background: var(--color-primary);
          border-color: var(--color-primary);
        }
        .toggle-dot {
          width: 18px;
          height: 18px;
          background: white;
          border-radius: 50%;
          position: absolute;
          top: 2px;
          left: 2px;
          transition: transform 0.3s;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .theme-toggle-pill.dark .toggle-dot {
          transform: translateX(20px);
        }
      `}</style>
    </div>
  );
}
