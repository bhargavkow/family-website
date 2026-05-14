import { Heart, MessageCircle, Send, Bookmark, ChevronLeft } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import type { Post } from '../types';
import { useAuth } from '../context/AuthContext';
import { apiLikePost } from '../api';
import './PostLightbox.css';

interface Props {
  post: Post;
  allPosts: Post[];
  onClose: () => void;
}

export default function PostLightbox({ post, allPosts, onClose }: Props) {
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to the clicked post on mount
  useEffect(() => {
    const activePost = document.getElementById(`feed-post-${post._id}`);
    if (activePost) {
      activePost.scrollIntoView({ behavior: 'auto', block: 'start' });
    }
  }, [post._id]);

  return (
    <div className="modal-overlay post-feed-overlay" onClick={onClose}>
      <div className="post-feed-container" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="post-feed-header">
          <button className="icon-btn" onClick={onClose}><ChevronLeft size={28} /></button>
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>Posts</h3>
          <div style={{ width: 28 }} />
        </div>

        {/* Scrollable List */}
        <div className="post-feed-list" ref={scrollRef}>
          {allPosts.map((p) => (
            <PostItem key={p._id} post={p} currentUser={user} />
          ))}
        </div>
      </div>

      <style>{`
        .post-feed-overlay {
          padding: 0;
          background: var(--color-bg);
          z-index: 1000;
        }
        .post-feed-container {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        .post-feed-header {
          height: 60px;
          border-bottom: 1px solid var(--color-border);
          display: flex;
          align-items: center;
          padding: 0 16px;
          justify-content: space-between;
          position: sticky;
          top: 0;
          background: var(--color-bg);
          z-index: 10;
        }
        .post-feed-list {
          flex: 1;
          overflow-y: auto;
          scroll-snap-type: y proximity;
        }
        
        /* ─── Post Item ────────────────────────────────────── */
        .feed-post {
          padding-bottom: 24px;
          border-bottom: 1px solid var(--color-border);
          margin-bottom: 8px;
        }
        .feed-post-header {
          display: flex;
          align-items: center;
          padding: 12px 16px;
          gap: 12px;
        }
        .feed-post-media {
          width: 100%;
          background: #000;
          aspect-ratio: 1/1;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .feed-post-media img,
        .feed-post-media video {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        .feed-post-actions {
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .feed-actions-left {
          display: flex;
          gap: 16px;
        }
        .feed-post-info {
          padding: 0 16px;
        }
        .feed-likes {
          font-weight: 700;
          font-size: 14px;
          margin-bottom: 6px;
        }
        .feed-caption {
          font-size: 14px;
          line-height: 1.4;
          margin-bottom: 8px;
        }
        .feed-date {
          font-size: 10px;
          color: var(--color-text-2);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .big-heart-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          z-index: 5;
          animation: heart-pop 1s ease forwards;
        }
        @keyframes heart-pop {
          0% { transform: scale(0); opacity: 0; }
          25% { transform: scale(1.2); opacity: 0.9; }
          50% { transform: scale(1); opacity: 1; }
          75% { transform: scale(1); opacity: 1; }
          100% { transform: scale(0.8); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function PostItem({ post, currentUser }: { post: Post; currentUser: any }) {
  const [liked, setLiked] = useState(post.likes.includes(currentUser?._id || ''));
  const [likeCount, setLikeCount] = useState(post.likes.length);

  const handleLike = async () => {
    if (!currentUser) return;
    try {
      const res = await apiLikePost(post._id);
      setLiked(res.data.liked);
      setLikeCount(res.data.likeCount);
    } catch { /* no-op */ }
  };

  const [showHeart, setShowHeart] = useState(false);

  const handleDoubleClick = () => {
    if (!liked) {
      handleLike();
    }
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 1000);
  };

  return (
    <div className="feed-post" id={`feed-post-${post._id}`}>
      {/* Header */}
      <div className="feed-post-header">
        {post.author?.profilePhoto?.url ? (
          <img src={post.author.profilePhoto.url} alt={post.author.username} className="avatar" style={{ width: 32, height: 32 }} />
        ) : (
          <div className="avatar" style={{ width: 32, height: 32, background: 'var(--color-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>
            {post.author?.username?.[0]?.toUpperCase()}
          </div>
        )}
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{post.author?.username}</div>
        </div>
      </div>

      {/* Media */}
      <div className="feed-post-media" onDoubleClick={handleDoubleClick} style={{ position: 'relative' }}>
        {post.mediaType === 'video' ? (
          <video src={post.mediaUrl} controls autoPlay muted loop />
        ) : (
          <img src={post.mediaUrl} alt={post.caption} />
        )}

        {showHeart && (
          <div className="big-heart-overlay">
            <Heart size={100} fill="white" color="white" />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="feed-post-actions">
        <div className="feed-actions-left">
          <button onClick={handleLike} style={{ background: 'none', border: 'none', padding: 0, color: liked ? 'var(--color-error)' : 'var(--color-text)' }}>
            <Heart size={26} fill={liked ? 'currentColor' : 'none'} />
          </button>
          <button style={{ background: 'none', border: 'none', padding: 0, color: 'var(--color-text)' }}>
            <MessageCircle size={26} />
          </button>
          <button style={{ background: 'none', border: 'none', padding: 0, color: 'var(--color-text)' }}>
            <Send size={26} />
          </button>
        </div>
        <button style={{ background: 'none', border: 'none', padding: 0, color: 'var(--color-text)' }}>
          <Bookmark size={26} />
        </button>
      </div>

      {/* Info */}
      <div className="feed-post-info">
        <div className="feed-likes">{likeCount} likes</div>
        {post.caption && (
          <div className="feed-caption">
            <span style={{ fontWeight: 700, marginRight: 8 }}>{post.author?.username}</span>
            {post.caption}
          </div>
        )}
        <div className="feed-date">
          {new Date(post.createdAt || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>
    </div>
  );
}
