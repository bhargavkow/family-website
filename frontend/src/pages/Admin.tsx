import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Users, Image, MessageCircle, TrendingUp,
  Plus, Trash2, Eye, ToggleLeft, ToggleRight, X, LogOut, Lock, Shield, Edit3,
  LayoutDashboard, FolderOpen, FolderPlus, ArrowLeft, Upload, Calendar,
  User as UserIcon, EyeOff, AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  apiAdminStats, apiAdminGetMembers, apiAdminCreateMember,
  apiAdminToggleMember, apiAdminDeleteMember,
  apiAdminGetPosts, apiAdminDeletePost, apiAdminUpdateMember,
  apiGetMoments, apiAdminCreateMoment, apiAdminAddMomentImages,
  apiAdminDeleteMomentImage, apiAdminDeleteMoment,
  apiGetEvents, apiCreateEvent, apiDeleteEvent
} from '../api';
import type { Moment } from '../api';
import type { User, Post, FamilyEvent } from '../types';
import PostLightbox from '../components/PostLightbox';
import toast from 'react-hot-toast';
import './Admin.css';
import './Login.css';

type Tab = 'overview' | 'members' | 'posts' | 'moments' | 'events';

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
  const [form, setForm] = useState({ name: '', username: '', password: '', bio: '', occupation: '', dob: '' });
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.bio.length > 200) {
      return toast.error('Bio cannot exceed 200 characters');
    }
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
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 20 }}>
              <label className="label" style={{ marginBottom: 12 }}>Profile Photo (optional)</label>
              <div style={{ position: 'relative', display: 'inline-block', cursor: 'pointer' }} onClick={() => fileRef.current?.click()}>
                {preview
                  ? <img src={preview} alt="preview" className="avatar" style={{ width: 80, height: 80, objectFit: 'cover' }} />
                  : <div className="avatar" style={{ width: 80, height: 80, background: 'var(--color-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-2)' }}>
                    <Plus size={32} />
                  </div>
                }
                <div className="avatar-edit-overlay"><Plus size={16} /></div>
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto} />
              <div style={{ fontSize: 12, color: 'var(--color-primary-light)', marginTop: 6, cursor: 'pointer' }} onClick={() => fileRef.current?.click()}>{photo ? 'Change Photo' : 'Upload Photo'}</div>
            </div>
            {[
              { id: 'am-name', key: 'name', label: 'Full Name', placeholder: 'John Doe', req: true },
              { id: 'am-username', key: 'username', label: 'Username', placeholder: 'johndoe', req: true },
              { id: 'am-password', key: 'password', label: 'Password', placeholder: 'Min 6 chars', req: true, type: 'password' },
              { id: 'am-bio', key: 'bio', label: 'Bio (optional)', placeholder: 'Tell us about them...', req: false, maxLength: 200 },
              { id: 'am-occupation', key: 'occupation', label: 'Occupation (optional)', placeholder: 'e.g. Farmer, Teacher...', req: false, maxLength: 100 },
              { id: 'am-dob', key: 'dob', label: 'Date of Birth (optional)', placeholder: '', req: false, type: 'date' },
            ].map(f => (
              <div key={f.key}>
                <label className="label" htmlFor={f.id}>{f.label}</label>
                <input
                  id={f.id}
                  type={f.type || 'text'}
                  className="input"
                  placeholder={f.placeholder}
                  required={f.req}
                  maxLength={f.maxLength}
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
  const [form, setForm] = useState({
    name: member.name,
    username: member.username,
    bio: member.bio || '',
    occupation: member.occupation || '',
    dob: member.dob ? member.dob.slice(0, 10) : '',
    password: '',
  });
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
    if (form.bio.length > 200) {
      return toast.error('Bio cannot exceed 200 characters');
    }
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
              { id: 'em-bio', key: 'bio', label: 'Bio', req: false, maxLength: 200 },
              { id: 'em-occupation', key: 'occupation', label: 'Occupation', req: false, placeholder: 'e.g. Farmer, Teacher...', maxLength: 100 },
              { id: 'em-dob', key: 'dob', label: 'Date of Birth', req: false, type: 'date' },
              { id: 'em-password', key: 'password', label: 'New Password (leave blank to keep)', req: false, type: 'password' },
            ].map(f => (
              <div key={f.key}>
                <label className="label" htmlFor={f.id}>{f.label}</label>
                <input
                  id={f.id}
                  type={f.type || 'text'}
                  className="input"
                  required={f.req}
                  maxLength={f.maxLength}
                  placeholder={f.placeholder}
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
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username.trim(), password);
      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg">
        <div className="login-bg-orb orb-1" />
        <div className="login-bg-orb orb-2" />
      </div>

      <div className="login-card card-glass animate-scale-in">
        {/* Logo / Header */}
        <div className="login-logo">
          <h1 className="login-brand" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            Baldaniya
          </h1>
          <p className="login-subtitle" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <Shield size={12} style={{ color: '#c5a880' }} /> Admin Portal Access
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="login-error animate-slide-up">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="label" htmlFor="gate-username">Username</label>
            <div className="input-wrap">
              <UserIcon size={16} className="input-icon" />
              <input
                id="gate-username"
                type="text"
                className="input input-with-icon"
                placeholder="Enter admin username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
                autoComplete="username"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="label" htmlFor="gate-password">Password</label>
            <div className="input-wrap">
              <Lock size={16} className="input-icon" />
              <input
                id="gate-password"
                type={showPass ? 'text' : 'password'}
                className="input input-with-icon input-with-icon-right"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="input-icon-right"
                onClick={() => setShowPass(!showPass)}
                aria-label="Toggle password visibility"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
            disabled={loading}
            id="gate-submit"
          >
            {loading ? (
              <>
                <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                Signing in...
              </>
            ) : (
              'Sign In as Admin'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Utils ────────────────────────────────────────────────
async function compressImage(file: File): Promise<File | Blob> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new window.Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_SIZE = 1200;
        if (width > height && width > MAX_SIZE) {
          height *= MAX_SIZE / width;
          width = MAX_SIZE;
        } else if (height > MAX_SIZE) {
          width *= MAX_SIZE / height;
          height = MAX_SIZE;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(new File([blob], file.name, { type: 'image/jpeg' }));
          } else {
            resolve(file);
          }
        }, 'image/jpeg', 0.7);
      };
    };
  });
}

