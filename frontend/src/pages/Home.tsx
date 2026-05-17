import { useState, useEffect } from 'react';
import { FlipText } from '../components/ui/flip-text';
import ScrollReveal from '../components/ui/ScrollReveal';
import { Users, Calendar, Globe, Heart } from 'lucide-react';
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
  {
    id: 1,
    bg: `url(${img1}) center / 100% 100% no-repeat`,
  },
  {
    id: 2,
    bg: `url(${img2}) center / 100% 100% no-repeat`,
  },
  {
    id: 3,
    bg: `url(${img3}) center / 100% 100% no-repeat`,
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

  return (
    <span ref={ref} className="counter-value">
      {count}{suffix}
    </span>
  );
}

// ─── Sparkle Icon ───────────────────────────────────────────
function SparkleIcon({ style }: { style?: React.CSSProperties }) {
  return (
    <svg className="sparkle-star" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={style}>
      <path d="M12 0L13.5 8.5L22 10L13.5 11.5L12 20L10.5 11.5L2 10L10.5 8.5L12 0Z" fill="currentColor" />
    </svg>
  );
}

// ─── Home Page ────────────────────────────────────────────
export default function Home() {
  const [slide, setSlide] = useState(0);
  const [members, setMembers] = useState<User[]>([]);
  const [galleryImages, setGalleryImages] = useState<DomeGalleryImage[]>([]);

  // Auto-advance carousel
  useEffect(() => {
    const t = setInterval(() => setSlide(s => (s + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, []);

  // Fetch members
  useEffect(() => {
    apiGetMembers()
      .then(res => setMembers(res.data))
      .catch(() => { });
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
          .map(p => ({
            src: p.mediaUrl,
            alt: p.caption || `Post by ${p.author.name}`
          }));
        
        if (postImages.length > 0) {
          setGalleryImages([...postImages, ...defaults]);
        } else {
          setGalleryImages(defaults);
        }
      })
      .catch(() => {
        setGalleryImages(defaults);
      });
  }, []);


  const { ref: statsRef, inView: statsInView } = useInView({ triggerOnce: true });

  return (
    <div className="page home-page">
      {/* ── Title Section ─────────────────────────────── */}
      <div className="home-title-bar">
        <h1>
          <SparkleIcon style={{ top: '-10px', left: '-20px', width: '20px', height: '20px', animationDelay: '0s', animationDuration: '1.5s' }} />
          <SparkleIcon style={{ top: '10px', right: '-30px', width: '28px', height: '28px', animationDelay: '0.5s', animationDuration: '2s' }} />
          <SparkleIcon style={{ bottom: '-5px', left: '20%', width: '16px', height: '16px', animationDelay: '1s', animationDuration: '2.5s' }} />
          <SparkleIcon style={{ top: '-15px', right: '20%', width: '24px', height: '24px', animationDelay: '1.2s', animationDuration: '1.8s' }} />
          <FlipText duration={2.2} delay={0}>
            BALDANIYA FAMILY
          </FlipText>
        </h1>
      </div>

      {/* ── Hero Carousel ─────────────────────────────── */}
      <section className="hero-carousel" id="home-hero">
        <div className="hero-track" style={{ transform: `translateX(-${slide * 100}%)` }}>
          {slides.map((s) => (
            <div key={s.id} className="hero-slide" style={{ background: s.bg }}>
              <div className="hero-overlay" />
            </div>
          ))}
        </div>
      </section>

      {/* ── Family History ────────────────────────────── */}
      <section className="section family-history" id="family-history" style={{ paddingTop: '30px' }}>
        <div className="container">
          <div className="section-header">
            <h2 
              className="section-title" 
              style={{ 
                color: '#fff', 
                WebkitTextFillColor: '#fff', 
                letterSpacing: '1px'
              }}
            >
              Our Story
            </h2>
            <p className="section-subtitle">A journey through generations of love and tradition</p>
          </div>

          <div className="story-content" style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto', fontSize: '0.8rem', lineHeight: '1.8', color: '#f0f0f8', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
            <ScrollReveal
              baseOpacity={0}
              enableBlur={true}
              baseRotation={0}
              blurStrength={10}
            >
              Our family roots trace back over a century, when our ancestors first settled and built a life together. Over the decades, we've expanded across cities while keeping our bonds unbreakable. A generation of dreamers and achievers brought new skills and horizons to our family, and the digital age brought us closer than ever. Today, with five generations and countless memories, our unbreakable bond grows stronger every day.
            </ScrollReveal>
          </div>
        </div>
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
              { icon: Users, label: 'Family Members', value: members.length || 120, suffix: '+', color: 'var(--color-primary)' },
              { icon: Calendar, label: 'Years of Legacy', value: 100, suffix: '+', color: 'var(--color-accent)' },
              { icon: Globe, label: 'Generations', value: 5, suffix: '', color: 'var(--color-accent-2)' },
              { icon: Heart, label: 'Memories Shared', value: 500, suffix: '+', color: 'var(--color-success)' },
            ].map(({ icon: Icon, label, value, suffix, color }) => (
              <div className="stat-card card" key={label}>
                <div className="stat-icon" style={{ color }}>
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

      {/* ── Immersive Family Gallery ─────────────────── */}
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
