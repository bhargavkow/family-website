import { X, ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import { useState } from 'react';
import type { Post } from '../types';
import { useAuth } from '../context/AuthContext';
import { apiLikePost } from '../api';
import './PostLightbox.css';

interface Props {
  post: Post;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}

export default function PostLightbox({ post, onClose, onPrev, onNext }: Props) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(post.likes.includes(user?._id || ''));
  const [likeCount, setLikeCount] = useState(post.likes.length);

  const handleLike = async () => {
    if (!user) return;
    try {
      const res = await apiLikePost(post._id);
      setLiked(res.data.liked);
      setLikeCount(res.data.likeCount);
    } catch { /* no-op */ }
  };

  const avatarUrl = post.author?.profilePhoto?.url;
  const authorName = post.author?.name || post.author?.username;

  return (
    <div className="modal-overlay" onClick={onClose} id="post-lightbox">
      <div className="lightbox" onClick={(e) => e.stopPropagation()}>
        {/* Media */}
        <div className="lightbox-media">
          {post.mediaType === 'video' ? (
            <video src={post.mediaUrl} controls autoPlay className="lightbox-video" />
          ) : (
            <img src={post.mediaUrl} alt={post.caption} className="lightbox-img" />
          )}

          <button className="lightbox-close" onClick={onClose} id="lightbox-close">
            <X size={20} />
          </button>

          {onPrev && (
            <button className="lightbox-nav lightbox-prev" onClick={onPrev}>
              <ChevronLeft size={24} />
            </button>
          )}
          {onNext && (
            <button className="lightbox-nav lightbox-next" onClick={onNext}>
              <ChevronRight size={24} />
            </button>
          )}
        </div>

        {/* Info */}
        <div className="lightbox-info">
          <div className="lightbox-author">
            {avatarUrl ? (
              <img src={avatarUrl} alt={authorName} className="avatar" style={{ width: 36, height: 36 }} />
            ) : (
              <div className="avatar" style={{ width: 36, height: 36, background: 'var(--color-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600 }}>
                {authorName?.[0]?.toUpperCase()}
              </div>
            )}
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{authorName}</div>
              <div style={{ color: 'var(--color-text-2)', fontSize: 12 }}>@{post.author?.username}</div>
            </div>
          </div>

          {post.caption && (
            <p className="lightbox-caption">{post.caption}</p>
          )}

          <div className="lightbox-actions">
            {user && !user.isAdmin ? (
              <button
                className={`lightbox-like ${liked ? 'liked' : ''}`}
                onClick={handleLike}
                id="lightbox-like-btn"
              >
                <Heart size={20} fill={liked ? 'currentColor' : 'none'} />
                <span>{likeCount}</span>
              </button>
            ) : (
              <span style={{ fontSize: 13, color: 'var(--color-text-2)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Heart size={14} /> {likeCount} likes
              </span>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
