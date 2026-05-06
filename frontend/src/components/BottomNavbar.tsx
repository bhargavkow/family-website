import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Users, MessageCircle, Search, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './BottomNavbar.css';

const navItems = [
  { to: '/', icon: Home, label: 'Home', auth: false },
  { to: '/members', icon: Users, label: 'Members', auth: false },
  { to: '/messages', icon: MessageCircle, label: 'Messages', auth: true },
  { to: '/search', icon: Search, label: 'Search', auth: true },
  { to: '/profile', icon: User, label: 'Profile', auth: false },
];

export default function BottomNavbar() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleNav = (to: string, requiresAuth: boolean) => {
    if (requiresAuth && !user) {
      navigate(`/login?redirect=${to}`);
      return;
    }
    if (to === '/profile') {
      navigate(user ? `/members/${user.username}` : '/login');
      return;
    }
    navigate(to);
  };

  return (
    <nav className="bottom-navbar">
      {navItems.map(({ to, icon: Icon, label, auth }) => (
        <button
          key={to}
          className="nav-item"
          onClick={() => handleNav(to, auth)}
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
