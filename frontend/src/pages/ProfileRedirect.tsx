import { useAuth } from '../context/AuthContext';
import Login from './Login';
import MemberProfile from './MemberProfile';

/**
 * /profile — URL always stays /profile.
 *
 * Not logged in OR admin → Login form (admin is user-side irrelevant)
 * Regular user           → Renders their own MemberProfile in-place
 */
export default function ProfileRedirect() {
  const { user, loading } = useAuth();

  if (loading) return <div className="loading-screen"><div className="spinner spinner-lg" /></div>;

  // Show profile only for regular (non-admin) users
  if (user && !user.isAdmin) {
    return <MemberProfile usernameOverride={user.username} />;
  }

  // Not logged in OR admin → show login form inline
  return <Login inlineMode />;
}

