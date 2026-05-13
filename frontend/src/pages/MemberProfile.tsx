import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { X, Plus, Edit3, MessageCircle, UserPlus, UserMinus, Play, Grid, Film, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  apiGetMember, apiFollow, apiGetFollowers, apiGetFollowing,
  apiUpdateProfile, apiCreatePost, apiDeletePost,
} from '../api';
import type { User, Post } from '../types';
import PostLightbox from '../components/PostLightbox';
import toast from 'react-hot-toast';
import './MemberProfile.css';

// ─── Confirm Popup ────────────────────────────────────────
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
      if (photo) fd.append('profilePhoto', photo);
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
              <label className="label" htmlFor="edit-bio">Bio</label>
              <textarea id="edit-bio" className="input" rows={3} value={bio} onChange={e => setBio(e.target.value)} style={{ resize: 'vertical' }} />
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

// ─── Create Post Modal ────────────────────────────────────
function CreatePostModal({ onClose, onCreated }: { onClose: () => void; onCreated: (p: Post) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleCreate = async () => {
    if (!file) return toast.error('Please select a file');
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('media', file);
      fd.append('caption', caption);
      const res = await apiCreatePost(fd);
      onCreated(res.data);
      toast.success('Post created!');
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal animate-scale-in" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()} id="create-post-modal">
        <div className="modal-header">
          <h3 style={{ fontWeight: 700 }}>New Post</h3>
          <button className="icon-btn" onClick={onClose}><X size={20} /></button>
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
              <button className="change-file-btn" onClick={() => fileRef.current?.click()}>Change</button>
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={handleFile} id="post-file-input" />

          <div style={{ marginTop: 16 }}>
            <label className="label" htmlFor="post-caption">Caption</label>
            <textarea id="post-caption" className="input" rows={3} placeholder="Write a caption..." value={caption} onChange={e => setCaption(e.target.value)} style={{ resize: 'vertical' }} />
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
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
  const { user: me, logout } = useAuth();
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
      <div className="profile-header container">
        {/* Avatar */}
        <div className="profile-avatar-wrap">
          <div className="avatar-ring">
            {avatarUrl
              ? <img src={avatarUrl} alt={profile.name} className="avatar profile-avatar" />
              : <div className="avatar profile-avatar profile-initial">{initial}</div>
            }
          </div>
        </div>

        {/* Info */}
        <div className="profile-info">
          <div className="profile-username-row">
            <h1 className="profile-username">@{profile.username}</h1>
            {isOwn && (
              <button className="btn btn-ghost btn-sm" onClick={() => setModal('logoutConfirm')} id="logout-btn" title="Logout">
                <LogOut size={15} />
              </button>
            )}
          </div>

          <div className="profile-name">{profile.name}</div>
          {profile.bio && <p className="profile-bio">{profile.bio}</p>}

          <div className="profile-stats">
            <div className="profile-stat">
              <span className="stat-num">{posts.length}</span>
              <span className="stat-name">Posts</span>
            </div>
            <button className="profile-stat profile-stat-btn" onClick={openFollowers} id="followers-btn">
              <span className="stat-num">{followerCount}</span>
              <span className="stat-name">Followers</span>
            </button>
            <button className="profile-stat profile-stat-btn" onClick={openFollowing} id="following-btn">
              <span className="stat-num">{followingCount}</span>
              <span className="stat-name">Following</span>
            </button>
          </div>

          {/* Own profile: Edit Profile + New Post row */}
          {isOwn ? (
            <div className="profile-action-row">
              <button className="btn btn-outline" onClick={() => setModal('editProfile')} id="edit-profile-btn" style={{ flex: 1 }}>
                <Edit3 size={14} /> Edit Profile
              </button>
              <button className="btn btn-primary" onClick={() => setModal('createPost')} id="create-post-btn" style={{ flex: 1, justifyContent: 'center' }}>
                <Plus size={14} /> New Post
              </button>
            </div>
          ) : !me?.isAdmin && (
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button
                className={`btn btn-sm ${following ? 'btn-ghost' : 'btn-primary'}`}
                onClick={handleFollow}
                disabled={followLoading}
                id="follow-btn"
              >
                {following ? <><UserMinus size={14} /> Unfollow</> : <><UserPlus size={14} /> Follow</>}
              </button>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => navigate(`/messages?user=${profile._id}`)}
                id="message-btn"
              >
                <MessageCircle size={14} /> Message
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Instagram-style Tab Bar ───────────────────── */}
      <div className="profile-tab-bar">
        <button
          className={`profile-tab ${postTab === 'all' ? 'active' : ''}`}
          onClick={() => setPostTab('all')}
          id="tab-all"
          title="All Posts"
        >
          <Grid size={20} />
        </button>
        <button
          className={`profile-tab ${postTab === 'images' ? 'active' : ''}`}
          onClick={() => setPostTab('images')}
          id="tab-images"
          title="Photos"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
        </button>
        <button
          className={`profile-tab ${postTab === 'videos' ? 'active' : ''}`}
          onClick={() => setPostTab('videos')}
          id="tab-videos"
          title="Videos"
        >
          <Film size={20} />
        </button>
      </div>

      {/* ── Posts Grid ───────────────────────────────── */}
      {filteredPosts.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: 48 }}>{postTab === 'videos' ? '🎬' : '📷'}</div>
          <p style={{ marginTop: 12 }}>
            {postTab === 'all' ? 'No posts yet' : postTab === 'videos' ? 'No videos yet' : 'No photos yet'}
          </p>
        </div>
      ) : (
        <div className="profile-posts-grid">
          {filteredPosts.map((post) => (
            <div key={post._id} style={{ position: 'relative' }}>
              <PostItem post={post} onClick={() => setLightboxIdx(posts.indexOf(post))} />
              {isOwn && (
                <button
                  className="delete-post-btn"
                  onClick={(e) => { e.stopPropagation(); handleDeletePost(post._id); }}
                  title="Delete post"
                >
                  <X size={14} />
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
