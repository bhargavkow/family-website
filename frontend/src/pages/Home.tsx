import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FlipText } from '../components/ui/flip-text';
import { Users, Globe, Heart, TreePine, Home as HomeIcon, Star, Sparkles, MapPin, Baby, History, Camera, Network, ChevronLeft, ChevronRight, Plus, ArrowLeft, Grid, Image, Video, MessageCircle } from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import { apiGetMembers, apiGetFeed, apiCreatePost, apiGetHeroImages } from '../api';
import type { User, Post } from '../types';
import DomeGallery from '../components/ui/DomeGallery';
import type { DomeGalleryImage } from '../components/ui/DomeGallery';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import './Home.css';

// ─── Image Compression Helper ────────────────────────────
function compressImage(file: File): Promise<Blob | File> {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      return resolve(file);
    }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_SIZE = 1200;
        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
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

// ─── Share Post Sheet ─────────────────────────────────────
function SharePostSheet({ onFileSelected, onCancel }: {
  onFileSelected: (file: File, accept: string) => void;
  onCancel: () => void;
}) {
  const imageRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) onFileSelected(f, 'image/*');
  };
  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) onFileSelected(f, 'video/*');
  };

  return (
    <>
      <input ref={imageRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
      <input ref={videoRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={handleVideoChange} />

      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 1200,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
        onClick={onCancel}
      />
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        zIndex: 1201,
        background: 'var(--color-surface)',
        borderRadius: '24px 24px 0 0',
        padding: '12px 0 0',
        animation: 'slideUpSheet 0.28s cubic-bezier(0.32,0.72,0,1)',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.5)',
      }}>
        <div style={{
          width: 36, height: 4, borderRadius: 99,
          background: 'var(--color-border)',
          margin: '0 auto 20px',
        }} />

        <p style={{
          textAlign: 'center', fontWeight: 800, fontSize: 17,
          color: 'var(--color-text)', paddingBottom: 20,
          letterSpacing: '-0.3px',
        }}>Create a Post</p>

        <div style={{ display: 'flex', gap: 12, padding: '0 16px 20px' }}>
          <button
            onClick={() => imageRef.current?.click()}
            style={{
              flex: 1,
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 10, padding: '20px 12px',
              background: 'var(--color-surface-2)',
              border: '1.5px solid var(--color-border)',
              borderRadius: 18, cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            <div style={{
              width: 52, height: 52,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Image size={32} color="#c5a880" />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-text)' }}>Image Post</div>
              <div style={{ fontSize: 11, color: 'var(--color-text-2)', marginTop: 2 }}>Photo from gallery</div>
            </div>
          </button>

          <button
            onClick={() => videoRef.current?.click()}
            style={{
              flex: 1,
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 10, padding: '20px 12px',
              background: 'var(--color-surface-2)',
              border: '1.5px solid var(--color-border)',
              borderRadius: 18, cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            <div style={{
              width: 52, height: 52,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Video size={32} color="#c5a880" />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-text)' }}>Video Post</div>
              <div style={{ fontSize: 11, color: 'var(--color-text-2)', marginTop: 2 }}>Video from gallery</div>
            </div>
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Create Post Modal ────────────────────────────────────
function CreatePostModal({ onClose, onCreated, acceptType = 'image/*,video/*', initialFile }: { onClose: () => void; onCreated: (p: Post) => void; acceptType?: string; initialFile?: File }) {
  const [file, setFile] = useState<File | null>(initialFile || null);
  const [preview, setPreview] = useState(initialFile ? URL.createObjectURL(initialFile) : '');
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

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
    <div className="modal-overlay" onClick={loading ? undefined : onClose} style={{ zIndex: 1300 }}>
      <div className="modal animate-scale-in" style={{ maxWidth: file ? 800 : 420 }} onClick={e => e.stopPropagation()} id="create-post-modal">
        <div className="modal-header" style={{ borderBottom: '1px solid var(--color-border)', padding: '8px 16px', display: 'flex', alignItems: 'center', height: 56 }}>
          {!loading && (
            <button
              style={{ background: 'none', border: 'none', padding: '8px', cursor: 'pointer', color: 'var(--color-text)', display: 'flex', alignItems: 'center', minWidth: 44 }}
              onClick={onClose}
            >
              <ArrowLeft size={26} strokeWidth={2.5} />
            </button>
          )}
          <h3 style={{ fontWeight: 700, fontSize: 16, flex: 1, textAlign: 'center' }}>{file ? 'New post' : 'Create new post'}</h3>
          <button
            className="btn btn-ghost"
            style={{ border: 'none', background: 'none', fontSize: 16, color: file ? '#c5a880' : 'var(--color-text-3)', fontWeight: 700, minWidth: 56, cursor: file ? 'pointer' : 'default' }}
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
          <input ref={fileRef} type="file" accept={acceptType} style={{ display: 'none' }} onChange={handleFile} id="post-file-input" />

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

import img1 from '../assets/_MG_1369.JPG';
import img2 from '../assets/_MG_1381.JPG';
import img3 from '../assets/_MG_1506.JPG';

// ─── Story Timeline Data ──────────────────────────────
const eras = [
  {
    year: '1920s',
    title: 'The Roots',
    desc: 'Our ancestors laid the first stones of the Baldaniya legacy — farming the land, building homes, and forging a family identity rooted in hard work and unity.',
    icon: TreePine,
    color: '#c5a880',
    glow: 'rgba(197, 168, 128, 0.15)',
    emoji: '🌱',
  },
  {
    year: '1950s',
    title: 'Growing Branches',
    desc: 'The next generation expanded our reach. Children married, new households formed, and the family grew from one village into nearby towns.',
    icon: HomeIcon,
    color: '#c5a880',
    glow: 'rgba(197, 168, 128, 0.15)',
    emoji: '🏡',
  },
  {
    year: '1970s',
    title: 'Migration & Dreams',
    desc: 'Driven by ambition, family members migrated to cities. Engineers, teachers, and entrepreneurs emerged — carrying the family name to new heights.',
    icon: MapPin,
    color: '#c5a880',
    glow: 'rgba(197, 168, 128, 0.15)',
    emoji: '✈️',
  },
  {
    year: '1990s',
    title: 'The Baby Boom',
    desc: 'A generation of new births, weddings, and celebrations. Family gatherings grew louder and the dinner table grew longer.',
    icon: Baby,
    color: '#c5a880',
    glow: 'rgba(197, 168, 128, 0.15)',
    emoji: '👶',
  },
  {
    year: '2000s',
    title: 'Digital Age',
    desc: 'The world got smaller. WhatsApp groups replaced letters, video calls replaced visits, and our family stayed closer than ever despite the miles.',
    icon: Globe,
    color: '#c5a880',
    glow: 'rgba(197, 168, 128, 0.15)',
    emoji: '🌐',
  },
  {
    year: 'Today',
    title: 'One Family, Forever',
    desc: 'Five generations strong. Spread across cities, united by blood. This platform is our digital home — where every memory, every face, every story lives forever.',
    icon: Heart,
    color: '#c5a880',
    glow: 'rgba(197, 168, 128, 0.15)',
    emoji: '❤️',
  },
];

// ─── Animated Counter ─────────────────────────────────────
function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const { ref, inView } = useInView({ triggerOnce: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 1500;
    const step = Math.ceil(target / (duration / 16));
    const timer = setInterval(() => {
      start = Math.min(start + step, target);
      setCount(start);
      if (start >= target) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target]);

  return <span ref={ref} className="counter-value">{count}{suffix}</span>;
}

// ─── Sparkle Icon ───────────────────────────────────────────
function SparkleIcon({ style }: { style?: React.CSSProperties }) {
  return (
    <svg className="sparkle-star" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={style}>
      <path d="M12 0L13.5 8.5L22 10L13.5 11.5L12 20L10.5 11.5L2 10L10.5 8.5L12 0Z" fill="currentColor" />
    </svg>
  );
}

// ─── Timeline Era Card ──────────────────────────────────────
function EraCard({ era, index, total }: { era: typeof eras[0]; index: number; total: number }) {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  const Icon = era.icon;
  const isLast = index === total - 1;

  return (
    <div
      ref={ref}
      className={`era-item ${inView ? 'era-visible' : ''}`}
      style={{ '--era-color': era.color, '--era-glow': era.glow, '--era-delay': `${index * 0.08}s` } as React.CSSProperties}
    >
      {/* Left: Spine dot + connecting line */}
      <div className="era-spine-col">
        <div className="era-dot">
          <Icon size={16} strokeWidth={2.2} />
        </div>
        {!isLast && <div className="era-line" />}
      </div>

      {/* Right: Content card */}
      <div className="era-card">
        {/* Top row: year badge */}
        <div className="era-card-top">
          <span className="era-year">{era.year}</span>
        </div>

        <h3 className="era-title">{era.title}</h3>
        <p className="era-desc">{era.desc}</p>

        {/* Decorative bottom accent */}
        <div className="era-accent" />
      </div>
    </div>
  );
}

// ─── Home Page ────────────────────────────────────────────
export default function Home() {
  const navigate = useNavigate();

  const defaultSlides = [
    { id: 'default1', bg: `url(${img1}) center / cover no-repeat` },
    { id: 'default2', bg: `url(${img2}) center / cover no-repeat` },
    { id: 'default3', bg: `url(${img3}) center / cover no-repeat` },
  ];

  const [activeSlides, setActiveSlides] = useState<{ id: string | number; bg: string }[]>(defaultSlides);

  // Fetch hero images
  useEffect(() => {
    apiGetHeroImages()
      .then((res) => {
        if (res.data && res.data.length > 0) {
          const dynamicSlides = res.data.map((item) => ({
            id: item._id,
            bg: `url(${item.url}) center / cover no-repeat`
          }));
          setActiveSlides(dynamicSlides);
        }
      })
      .catch((err) => {
        console.error('Failed to load hero images', err);
      });
  }, []);
  const [slide, setSlide] = useState(1); // Start at index 1 (the first real slide)
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [isTabVisible, setIsTabVisible] = useState(true);
  const [members, setMembers] = useState<User[]>([]);
  const [galleryImages, setGalleryImages] = useState<DomeGalleryImage[]>([]);
  const titleRef = useRef<HTMLDivElement>(null);
  const { ref: storyHeaderRef, inView: storyHeaderInView } = useInView({ triggerOnce: true, threshold: 0.1 });

  // Post upload modals states
  const [modal, setModal] = useState<'sharePost' | 'createPost' | null>(null);
  const [postAcceptType, setPostAcceptType] = useState('image/*,video/*');
  const [postInitialFile, setPostInitialFile] = useState<File | undefined>(undefined);

  // Stories scroll and drag references/state
  const storiesRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [isDraggingStories, setIsDraggingStories] = useState(false);
  const [storiesStartX, setStoriesStartX] = useState(0);
  const [storiesScrollLeft, setStoriesScrollLeft] = useState(0);
  const [dragMoved, setDragMoved] = useState(false);

  const checkArrowsVisibility = () => {
    const el = storiesRef.current;
    if (!el) return;
    setShowLeftArrow(el.scrollLeft > 5);
    setShowRightArrow(el.scrollWidth - el.clientWidth - el.scrollLeft > 5);
  };

  useEffect(() => {
    checkArrowsVisibility();
    // Add a delay for layout rendering
    const timer = setTimeout(checkArrowsVisibility, 500);
    window.addEventListener('resize', checkArrowsVisibility);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkArrowsVisibility);
    };
  }, [members]);

  const scrollStories = (direction: 'left' | 'right') => {
    const el = storiesRef.current;
    if (!el) return;
    const scrollAmount = 240;
    const targetScroll = el.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
    el.scrollTo({
      left: targetScroll,
      behavior: 'smooth'
    });
  };

  const handleStoriesMouseDown = (e: React.MouseEvent) => {
    const el = storiesRef.current;
    if (!el) return;
    setIsDraggingStories(true);
    setStoriesStartX(e.pageX - el.offsetLeft);
    setStoriesScrollLeft(el.scrollLeft);
    setDragMoved(false);
  };

  const handleStoriesMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingStories) return;
    const el = storiesRef.current;
    if (!el) return;
    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    const walk = (x - storiesStartX) * 1.2;
    if (Math.abs(walk) > 5) {
      setDragMoved(true);
      el.scrollLeft = storiesScrollLeft - walk;
      checkArrowsVisibility();
    }
  };

  const handleStoriesMouseUpOrLeave = () => {
    setIsDraggingStories(false);
  };

  const handleStoryClick = (e: React.MouseEvent, username: string) => {
    if (dragMoved) {
      e.preventDefault();
      return;
    }
    navigate(`/members/${username}`);
  };

  // Extended slides for infinite loop: [Last, Slide 1, Slide 2, Slide 3, First]
  const extendedSlides = [
    activeSlides[activeSlides.length - 1],
    ...activeSlides,
    activeSlides[0],
  ];

  // Tab visibility detection to pause auto-play and prevent background state desync
  useEffect(() => {
    const handleVisibility = () => {
      setIsTabVisible(!document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // Unified transition end and snap-back timer handler (independent of browser transitionend events)
  useEffect(() => {
    if (!isTransitioning) return;

    const timer = setTimeout(() => {
      setIsTransitioning(false);
      setSlide((s) => {
        if (s >= activeSlides.length + 1) return 1;
        if (s <= 0) return activeSlides.length;
        return s;
      });
    }, 500); // Match transition duration (0.5s)

    return () => clearTimeout(timer);
  }, [isTransitioning, activeSlides]);

  // Touch & Mouse swipe gesture support
  const handleStart = (clientX: number) => {
    if (isTransitioning) return;
    setTouchStart(clientX);
    setIsDragging(true);
    setDragOffset(0);
  };

  const handleMove = (clientX: number) => {
    if (!isDragging || touchStart === null) return;
    const diff = clientX - touchStart;
    setDragOffset(diff);
  };

  const handleEnd = () => {
    if (!isDragging || touchStart === null) return;
    setIsDragging(false);

    const threshold = window.innerWidth * 0.15; // Swipe threshold (15% of viewport width)
    setIsTransitioning(true);

    if (dragOffset < -threshold) {
      // Swipe left -> next slide
      setSlide((s) => s + 1);
    } else if (dragOffset > threshold) {
      // Swipe right -> prev slide
      setSlide((s) => s - 1);
    } else {
      // Snap back to current slide (dragOffset reset to 0)
    }
    setDragOffset(0);
    setTouchStart(null);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    handleStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    handleEnd();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.hero-dots')) return;
    e.preventDefault(); // Prevent text selection/drag behaviors
    handleStart(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientX);
  };

  const handleMouseUpOrLeave = () => {
    handleEnd();
  };

  // Auto-advance carousel (only when tab is active and user is not interacting)
  useEffect(() => {
    if (!isTabVisible || isDragging || isTransitioning) return;

    const t = setInterval(() => {
      setIsTransitioning(true);
      setSlide((s) => s + 1);
    }, 5000);
    return () => clearInterval(t);
  }, [slide, isTabVisible, isDragging, isTransitioning]);

  // Fetch members
  useEffect(() => {
    apiGetMembers()
      .then(res => setMembers(res.data))
      .catch(() => {});
  }, []);

  // Fetch feed images for DomeGallery
  useEffect(() => {
    const defaults = [
      { src: img1, alt: 'Baldaniya Legacy' },
      { src: img2, alt: 'Baldaniya Celebrations' },
      { src: img3, alt: 'Baldaniya Memories' },
    ];
    apiGetFeed(1)
      .then(res => {
        const postImages = res.data.posts
          .filter(p => p.mediaType === 'image' && p.mediaUrl)
          .map(p => ({ src: p.mediaUrl, alt: p.caption || `Post by ${p.author.name}` }));
        setGalleryImages(postImages.length > 0 ? [...postImages, ...defaults] : defaults);
      })
      .catch(() => setGalleryImages(defaults));
  }, []);

  const { ref: statsRef, inView: statsInView } = useInView({ triggerOnce: true });

  return (
    <div className="page home-page">

      {/* ── Title Section ─────────────────────────────── */}
      <div className="home-title-bar" ref={titleRef}>
        <button 
          className="home-title-bar-plus" 
          onClick={() => setModal('sharePost')}
          aria-label="Create Post"
        >
          <Plus size={26} strokeWidth={2.5} />
        </button>
        <h1>
          <SparkleIcon style={{ top: '-10px', left: '-20px', width: '20px', height: '20px', animationDelay: '0s', animationDuration: '1.5s' }} />
          <SparkleIcon style={{ top: '10px', right: '-30px', width: '28px', height: '28px', animationDelay: '0.5s', animationDuration: '2s' }} />
          <SparkleIcon style={{ bottom: '-5px', left: '20%', width: '16px', height: '16px', animationDelay: '1s', animationDuration: '2.5s' }} />
          <SparkleIcon style={{ top: '-15px', right: '20%', width: '24px', height: '24px', animationDelay: '1.2s', animationDuration: '1.8s' }} />
          <FlipText duration={2.2} delay={0}>Baldaniya</FlipText>
        </h1>
        <button 
          className="home-title-bar-msg" 
          onClick={() => navigate('/messages')}
          aria-label="Messages"
        >
          <MessageCircle size={26} strokeWidth={2.2} />
        </button>
      </div>

      {/* ── Member Stories Section ───────────────────── */}
      {members.length > 0 && (
        <div className="member-stories-section">
          {showLeftArrow && (
            <button 
              className="story-nav-btn prev" 
              onClick={() => scrollStories('left')}
              aria-label="Previous profiles"
            >
              <ChevronLeft size={20} />
            </button>
          )}
          <div
            className="member-stories-track"
            ref={storiesRef}
            onScroll={checkArrowsVisibility}
            onMouseDown={handleStoriesMouseDown}
            onMouseMove={handleStoriesMouseMove}
            onMouseUp={handleStoriesMouseUpOrLeave}
            onMouseLeave={handleStoriesMouseUpOrLeave}
            style={{ cursor: isDraggingStories ? 'grabbing' : 'grab' }}
          >
            {members.map((m) => (
              <div
                key={m._id}
                className="story-item"
                onClick={(e) => handleStoryClick(e, m.username)}
              >
                <div className="story-avatar-wrapper">
                  <div className="story-avatar-gradient">
                    <div className="story-avatar-inner">
                      {m.profilePhoto?.url ? (
                        <img 
                          src={m.profilePhoto.url} 
                          alt={m.name} 
                          className="story-avatar-img"
                          draggable="false"
                        />
                      ) : (
                        <div className="story-avatar-placeholder">
                          {m.name?.[0]?.toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <span className="story-username">
                  {m.username.length > 11 ? `${m.username.slice(0, 10)}...` : m.username}
                </span>
              </div>
            ))}
          </div>
          {showRightArrow && (
            <button 
              className="story-nav-btn next" 
              onClick={() => scrollStories('right')}
              aria-label="Next profiles"
            >
              <ChevronRight size={20} />
            </button>
          )}
        </div>
      )}

      {/* ── Hero Carousel ─────────────────────────────── */}
      <section
        className="hero-carousel"
        id="home-hero"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
      >
        <div
          className="hero-track"
          style={{
            transform: isDragging
              ? `translateX(calc(-${slide * 100}% + ${dragOffset}px))`
              : `translateX(-${slide * 100}%)`,
            transition: isTransitioning && !isDragging
              ? 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
              : 'none'
          }}
        >
          {extendedSlides.map((s, idx) => (
            <div key={idx} className="hero-slide" style={{ background: s.bg }}>
              <div className="hero-overlay" />
            </div>
          ))}
        </div>
        <div className="hero-dots">
          {activeSlides.map((_, i) => {
            let dotActiveIndex = slide - 1;
            if (slide >= activeSlides.length + 1) dotActiveIndex = 0;
            if (slide <= 0) dotActiveIndex = activeSlides.length - 1;

            return (
              <button
                key={i}
                className={`hero-dot ${i === dotActiveIndex ? 'active' : ''}`}
                onClick={() => {
                  if (isTransitioning) return;
                  setIsTransitioning(true);
                  setSlide(i + 1);
                }}
                aria-label={`Slide ${i + 1}`}
              />
            );
          })}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          OUR STORY — Premium Timeline Section
      ══════════════════════════════════════════════════ */}
      <section className="story-section" id="our-story">

        {/* Ambient glows */}
        <div className="story-glow story-glow-1" />
        <div className="story-glow story-glow-2" />
        <div className="story-glow story-glow-3" />

        {/* Header */}
        <div
          ref={storyHeaderRef}
          className={`story-header ${storyHeaderInView ? 'is-visible' : ''}`}
        >
          <div className="story-eyebrow">
            <Sparkles size={13} />
            <span>Our Journey</span>
            <Sparkles size={13} />
          </div>
          <h2 className="story-main-title">Our Story</h2>
          <p className="story-subtitle">
            A century of love, laughter, and legacy — told through the chapters that shaped us.
          </p>
          <div className="story-divider">
            <div className="story-divider-line" />
            <Star size={10} fill="currentColor" />
            <div className="story-divider-line" />
          </div>
        </div>

        {/* Timeline list */}
        <div className="story-timeline">
          {eras.map((era, i) => (
            <EraCard key={era.year} era={era} index={i} total={eras.length} />
          ))}


        </div>

        {/* Bottom quote */}
        <p className="story-quote">
          "Five generations. One unbreakable bond."
        </p>
      </section>

      {/* ── Family Facts ──────────────────────────────── */}
      <section className="section family-facts" id="family-facts" ref={statsRef}>
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">By The Numbers</h2>
            <p className="section-subtitle">A snapshot of our incredible family</p>
          </div>
          <div className="stats-grid">
            {[
              { icon: Users, label: 'Family Members', value: members.length || 120, suffix: '+', color: '#c5a880' },
              { icon: History, label: 'Years of Legacy', value: 100, suffix: '+', color: '#c5a880' },
              { icon: Network, label: 'Generations', value: 5, suffix: '', color: '#c5a880' },
              { icon: Camera, label: 'Memories Shared', value: 500, suffix: '+', color: '#c5a880' },
            ].map(({ icon: Icon, label, value, suffix, color }) => (
              <div className="stat-card card" key={label}>
                <div className="stat-icon" style={{ color: '#ffffff' }}>
                  <Icon size={32} />
                </div>
                <div className="stat-value" style={{ color }}>
                  {statsInView ? <AnimatedCounter target={value} suffix={suffix} /> : '0'}
                </div>
                <div className="stat-label">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Immersive Gallery ─────────────────────────── */}
      <section className="section family-interactive-gallery" id="family-interactive-gallery" style={{ padding: '60px 0 20px', background: '#000000' }}>
        <div className="container">
          <div className="section-header" style={{ marginBottom: '32px' }}>
            <h2 className="section-title">Immersive Gallery</h2>
            <p className="section-subtitle">Drag to spin the 3D dome and click any memory to enlarge</p>
          </div>
          <div className="dome-gallery-wrapper" style={{ height: '550px', position: 'relative', overflow: 'hidden', background: 'transparent' }}>
            {galleryImages.length > 0 && (
              <DomeGallery
                images={galleryImages}
                fit={0.65}
                fitBasis="auto"
                minRadius={500}
                maxRadius={900}
                padFactor={0.15}
                overlayBlurColor="#000000"
                maxVerticalRotationDeg={10}
                dragSensitivity={15}
                enlargeTransitionMs={350}
                segments={30}
                dragDampening={1.8}
                openedImageWidth="350px"
                openedImageHeight="450px"
                imageBorderRadius="16px"
                openedImageBorderRadius="24px"
                grayscale={false}
              />
            )}
          </div>
        </div>
      </section>
      {/* ── Modals ───────────────────────────────────── */}
      {modal === 'sharePost' && (
        <SharePostSheet
          onFileSelected={(file, accept) => {
            setPostAcceptType(accept);
            setPostInitialFile(file);
            setModal('createPost');
          }}
          onCancel={() => setModal(null)}
        />
      )}

      {modal === 'createPost' && (
        <CreatePostModal
          onClose={() => { setModal(null); setPostInitialFile(undefined); }}
          onCreated={() => {
            setModal(null);
            setPostInitialFile(undefined);
            window.location.reload();
          }}
          acceptType={postAcceptType}
          initialFile={postInitialFile}
        />
      )}
    </div>
  );
}
