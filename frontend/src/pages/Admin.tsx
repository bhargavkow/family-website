import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Image, MessageCircle, TrendingUp,
  Plus, Trash2, Eye, ToggleLeft, ToggleRight, X, LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  apiAdminStats, apiAdminGetMembers, apiAdminCreateMember,
  apiAdminToggleMember, apiAdminDeleteMember,
  apiAdminGetPosts, apiAdminDeletePost,
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
            <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={loading} id="create-member-btn">
              {loading ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : 'Create Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Admin Page ───────────────────────────────────────────
export default function Admin() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<Stats | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddMember, setShowAddMember] = useState(false);
  const [lightboxPost, setLightboxPost] = useState<Post | null>(null);

  useEffect(() => {
    Promise.all([
      apiAdminStats().then(r => setStats(r.data)),
      apiAdminGetMembers().then(r => setMembers(r.data)),
      apiAdminGetPosts().then(r => setPosts(r.data.posts)),
    ]).finally(() => setLoading(false));
  }, []);

  const toggleMember = async (id: string) => {
    try {
      const res = await apiAdminToggleMember(id);
      setMembers(prev => prev.map(m => m._id === id ? { ...m, isActive: res.data.isActive } : m));
      toast.success(`Member ${res.data.isActive ? 'enabled' : 'disabled'}`);
    } catch { toast.error('Failed to toggle'); }
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

  if (loading) return <div className="loading-screen"><div className="spinner spinner-lg" /></div>;

  return (
    <div className="page admin-page">
      {/* ── Admin Header ─────────────────────────────── */}
      <div className="admin-header">
        <div className="admin-header-left">
          <span className="admin-logo">👑</span>
          <div>
            <h1 className="admin-title">Admin Panel</h1>
            <p style={{ color: 'var(--color-text-2)', fontSize: 12 }}>Welcome, {user?.name}</p>
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => { logout(); navigate('/'); }} id="admin-logout">
          <LogOut size={14} /> Logout
        </button>
      </div>

      {/* ── Tabs ─────────────────────────────────────── */}
      <div className="admin-tabs">
        {(['overview', 'members', 'posts'] as Tab[]).map(t => (
          <button
            key={t}
            className={`admin-tab ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}
            id={`tab-${t}`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div className="admin-content">

        {/* ── Overview ─────────────────────────────── */}
        {tab === 'overview' && stats && (
          <div className="admin-section">
            <div className="admin-stats-grid">
              {[
                { icon: Users, label: 'Total Members', value: stats.totalMembers, color: 'var(--color-primary)' },
                { icon: TrendingUp, label: 'Active Members', value: stats.activeMembers, color: 'var(--color-success)' },
                { icon: Users, label: 'Disabled Members', value: stats.disabledMembers, color: 'var(--color-error)' },
                { icon: Image, label: 'Total Posts', value: stats.totalPosts, color: 'var(--color-accent-2)' },
                { icon: MessageCircle, label: 'Total Messages', value: stats.totalMessages, color: 'var(--color-accent)' },
              ].map(({ icon: Icon, label, value, color }) => (
                <div className="admin-stat-card card" key={label}>
                  <div className="admin-stat-icon" style={{ color }}>
                    <Icon size={24} />
                  </div>
                  <div className="admin-stat-value" style={{ color }}>{value}</div>
                  <div className="admin-stat-label">{label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Members Tab ───────────────────────────── */}
        {tab === 'members' && (
          <div className="admin-section">
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
                    <th>Joined</th>
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
                          {m.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td style={{ color: 'var(--color-text-2)', fontSize: 12 }}>
                        {new Date(m.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/members/${m.username}`)} title="View Profile" id={`view-${m._id}`}>
                            <Eye size={14} />
                          </button>
                          <button
                            className={`btn btn-sm ${m.isActive ? 'btn-outline' : 'btn-ghost'}`}
                            onClick={() => toggleMember(m._id)}
                            title={m.isActive ? 'Disable' : 'Enable'}
                            id={`toggle-${m._id}`}
                          >
                            {m.isActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => deleteMember(m._id, m.name)} title="Delete" id={`delete-member-${m._id}`}>
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
          <div className="admin-section">
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
      </div>

      {/* Modals */}
      {showAddMember && (
        <AddMemberModal
          onClose={() => setShowAddMember(false)}
          onCreated={u => setMembers(prev => [u, ...prev])}
        />
      )}

      {lightboxPost && (
        <PostLightbox post={lightboxPost} onClose={() => setLightboxPost(null)} />
      )}
    </div>
  );
}
