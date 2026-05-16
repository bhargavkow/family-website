import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Quote, Calendar, ChevronDown, ChevronRight, Sparkles, Crown, Cake } from 'lucide-react';
import { apiGetMembers, apiGetEvents } from '../api';
import type { User, FamilyEvent } from '../types';
import './Members.css';

const dailyThoughts = [
  "Family is where life begins and love never ends.",
  "The most important thing in the world is family and love.",
  // "In family life, love is the oil that eases friction, the cement that binds closer together, and the music that brings harmony.",
  "Family is not an important thing. It's everything.",
  "Other things may change us, but we start and end with the family.",
  "A happy family is but an earlier heaven.",
  "Family: A little bit of crazy, a little bit of loud, and a whole lot of love.",
  "The family is one of nature's masterpieces.",
  "Family and friends are hidden treasures, seek them out and enjoy their riches.",
  "Home is where you are loved the most and act the worst.",
  "The strength of a family, like the strength of an army, lies in its loyalty to each other.",
  // "Being a family means you are a part of something very wonderful. It means you will love and be loved for the rest of your life.",
  "To us, family means putting your arms around each other and being there.",
  "Family is the heart of a home.",
  "A house is made of bricks and beams. A home is made of love and dreams."
];

export default function Members() {
  const [members, setMembers] = useState<User[]>([]);
  const [events, setEvents] = useState<FamilyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllBirthdays, setShowAllBirthdays] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([apiGetMembers(), apiGetEvents()])
      .then(([membersRes, eventsRes]) => {
        setMembers(membersRes.data);
        setEvents(eventsRes.data);
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  // Daily Thought Logic
  const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const currentThought = dailyThoughts[dayOfYear % dailyThoughts.length];

  // Birthday Logic
  const getBirthdayScore = (m: User) => {
    if (!m.dob) return 9999;
    const dob = new Date(m.dob);
    const today = new Date();
    const tMonth = today.getMonth();
    const tDay = today.getDate();
    const bMonth = dob.getMonth();
    const bDay = dob.getDate();

    let score = (bMonth - tMonth) * 100 + (bDay - tDay);
    if (score < 0) score += 1200; // Next year
    return score;
  };

  const sortedMembers = [...members]
    .filter(m => m.dob)
    .sort((a, b) => getBirthdayScore(a) - getBirthdayScore(b));

  const todayBirthdays = sortedMembers.filter(m => getBirthdayScore(m) === 0);
  const topUpcoming = todayBirthdays.length > 0 ? todayBirthdays : sortedMembers.slice(0, 3);

  if (loading) return (
    <div className="page members-page" style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
      <div className="members-header" style={{ padding: '16px 20px 20px' }}>
        <div className="skeleton" style={{ width: 120, height: 32, borderRadius: 8, marginBottom: 8 }} />
        <div className="skeleton" style={{ width: 180, height: 16, borderRadius: 4 }} />
      </div>
      <div style={{ padding: '0 0 24px' }}>
        <div className="skeleton" style={{ height: 120, borderRadius: 0 }} />
      </div>
      <div style={{ padding: '0 20px' }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 14 }} />
          <div>
            <div className="skeleton" style={{ width: 100, height: 20, borderRadius: 4, marginBottom: 6 }} />
            <div className="skeleton" style={{ width: 140, height: 14, borderRadius: 4 }} />
          </div>
        </div>
        <div className="skeleton" style={{ height: 180, borderRadius: 24, marginBottom: 16 }} />
        <div className="skeleton" style={{ height: 80, borderRadius: 24, marginBottom: 16 }} />
      </div>
    </div>
  );

  return (
    <div className="page members-page" style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
      <div className="members-header" style={{ padding: '16px 20px 20px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-1.5px', marginBottom: 2, color: 'var(--color-text)' }}>Update</h1>
        <p style={{ color: 'var(--color-text-2)', fontSize: 14, fontWeight: 500 }}>Stay connected with our family</p>
      </div>

      {/* ── Daily Thought Section ── */}
      <section style={{ padding: '0 0 24px' }}>
        <div style={{
          background: 'var(--color-surface)',
          padding: '24px 20px',
          borderTop: '1px solid var(--color-border)',
          borderBottom: '1px solid var(--color-border)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: -15, right: -15, opacity: 0.03, color: 'var(--color-primary)' }}>
            <Quote size={100} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{ width: 24, height: 24, borderRadius: 8, background: 'rgba(124, 92, 252, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
              <Quote size={12} fill="currentColor" />
            </div>
            <span style={{ fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-primary)' }}>Thought of the Day</span>
          </div>
          <p style={{
            fontSize: 16,
            fontWeight: 700,
            lineHeight: 1.5,
            color: 'var(--color-text)',
            position: 'relative',
            zIndex: 1,
            fontStyle: 'italic'
          }}>
            "{currentThought}"
          </p>
        </div>
      </section>

      {/* ── Exciting Birthday Section ── */}
      <section style={{ padding: '0 20px 40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44,
              height: 44,
              background: 'linear-gradient(135deg, #7c5cfc, #a855f7)',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: '0 8px 16px rgba(124, 92, 252, 0.3)'
            }}>
              <Cake size={24} className="animate-pulse" />
            </div>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.5px', color: 'var(--color-text)' }}>Birthdays</h2>
              <p style={{ fontSize: 12, color: 'var(--color-text-2)', fontWeight: 600 }}>Celebrate our loved ones</p>
            </div>
          </div>
          <button
            onClick={() => setShowAllBirthdays(!showAllBirthdays)}
            style={{
              background: 'var(--color-surface-2)',
              border: 'none',
              width: 40,
              height: 40,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-text)',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
              transform: showAllBirthdays ? 'rotate(180deg)' : 'rotate(0deg)'
            }}
          >
            <ChevronDown size={22} strokeWidth={2.5} />
          </button>
        </div>

        {!showAllBirthdays && (
          sortedMembers.length === 0 ? (
            <div className="glass-card" style={{ padding: '32px 20px', textAlign: 'center', borderRadius: 28, color: 'var(--color-text-2)', border: '2px dashed var(--color-border)', background: 'rgba(0,0,0,0.02)' }}>
              <Sparkles size={32} style={{ marginBottom: 12, opacity: 0.3, color: 'var(--color-primary)' }} />
              <p style={{ fontWeight: 600 }}>No upcoming celebrations yet!</p>
              <p style={{ fontSize: 12, marginTop: 4 }}>Add birthdays to family profiles to see them here.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
              {topUpcoming.map((m, idx) => {
                const dob = new Date(m.dob!);
                const today = new Date();
                const isToday = dob.getDate() === today.getDate() && dob.getMonth() === today.getMonth();

                // Calculate days remaining
                const bMonth = dob.getMonth();
                const bDay = dob.getDate();
                const tMonth = today.getMonth();
                const tDay = today.getDate();

                let daysText = "";
                if (isToday) daysText = "TODAY! 🥳";
                else if (bMonth === tMonth && bDay === tDay + 1) daysText = "Tomorrow! ✨";
                else {
                  const monthsArr = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                  daysText = `${monthsArr[bMonth]} ${bDay}`;
                }

                return (
                  <div
                    key={m._id}
                    onClick={() => navigate(`/members/${m.username}`)}
                    className={isToday ? "birthday-card-today" : "birthday-card-upcoming"}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      padding: isToday ? '20px' : '16px',
                      borderRadius: 8,
                      cursor: 'pointer',
                      position: 'relative',
                      overflow: 'hidden',
                      animation: `fadeInUp ${0.3 + idx * 0.1}s ease-out`
                    }}
                  >
                    {/* Background effects for today */}
                    {isToday && (
                      <>
                        <div className="birthday-glow" />
                        <div className="confetti-particle p1" />
                        <div className="confetti-particle p2" />
                        <div className="confetti-particle p3" />
                        <div className="birthday-shine" />
                      </>
                    )}

                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <div className={isToday ? "avatar-ring-animated" : ""}>
                        {m.profilePhoto?.url ? (
                          <img src={m.profilePhoto.url} alt={m.name} style={{ width: isToday ? 72 : 56, height: isToday ? 72 : 56, borderRadius: '50%', objectFit: 'cover', border: isToday ? '3px solid white' : '2px solid var(--color-border)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                        ) : (
                          <div style={{ width: isToday ? 72 : 56, height: isToday ? 72 : 56, borderRadius: '50%', background: isToday ? 'white' : 'var(--color-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: isToday ? 24 : 18, color: isToday ? 'var(--color-primary)' : 'var(--color-text)' }}>
                            {m.name?.[0]?.toUpperCase()}
                          </div>
                        )}
                      </div>
                      {isToday && (
                        <>
                          <div className="floating-emoji">🎂</div>
                          <div className="birthday-crown">
                            <Crown size={20} fill="#FFD700" color="#FFD700" />
                          </div>
                        </>
                      )}
                    </div>

                    <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
                      <div style={{
                        fontWeight: 900,
                        fontSize: isToday ? 20 : 16,
                        color: isToday ? 'white' : 'var(--color-text)',
                        letterSpacing: '-0.3px',
                        textShadow: isToday ? '0 2px 4px rgba(0,0,0,0.2)' : 'none'
                      }}>
                        {m.name}
                      </div>
                      <div style={{
                        fontSize: isToday ? 14 : 13,
                        fontWeight: 700,
                        color: isToday ? 'rgba(255,255,255,0.9)' : 'var(--color-primary)',
                        marginTop: 4,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}>
                        {isToday ? <Sparkles size={14} /> : <Calendar size={14} />}
                        {daysText}
                      </div>
                    </div>

                    {isToday && (
                      <div
                        className="wish-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/messages/${m.username}`);
                        }}
                      >
                        Wish Now
                      </div>
                    )}


                  </div>
                );
              })}
            </div>
          )
        )}

        {/* All Birthdays List (Expanded View) */}
        {showAllBirthdays && (
          <div className="birthday-list-expanded" style={{
            background: 'var(--color-surface)',
            borderRadius: 32,
            border: '1px solid var(--color-border)',
            overflow: 'hidden',
            boxShadow: '0 24px 48px rgba(0,0,0,0.1)',
            animation: 'slideDownFade 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}>
            <div style={{ padding: '20px 20px 10px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-2)' }}>
              <p style={{ fontWeight: 800, fontSize: 13, textTransform: 'uppercase', color: 'var(--color-text-2)', letterSpacing: '1px' }}>Full Birthday Calendar</p>
            </div>
            {sortedMembers.map((m, idx) => {
              const dob = new Date(m.dob!);
              const isToday = dob.getDate() === new Date().getDate() && dob.getMonth() === new Date().getMonth();
              return (
                <div
                  key={m._id}
                  onClick={() => navigate(`/members/${m.username}`)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '14px 20px',
                    gap: 14,
                    borderBottom: idx === sortedMembers.length - 1 ? 'none' : '1px solid var(--color-border-light)',
                    background: isToday ? 'rgba(124, 92, 252, 0.05)' : 'none',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--color-border)' }}>
                    {m.profilePhoto?.url ? (
                      <img src={m.profilePhoto.url} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: 'var(--color-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16 }}>
                        {m.name?.[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: isToday ? 'var(--color-primary)' : 'var(--color-text)' }}>
                      {m.name}
                      {isToday && <span className="today-badge">TODAY</span>}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--color-text-2)', fontWeight: 500 }}>
                      {dob.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                    </div>
                  </div>
                  <div style={{ color: 'var(--color-text-3)' }}>
                    <ChevronRight size={18} strokeWidth={2.5} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Upcoming Events Section ── */}
      <section style={{ padding: '0 20px 100px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(124, 92, 252, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
            <Calendar size={16} strokeWidth={2.5} />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-text)' }}>Upcoming Events</h3>
        </div>

        {events.length === 0 ? (
          <div className="glass-card" style={{ padding: '32px 20px', textAlign: 'center', borderRadius: 28, color: 'var(--color-text-2)', border: '2px dashed var(--color-border)', background: 'rgba(0,0,0,0.02)' }}>
            <Sparkles size={32} style={{ marginBottom: 12, opacity: 0.3, color: 'var(--color-primary)' }} />
            <p style={{ fontWeight: 600 }}>No major events planned yet</p>
            <p style={{ fontSize: 12, marginTop: 4 }}>Check back later for family gatherings!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {events.map((ev) => (
              <div key={ev._id} className="event-card" style={{
                background: 'var(--color-surface)',
                borderRadius: 8,
                overflow: 'hidden',
                border: '1px solid var(--color-border)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.05)',
                display: 'flex',
                flexDirection: 'column'
              }}>
                {ev.photo?.url && (
                  <div style={{ width: '100%', height: 160, overflow: 'hidden' }}>
                    <img src={ev.photo.url} alt={ev.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
                <div style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontWeight: 800, fontSize: 17, color: 'var(--color-text)', marginBottom: 2 }}>{ev.name}</h4>
                      <p style={{ fontSize: 13, color: 'var(--color-text-2)', lineHeight: 1.4 }}>{ev.description}</p>
                    </div>
                    <div style={{
                      padding: '6px 10px',
                      borderRadius: 12,
                      background: 'rgba(124, 92, 252, 0.1)',
                      color: 'var(--color-primary)',
                      textAlign: 'center',
                      minWidth: 50
                    }}>
                      <div style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase' }}>
                        {new Date(ev.date).toLocaleDateString('en-US', { month: 'short' })}
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 900 }}>
                        {new Date(ev.date).getDate()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDownFade {
          from { opacity: 0; transform: translateY(-20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes pulse-glow {
          0% { box-shadow: 0 0 0 0 rgba(124, 92, 252, 0.4); }
          70% { box-shadow: 0 0 0 15px rgba(124, 92, 252, 0); }
          100% { box-shadow: 0 0 0 0 rgba(124, 92, 252, 0); }
        }
        @keyframes float {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-5px) rotate(10deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }

        .birthday-card-today {
          background: linear-gradient(135deg, var(--color-primary), #a855f7, #ec4899);
          background-size: 200% 200%;
          animation: pulse-glow 2s infinite, gradient-move 5s ease infinite;
          box-shadow: 0 15px 35px rgba(124, 92, 252, 0.35), inset 0 0 20px rgba(255,255,255,0.2);
        }
        @keyframes gradient-move {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .birthday-shine {
          position: absolute;
          top: 0;
          left: -100%;
          width: 50%;
          height: 100%;
          background: linear-gradient(to right, transparent, rgba(255,255,255,0.3), transparent);
          transform: skewX(-25deg);
          animation: shine 3s infinite;
        }
        @keyframes shine {
          0% { left: -100%; }
          20% { left: 150%; }
          100% { left: 150%; }
        }
        .confetti-particle {
          position: absolute;
          width: 6px;
          height: 6px;
          border-radius: 2px;
          opacity: 0.6;
        }
        .p1 { background: #FFD700; top: 10%; left: 20%; animation: particle-float 3s infinite; }
        .p2 { background: #fff; top: 60%; left: 80%; animation: particle-float 4s infinite reverse; }
        .p3 { background: #00f2fe; top: 40%; left: 10%; animation: particle-float 5s infinite 1s; }
        @keyframes particle-float {
          0% { transform: translateY(0) rotate(0); }
          50% { transform: translateY(-20px) rotate(180deg); }
          100% { transform: translateY(0) rotate(360deg); }
        }
        .birthday-crown {
          position: absolute;
          top: -15px;
          left: 50%;
          transform: translateX(-50%) rotate(-15deg);
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
        }
        .wish-btn {
          padding: 8px 16px;
          background: white;
          color: var(--color-primary);
          border-radius: 12px;
          font-weight: 800;
          font-size: 12px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.1);
          animation: bounce 2s infinite;
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        .birthday-card-upcoming {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          box-shadow: 0 4px 12px rgba(0,0,0,0.03);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .birthday-card-upcoming:active {
          transform: scale(0.98);
          background: var(--color-surface-2);
        }
        
        .birthday-glow {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at top right, rgba(255,255,255,0.3), transparent);
          pointer-events: none;
        }

        .avatar-ring-animated {
          padding: 3px;
          background: linear-gradient(45deg, rgba(255,255,255,0.8), rgba(255,255,255,0.3));
          border-radius: 50%;
        }
        
        .floating-emoji {
          position: absolute;
          top: -10px;
          right: -10px;
          font-size: 24px;
          animation: float 2.5s ease-in-out infinite;
        }

        .today-badge {
          margin-left: 10px;
          font-size: 10px;
          background: var(--color-primary);
          color: white;
          padding: 2px 8px;
          borderRadius: 8px;
          font-weight: 900;
          letter-spacing: 0.5px;
        }


      `}</style>
    </div>
  );
}
