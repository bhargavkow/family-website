import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGetMembers } from '../api';
import type { User } from '../types';
import './Members.css';

function MemberTile({ member }: { member: User }) {
  const navigate = useNavigate();
  const initial = member.name?.[0]?.toUpperCase() || '?';

  return (
    <div
      className="member-tile"
      onClick={() => navigate(`/members/${member.username}`)}
      role="button"
      tabIndex={0}
      id={`tile-${member.username}`}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/members/${member.username}`)}
    >
      <div className="member-tile-photo">
        {member.profilePhoto?.url ? (
          <img src={member.profilePhoto.url} alt={member.name} className="member-tile-img" />
        ) : (
          <div className="member-tile-initial">{initial}</div>
        )}
        <div className="member-tile-overlay">
          <span className="member-tile-view">View Profile</span>
        </div>
      </div>
      <div className="member-tile-info">
        <span className="member-tile-name">{member.name}</span>
        <span className="member-tile-username">@{member.username}</span>
      </div>
    </div>
  );
}

function MemberSkeleton() {
  return (
    <div className="member-tile-skeleton">
      <div className="skeleton member-tile-photo" style={{ aspectRatio: '1' }} />
      <div style={{ padding: '8px 4px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div className="skeleton" style={{ height: 12, width: '70%', borderRadius: 6 }} />
        <div className="skeleton" style={{ height: 10, width: '50%', borderRadius: 6 }} />
      </div>
    </div>
  );
}

export default function Members() {
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiGetMembers()
      .then(res => setMembers(res.data))
      .catch(() => setError('Failed to load members'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page members-page">
      <div className="members-header">
        <h1 className="section-title">Our Family</h1>
        <p className="section-subtitle">
          {loading ? 'Loading members...' : `${members.length} members`}
        </p>
      </div>

      {error && (
        <div style={{ textAlign: 'center', color: 'var(--color-error)', padding: 40 }}>
          {error}
        </div>
      )}

      <div className="members-grid">
        {loading
          ? Array.from({ length: 12 }).map((_, i) => <MemberSkeleton key={i} />)
          : members.map(m => <MemberTile key={m._id} member={m} />)
        }
      </div>

      {!loading && members.length === 0 && (
        <div className="empty-state">
          <p>No members found yet.</p>
        </div>
      )}
    </div>
  );
}
