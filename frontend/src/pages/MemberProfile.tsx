import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { X, Play, Grid, Film, Settings, Search, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiGetMember, apiFollow, apiGetFollowers, apiGetFollowing, apiUpdateProfile, apiCreatePost, apiDeletePost } from '../api';
import type { User, Post } from '../types';
import PostLightbox from '../components/PostLightbox';
import SettingsMenu from '../components/SettingsMenu';
import useEmblaCarousel from 'embla-carousel-react';
import toast from 'react-hot-toast';
import './MemberProfile.css';

// ─── Confirm Popup
function ConfirmModal({ message, onConfirm, onCancel }: {
  message: string; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div className="modal-overlay" onClick={onCancel} style={{ zIndex: 2000 }}>
      <div className="modal animate-scale-in confirm-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 320, textAlign: 'center', padding: 24 }}>
        <p style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>{message}</p>
        <p style={{ color: 'var(--color-text-2)', fontSize: 14, marginBottom: 24 }}>Are you sure you want to log out of your account?</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, borderTop: '1px solid var(--color-border)', margin: '0 -24px -24px' }}>
          <button style={{ background: 'none', border: 'none', padding: '14px', color: 'var(--color-error)', fontWeight: 700, borderBottom: '1px solid var(--color-border)', cursor: 'pointer' }} onClick={onConfirm}>Log Out</button>
          <button style={{ background: 'none', border: 'none', padding: '14px', color: 'var(--color-text)', cursor: 'pointer' }} onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ─── Follower/Following Modal ─────────────────────────────
