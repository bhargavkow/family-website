import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Image, MessageCircle, TrendingUp,
  Plus, Trash2, Eye, ToggleLeft, ToggleRight, X, LogOut, Lock, Shield, Edit3,
  LayoutDashboard
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  apiAdminStats, apiAdminGetMembers, apiAdminCreateMember,
  apiAdminToggleMember, apiAdminDeleteMember,
  apiAdminGetPosts, apiAdminDeletePost, apiAdminUpdateMember,
} from '../api';
import type { User, Post } from '../types';
import PostLightbox from '../components/PostLightbox';
import toast from 'react-hot-toast';
import './Admin.css';

type Tab = 'overview' | 'members' | 'posts';

interface Stats {
  totalMembers: number;
  activeMembers: number;
  disabledMembers: number;
  totalPosts: number;
  totalMessages: number;
}

// ─── Confirm Logout Modal ─────────────────────────────────
function ConfirmLogoutModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal animate-scale-in admin-confirm-modal" onClick={e => e.stopPropagation()}>
        <p className="admin-confirm-msg">Are you sure you want to logout from Admin?</p>
        <div className="admin-confirm-actions">
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm} id="confirm-logout-btn">Yes, Logout</button>
        </div>
      </div>
    </div>
  );
}

// ─── Add Member Modal ─────────────────────────────────────
function AddMemberModal({ onClose, onCreated }: { onClose: () => void; onCreated: (u: User) => void }) {
  const [form, setForm] = useState({ name: '', username: '', password: '', bio: '' });
  const [photo, setPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (photo) fd.append('profilePhoto', photo);
      const res = await apiAdminCreateMember(fd);
      onCreated(res.data);
      toast.success(`Member @${res.data.username} created!`);
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal animate-scale-in" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()} id="add-member-modal">
        <div className="modal-header">
          <h3 style={{ fontWeight: 700 }}>Add New Member</h3>
          <button className="icon-btn" onClick={onClose}><X size={20} /></button>
        </div>
        <form className="modal-body" onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className="label">Profile Photo (optional)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => fileRef.current?.click()} id="pick-photo-btn">
                  📷 {photo ? 'Change Photo' : 'Pick Photo'}
                </button>
                {photo && <span style={{ fontSize: 13, color: 'var(--color-text-2)' }}>{photo.name}</span>}
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setPhoto(e.target.files?.[0] || null)} />
            </div>
            {[
              { id: 'am-name', key: 'name', label: 'Full Name', placeholder: 'John Doe', req: true },
              { id: 'am-username', key: 'username', label: 'Username', placeholder: 'johndoe', req: true },
              { id: 'am-password', key: 'password', label: 'Password', placeholder: 'Min 6 chars', req: true, type: 'password' },
              { id: 'am-bio', key: 'bio', label: 'Bio (optional)', placeholder: 'Tell us about them...', req: false },
            ].map(f => (
              <div key={f.key}>
                <label className="label" htmlFor={f.id}>{f.label}</label>
                <input
                  id={f.id}
                  type={f.type || 'text'}
                  className="input"
                  placeholder={f.placeholder}
                  required={f.req}
                  value={form[f.key as keyof typeof form]}
                  onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={loading} id="save-new-member-btn">
              {loading ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : 'Create Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Edit Member Modal ─────────────────────────────────────
function EditMemberModal({ member, onClose, onSaved }: { member: User; onClose: () => void; onSaved: (u: User) => void }) {
  const [form, setForm] = useState({ name: member.name, username: member.username, bio: member.bio || '', password: '' });
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState(member.profilePhoto?.url || '');
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'password' && !v) return;
        fd.append(k, v);
      });
      if (photo) fd.append('profilePhoto', photo);

      const res = await apiAdminUpdateMember(member._id, fd);
      onSaved(res.data);
      toast.success('Member updated');
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal animate-scale-in" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()} id="edit-member-modal">
        <div className="modal-header">
          <h3 style={{ fontWeight: 700 }}>Edit Member</h3>
          <button className="icon-btn" onClick={onClose}><X size={20} /></button>
        </div>
        <form className="modal-body" onSubmit={handleSave}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ position: 'relative', display: 'inline-block', cursor: 'pointer' }} onClick={() => fileRef.current?.click()}>
              {preview
                ? <img src={preview} alt="profile" className="avatar" style={{ width: 80, height: 80 }} />
                : <div className="avatar" style={{ width: 80, height: 80, background: 'var(--color-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, fontWeight: 700 }}>{member.name?.[0]?.toUpperCase()}</div>
              }
              <div className="avatar-edit-overlay"><Edit3 size={16} /></div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto} />
            <div style={{ fontSize: 12, color: 'var(--color-primary-light)', marginTop: 6, cursor: 'pointer' }} onClick={() => fileRef.current?.click()}>Change Photo</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { id: 'em-name', key: 'name', label: 'Full Name', req: true },
              { id: 'em-username', key: 'username', label: 'Username', req: true },
              { id: 'em-bio', key: 'bio', label: 'Bio', req: false },
              { id: 'em-password', key: 'password', label: 'New Password (leave blank to keep)', req: false, type: 'password' },
            ].map(f => (
              <div key={f.key}>
                <label className="label" htmlFor={f.id}>{f.label}</label>
                <input
                  id={f.id}
                  type={f.type || 'text'}
                  className="input"
                  required={f.req}
                  value={form[f.key as keyof typeof form]}
                  onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={loading} id="save-member-btn">
              {loading ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Admin Login Gate ─────────────────────────────────────
function AdminLoginGate({ onSuccess }: { onSuccess: () => void }) {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-gate-screen">
      <div className="admin-gate-card">
        <div className="admin-gate-header">
          <div className="admin-gate-icon">
            <Shield size={32} />
          </div>
          <h1 className="admin-gate-title">Admin Access</h1>
          <p className="admin-gate-subtitle">Enter your admin credentials to continue</p>
        </div>
        <form className="admin-gate-form" onSubmit={handleSubmit}>
          <div className="admin-gate-field">
            <label htmlFor="gate-username">Username</label>
            <div className="admin-gate-input-wrap">
              <Lock size={16} className="admin-gate-input-icon" />
              <input id="gate-username" type="text" autoComplete="username" placeholder="admin" required value={username} onChange={e => setUsername(e.target.value)} />
            </div>
          </div>
          <div className="admin-gate-field">
            <label htmlFor="gate-password">Password</label>
            <div className="admin-gate-input-wrap">
              <Lock size={16} className="admin-gate-input-icon" />
              <input id="gate-password" type="password" autoComplete="current-password" placeholder="••••••••" required value={password} onChange={e => setPassword(e.target.value)} />
            </div>
          </div>
          {error && <div className="admin-gate-error">{error}</div>}
          <button type="submit" className="admin-gate-btn" disabled={loading}>
            {loading ? <div className="spinner" style={{ width: 20, height: 20 }} /> : 'Login to Admin'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Main Admin Dashboard ──────────────────────────────────
export default function Admin() {
  const { user, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [showAddMember, setShowAddMember] = useState(false);
  const [editingMember, setEditingMember] = useState<User | null>(null);
  const [lightboxPost, setLightboxPost] = useState<Post | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, m, p] = await Promise.all([
        apiAdminStats(),
        apiAdminGetMembers(),
        apiAdminGetPosts(),
      ]);
      setStats(s.data);
      setMembers(m.data);
      setPosts(p.data.posts || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to fetch admin data');
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (user?.isAdmin) {
      loadData();
    }
  }, [authLoading, user]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const toggleMember = async (id: string) => {
    try {
      const res = await apiAdminToggleMember(id);
      setMembers(prev => prev.map(m => m._id === id ? { ...m, isActive: res.data.isActive } : m));
      toast.success(`Member ${res.data.isActive ? 'enabled' : 'disabled'}`);
    } catch { toast.error('Action failed'); }
  };

  const deleteMember = async (id: string, name: string) => {
    if (!window.confirm(`Delete member "${name}"? This cannot be undone.`)) return;
    try {
      await apiAdminDeleteMember(id);
      setMembers(prev => prev.filter(m => m._id !== id));
      toast.success('Member deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const deletePost = async (id: string) => {
    if (!window.confirm('Delete this post permanently?')) return;
    try {
      await apiAdminDeletePost(id);
      setPosts(prev => prev.filter(p => p._id !== id));
      toast.success('Post deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const handleNav = (t: Tab) => {
    setTab(t);
    setIsSidebarOpen(false);
  };

  if (authLoading) return <div className="loading-screen"><div className="spinner spinner-lg" /></div>;

  if (!user?.isAdmin) {
    return <AdminLoginGate onSuccess={loadData} />;
  }

  if (loading) return <div className="loading-screen"><div className="spinner spinner-lg" /></div>;

  if (error || !stats) {
    return (
      <div className="admin-error-screen">
        <div className="admin-error-card">
          <Shield size={48} color="var(--color-error)" />
          <h2>Connection Error</h2>
          <p>{error || 'Could not fetch dashboard data. Please check your connection.'}</p>
          <button className="btn btn-primary" onClick={loadData}>Retry Connection</button>
          <button className="btn btn-ghost" onClick={handleLogout} style={{ marginTop: 10 }}>Logout</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`admin-layout ${isSidebarOpen ? 'sidebar-open' : ''}`}>
      {/* Mobile Sidebar Overlay */}
      <div className="admin-sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />

      {/* ── Sidebar ───────────────────────────────────── */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-top">
          <div className="admin-brand">
            <div className="admin-brand-icon"><Shield size={28} /></div>
            <div>
              <div className="admin-brand-title">FAMILY PRO</div>
              <div className="admin-brand-sub">Management</div>
            </div>
            <button className="mobile-close-sidebar" onClick={() => setIsSidebarOpen(false)}><X size={20} /></button>
          </div>

          <nav className="admin-nav">
            <button className={`admin-nav-item ${tab === 'overview' ? 'active' : ''}`} onClick={() => handleNav('overview')}>
              <LayoutDashboard size={18} /> Overview
            </button>
            <button className={`admin-nav-item ${tab === 'members' ? 'active' : ''}`} onClick={() => handleNav('members')}>
              <Users size={18} /> Members
            </button>
            <button className={`admin-nav-item ${tab === 'posts' ? 'active' : ''}`} onClick={() => handleNav('posts')}>
              <Image size={18} /> Posts
            </button>
          </nav>
        </div>

        <button className="admin-logout-btn" onClick={() => setShowLogoutConfirm(true)} id="admin-logout">
          <LogOut size={16} /> Logout
        </button>
      </aside>

      {/* ── Main Content ──────────────────────────────── */}
      <main className="admin-main">
        <header className="admin-mobile-header">
          <button className="admin-menu-btn" onClick={() => setIsSidebarOpen(true)}>
            <LayoutDashboard size={20} />
          </button>
          <div className="admin-mobile-title">
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </div>
          <div style={{ width: 40 }} />
        </header>

        {/* ── Overview ──────────────────────────────── */}
        {tab === 'overview' && (
          <div className="admin-section animate-fade-in">
            <h2 className="admin-section-title">Dashboard Overview</h2>
            <div className="admin-stats-grid">
              {[
                { icon: <Users size={24} />, label: 'Total Members', value: stats.totalMembers, color: 'var(--color-primary)' },
                { icon: <TrendingUp size={24} />, label: 'Active Members', value: stats.activeMembers, color: 'var(--color-success)' },
                { icon: <Users size={24} />, label: 'Disabled', value: stats.disabledMembers, color: 'var(--color-error)' },
                { icon: <Image size={24} />, label: 'Total Posts', value: stats.totalPosts, color: 'var(--color-accent-2)' },
                { icon: <MessageCircle size={24} />, label: 'Messages', value: stats.totalMessages, color: 'var(--color-accent)' },
              ].map(({ icon, label, value, color }) => (
                <div className="admin-stat-card card" key={label}>
                  <div className="admin-stat-icon" style={{ color }}>{icon}</div>
                  <div className="admin-stat-value" style={{ color }}>{value}</div>
                  <div className="admin-stat-label">{label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Members Tab ───────────────────────────── */}
        {tab === 'members' && (
          <div className="admin-section animate-fade-in">
            <div className="admin-section-header">
              <h2 className="admin-section-title">Members ({members.length})</h2>
              <button className="btn btn-primary btn-sm" onClick={() => setShowAddMember(true)} id="add-member-btn">
                <Plus size={14} /> Add Member
              </button>
            </div>

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Username</th>
                    <th>Status</th>
                    <th className="hide-on-mobile">Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map(m => (
                    <tr key={m._id} id={`member-row-${m._id}`}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {m.profilePhoto?.url
                            ? <img src={m.profilePhoto.url} alt={m.name} className="avatar" style={{ width: 36, height: 36 }} />
                            : <div className="avatar" style={{ width: 36, height: 36, background: 'var(--color-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{m.name?.[0]?.toUpperCase()}</div>
                          }
                          <span style={{ fontWeight: 600, fontSize: 14 }}>{m.name}</span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--color-text-2)', fontSize: 13 }}>@{m.username}</td>
                      <td>
                        <span className={`badge ${m.isActive ? 'badge-success' : 'badge-error'}`}>
                          {m.isActive ? 'Active' : 'Off'}
                        </span>
                      </td>
                      <td className="hide-on-mobile" style={{ color: 'var(--color-text-2)', fontSize: 12 }}>
                        {new Date(m.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => setEditingMember(m)} title="Edit Member" id={`edit-${m._id}`}>
                            <Edit3 size={14} />
                          </button>
                          <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/members/${m.username}`)} title="View Profile">
                            <Eye size={14} />
                          </button>
                          <button
                            className={`btn btn-sm ${m.isActive ? 'btn-outline' : 'btn-ghost'}`}
                            onClick={() => toggleMember(m._id)}
                            title={m.isActive ? 'Disable' : 'Enable'}
                          >
                            {m.isActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => deleteMember(m._id, m.name)} title="Delete">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Posts Tab ─────────────────────────────── */}
        {tab === 'posts' && (
          <div className="admin-section animate-fade-in">
            <h2 className="admin-section-title">All Posts ({posts.length})</h2>
            <div className="admin-posts-grid">
              {posts.map(post => (
                <div key={post._id} className="admin-post-item" id={`admin-post-${post._id}`}>
                  {post.mediaType === 'video'
                    ? <video src={post.mediaUrl} className="admin-post-media" muted />
                    : <img src={post.mediaUrl} alt={post.caption} className="admin-post-media" loading="lazy" />
                  }
                  <div className="admin-post-overlay">
                    <button className="btn btn-ghost btn-sm" onClick={() => setLightboxPost(post)} style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}>
                      <Eye size={14} />
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => deletePost(post._id)} id={`del-post-${post._id}`}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="admin-post-author">@{post.author?.username}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      {showAddMember && (
        <AddMemberModal
          onClose={() => setShowAddMember(false)}
          onCreated={u => setMembers(prev => [u, ...prev])}
        />
      )}

      {editingMember && (
        <EditMemberModal
          member={editingMember}
          onClose={() => setEditingMember(null)}
          onSaved={updated => setMembers(prev => prev.map(m => m._id === updated._id ? updated : m))}
        />
      )}

      {lightboxPost && (
        <PostLightbox post={lightboxPost} onClose={() => setLightboxPost(null)} />
      )}

      {showLogoutConfirm && (
        <ConfirmLogoutModal
          onConfirm={handleLogout}
          onCancel={() => setShowLogoutConfirm(false)}
        />
      )}
    </div>
  );
}
