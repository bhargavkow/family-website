import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Users, Calendar, Globe, Heart } from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import { apiGetMembers, apiGetFeed } from '../api';
import type { User } from '../types';
import './Home.css';

// ─── Carousel Data ────────────────────────────────────────
const slides = [
  {
    id: 1,
    bg: 'linear-gradient(135deg, #1a0533 0%, #0d1b4b 50%, #1a0533 100%)',
    title: 'Our Family Legacy',
    subtitle: 'Five generations of love, laughter & memories',
    emoji: '🌳',
  },
  {
    id: 2,
    bg: 'linear-gradient(135deg, #0d2b1a 0%, #0d1b4b 50%, #2b0d1a 100%)',
    title: 'Rooted in Tradition',
    subtitle: 'From humble beginnings to a thriving family tree',
    emoji: '🏡',
  },
  {
    id: 3,
    bg: 'linear-gradient(135deg, #2b1a0d 0%, #0d1b4b 50%, #0d2b2b 100%)',
    title: 'Together Always',
    subtitle: 'Distance is nothing when family is everything',
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

  return (
    <span ref={ref} className="counter-value">
      {count}{suffix}
    </span>
  );
}

// ─── Member Avatar Card ───────────────────────────────────
function MemberCard({ member }: { member: User }) {
  const navigate = useNavigate();
  const initial = member.name?.[0]?.toUpperCase() || '?';

  return (
    <div
      className="member-preview-card"
      onClick={() => navigate(`/members/${member.username}`)}
      role="button"
      tabIndex={0}
      id={`member-${member.username}`}
    >
      <div className="member-preview-avatar avatar-ring">
        {member.profilePhoto?.url ? (
          <img
            src={member.profilePhoto.url}
            alt={member.name}
            className="avatar"
            style={{ width: 64, height: 64 }}
          />
        ) : (
          <div className="member-preview-initial avatar" style={{ width: 64, height: 64 }}>
            {initial}
          </div>
        )}
      </div>
      <span className="member-preview-name">{member.name}</span>
      <span className="member-preview-username">@{member.username}</span>
    </div>
  );
}

// ─── Home Page ────────────────────────────────────────────
export default function Home() {
  const navigate = useNavigate();
  const [slide, setSlide] = useState(0);
  const [members, setMembers] = useState<User[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);

  // Auto-advance carousel
  useEffect(() => {
    const t = setInterval(() => setSlide(s => (s + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, []);

  // Fetch members
  useEffect(() => {
    apiGetMembers()
      .then(res => setMembers(res.data))
      .catch(() => {})
      .finally(() => setMembersLoading(false));
  }, []);

  const prev = useCallback(() => setSlide(s => (s - 1 + slides.length) % slides.length), []);
  const next = useCallback(() => setSlide(s => (s + 1) % slides.length), []);

  const { ref: statsRef, inView: statsInView } = useInView({ triggerOnce: true });

  return (
    <div className="page home-page">
      {/* ── Hero Carousel ─────────────────────────────── */}
      <section className="hero-carousel" id="home-hero">
        <div className="hero-track" style={{ transform: `translateX(-${slide * 100}%)` }}>
          {slides.map((s) => (
            <div key={s.id} className="hero-slide" style={{ background: s.bg }}>
              <div className="hero-overlay" />
              <div className="hero-content animate-slide-up">
                <div className="hero-emoji">{s.emoji}</div>
                <h1 className="hero-title">{s.title}</h1>
                <p className="hero-subtitle">{s.subtitle}</p>
                <button
                  className="btn btn-primary btn-lg"
                  onClick={() => navigate('/members')}
                  id="hero-explore-btn"
                >
                  Meet the Family
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation */}
        <button className="carousel-btn carousel-prev" onClick={prev} id="carousel-prev" aria-label="Previous slide">
          <ChevronLeft size={22} />
        </button>
        <button className="carousel-btn carousel-next" onClick={next} id="carousel-next" aria-label="Next slide">
          <ChevronRight size={22} />
        </button>

        {/* Dots */}
        <div className="carousel-dots">
          {slides.map((_, i) => (
            <button
              key={i}
              className={`dot ${i === slide ? 'active' : ''}`}
              onClick={() => setSlide(i)}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </section>

      {/* ── Family History ────────────────────────────── */}
      <section className="section family-history" id="family-history">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Our Story</h2>
            <p className="section-subtitle">A journey through generations of love and tradition</p>
          </div>

          <div className="timeline">
            {[
              { year: '1920', title: 'The Beginning', desc: 'Our family roots trace back over a century, when our ancestors first settled and built a life together.', icon: '🌱' },
              { year: '1950', title: 'Growing Strong', desc: 'Three generations strong, the family expanded across cities while keeping bonds unbreakable.', icon: '🏠' },
              { year: '1980', title: 'A New Era', desc: 'A generation of dreamers and achievers brought new skills, professions, and horizons to our family.', icon: '⭐' },
              { year: '2000', title: 'Modern Family', desc: 'The digital age brought us closer — video calls, group chats, and now our very own family website.', icon: '💻' },
              { year: 'Now', title: 'Our Legacy Lives On', desc: 'Five generations, countless memories, and an unbreakable bond that grows stronger every day.', icon: '❤️' },
            ].map((item, i) => (
              <div key={item.year} className={`timeline-item ${i % 2 === 0 ? 'left' : 'right'}`}>
                <div className="timeline-dot">
                  <span>{item.icon}</span>
                </div>
                <div className="timeline-card card">
                  <div className="timeline-year">{item.year}</div>
                  <h3 className="timeline-title">{item.title}</h3>
                  <p className="timeline-desc">{item.desc}</p>
                </div>
              </div>
            ))}
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

      {/* ── Members Preview ───────────────────────────── */}
      <section className="section members-preview" id="members-preview">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Meet the Family</h2>
            <p className="section-subtitle">Our incredible members from every generation</p>
          </div>

          {membersLoading ? (
            <div className="member-grid">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="member-preview-card-skeleton">
                  <div className="skeleton" style={{ width: 68, height: 68, borderRadius: '50%' }} />
                  <div className="skeleton" style={{ width: 70, height: 12, borderRadius: 6, marginTop: 8 }} />
                </div>
              ))}
            </div>
          ) : (
            <div className="member-grid">
              {members.slice(0, 10).map(m => (
                <MemberCard key={m._id} member={m} />
              ))}
            </div>
          )}

          {members.length > 10 && (
            <div style={{ textAlign: 'center', marginTop: 32 }}>
              <button
                className="btn btn-outline btn-lg"
                onClick={() => navigate('/members')}
                id="view-all-members-btn"
              >
                View All {members.length} Members
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
