import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { X, Edit3, UserPlus, Play, Grid, Film, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  apiGetMember, apiFollow, apiGetFollowers, apiGetFollowing,
  apiUpdateProfile, apiCreatePost, apiDeletePost,
} from '../api';
import type { User, Post } from '../types';
import PostLightbox from '../components/PostLightbox';
import toast from 'react-hot-toast';
import './MemberProfile.css';

// ─── Confirm Popup
function ConfirmModal({ message, onConfirm, onCancel }: {
  message: string; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal animate-scale-in confirm-modal" onClick={e => e.stopPropagation()}>
        <p className="confirm-message">{message}</p>
        <div className="confirm-actions">
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm} id="confirm-yes-btn">Yes, Logout</button>
        </div>
      </div>
    </div>
  );
}

// ─── Follower/Following Modal ─────────────────────────────
function UserListModal({ title, users, onClose }: { title: string; users: User[]; onClose: () => void }) {
  const navigate = useNavigate();
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal animate-scale-in" onClick={e => e.stopPropagation()} id="user-list-modal">
        <div className="modal-header">
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>{title}</h3>
          <button className="icon-btn" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body" style={{ padding: '8px 0', maxHeight: 400, overflowY: 'auto' }}>
          {users.length === 0 ? (
            <p style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-2)', fontSize: 14 }}>No users yet</p>
          ) : users.map(u => (
            <div key={u._id} className="user-list-item" onClick={() => { navigate(`/members/${u.username}`); onClose(); }}>
              {u.profilePhoto?.url
                ? <img src={u.profilePhoto.url} alt={u.name} className="avatar" style={{ width: 44, height: 44 }} />
                : <div className="avatar user-initial-sm">{u.name?.[0]?.toUpperCase()}</div>
              }
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{u.name}</div>
                <div style={{ color: 'var(--color-text-2)', fontSize: 12 }}>@{u.username}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal animate-scale-in" onClick={e => e.stopPropagation()} id="edit-profile-modal">
        <div className="modal-header">
          <h3 style={{ fontWeight: 700 }}>Edit Profile</h3>
          <button className="icon-btn" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body">
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div className="edit-avatar-wrap" onClick={() => fileRef.current?.click()}>
              {preview
                ? <img src={preview} alt="profile" className="avatar" style={{ width: 90, height: 90 }} />
                : <div className="avatar edit-initial" style={{ width: 90, height: 90 }}>{user.name?.[0]?.toUpperCase()}</div>
              }
              <div className="edit-avatar-overlay"><Edit3 size={16} /></div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto} id="profile-photo-input" />
            <button style={{ fontSize: 12, color: 'var(--color-primary-light)', background: 'none', marginTop: 8 }} onClick={() => fileRef.current?.click()}>
              Change Photo
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className="label" htmlFor="edit-name">Name</label>
              <input id="edit-name" className="input" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="edit-username">Username</label>
              <input id="edit-username" className="input" value={username} onChange={e => setUsername(e.target.value.toLowerCase())} />
            </div>
            <div>
              <label className="label">Bio</label>
              <textarea
                className="input"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                maxLength={300}
                placeholder="Tell us about yourself..."
              />
              <div style={{ fontSize: 11, textAlign: 'right', color: 'var(--color-text-2)', marginTop: 4 }}>
                {bio.length}/300
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={handleSave} disabled={loading} id="save-profile-btn">
              {loading ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : 'Save'}
            </button>
          </div>
        </div>
      </div>
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
      <div className="modal animate-scale-in" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()} id="create-post-modal">
        <div className="modal-header">
          <h3 style={{ fontWeight: 700 }}>New Post</h3>
          {!loading && <button className="icon-btn" onClick={onClose}><X size={20} /></button>}
        </div>
        <div className="modal-body">
          {!file ? (
            <div className="upload-zone" onClick={() => fileRef.current?.click()} id="upload-zone">
              <div className="upload-icon">📷</div>
              <p>Click to select photo or video</p>
              <p style={{ fontSize: 12, color: 'var(--color-text-2)' }}>Max 100MB</p>
            </div>
          ) : (
            <div className="post-preview">
              {file.type.startsWith('video/')
                ? <video src={preview} controls style={{ width: '100%', borderRadius: 12, maxHeight: 300 }} />
                : <img src={preview} alt="preview" style={{ width: '100%', borderRadius: 12, maxHeight: 300, objectFit: 'cover' }} />
              }
              {!loading && <button className="change-file-btn" onClick={() => fileRef.current?.click()}>Change</button>}
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={handleFile} id="post-file-input" />

          <div style={{ marginTop: 16 }}>
            <label className="label" htmlFor="post-caption">Caption</label>
            <textarea id="post-caption" className="input" rows={3} placeholder="Write a caption..." value={caption} onChange={e => setCaption(e.target.value)} disabled={loading} style={{ resize: 'vertical' }} />
          </div>

          {loading && (
            <div style={{ marginTop: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                <span>{progress < 100 ? 'Uploading...' : 'Processing on server...'}</span>
                <span>{progress}%</span>
              </div>
              <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            {!loading && <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>}
            <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={handleCreate} disabled={loading || !file} id="submit-post-btn">
              {loading ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : 'Share Post'}
            </button>
          </div>
        </div>
      </div>
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

  const [modal, setModal] = useState<'followers' | 'following' | 'editProfile' | 'createPost' | 'logoutConfirm' | null>(null);
  const [modalUsers, setModalUsers] = useState<User[]>([]);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

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
    const res = await apiGetFollowers(username!);
    setModalUsers(res.data);
    setModal('followers');
  };

  const openFollowing = async () => {
    const res = await apiGetFollowing(username!);
    setModalUsers(res.data);
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

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Filtered posts for tabs
  const filteredPosts = posts.filter(p => {
    if (postTab === 'images') return p.mediaType === 'image';
    if (postTab === 'videos') return p.mediaType === 'video';
    return true;
  });

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

          {/* Stats (Mobile style) */}
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
              <button className="btn profile-action-btn-icon" onClick={() => setModal('logoutConfirm')} id="logout-btn">
                <Settings size={20} />
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
              <button className="btn profile-action-btn-icon">
                <UserPlus size={20} />
              </button>
            </>
          )}
        </div>
      </header>

      {/* ── Tabs ───────────────────────────────────── */}
      <div className="profile-tabs">
        <button className={`profile-tab-item ${postTab === 'all' ? 'active' : ''}`} onClick={() => setPostTab('all')}>
          <Grid size={22} strokeWidth={postTab === 'all' ? 2.5 : 1.5} />
        </button>
        <button className={`profile-tab-item ${postTab === 'images' ? 'active' : ''}`} onClick={() => setPostTab('images')}>
          <Film size={22} strokeWidth={postTab === 'images' ? 2.5 : 1.5} />
        </button>
        <button className={`profile-tab-item ${postTab === 'videos' ? 'active' : ''}`} onClick={() => setPostTab('videos')}>
          <Play size={22} strokeWidth={postTab === 'videos' ? 2.5 : 1.5} />
        </button>
      </div>

      {/* ── Posts Grid ───────────────────────────────── */}
      {filteredPosts.length === 0 ? (
        <div className="profile-empty">
          <div className="profile-empty-icon">
            {postTab === 'videos' ? <Film size={40} /> : <Grid size={40} />}
          </div>
          <h2 className="profile-empty-title">
            {postTab === 'all' ? 'No Posts Yet' : postTab === 'videos' ? 'No Videos Yet' : 'No Photos Yet'}
          </h2>
        </div>
      ) : (
        <div className="profile-posts-grid">
          {filteredPosts.map((post) => (
            <div key={post._id} className="profile-post-wrapper">
              <PostItem post={post} onClick={() => setLightboxIdx(posts.indexOf(post))} />
              {isOwn && (
                <button
                  className="delete-post-badge"
                  onClick={(e) => { e.stopPropagation(); handleDeletePost(post._id); }}
                >
                  <X size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Modals ───────────────────────────────────── */}
      {(modal === 'followers' || modal === 'following') && (
        <UserListModal
          title={modal === 'followers' ? 'Followers' : 'Following'}
          users={modalUsers}
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

      {modal === 'logoutConfirm' && (
        <ConfirmModal
          message="Are you sure you want to logout?"
          onConfirm={handleLogout}
          onCancel={() => setModal(null)}
        />
      )}

      {lightboxIdx !== null && (
        <PostLightbox
          post={posts[lightboxIdx]}
          onClose={() => setLightboxIdx(null)}
          onPrev={lightboxIdx > 0 ? () => setLightboxIdx(i => i! - 1) : undefined}
          onNext={lightboxIdx < posts.length - 1 ? () => setLightboxIdx(i => i! + 1) : undefined}
        />
      )}
    </div>
  );
}