function UserListModal({
  profileUsername, initialTab, followersList, followingList, meFollowingIds, onClose,
}: {
  profileUsername: string;
  initialTab: 'followers' | 'following';
  followersList: User[];
  followingList: User[];
  meFollowingIds: Set<string>;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const { user: me } = useAuth();
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(initialTab);
  const [search, setSearch] = useState('');
  // Local copy so follow-back clicks update UI immediately
  const [followingSet, setFollowingSet] = useState<Set<string>>(new Set(meFollowingIds));

  const currentList = activeTab === 'followers' ? followersList : followingList;
  const filtered = currentList.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    (u.name && u.name.toLowerCase().includes(search.toLowerCase()))
  );

  const handleFollowBack = async (u: User) => {
    try {
      await apiFollow(u.username);
      setFollowingSet(prev => { const s = new Set(prev); s.add(u._id); return s; });
      toast.success(`Following ${u.username}!`);
    } catch { toast.error('Failed to follow'); }
  };

  const touchStartX = useRef<number>(0);
  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = touchStartX.current - e.changedTouches[0].clientX;
    if (dx > 60) { setActiveTab('following'); setSearch(''); }
    else if (dx < -60) { setActiveTab('followers'); setSearch(''); }
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: 'var(--color-bg)',
      display: 'flex', flexDirection: 'column',
      animation: 'slideInRight 0.25s cubic-bezier(0.32,0.72,0,1)',
    }}>
      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center',
        height: 54, padding: '0 4px',
        borderBottom: '1px solid var(--color-border)',
        position: 'relative', flexShrink: 0,
      }}>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', padding: '10px 12px',
          cursor: 'pointer', color: 'var(--color-text)', display: 'flex', alignItems: 'center',
        }}>
          <ArrowLeft size={26} strokeWidth={2.2} />
        </button>
        <div style={{
          position: 'absolute', left: 0, right: 0,
          textAlign: 'center', fontWeight: 700, fontSize: 17,
          color: 'var(--color-text)', pointerEvents: 'none',
        }}>
          {profileUsername}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
        {(['followers', 'following'] as const).map(tab => (
          <button key={tab} onClick={() => { setActiveTab(tab); setSearch(''); }} style={{
            flex: 1, background: 'none', border: 'none',
            padding: '14px 0',
            fontWeight: activeTab === tab ? 700 : 500,
            fontSize: 15,
            color: activeTab === tab ? 'var(--color-text)' : 'var(--color-text-2)',
            borderBottom: activeTab === tab ? '2px solid var(--color-text)' : '2px solid transparent',
            cursor: 'pointer', transition: 'all 0.2s',
          }}>
            {tab === 'followers'
              ? `${followersList.length} Followers`
              : `${followingList.length} Following`}
          </button>
        ))}
      </div>

      {/* ── Search ── */}
      <div style={{ padding: '12px 16px', flexShrink: 0 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'var(--color-surface-2)',
          borderRadius: 12, padding: '10px 14px',
        }}>
          <Search size={16} style={{ color: 'var(--color-text-2)', flexShrink: 0 }} />
          <input
            type="text" placeholder="Search"
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 16, color: 'var(--color-text)' }}
            autoComplete="off"
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--color-text-2)' }}>
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* ── User List ── */}
      <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--color-text-2)', fontSize: 15 }}>
            No users found
          </div>
        ) : filtered.map(u => {
          const isMe = me?._id === u._id || me?.username === u.username;
          // Determine button to show
          // Following tab → always Message
          // Followers tab → if me already follows u → Message, else → Follow back (blue)
          const iFollowThem = followingSet.has(u._id);
          const showMessage = activeTab === 'following' || iFollowThem;

          return (
            <div key={u._id} style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', gap: 14 }}>
              {/* Avatar */}
              <div onClick={() => { navigate(`/members/${u.username}`); onClose(); }}
                style={{ cursor: 'pointer', flexShrink: 0 }}>
                {u.profilePhoto?.url ? (
                  <img src={u.profilePhoto.url} alt={u.name}
                    style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{
                    width: 52, height: 52, borderRadius: '50%',
                    background: 'var(--grad-primary)', color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: 20,
                  }}>{u.name?.[0]?.toUpperCase()}</div>
                )}
              </div>

              {/* Info */}
              <div onClick={() => { navigate(`/members/${u.username}`); onClose(); }}
                style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.username}</div>
                <div style={{ fontSize: 13, color: 'var(--color-text-2)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</div>
              </div>

              {/* Action Button */}
              {!isMe && me && (
                showMessage ? (
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onClose();
                      navigate('/messages', { state: { chatUser: u } });
                    }}
                    style={{
                      flexShrink: 0, padding: '8px 18px', borderRadius: 10,
                      border: '1.5px solid var(--color-border)', cursor: 'pointer',
                      fontWeight: 700, fontSize: 14,
                      background: 'var(--color-surface)', color: 'var(--color-text)',
                    }}
                  >
                    Message
                  </button>
                ) : (
                  <button
                    onClick={e => { e.stopPropagation(); handleFollowBack(u); }}
                    style={{
                      flexShrink: 0, padding: '8px 18px', borderRadius: 10,
                      border: 'none', cursor: 'pointer',
                      fontWeight: 700, fontSize: 14,
                      background: 'var(--color-primary)', color: '#fff',
                    }}
                  >
                    Follow back
                  </button>
                )
              )}
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

// ─── Edit Profile Modal ───────────────────────────────────
function EditProfileModal({ user, onClose, onSave }: { user: User; onClose: () => void; onSave: (u: User) => void }) {
  const [name, setName] = useState(user.name);
  const [username, setUsername] = useState(user.username);
  const [bio, setBio] = useState(user.bio || '');
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState(user.profilePhoto?.url || '');
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('name', name);
      fd.append('username', username);
      fd.append('bio', bio);
      if (photo) {
        const optimized = await compressImage(photo);
        fd.append('profilePhoto', optimized, photo.name);
      }
      const res = await apiUpdateProfile(user.username, fd);
      onSave(res.data.user);
      toast.success('Profile updated!');
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal animate-scale-in" onClick={e => e.stopPropagation()} id="edit-profile-modal" style={{ maxWidth: 420 }}>
        <div className="modal-header" style={{ borderBottom: '1px solid var(--color-border)', padding: '12px 16px' }}>
          <button className="btn btn-ghost" style={{ border: 'none', background: 'none', fontSize: 14 }} onClick={onClose}>Cancel</button>
          <h3 style={{ fontWeight: 700, fontSize: 16 }}>Edit profile</h3>
          <button className="btn btn-ghost" style={{ border: 'none', background: 'none', fontSize: 14, color: 'var(--color-primary)', fontWeight: 700 }} onClick={handleSave} disabled={loading}>
            {loading ? <div className="spinner" style={{ width: 16, height: 16 }} /> : 'Done'}
          </button>
        </div>
        <div className="modal-body" style={{ padding: '24px 20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
            <div className="edit-avatar-wrap" onClick={() => fileRef.current?.click()}>
              {preview
                ? <img src={preview} alt="profile" className="avatar" style={{ width: 84, height: 84, border: 'none', objectFit: 'cover' }} />
                : <div className="avatar edit-initial" style={{ width: 84, height: 84, fontSize: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{user.name?.[0]?.toUpperCase()}</div>
              }
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto} id="profile-photo-input" />
            <button style={{ fontSize: 14, color: 'var(--color-primary)', fontWeight: 600, background: 'none', marginTop: 12 }} onClick={() => fileRef.current?.click()}>
              Edit picture or avatar
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="edit-field">
              <label className="label" style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Name</label>
              <input id="edit-name" className="input-minimal" value={name} onChange={e => setName(e.target.value)} placeholder="Name" />
            </div>
            <div className="edit-field">
              <label className="label" style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Username</label>
              <input id="edit-username" className="input-minimal" value={username} onChange={e => setUsername(e.target.value.toLowerCase())} placeholder="Username" />
            </div>
            <div className="edit-field">
              <label className="label" style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Bio</label>
              <textarea
                className="input-minimal"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={2}
                maxLength={300}
                placeholder="Bio"
                style={{ resize: 'none' }}
              />
            </div>
          </div>
        </div>
      </div>
      <style>{`
        .input-minimal {
          width: 100%;
          background: none;
          border: none;
          border-bottom: 1px solid var(--color-border);
          padding: 8px 0;
          color: var(--color-text);
          font-size: 15px;
          border-radius: 0;
          transition: border-color 0.2s;
        }
        .input-minimal:focus {
          outline: none;
          border-bottom-color: var(--color-primary);
        }
      `}</style>
    </div>
  );
}

// ─── Utils ────────────────────────────────────────────────
async function compressImage(file: File): Promise<File | Blob> {
  if (file.type.startsWith('video/')) return file;
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
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
        canvas.toBlob((blob) => resolve(blob || file), 'image/jpeg', 0.8);
      };
    };
  });
}