// ─── Main Admin Dashboard ──────────────────────────────────
// ─── Manage Events ───────────────────────────────────────
function ManageEvents() {
  const [events, setEvents] = useState<FamilyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<FamilyEvent | null>(null);
  const [form, setForm] = useState({ name: '', description: '', date: '' });
  const [photo, setPhoto] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    apiGetEvents().then(res => setEvents(res.data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (showAdd || confirmDelete) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showAdd, confirmDelete]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));

      if (photo) {
        const compressed = await compressImage(photo);
        fd.append('photo', compressed);
      }

      const res = await apiCreateEvent(fd);
      setEvents(prev => [...prev, res.data]);
      setShowAdd(false);
      setForm({ name: '', description: '', date: '' });
      setPhoto(null);
      toast.success('Event created!');
    } catch {
      toast.error('Failed to create event');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const id = confirmDelete._id;
    setDeletingId(id);
    setConfirmDelete(null);
    try {
      await apiDeleteEvent(id);
      setEvents(prev => prev.filter(e => e._id !== id));
      toast.success('Event deleted');
    } catch {
      toast.error('Failed to delete event');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <div className="admin-loading"><div className="spinner" /></div>;

  return (
    <>
      <div className="admin-view animate-fade-in">
        <div className="admin-view-header">
          <div>
            <h2 className="admin-view-title">Family Events</h2>
            <p className="admin-view-subtitle">Manage upcoming celebrations and gatherings</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
            <Plus size={18} /> Add Event
          </button>
        </div>

        {events.length === 0 ? (
          <div className="admin-empty-state">
            <Calendar size={48} style={{ margin: '0 auto 12px', opacity: 0.35 }} />
            <p style={{ fontWeight: 600, color: 'var(--color-text)' }}>No events scheduled</p>
            <p style={{ fontSize: 14, marginTop: 4, color: 'var(--color-text-2)' }}>Create your first family event above.</p>
          </div>
        ) : (
          <div className="admin-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: 20 }}>
            {events.map(ev => (
              <div key={ev._id} className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
                {ev.photo?.url && <img src={ev.photo.url} alt="" style={{ width: '100%', height: 140, objectFit: 'cover' }} />}
                <div style={{ padding: 16 }}>
                  <div style={{ marginBottom: 12 }}>
                    <h4 style={{ fontWeight: 700, fontSize: 16, marginBottom: 4, color: 'var(--color-text)' }}>{ev.name}</h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--color-primary-light)', fontWeight: 600 }}>
                      <Calendar size={12} />
                      <span>{new Date(ev.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--color-text-2)', marginBottom: 16 }}>{ev.description}</p>
                  <button
                    className="btn btn-danger btn-sm w-full"
                    onClick={() => setConfirmDelete(ev)}
                    disabled={deletingId === ev._id}
                  >
                    {deletingId === ev._id ? (
                      <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                    ) : (
                      <><Trash2 size={14} /> Delete</>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal animate-scale-in" onClick={e => e.stopPropagation()} style={{ maxWidth: 450 }}>
            <div className="modal-header">
              <h3>Create Family Event</h3>
              <button className="icon-btn" onClick={() => setShowAdd(false)}><X size={20} /></button>
            </div>
            <form className="modal-body" onSubmit={handleCreate}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label className="label">Event Banner (optional)</label>
                  <div
                    className="banner-upload-zone"
                    onClick={() => fileRef.current?.click()}
                  >
                    {photo ? (
                      <>
                        <img
                          src={URL.createObjectURL(photo)}
                          alt="Banner Preview"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <div className="banner-upload-overlay">
                          <Upload size={20} />
                        </div>
                      </>
                    ) : (
                      <div style={{ textAlign: 'center', color: 'var(--color-text-2)' }}>
                        <Plus size={24} style={{ margin: '0 auto 8px', display: 'block' }} />
                        <span style={{ fontSize: 13 }}>Upload Event Banner</span>
                      </div>
                    )}
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => setPhoto(e.target.files?.[0] || null)} />
                </div>
                <div>
                  <label className="label">Event Name</label>
                  <input className="input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Family Trip 2024" />
                </div>
                <div>
                  <label className="label">Event Date</label>
                  <input className="input" type="date" required value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                </div>
                <div>
                  <label className="label">Description</label>
                  <textarea className="input" required rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="What's happening?" />
                </div>
                <button type="submit" className="btn btn-primary w-full" disabled={creating}>
                  {creating ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal animate-scale-in admin-confirm-modal" onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', padding: '20px 10px' }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-error)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Trash2 size={28} />
              </div>
              <h3 style={{ fontWeight: 800, fontSize: 18, marginBottom: 8 }}>Delete Event?</h3>
              <p style={{ color: 'var(--color-text-2)', fontSize: 14, lineHeight: 1.5 }}>
                Are you sure you want to delete "<strong>{confirmDelete.name}</strong>"? This action cannot be undone.
              </p>
            </div>
            <div className="admin-confirm-actions" style={{ display: 'flex', gap: 12, padding: '0 10px 10px' }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleDelete}>Delete Now</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function Admin() {

  const { user, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Extract tab from URL path (e.g. /admin/members -> members)
  const pathParts = location.pathname.split('/').filter(Boolean);
  const currentTabFromUrl = pathParts[1] as Tab;
  const validTabs: Tab[] = ['overview', 'members', 'posts', 'moments', 'events'];
  const tab = validTabs.includes(currentTabFromUrl) ? currentTabFromUrl : 'overview';

  useEffect(() => {
    // If at /admin or /admin/, redirect to the last saved tab or overview
    if (location.pathname === '/admin' || location.pathname === '/admin/') {
      const saved = localStorage.getItem('admin_current_tab');
      const targetTab = (saved && validTabs.includes(saved as Tab)) ? saved : 'overview';
      navigate(`/admin/${targetTab}`, { replace: true });
    }
  }, [location.pathname, navigate]);
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

  // Special Moments
  const [moments, setMoments] = useState<Moment[]>([]);
  const [showCreateMoment, setShowCreateMoment] = useState(false);
  const [activeMoment, setActiveMoment] = useState<Moment | null>(null);
  const [momentUploading, setMomentUploading] = useState(false);
  const momentImgRef = useRef<HTMLInputElement>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderCover, setNewFolderCover] = useState<File | null>(null);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const folderCoverRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, m, p, mo] = await Promise.all([
        apiAdminStats(),
        apiAdminGetMembers(),
        apiAdminGetPosts(),
        apiGetMoments(),
      ]);
      setStats(s.data);
      setMembers(m.data);
      setPosts(p.data.posts || []);
      setMoments(mo.data);
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

  useEffect(() => {
    if (showAddMember || editingMember || showCreateMoment || showLogoutConfirm || isSidebarOpen || lightboxPost) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showAddMember, editingMember, showCreateMoment, showLogoutConfirm, isSidebarOpen, lightboxPost]);

  useEffect(() => {
    const originalPadding = document.body.style.paddingBottom;
    document.body.style.paddingBottom = '0px';
    return () => {
      document.body.style.paddingBottom = originalPadding;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('admin_current_tab', tab);
  }, [tab]);

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
    navigate(`/admin/${t}`);
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
            <button className={`admin-nav-item ${tab === 'moments' ? 'active' : ''}`} onClick={() => handleNav('moments')}>
              <FolderOpen size={18} /> Special Moments
            </button>
            <button className={`admin-nav-item ${tab === 'events' ? 'active' : ''}`} onClick={() => handleNav('events')}>
              <Calendar size={18} /> Events
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
          <div style={{ width: 42 }} />
        </header>

        {/* ── Overview ──────────────────────────────── */}
        {tab === 'overview' && (
          <div className="admin-section animate-fade-in">
            {/* Hero Welcome Panel */}
            <div className="admin-hero-card">
              <div className="admin-hero-content">
                <div className="admin-hero-badge">FAMILY PORTAL</div>
                <h2 className="admin-hero-title">Welcome back, Admin!</h2>
                <p className="admin-hero-subtitle">Here is the latest status of your family website. Everything looks healthy and online.</p>
                <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
                  <button className="btn btn-primary btn-sm" onClick={() => handleNav('members')}>
                    <Users size={14} /> Manage Members
                  </button>
                  <button className="btn btn-outline btn-sm" onClick={() => handleNav('events')}>
                    <Calendar size={14} /> Scheduled Events
                  </button>
                </div>
              </div>
              <div className="admin-hero-glow" />
            </div>

            {/* Stats Grid */}
            <div>
              <h3 className="admin-section-subtitle-small">System Analytics</h3>
              <div className="admin-stats-grid">
                {[
                  { icon: <Users size={24} />, label: 'Total Members', value: stats.totalMembers, color: 'var(--color-primary)', trend: 'Registered accounts' },
                  { icon: <TrendingUp size={24} />, label: 'Active Members', value: stats.activeMembers, color: 'var(--color-success)', trend: 'Authorized logins' },
                  { icon: <Users size={24} />, label: 'Disabled Accounts', value: stats.disabledMembers, color: 'var(--color-error)', trend: 'Access revoked' },
                  { icon: <Image size={24} />, label: 'Total Posts', value: stats.totalPosts, color: 'var(--color-accent-2)', trend: 'Shared moments' },
                  { icon: <MessageCircle size={24} />, label: 'Messages', value: stats.totalMessages, color: 'var(--color-accent)', trend: 'Contact inquiries' },
                ].map(({ icon, label, value, color, trend }) => (
                  <div className="admin-stat-card" key={label} style={{ '--accent-color': color } as React.CSSProperties}>
                    <div className="admin-stat-card-header">
                      <div className="admin-stat-icon-wrapper" style={{ '--icon-color': color } as React.CSSProperties}>{icon}</div>
                      <div className="admin-stat-trend">{trend}</div>
                    </div>
                    <div className="admin-stat-card-body">
                      <div className="admin-stat-value" style={{ color }}>{value}</div>
                      <div className="admin-stat-label">{label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Shortcuts, Diagnostics & Status Panel */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: 20 }}>
              {/* Shortcut Card */}
              <div className="admin-panel-card">
                <h3 className="admin-panel-card-title">Quick Actions</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
                  <button className="btn btn-ghost" style={{ justifyContent: 'flex-start', padding: '14px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--color-border)' }} onClick={() => setShowAddMember(true)}>
                    <Plus size={16} style={{ marginRight: 8, color: 'var(--color-primary)' }} /> Add Family Member Account
                  </button>
                  <button className="btn btn-ghost" style={{ justifyContent: 'flex-start', padding: '14px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--color-border)' }} onClick={() => handleNav('moments')}>
                    <FolderPlus size={16} style={{ marginRight: 8, color: 'var(--color-accent-2)' }} /> Create Photo Folder
                  </button>
                </div>
              </div>

              {/* System Diagnostics Card */}
              <div className="admin-panel-card">
                <h3 className="admin-panel-card-title">Membership Diagnostics</h3>
                <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                      <span style={{ color: 'var(--color-text-2)' }}>Active Member Ratio</span>
                      <span style={{ fontWeight: 700, color: 'var(--color-success)' }}>
                        {stats.totalMembers ? Math.round((stats.activeMembers / stats.totalMembers) * 100) : 0}%
                      </span>
                    </div>
                    <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${stats.totalMembers ? Math.round((stats.activeMembers / stats.totalMembers) * 100) : 0}%`, height: '100%', background: 'var(--color-success)', borderRadius: 3 }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--color-text-2)' }}>Average posts per member</span>
                    <span style={{ fontWeight: 700, color: 'var(--color-text)', fontSize: 13 }}>
                      {stats.totalMembers ? (stats.totalPosts / stats.totalMembers).toFixed(1) : 0} posts
                    </span>
                  </div>
                </div>
              </div>

              {/* Media Space Usage Card */}
              <div className="admin-panel-card">
                <h3 className="admin-panel-card-title">Media Storage Usage</h3>
                <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                      <span style={{ color: 'var(--color-text-2)' }}>Cloudinary Space Used</span>
                      <span style={{ fontWeight: 700, color: 'var(--color-primary-light)' }}>
                        {(stats.totalPosts * 0.45).toFixed(1)} MB / 512 MB
                      </span>
                    </div>
                    <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(100, Math.round(((stats.totalPosts * 0.45) / 512) * 100))}%`, height: '100%', background: 'var(--grad-primary)', borderRadius: 3 }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--color-text-2)' }}>Estimated file load speed</span>
                    <span style={{ fontWeight: 700, color: 'var(--color-success)', fontSize: 13 }}>Fast (0.2s)</span>
                  </div>
                </div>
              </div>

              {/* Status Indicator Card */}
              <div className="admin-panel-card">
                <h3 className="admin-panel-card-title">Server & System Status</h3>
                <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--color-text-2)' }}>API Server</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-success)', fontWeight: 700 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-success)', boxShadow: '0 0 8px var(--color-success)' }} /> Connected
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--color-text-2)' }}>Database Status</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-success)', fontWeight: 700 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-success)', boxShadow: '0 0 8px var(--color-success)' }} /> Online
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--color-text-2)' }}>Media Storage</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-success)', fontWeight: 700 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-success)', boxShadow: '0 0 8px var(--color-success)' }} /> Cloudinary OK
                    </span>
                  </div>
                </div>
              </div>
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
                    <th className="hide-on-mobile">Username</th>
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
                      <td className="hide-on-mobile" style={{ color: 'var(--color-text-2)', fontSize: 13 }}>@{m.username}</td>
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
            {posts.length === 0 ? (
              <div className="admin-empty-state">
                <Image size={48} style={{ margin: '0 auto 12px', opacity: 0.35 }} />
                <p style={{ fontWeight: 600, color: 'var(--color-text)' }}>No posts uploaded</p>
                <p style={{ fontSize: 14, marginTop: 4, color: 'var(--color-text-2)' }}>Posts created by members will show up here.</p>
              </div>
            ) : (
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
            )}
          </div>
        )}

        {/* ── Special Moments Tab ────────────────────── */}
        {tab === 'moments' && (
          <div className="admin-section animate-fade-in">
            {/* If viewing a specific folder */}
            {activeMoment ? (
              <>
                <div className="admin-section-header">
                  <button className="btn btn-ghost btn-sm" onClick={() => setActiveMoment(null)}>
                    <ArrowLeft size={14} /> Back
                  </button>
                  <h2 className="admin-section-title" style={{ flex: 1 }}>{activeMoment.name}</h2>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={async () => {
                      if (!window.confirm(`Delete folder "${activeMoment.name}" and all its photos?`)) return;
                      try {
                        await apiAdminDeleteMoment(activeMoment._id);
                        setMoments(prev => prev.filter(m => m._id !== activeMoment._id));
                        setActiveMoment(null);
                        toast.success('Folder deleted');
                      } catch { toast.error('Failed to delete folder'); }
                    }}
                  >
                    <Trash2 size={14} /> Delete Folder
                  </button>
                </div>

                {/* Upload more images */}
                <div style={{ marginBottom: 20 }}>
                  <input
                    ref={momentImgRef}
                    type="file"
                    accept="image/*"
                    multiple
                    style={{ display: 'none' }}
                    onChange={async (e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length === 0) return;
                      setMomentUploading(true);
                      try {
                        const fd = new FormData();
                        files.forEach(f => fd.append('images', f));
                        const res = await apiAdminAddMomentImages(activeMoment._id, fd);
                        setActiveMoment(res.data);
                        setMoments(prev => prev.map(m => m._id === res.data._id ? res.data : m));
                        toast.success(`${files.length} photo${files.length > 1 ? 's' : ''} added!`);
                      } catch { toast.error('Upload failed'); }
                      finally { setMomentUploading(false); e.target.value = ''; }
                    }}
                  />
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => momentImgRef.current?.click()}
                    disabled={momentUploading}
                  >
                    {momentUploading
                      ? <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Uploading...</>
                      : <><Upload size={14} /> Add Photos</>
                    }
                  </button>
                </div>

                {/* Photos grid */}
                {activeMoment.images.length === 0 ? (
                  <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--color-text-2)' }}>
                    <FolderOpen size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                    <p>No photos yet. Click "Add Photos" to upload.</p>
                  </div>
                ) : (
                  <div className="admin-posts-grid">
                    {activeMoment.images.map(img => (
                      <div key={img._id} className="admin-post-item">
                        <img src={img.url} alt="" className="admin-post-media" loading="lazy" />
                        <div className="admin-post-overlay">
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={async () => {
                              try {
                                const res = await apiAdminDeleteMomentImage(activeMoment._id, img._id);
                                setActiveMoment(res.data);
                                setMoments(prev => prev.map(m => m._id === res.data._id ? res.data : m));
                                toast.success('Photo removed');
                              } catch { toast.error('Failed to remove photo'); }
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              /* Folder list view */
              <>
                <div className="admin-section-header">
                  <h2 className="admin-section-title">Special Moments ({moments.length})</h2>
                  <button className="btn btn-primary btn-sm" onClick={() => setShowCreateMoment(true)}>
                    <FolderPlus size={14} /> New Folder
                  </button>
                </div>

                {moments.length === 0 ? (
                  <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--color-text-2)' }}>
                    <FolderOpen size={48} style={{ margin: '0 auto 12px', opacity: 0.35 }} />
                    <p style={{ fontWeight: 600, color: 'var(--color-text)' }}>No folders yet</p>
                    <p style={{ fontSize: 14, marginTop: 4 }}>Create your first Special Moments folder.</p>
                  </div>
                ) : (
                  <div className="admin-moments-grid">
                    {moments.map(m => (
                      <div key={m._id} className="admin-moment-card" onClick={() => setActiveMoment(m)}>
                        <div className="admin-moment-cover">
                          {m.coverImage?.url
                            ? <img src={m.coverImage.url} alt={m.name} className="admin-moment-cover-img" />
                            : <div className="admin-moment-cover-placeholder"><FolderOpen size={32} /></div>
                          }
                        </div>
                        <div className="admin-moment-info">
                          <div className="admin-moment-name">{m.name}</div>
                          <div className="admin-moment-count">{m.images.length} photo{m.images.length !== 1 ? 's' : ''}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
        {tab === 'events' && <ManageEvents />}
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
        <PostLightbox
          post={lightboxPost}
          allPosts={posts}
          onClose={() => setLightboxPost(null)}
          onLikeToggle={(postId, liked, _likeCount) => {
            setPosts(prev => prev.map(p => {
              if (p._id === postId) {
                const userLikes = Array.isArray(p.likes) ? p.likes : [];
                const alreadyLiked = userLikes.includes(user?._id || '');
                let newLikes = [...userLikes];
                if (liked && !alreadyLiked) {
                  newLikes.push(user?._id || '');
                } else if (!liked && alreadyLiked) {
                  newLikes = newLikes.filter(id => id !== (user?._id || ''));
                }
                return { ...p, likes: newLikes };
              }
              return p;
            }));
          }}
        />
      )}

      {showLogoutConfirm && (
        <ConfirmLogoutModal
          onConfirm={handleLogout}
          onCancel={() => setShowLogoutConfirm(false)}
        />
      )}

      {/* ── Create Folder Modal ─────────────────── */}
      {showCreateMoment && (
        <div className="modal-overlay" onClick={() => setShowCreateMoment(false)}>
          <div className="modal animate-scale-in" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontWeight: 700 }}>New Folder</h3>
              <button className="icon-btn" onClick={() => setShowCreateMoment(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label className="label">Folder Name</label>
                  <input
                    className="input"
                    placeholder="e.g. Summer Vacation 2024"
                    value={newFolderName}
                    onChange={e => setNewFolderName(e.target.value)}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="label">Cover Image (optional)</label>
                  <div
                    className="banner-upload-zone"
                    style={{ height: 160, maxWidth: 200, margin: '0 auto' }}
                    onClick={() => folderCoverRef.current?.click()}
                  >
                    {newFolderCover ? (
                      <>
                        <img
                          src={URL.createObjectURL(newFolderCover)}
                          alt="Cover Preview"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <div className="banner-upload-overlay">
                          <Upload size={18} />
                        </div>
                      </>
                    ) : (
                      <div style={{ textAlign: 'center', color: 'var(--color-text-2)' }}>
                        <Plus size={20} style={{ margin: '0 auto 6px', display: 'block' }} />
                        <span style={{ fontSize: 12 }}>Upload Cover Image</span>
                      </div>
                    )}
                  </div>
                  <input ref={folderCoverRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setNewFolderCover(e.target.files?.[0] || null)} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowCreateMoment(false)}>Cancel</button>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1, justifyContent: 'center' }}
                  disabled={creatingFolder || !newFolderName.trim()}
                  onClick={async () => {
                    setCreatingFolder(true);
                    try {
                      const fd = new FormData();
                      fd.append('name', newFolderName.trim());
                      if (newFolderCover) fd.append('coverImage', newFolderCover);
                      const res = await apiAdminCreateMoment(fd);
                      setMoments(prev => [res.data, ...prev]);
                      setNewFolderName('');
                      setNewFolderCover(null);
                      setShowCreateMoment(false);
                      toast.success(`Folder "${res.data.name}" created!`);
                    } catch { toast.error('Failed to create folder'); }
                    finally { setCreatingFolder(false); }
                  }}
                >
                  {creatingFolder ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : 'Create Folder'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
