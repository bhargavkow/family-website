import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, X, Play, FolderOpen, ArrowLeft, Camera, Download } from 'lucide-react';
import { apiSearchMembers, apiGetFeed, apiGetMoments, apiGetMembers } from '../api';
import type { Moment } from '../api';
import type { User, Post } from '../types';
import { useAuth } from '../context/AuthContext';
import PostLightbox from '../components/PostLightbox';
import './Search.css';
import './Members.css';

function useDebounce<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const downloadImage = async (url: string, filename: string) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  } catch (err) {
    window.open(url, '_blank');
  }
};

// ─── Moment Image Viewer ──────────────────────────────────
function MomentViewer({ moment, onClose }: { moment: Moment; onClose: () => void }) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const images = moment.images;

  const downloadAll = async () => {
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const isCover = moment.coverImage?.url && (img.url === moment.coverImage.url || img.url.split('?')[0] === moment.coverImage.url.split('?')[0]);
      if (isCover) {
        continue;
      }
      downloadImage(img.url, `${moment.name.replace(/\s+/g, '_')}_${i + 1}.jpg`);
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: 'var(--color-bg)',
      display: 'flex', flexDirection: 'column',
      animation: 'slideInRight 0.25s cubic-bezier(0.32,0.72,0,1)',
      overflowY: 'auto',
    }}>
      {/* Hero header with cover */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        {/* Cover photo or gradient bg */}
        <div style={{
          height: 220,
          background: moment.coverImage?.url
            ? 'none'
            : 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)',
          overflow: 'hidden',
          position: 'relative',
        }}>
          {moment.coverImage?.url && (
            <img
              src={moment.coverImage.url}
              alt={moment.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          )}
          {/* Dark gradient */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.6) 100%)',
          }} />
          {/* Back button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 'calc(14px + env(safe-area-inset-top, 0px))', left: 14,
              width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(0,0,0,0.45)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <ArrowLeft size={18} strokeWidth={2.5} />
          </button>

          {/* Album info at bottom of hero */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            padding: '12px 16px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)',
          }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
                {moment.name}
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4, fontWeight: 500 }}>
                {images.length} photo{images.length !== 1 ? 's' : ''}
              </div>
            </div>
            {images.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  downloadAll();
                }}
                style={{
                  background: '#c5a880',
                  color: '#000000',
                  border: 'none',
                  borderRadius: 20,
                  padding: '6px 14px',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 4px 12px rgba(197, 168, 128, 0.25)',
                }}
              >
                <Download size={14} strokeWidth={2.5} />
                Download All
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Photo grid */}
      <div style={{ flex: 1, padding: '16px 2px 40px' }}>
        {images.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--color-text-2)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
            <p style={{ fontWeight: 600, color: 'var(--color-text)', margin: '0 0 6px' }}>No photos yet</p>
            <p style={{ fontSize: 13, margin: 0 }}>This album is empty.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
            {images.map((img, i) => (
              <div
                key={img._id}
                onClick={() => setLightboxIdx(i)}
                style={{
                  aspectRatio: '1', overflow: 'hidden',
                  cursor: 'pointer', position: 'relative',
                  background: 'var(--color-surface-2)',
                }}
              >
                <img
                  src={img.url}
                  alt={img.caption || moment.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  loading="lazy"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadImage(img.url, `${moment.name.replace(/\s+/g, '_')}_${i + 1}.jpg`);
                  }}
                  style={{
                    position: 'absolute',
                    bottom: 6,
                    right: 6,
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: 'rgba(0, 0, 0, 0.65)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#c5a880',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 10,
                  }}
                  title="Download photo"
                >
                  <Download size={14} strokeWidth={2.5} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Full-screen image lightbox */}
      {lightboxIdx !== null && (
        <div
          onClick={() => setLightboxIdx(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 3000,
            background: 'rgba(0,0,0,0.97)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <img
            src={images[lightboxIdx].url}
            alt=""
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '100vw', maxHeight: '90vh', objectFit: 'contain' }}
          />
          {/* Prev */}
          {lightboxIdx > 0 && (
            <button
              onClick={e => { e.stopPropagation(); setLightboxIdx(lightboxIdx - 1); }}
              style={{
                position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(6px)',
                border: 'none', borderRadius: '50%',
                width: 44, height: 44, color: '#fff', fontSize: 24, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >‹</button>
          )}
          {/* Next */}
          {lightboxIdx < images.length - 1 && (
            <button
              onClick={e => { e.stopPropagation(); setLightboxIdx(lightboxIdx + 1); }}
              style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(6px)',
                border: 'none', borderRadius: '50%',
                width: 44, height: 44, color: '#fff', fontSize: 24, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >›</button>
          )}
          {/* Counter */}
          <div style={{
            position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
            borderRadius: 20, padding: '4px 14px',
            fontSize: 13, fontWeight: 600, color: '#fff',
          }}>
            {lightboxIdx + 1} / {images.length}
          </div>
          {/* Download */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              const img = images[lightboxIdx];
              downloadImage(img.url, `${moment.name.replace(/\s+/g, '_')}_${lightboxIdx + 1}.jpg`);
            }}
            style={{
              position: 'absolute', top: 14, right: 60,
              background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(6px)',
              border: 'none', borderRadius: '50%',
              width: 36, height: 36, color: '#c5a880', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            title="Download photo"
          >
            <Download size={18} strokeWidth={2.5} />
          </button>
          {/* Close */}
          <button
            onClick={() => setLightboxIdx(null)}
            style={{
              position: 'absolute', top: 14, right: 14,
              background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(6px)',
              border: 'none', borderRadius: '50%',
              width: 36, height: 36, color: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
            }}
          >✕</button>
        </div>
      )}

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

// ─── Special Moments Grid ─────────────────────────────────
function SpecialMomentsSection() {
  const [moments, setMoments] = useState<Moment[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMoment, setOpenMoment] = useState<Moment | null>(null);

  useEffect(() => {
    apiGetMoments()
      .then(res => setMoments(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
      <div className="spinner" />
    </div>
  );

  if (moments.length === 0) return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '80px 20px', gap: 12,
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: 24,
        background: 'var(--color-surface-2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#c5a880',
      }}>
        <Camera size={36} strokeWidth={1.8} />
      </div>
      <p style={{ fontSize: 17, fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>No Albums Yet</p>
      <p style={{ fontSize: 14, color: 'var(--color-text-2)', margin: 0, textAlign: 'center' }}>
        Special moments will appear here once the admin adds them.
      </p>
    </div>
  );

  return (
    <>
      <div style={{ padding: '16px 14px 80px' }}>
        {/* Section header */}
        <div style={{ marginBottom: 16, paddingLeft: 2 }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-text)', margin: '0 0 2px' }}>Special Moments</h3>
          <p style={{ fontSize: 13, color: 'var(--color-text-2)', margin: 0 }}>{moments.length} album{moments.length !== 1 ? 's' : ''}</p>
        </div>

        {/* Album grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 12,
        }}>
          {moments.map((m, idx) => {
            const previews = m.images.slice(0, 4);
            const isFirst = idx === 0;
            return (
              <div
                key={m._id}
                onClick={() => setOpenMoment(m)}
                style={{
                  gridColumn: isFirst ? '1 / -1' : undefined,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  position: 'relative',
                  background: 'var(--color-surface-2)',
                  aspectRatio: isFirst ? '16/9' : '1',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
                }}
              >
                {/* Cover / collage */}
                {m.coverImage?.url || previews.length > 0 ? (
                  <>
                    {/* Main cover */}
                    <img
                      src={m.coverImage?.url || previews[0]?.url}
                      alt={m.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                    {/* Small preview strip (only if no cover and multiple images) */}
                    {!m.coverImage?.url && previews.length > 1 && (
                      <div style={{
                        position: 'absolute', bottom: 0, right: 0,
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: 1,
                        width: '35%', height: '35%',
                      }}>
                        {previews.slice(1, 5).map(img => (
                          <img key={img._id} src={img.url} alt=""
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{
                    width: '100%', height: '100%',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    gap: 8, color: 'var(--color-text-2)',
                    background: 'linear-gradient(135deg, var(--color-surface), var(--color-surface-2))',
                  }}>
                    <FolderOpen size={36} />
                    <span style={{ fontSize: 12, fontWeight: 600 }}>Empty album</span>
                  </div>
                )}

                {/* Gradient overlay */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.15) 45%, transparent 70%)',
                  pointerEvents: 'none',
                }} />

                {/* Photo count badge */}
                <div style={{
                  position: 'absolute', top: 10, right: 10,
                  background: 'rgba(0,0,0,0.55)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: 20,
                  padding: '4px 10px',
                  fontSize: 11, fontWeight: 700, color: '#fff',
                  letterSpacing: 0.3,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}>
                  <span>{m.images.length}</span>
                  <Camera size={12} strokeWidth={2.2} style={{ color: '#c5a880' }} />
                </div>

                {/* Name + count */}
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  padding: isFirst ? '20px 16px 16px' : '12px 10px 10px',
                }}>
                  <div style={{
                    fontSize: isFirst ? 18 : 14,
                    fontWeight: 800,
                    color: '#fff',
                    textShadow: '0 1px 6px rgba(0,0,0,0.5)',
                    lineHeight: 1.2,
                  }}>{m.name}</div>
                  <div style={{
                    fontSize: isFirst ? 13 : 11,
                    color: 'rgba(255,255,255,0.75)',
                    marginTop: 3, fontWeight: 500,
                  }}>
                    {m.images.length} photo{m.images.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {openMoment && (
        <MomentViewer moment={openMoment} onClose={() => setOpenMoment(null)} />
      )}
    </>
  );
}

// ─── Main Search Page ─────────────────────────────────────
export default function Search() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [exploreTab, setExploreTab] = useState<'posts' | 'moments' | 'members'>('posts');
  const [allMembers, setAllMembers] = useState<User[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [memberSort, setMemberSort] = useState<'asc' | 'desc'>('asc');
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef<HTMLDivElement>(null);

  const debounced = useDebounce(query, 300);

  // Search members
  useEffect(() => {
    if (!debounced.trim()) { setResults([]); setSearching(false); return; }
    setSearching(true);
    apiSearchMembers(debounced)
      .then(res => setResults(res.data))
      .catch(() => setResults([]))
      .finally(() => setSearching(false));
  }, [debounced]);

  // Load all members for Members tab
  useEffect(() => {
    setMembersLoading(true);
    apiGetMembers()
      .then(res => setAllMembers(res.data))
      .catch(() => {})
      .finally(() => setMembersLoading(false));
  }, []);

  // Load feed posts
  const loadPosts = useCallback(async (p: number) => {
    try {
      const res = await apiGetFeed(p);
      setPosts(prev => p === 1 ? res.data.posts : [...prev, ...res.data.posts]);
      setHasMore(p < res.data.pages);
    } catch { /* no-op */ }
    finally { setPostsLoading(false); }
  }, []);

  useEffect(() => { loadPosts(1); }, []);

  // Infinite scroll for posts
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !postsLoading && !query && exploreTab === 'posts') {
        const next = page + 1;
        setPage(next);
        loadPosts(next);
      }
    }, { threshold: 0.1 });
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, postsLoading, page, query, exploreTab]);

  return (
    <div className="page search-page">
      {/* ── Search Bar ─────────────────────────────── */}
      <div className="search-bar-wrap">
        <div className="search-bar">
          <SearchIcon size={18} className="search-icon" />
          <input
            id="search-input"
            type="text"
            className="search-input"
            placeholder="Search members by name or username..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query && (
            <button className="search-clear" onClick={() => setQuery('')} id="clear-search">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* ── Member Results ──────────────────────────── */}
      {query && (
        <div className="search-results">
          {searching ? (
            <div style={{ padding: 20, textAlign: 'center' }}>
              <div className="spinner" style={{ margin: '0 auto' }} />
            </div>
          ) : results.length === 0 ? (
            <p style={{ padding: 20, textAlign: 'center', color: 'var(--color-text-2)', fontSize: 14 }}>
              No members found for "{query}"
            </p>
          ) : results.map(u => (
            <div
              key={u._id}
              className="member-result"
              onClick={() => navigate(`/members/${u.username}`)}
              id={`result-${u.username}`}
            >
              {u.profilePhoto?.url
                ? <img src={u.profilePhoto.url} alt={u.name} className="avatar" style={{ width: 48, height: 48 }} />
                : <div className="avatar result-initial" style={{ width: 48, height: 48 }}>{u.name?.[0]?.toUpperCase()}</div>
              }
              <div>
                <div style={{ fontWeight: 600 }}>{u.name}</div>
                <div style={{ color: 'var(--color-text-2)', fontSize: 13 }}>@{u.username}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Explore Section ─────────────────────────── */}
      {!query && (
        <>
          {/* Tab Bar — 3 tabs */}
          <div style={{
            display: 'flex',
            borderBottom: '1px solid var(--color-border)',
            marginBottom: 2,
          }}>
            {/* Posts */}
            <button
              onClick={() => setExploreTab('posts')}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 3, padding: '10px 0',
                background: 'none', border: 'none', cursor: 'pointer',
                borderBottom: exploreTab === 'posts' ? '2px solid #c5a880' : '2px solid transparent',
                marginBottom: -1,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill={exploreTab === 'posts' ? '#c5a880' : 'none'} stroke={exploreTab === 'posts' ? '#c5a880' : 'var(--color-text-2)'} strokeWidth="1.8">
                <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
              </svg>
              <span style={{ fontSize: 9, fontWeight: 600, color: exploreTab === 'posts' ? '#c5a880' : 'var(--color-text-2)', letterSpacing: 0.3 }}>POSTS</span>
            </button>

            {/* Moments */}
            <button
              onClick={() => setExploreTab('moments')}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 3, padding: '10px 0',
                background: 'none', border: 'none', cursor: 'pointer',
                borderBottom: exploreTab === 'moments' ? '2px solid #c5a880' : '2px solid transparent',
                marginBottom: -1,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={exploreTab === 'moments' ? '#c5a880' : 'var(--color-text-2)'} strokeWidth="1.8">
                <path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/>
                <path d="M8 3v4M16 3v4M3 10h18"/>
              </svg>
              <span style={{ fontSize: 9, fontWeight: 600, color: exploreTab === 'moments' ? '#c5a880' : 'var(--color-text-2)', letterSpacing: 0.3 }}>MOMENTS</span>
            </button>

            {/* Members */}
            <button
              onClick={() => setExploreTab('members')}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 3, padding: '10px 0',
                background: 'none', border: 'none', cursor: 'pointer',
                borderBottom: exploreTab === 'members' ? '2px solid #c5a880' : '2px solid transparent',
                marginBottom: -1,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={exploreTab === 'members' ? '#c5a880' : 'var(--color-text-2)'} strokeWidth="1.8">
                <circle cx="9" cy="7" r="4"/>
                <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75M21 21v-2a4 4 0 0 0-3-3.87"/>
              </svg>
              <span style={{ fontSize: 9, fontWeight: 600, color: exploreTab === 'members' ? '#c5a880' : 'var(--color-text-2)', letterSpacing: 0.3 }}>MEMBERS</span>
            </button>
          </div>

          {/* Explore Posts Grid — Instagram-style alternating */}
          {exploreTab === 'posts' && (
            <>
              {(() => {
                const LAYOUT_RIGHT = [
                  { gridColumn: '1', gridRow: '1', large: false },
                  { gridColumn: '2', gridRow: '1', large: false },
                  { gridColumn: '3', gridRow: '1 / span 2', large: true },
                  { gridColumn: '1', gridRow: '2', large: false },
                  { gridColumn: '2', gridRow: '2', large: false },
                ];
                const LAYOUT_LEFT = [
                  { gridColumn: '1', gridRow: '1 / span 2', large: true },
                  { gridColumn: '2', gridRow: '1', large: false },
                  { gridColumn: '3', gridRow: '1', large: false },
                  { gridColumn: '2', gridRow: '2', large: false },
                  { gridColumn: '3', gridRow: '2', large: false },
                ];

                if (postsLoading && posts.length === 0) {
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {[0, 1].map(g => (
                        <div key={g} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
                          {[0,1,2,3,4].map(i => {
                            const isLarge = (g === 0 && i === 2) || (g === 1 && i === 0);
                            const gCol = g === 0 ? '3' : '1';
                            return (
                              <div key={i} style={{
                                gridColumn: isLarge ? gCol : undefined,
                                gridRow: isLarge ? '1 / span 2' : undefined,
                                aspectRatio: isLarge ? undefined : '1',
                                background: 'var(--color-surface-2)',
                                animation: 'pulse 1.5s ease-in-out infinite',
                              }} />
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  );
                }

                const groups: { items: typeof posts; startIdx: number }[] = [];
                for (let i = 0; i < posts.length; i += 5) {
                  groups.push({ items: posts.slice(i, i + 5), startIdx: i });
                }

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {groups.map(({ items, startIdx }, groupIdx) => {
                      const layout = groupIdx % 2 === 0 ? LAYOUT_RIGHT : LAYOUT_LEFT;
                      return (
                        <div key={groupIdx} style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(3, 1fr)',
                          gap: 2,
                        }}>
                          {items.map((post, posIdx) => {
                            if (posIdx >= layout.length) return null;
                            const { gridColumn, gridRow, large } = layout[posIdx];
                            return (
                              <div
                                key={post._id}
                                id={`explore-${post._id}`}
                                onClick={() => setLightboxIdx(startIdx + posIdx)}
                                style={{
                                  gridColumn, gridRow,
                                  position: 'relative', cursor: 'pointer',
                                  overflow: 'hidden',
                                  aspectRatio: large ? undefined : '1',
                                  background: 'var(--color-surface-2)',
                                }}
                              >
                                {post.mediaType === 'video' ? (
                                  <video src={post.mediaUrl}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                    muted playsInline />
                                ) : (
                                  <img src={post.mediaUrl} alt={post.caption}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                    loading="lazy" />
                                )}
                                {post.mediaType === 'video' && (
                                  <div style={{ position: 'absolute', top: 5, right: 5 }}>
                                    <Play size={13} fill="white" color="white" />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
              <div ref={loaderRef} style={{ height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {!hasMore && posts.length > 0 && (
                  <p style={{ color: 'var(--color-text-2)', fontSize: 13 }}>You've seen it all!</p>
                )}
              </div>
            </>
          )}

          {/* Special Moments Grid */}
          {exploreTab === 'moments' && <SpecialMomentsSection />}

          {/* Members Cards */}
          {exploreTab === 'members' && (
            <div style={{ paddingBottom: 80 }}>
              {/* Header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 16px 12px',
              }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-text)', margin: '0 0 2px' }}>Members</h3>
                  <p style={{ fontSize: 13, color: 'var(--color-text-2)', margin: 0 }}>
                    {allMembers.length} member{allMembers.length !== 1 ? 's' : ''}
                  </p>
                </div>
                {/* Sort toggle */}
                <button
                  onClick={() => setMemberSort(s => s === 'asc' ? 'desc' : 'asc')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '6px 12px', borderRadius: 20,
                    background: 'var(--color-surface-2)',
                    border: '1px solid var(--color-border)',
                    cursor: 'pointer', color: 'var(--color-text)',
                    fontSize: 13, fontWeight: 600,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    {memberSort === 'asc'
                      ? <><path d="M3 6h18M3 12h12M3 18h6"/><path d="M19 12v8m0 0-3-3m3 3 3-3"/></>
                      : <><path d="M3 6h6M3 12h12M3 18h18"/><path d="M19 4v8m0-8-3 3m3-3 3 3"/></>
                    }
                  </svg>
                  {memberSort === 'asc' ? 'A → Z' : 'Z → A'}
                </button>
              </div>

              {membersLoading ? (
                <div className="members-grid">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="member-tile-skeleton">
                      <div className="skeleton member-tile-photo" style={{ aspectRatio: '1' }} />
                      <div style={{ padding: '8px 4px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div className="skeleton" style={{ height: 12, width: '70%', borderRadius: 6 }} />
                        <div className="skeleton" style={{ height: 10, width: '50%', borderRadius: 6 }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="members-grid">
                  {[...allMembers]
                    .sort((a, b) =>
                      memberSort === 'asc'
                        ? a.name.localeCompare(b.name)
                        : b.name.localeCompare(a.name)
                    )
                    .map(u => (
                      <div
                        key={u._id}
                        className="member-tile"
                        onClick={() => navigate(`/members/${u.username}`)}
                        role="button"
                        tabIndex={0}
                        id={`search-tile-${u.username}`}
                      >
                        <div className="member-tile-photo">
                          {u.profilePhoto?.url ? (
                            <img src={u.profilePhoto.url} alt={u.name} className="member-tile-img" />
                          ) : (
                            <div className="member-tile-initial">
                              {u.name?.[0]?.toUpperCase() || '?'}
                            </div>
                          )}
                          <div className="member-tile-overlay">
                            <span className="member-tile-view">View Profile</span>
                          </div>
                        </div>
                        <div className="member-tile-info">
                          <span className="member-tile-name">{u.name}</span>
                          <span className="member-tile-username">@{u.username}</span>
                        </div>
                      </div>
                    ))
                  }
                </div>
              )}
            </div>
          )}
        </>
      )}

      {lightboxIdx !== null && (
        <PostLightbox
          post={posts[lightboxIdx]}
          allPosts={posts}
          onClose={() => setLightboxIdx(null)}
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
    </div>
  );
}
