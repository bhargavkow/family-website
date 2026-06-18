import { useState, useEffect, useRef } from 'react';
import { FlipText } from '../components/ui/flip-text';
import { Users, Globe, Heart, TreePine, Home as HomeIcon, Star, Sparkles, MapPin, Baby, History, Camera, Network } from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import { apiGetMembers, apiGetFeed } from '../api';
import type { User } from '../types';
import DomeGallery from '../components/ui/DomeGallery';
import type { DomeGalleryImage } from '../components/ui/DomeGallery';
import './Home.css';

import img1 from '../assets/_MG_1369.JPG';
import img2 from '../assets/_MG_1381.JPG';
import img3 from '../assets/_MG_1506.JPG';

// ─── Carousel Data ────────────────────────────────────────
const slides = [
  { id: 1, bg: `url(${img1}) center / cover no-repeat` },
  { id: 2, bg: `url(${img2}) center / cover no-repeat` },
  { id: 3, bg: `url(${img3}) center / cover no-repeat` },
];

// ─── Story Timeline Data ───────────────────────────────────
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

  // Extended slides for infinite loop: [Last, Slide 1, Slide 2, Slide 3, First]
  const extendedSlides = [
    slides[slides.length - 1],
    ...slides,
    slides[0],
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
        if (s >= slides.length + 1) return 1;
        if (s <= 0) return slides.length;
        return s;
      });
    }, 500); // Match transition duration (0.5s)

    return () => clearTimeout(timer);
  }, [isTransitioning]);

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
        <h1>
          <SparkleIcon style={{ top: '-10px', left: '-20px', width: '20px', height: '20px', animationDelay: '0s', animationDuration: '1.5s' }} />
          <SparkleIcon style={{ top: '10px', right: '-30px', width: '28px', height: '28px', animationDelay: '0.5s', animationDuration: '2s' }} />
          <SparkleIcon style={{ bottom: '-5px', left: '20%', width: '16px', height: '16px', animationDelay: '1s', animationDuration: '2.5s' }} />
          <SparkleIcon style={{ top: '-15px', right: '20%', width: '24px', height: '24px', animationDelay: '1.2s', animationDuration: '1.8s' }} />
          <FlipText duration={2.2} delay={0}>Baldaniya family</FlipText>
        </h1>
      </div>

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
          {slides.map((_, i) => {
            let dotActiveIndex = slide - 1;
            if (slide >= slides.length + 1) dotActiveIndex = 0;
            if (slide <= 0) dotActiveIndex = slides.length - 1;

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
    </div>
  );
}