// ─── Create Post Modal ────────────────────────────────────
function CreatePostModal({ onClose, onCreated }: { onClose: () => void; onCreated: (p: Post) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview); };
  }, [preview]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 100 * 1024 * 1024) return toast.error('File too large (max 100MB)');
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const { user: me } = useAuth();

  const handleCreate = async () => {
    if (!file) return toast.error('Please select a file');
    setLoading(true);
    setProgress(0);
    try {
      const optimizedFile = await compressImage(file);
      const fd = new FormData();
      fd.append('media', optimizedFile, file.name);
      fd.append('caption', caption);
      
      const res = await apiCreatePost(fd, {
        onUploadProgress: (ev: any) => {
          const percent = Math.round((ev.loaded * 100) / ev.total);
          setProgress(percent);
        }
      });
      
      onCreated(res.data);
      toast.success('Post shared successfully!');
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Failed to share post. Try a smaller file.');
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  return (
    <div className="modal-overlay" onClick={loading ? undefined : onClose}>
      <div className="modal animate-scale-in" style={{ maxWidth: file ? 800 : 420 }} onClick={e => e.stopPropagation()} id="create-post-modal">
        <div className="modal-header" style={{ borderBottom: '1px solid var(--color-border)', padding: '12px 16px', display: 'flex', alignItems: 'center' }}>
          {!loading && <button className="icon-btn" onClick={onClose} style={{ border: 'none', background: 'none' }}><X size={24} /></button>}
          <h3 style={{ fontWeight: 700, fontSize: 16, flex: 1, textAlign: 'center' }}>Create new post</h3>
          <button 
            className="btn btn-ghost" 
            style={{ border: 'none', background: 'none', fontSize: 14, color: file ? 'var(--color-primary)' : 'var(--color-text-3)', fontWeight: 700 }} 
            onClick={handleCreate} 
            disabled={loading || !file}
          >
            {loading ? <div className="spinner" style={{ width: 16, height: 16 }} /> : 'Share'}
          </button>
        </div>
        <div className="modal-body" style={{ padding: 0 }}>
          {!file ? (
            <div className="upload-zone" onClick={() => fileRef.current?.click()} id="upload-zone" style={{ height: 450, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 20 }}>
              <div style={{ color: 'var(--color-text-2)', marginBottom: 20 }}>
                <Grid size={96} strokeWidth={1} />
              </div>
              <p style={{ fontSize: 22, fontWeight: 300, color: 'var(--color-text)', marginBottom: 8 }}>Drag photos and videos here</p>
              <p style={{ fontSize: 14, color: 'var(--color-text-2)', marginBottom: 24 }}>Select images or videos up to 100MB</p>
              <button className="btn btn-primary" style={{ borderRadius: 8, padding: '10px 24px', fontWeight: 600, fontSize: 14 }}>Select from device</button>
            </div>
          ) : (
            <div className="post-create-layout" style={{ display: 'flex', height: 480, flexDirection: window.innerWidth < 640 ? 'column' : 'row' }}>
              <div className="post-preview-container" style={{ flex: 1.5, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {file.type.startsWith('video/')
                  ? <video src={preview} controls style={{ maxWidth: '100%', maxHeight: '100%' }} />
                  : <img src={preview} alt="preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                }
              </div>
              <div className="post-create-sidebar" style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', borderLeft: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
                  {me?.profilePhoto?.url ? (
                    <img src={me.profilePhoto.url} alt={me.username} className="avatar" style={{ width: 32, height: 32 }} />
                  ) : (
                    <div className="avatar" style={{ width: 32, height: 32, background: 'var(--color-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600 }}>
                      {me?.username?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{me?.username}</span>
                </div>
                <textarea 
                  id="post-caption" 
                  className="caption-input" 
                  rows={10} 
                  placeholder="Write a caption..." 
                  value={caption} 
                  onChange={e => setCaption(e.target.value)} 
                  disabled={loading} 
                  style={{ border: 'none', background: 'none', color: 'var(--color-text)', fontSize: 15, padding: 0, resize: 'none', flex: 1 }} 
                />
              </div>
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={handleFile} id="post-file-input" />

          {loading && (
            <div className="upload-progress-overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'white' }}>
               <div className="spinner" style={{ width: 40, height: 40, marginBottom: 16 }} />
               <span>Sharing {progress}%</span>
            </div>
          )}
        </div>
      </div>
      <style>{`
        .caption-input:focus { outline: none; }
        
        @media (max-width: 640px) {
          #create-post-modal {
            width: 100% !important;
            height: 100% !important;
            max-width: none !important;
            border-radius: 0 !important;
            margin: 0 !important;
          }
          .post-create-layout {
            flex-direction: column !important;
            height: calc(100vh - 60px) !important;
            overflow-y: auto;
          }
          .post-preview-container {
            min-height: 350px !important;
            max-height: 450px !important;
          }
          .post-create-sidebar {
            border-left: none !important;
            border-top: 1px solid var(--color-border);
            flex: none !important;
            padding-bottom: 40px !important;
          }
        }
      `}</style>
    </div>
  );
}

// ─── Post Grid Item ───────────────────────────────────────
function PostItem({ post, onClick }: { post: Post; onClick: () => void }) {
  return (
    <div className="post-item" onClick={onClick} id={`post-${post._id}`}>
      {post.mediaType === 'video'
        ? <video src={post.mediaUrl} className="post-item-media" muted />
        : <img src={post.mediaUrl} alt={post.caption} className="post-item-media" loading="lazy" />
      }
      <div className="post-item-overlay">
        {post.mediaType === 'video' && <Play size={24} fill="white" />}
        <span className="post-item-likes">❤️ {post.likes?.length || 0}</span>
      </div>
    </div>
  );
}

// ─── Post Grid ────────────────────────────────────────────
function PostGrid({ posts, onPostClick, emptyTitle }: {
  posts: Post[]; isOwn: boolean; onDelete: (id: string) => void; onPostClick: (p: Post) => void; emptyTitle: string;
}) {
  if (posts.length === 0) {
    return (
      <div className="profile-empty">
        <div className="profile-empty-icon">
          <Grid size={40} />
        </div>
        <h2 className="profile-empty-title">{emptyTitle}</h2>
      </div>
    );
  }

  return (
    <div className="profile-posts-grid">
      {posts.map((post) => (
        <div key={post._id} className="profile-post-wrapper">
          <PostItem post={post} onClick={() => onPostClick(post)} />
        </div>
      ))}
    </div>
  );
}

// ─── Main Profile Page ────────────────────────────────────
export default function MemberProfile({ usernameOverride }: { usernameOverride?: string } = {}) {
  const params = useParams<{ username: string }>();
  const username = usernameOverride || params.username;
  const { user: me, logout, setUser } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [postTab, setPostTab] = useState<'all' | 'images' | 'videos'>('all');
  const [modal, setModal] = useState<'followers' | 'following' | 'editProfile' | 'createPost' | 'settings' | 'confirmLogout' | null>(null);
  const [followersList, setFollowersList] = useState<User[]>([]);
  const [followingList, setFollowingList] = useState<User[]>([]);
  const [meFollowingIds, setMeFollowingIds] = useState<Set<string>>(new Set());
  const [modalInitialTab, setModalInitialTab] = useState<'followers' | 'following'>('followers');
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: 'start' });

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', () => {
      const idx = emblaApi.selectedScrollSnap();
      setPostTab(idx === 0 ? 'all' : idx === 1 ? 'images' : 'videos');
    });
  }, [emblaApi]);

  const scrollTo = (tab: 'all' | 'images' | 'videos') => {
    setPostTab(tab);
    if (emblaApi) emblaApi.scrollTo(tab === 'all' ? 0 : tab === 'images' ? 1 : 2);
  };

  const isOwn = me?.username === username;

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    apiGetMember(username)
      .then(res => {
        setProfile(res.data.user);
        setPosts(res.data.posts);
        if (me) {
          setFollowing(res.data.user.followers?.some((f: any) => f._id === me._id || f === me._id));
        }
      })
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [username, me]);

  const handleFollow = async () => {
    if (!me) { navigate('/login?redirect=/members/' + username); return; }
    setFollowLoading(true);
    try {
      const res = await apiFollow(username!);
      setFollowing(res.data.following);
      setProfile(prev => prev ? {
        ...prev,
        followers: res.data.following
          ? [...(prev.followers as any[]), me._id]
          : (prev.followers as any[]).filter((f: any) => f._id !== me._id && f !== me._id)
      } : prev);
      toast.success(res.data.following ? 'Following!' : 'Unfollowed');
    } catch { toast.error('Failed to follow'); }
    finally { setFollowLoading(false); }
  };

  const openFollowers = async () => {
    const requests: Promise<any>[] = [
      apiGetFollowers(username!),
      apiGetFollowing(username!),
    ];
    // Also fetch me's following to determine follow-back status
    if (me) requests.push(apiGetFollowing(me.username));
    const results = await Promise.all(requests);
    setFollowersList(results[0].data);
    setFollowingList(results[1].data);
    if (me) {
      const ids = new Set<string>((results[2].data as User[]).map(u => u._id));
      setMeFollowingIds(ids);
    }
    setModalInitialTab('followers');
    setModal('followers');
  };

  const openFollowing = async () => {
    const requests: Promise<any>[] = [
      apiGetFollowers(username!),
      apiGetFollowing(username!),
    ];
    if (me) requests.push(apiGetFollowing(me.username));
    const results = await Promise.all(requests);
    setFollowersList(results[0].data);
    setFollowingList(results[1].data);
    if (me) {
      const ids = new Set<string>((results[2].data as User[]).map(u => u._id));
      setMeFollowingIds(ids);
    }
    setModalInitialTab('following');
    setModal('following');
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await apiDeletePost(postId);
      setPosts(prev => prev.filter(p => p._id !== postId));
      toast.success('Post deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const handleLogout = () => {
    setModal('confirmLogout');
  };

  const performLogout = async () => {
    await logout();
    navigate('/');
  };


  if (loading) return <div className="loading-screen"><div className="spinner spinner-lg" /></div>;
  if (!profile) return (
    <div className="empty-state" style={{ paddingTop: 80 }}>
      {me?.isAdmin ? (
        <>
          <div style={{ fontSize: 48 }}>👑</div>
          <p style={{ fontSize: 18, fontWeight: 700, marginTop: 12 }}>Admin Account</p>
          <p style={{ fontSize: 14, color: 'var(--color-text-2)', marginTop: 6 }}>
            Admin profiles are managed separately.
          </p>
          <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => navigate('/admin')}>
            Open Admin Panel
          </button>
        </>
      ) : (
        <>
          <p style={{ fontSize: 20, fontWeight: 600 }}>Member not found</p>
          <button className="btn btn-ghost" style={{ marginTop: 16 }} onClick={() => navigate('/')}>← Back to Home</button>
        </>
      )}
    </div>
  );

  const avatarUrl = profile.profilePhoto?.url;
  const initial = profile.name?.[0]?.toUpperCase();
  const followerCount = profile.followers?.length || 0;
  const followingCount = profile.following?.length || 0;

  return (
    <div className="page profile-page">
      {/* ── Top Navigation Bar ────────────────────────── */}
      <div className="profile-top-nav">
        <div className="top-nav-left">
          {/* Back button or spacer */}
          <div style={{ width: 40 }} />
        </div>
        <div className="top-nav-center">
          <span className="top-nav-username">{profile.username}</span>
        </div>
        <div className="top-nav-right">
          {isOwn && (
            <button className="icon-btn" onClick={() => setModal('settings')}>
              <Settings size={22} />
            </button>
          )}
        </div>
      </div>

      {/* ── Profile Header ───────────────────────────── */}
      <header className="profile-header container">
        <div className="profile-header-top">
          {/* Avatar */}
          <div className="profile-avatar-container">
            <div className="avatar-ring">
              {avatarUrl
                ? <img src={avatarUrl} alt={profile.name} className="avatar profile-avatar" />
                : <div className="avatar profile-avatar profile-initial">{initial}</div>
              }
            </div>
          </div>

          {/* Stats */}
          <div className="profile-stats">
            <div className="profile-stat">
              <span className="stat-num">{posts.length}</span>
              <span className="stat-name">posts</span>
            </div>
            <button className="profile-stat profile-stat-btn" onClick={openFollowers} id="followers-btn">
              <span className="stat-num">{followerCount}</span>
              <span className="stat-name">followers</span>
            </button>
            <button className="profile-stat profile-stat-btn" onClick={openFollowing} id="following-btn">
              <span className="stat-num">{followingCount}</span>
              <span className="stat-name">following</span>
            </button>
          </div>
        </div>

        {/* Bio Section */}
        <div className="profile-bio-container">
          <h1 className="profile-display-name">{profile.name}</h1>
          {profile.bio && <p className="profile-bio-text">{profile.bio}</p>}
        </div>

        {/* Actions */}
        <div className="profile-actions-container">
          {isOwn ? (
            <>
              <button className="btn profile-action-btn" onClick={() => setModal('editProfile')} id="edit-profile-btn">
                Edit profile
              </button>
              <button className="btn profile-action-btn" onClick={() => setModal('createPost')} id="create-post-btn">
                Share post
              </button>
            </>
          ) : !me?.isAdmin && (
            <>
              <button
                className={`btn profile-action-btn ${following ? 'following' : 'btn-primary'}`}
                onClick={handleFollow}
                disabled={followLoading}
                id="follow-btn"
              >
                {following ? 'Following' : 'Follow'}
              </button>
              <button
                className="btn profile-action-btn"
                onClick={() => navigate(`/messages?user=${profile._id}`)}
                id="message-btn"
              >
                Message
              </button>

            </>
          )}
        </div>
      </header>

      {/* ── Tabs ───────────────────────────────────── */}
      <div className="profile-tabs">
        <button className={`profile-tab-item ${postTab === 'all' ? 'active' : ''}`} onClick={() => scrollTo('all')}>
          <Grid size={22} strokeWidth={postTab === 'all' ? 2.5 : 1.5} />
        </button>
        <button className={`profile-tab-item ${postTab === 'images' ? 'active' : ''}`} onClick={() => scrollTo('images')}>
          <Film size={22} strokeWidth={postTab === 'images' ? 2.5 : 1.5} />
        </button>
        <button className={`profile-tab-item ${postTab === 'videos' ? 'active' : ''}`} onClick={() => scrollTo('videos')}>
          <Play size={22} strokeWidth={postTab === 'videos' ? 2.5 : 1.5} />
        </button>
      </div>

      {/* ── Swipeable Sections ────────────────────────── */}
      <div className="embla" ref={emblaRef}>
        <div className="embla__container">
          {/* ALL POSTS */}
          <div className="embla__slide">
            <PostGrid 
              posts={posts} 
              isOwn={isOwn} 
              onDelete={handleDeletePost} 
              onPostClick={(p) => setLightboxIdx(posts.indexOf(p))}
              emptyTitle="No Posts Yet"
            />
          </div>
          {/* IMAGES */}
          <div className="embla__slide">
            <PostGrid 
              posts={posts.filter(p => p.mediaType === 'image')} 
              isOwn={isOwn} 
              onDelete={handleDeletePost} 
              onPostClick={(p) => setLightboxIdx(posts.indexOf(p))}
              emptyTitle="No Photos Yet"
            />
          </div>
          {/* VIDEOS */}
          <div className="embla__slide">
            <PostGrid 
              posts={posts.filter(p => p.mediaType === 'video')} 
              isOwn={isOwn} 
              onDelete={handleDeletePost} 
              onPostClick={(p) => setLightboxIdx(posts.indexOf(p))}
              emptyTitle="No Videos Yet"
            />
          </div>
        </div>
      </div>

      {/* ── Modals ───────────────────────────────────── */}
      {(modal === 'followers' || modal === 'following') && profile && (
        <UserListModal
          profileUsername={profile.username}
          initialTab={modalInitialTab}
          followersList={followersList}
          followingList={followingList}
          meFollowingIds={meFollowingIds}
          onClose={() => setModal(null)}
        />
      )}

      {modal === 'editProfile' && (
        <EditProfileModal
          user={profile}
          onClose={() => setModal(null)}
          onSave={(updated) => {
            setProfile(updated);
            if (isOwn) setUser(updated);
            if (updated.username !== username) navigate(`/members/${updated.username}`);
          }}
        />
      )}

      {modal === 'createPost' && (
        <CreatePostModal
          onClose={() => setModal(null)}
          onCreated={(post) => setPosts(prev => [post, ...prev])}
        />
      )}

      {modal === 'settings' && (
        <SettingsMenu
          onClose={() => setModal(null)}
          onLogout={handleLogout}
        />
      )}

      {modal === 'confirmLogout' && (
        <ConfirmModal 
          message="Log out?" 
          onConfirm={performLogout} 
          onCancel={() => setModal(null)} 
        />
      )}

      {lightboxIdx !== null && (
        <PostLightbox
          post={posts[lightboxIdx]}
          allPosts={posts}
          onClose={() => setLightboxIdx(null)}
          onDelete={(postId) => {
            setPosts(prev => prev.filter(p => p._id !== postId));
            if (posts.length <= 1) setLightboxIdx(null);
          }}
        />
      )}
    </div>
  );
}
