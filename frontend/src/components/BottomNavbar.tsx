import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Users, MessageCircle, Search, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './BottomNavbar.css';

export default function BottomNavbar() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Hide on admin pages and standalone login page
  if (location.pathname.startsWith('/admin')) return null;
  if (location.pathname === '/login') return null;

  // Wait for auth to resolve (prevents flash)
  if (loading) return null;

  // Regular logged-in user sees all 5 items
  const isRegularUser = user && !user.isAdmin;

  const navItems = isRegularUser
    ? [
        { to: '/',         icon: Home,          label: 'Home'     },
        { to: '/members',  icon: Users,         label: 'Update'  },
        { to: '/messages', icon: MessageCircle, label: 'Messages' },
        { to: '/search',   icon: Search,        label: 'Search'   },
        { to: '/profile',  icon: User,          label: 'Profile'  },
      ]
    : [
        // Guest or admin → only Home + Profile
        { to: '/',        icon: Home, label: 'Home'    },
        { to: '/profile', icon: User, label: 'Profile' },
      ];

  const isActive = (to: string) => {
    if (to === '/') return location.pathname === '/';
    return location.pathname.startsWith(to);
  };

  return (
    <nav className="bottom-navbar">
      {navItems.map(({ to, icon: Icon, label }) => (
        <button
          key={to}
          className={`nav-item ${isActive(to) ? 'active' : ''}`}
          onClick={() => navigate(to)}
          aria-label={label}
          id={`nav-${label.toLowerCase()}`}
        >
          <span className="nav-icon">
            <Icon size={24} strokeWidth={1.8} />
          </span>
          <span className="nav-label">{label}</span>
        </button>
      ))}
    </nav>
  );
}
