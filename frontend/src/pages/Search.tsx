import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, X, Play } from 'lucide-react';
import { apiSearchMembers, apiGetFeed } from '../api';
import type { User, Post } from '../types';
import PostLightbox from '../components/PostLightbox';
import './Search.css';

function useDebounce<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function Search() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
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

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !postsLoading && !query) {
        const next = page + 1;
        setPage(next);
        loadPosts(next);
      }
    }, { threshold: 0.1 });
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, postsLoading, page, query]);

  return (
    <div className="page search-page">
      {/* ── Search Bar ───────────────────────────────── */}
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
            autoFocus
          />
          {query && (
            <button className="search-clear" onClick={() => setQuery('')} id="clear-search">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* ── Member Results ────────────────────────────── */}
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

      {/* ── Explore Gallery ───────────────────────────── */}
      {!query && (
        <>
          <div className="explore-header">
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-2)' }}>Explore Posts</h2>
          </div>
          <div className="explore-grid">
            {postsLoading && posts.length === 0
              ? Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="skeleton explore-item" />
                ))
              : posts.map((post, i) => (
                  <div
                    key={post._id}
                    className="explore-item"
                    onClick={() => setLightboxIdx(i)}
                    id={`explore-${post._id}`}
                  >
                    {post.mediaType === 'video'
                      ? <video src={post.mediaUrl} className="explore-media" muted />
                      : <img src={post.mediaUrl} alt={post.caption} className="explore-media" loading="lazy" />
                    }
                    <div className="explore-overlay">
                      {post.mediaType === 'video' && <Play size={20} fill="white" color="white" />}
                      <span>❤️ {post.likes?.length || 0}</span>
                    </div>
                  </div>
                ))
            }
          </div>

          <div ref={loaderRef} style={{ height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {!hasMore && posts.length > 0 && (
              <p style={{ color: 'var(--color-text-2)', fontSize: 13 }}>You've seen it all!</p>
            )}
          </div>
        </>
      )}

      {lightboxIdx !== null && (
        <PostLightbox
          post={posts[lightboxIdx]}
          allPosts={posts}
          onClose={() => setLightboxIdx(null)}
        />
      )}
    </div>
  );
}
