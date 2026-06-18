import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { Search, ArrowLeft, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  apiGetConversations, apiGetThread, apiSendMessage, apiSearchMembers, apiGetMember
} from '../api';
import type { Conversation, Message, User } from '../types';
import './Messages.css';
import './Members.css';

function formatTime(date: string) {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return 'now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function formatDivider(date: string) {
  const d = new Date(date);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const timeStr = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  if (isToday) return timeStr;
  const dayStr = d.toLocaleDateString([], { weekday: 'long' });
  return `${dayStr} ${timeStr}`;
}

export default function Messages() {
  const { user: me } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { userId: routeUserId } = useParams<{ userId: string }>();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [view, setView] = useState<'list' | 'chat'>('list');
  const [listLoading, setListLoading] = useState(true);
  const [swipeX, setSwipeX] = useState(0);
  const touchStart = useRef(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const didOpenFromState = useRef(false);

  // Load conversations
  const loadConversations = async () => {
    try {
      const res = await apiGetConversations();
      setConversations(res.data);
    } catch { /* no-op */ }
    finally { setListLoading(false); }
  };

  useEffect(() => { loadConversations(); }, []);

  useEffect(() => {
    if (didOpenFromState.current) return;
    const stateUser = (location.state as any)?.chatUser as User | undefined;
    if (stateUser) {
      didOpenFromState.current = true;
      openChat(stateUser);
    }
  }, [location.state]);

  useEffect(() => {
    const uid = routeUserId || searchParams.get('user');
    if (!uid) return;
    const conv = conversations.find(c => c.partner._id === uid);
    if (conv) {
      openChat(conv.partner);
      return;
    }
    apiSearchMembers(uid)
      .then(res => {
        const found = (res.data as User[]).find(u => u._id === uid);
        if (found) { openChat(found); return; }
        return apiGetMember(uid).then(r => { if (r.data?.user) openChat(r.data.user); });
      })
      .catch(() => {});
  }, [routeUserId, searchParams.get('user'), conversations.length]);

  useEffect(() => {
    if (!search.trim()) { setSearchResults([]); return; }
    const t = setTimeout(() => {
      apiSearchMembers(search).then(res => setSearchResults(res.data)).catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const openChat = async (partner: User) => {
    setActiveUser(partner);
    setView('chat');
    await loadThread(partner._id);
    startPolling(partner._id);
  };

  const loadThread = async (uid: string) => {
    try {
      const res = await apiGetThread(uid);
      setMessages(res.data);
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch { /* no-op */ }
  };

  const startPolling = (uid: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => loadThread(uid), 4000);
  };

  const closeChat = () => {
    clearInterval(pollRef.current);
    setActiveUser(null);
    setMessages([]);
    setView('list');
  };

  useEffect(() => () => clearInterval(pollRef.current), []);

  const sendMessage = async () => {
    if (!text.trim() || !activeUser) return;
    setSending(true);
    try {
      const res = await apiSendMessage(activeUser._id, text.trim());
      setMessages(prev => [...prev, res.data]);
      setText('');
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch { /* no-op */ }
    finally { setSending(false); }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.touches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const delta = touchStart.current - e.touches[0].clientX;
    if (delta > 0) {
      setSwipeX(Math.min(delta, 60));
    } else {
      setSwipeX(0);
    }
  };

  const onTouchEnd = () => {
    setSwipeX(0);
  };

  const avatarEl = (u: User, size = 44) => u.profilePhoto?.url
    ? <img src={u.profilePhoto.url} alt={u.name} className="avatar" style={{ width: size, height: size }} />
    : <div className="avatar msg-initial" style={{ width: size, height: size }}>{u.name?.[0]?.toUpperCase()}</div>;

  // ── Chat View
  if (view === 'chat' && activeUser) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', flexDirection: 'column', background: '#000000' }}>
        <div style={{ display: 'flex', alignItems: 'center', height: 60, padding: '0 8px', borderBottom: '1px solid var(--color-border)', background: '#000000', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
            <button onClick={closeChat} style={{ background: 'none', border: 'none', padding: '10px 8px', cursor: 'pointer', color: 'var(--color-text)', display: 'flex', alignItems: 'center' }}>
              <ArrowLeft size={28} strokeWidth={2.5} />
            </button>
            <div onClick={() => navigate(`/members/${activeUser.username}`)} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', minWidth: 0 }}>
              {activeUser.profilePhoto?.url ? (
                <img src={activeUser.profilePhoto.url} alt={activeUser.name} style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
              ) : (
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255, 255, 255, 0.05)', color: '#c5a880', border: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0, boxSizing: 'border-box' }}>{activeUser.name?.[0]?.toUpperCase()}</div>
              )}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activeUser.name}</div>
                <div style={{ fontSize: 12, color: '#c5a880', marginTop: -1 }}>@{activeUser.username}</div>
              </div>
            </div>
          </div>
        </div>

        <div id="chat-messages" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} style={{ flex: 1, overflowY: 'auto', padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 6, scrollbarWidth: 'none', touchAction: 'pan-y' }}>
          {messages.length === 0 && (
            <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--color-text-2)', paddingTop: 60 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>✨</div>
            </div>
          )}
          {messages.map((msg, i) => {
            const isMine = (msg.sender as any)?._id === me?._id || msg.sender === me?._id as any;
            const prevMsg = messages[i - 1];
            const nextMsg = messages[i + 1];
            const showDivider = !prevMsg || (new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime() > 3600000);
            const isLastInGroup = !nextMsg || (nextMsg.sender as any)?._id !== (msg.sender as any)?._id || (new Date(nextMsg.createdAt).getTime() - new Date(msg.createdAt).getTime() > 300000);
            return (
              <div key={msg._id} className="message-row-container">
                {showDivider && <div className="message-divider">{formatDivider(msg.createdAt)}</div>}
                <div className={`message-bubble-wrapper ${isMine ? 'mine' : 'theirs'}`} style={{ marginBottom: isLastInGroup ? 8 : 2, transform: `translateX(-${swipeX}px)` }}>
                  <div className="message-content-swipe">
                    <div className={`message-bubble ${isMine ? 'bubble-mine' : 'bubble-theirs'}`}>{msg.content}</div>
                    <div className="message-swipe-time" style={{ opacity: swipeX / 60 }}>{new Date(msg.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</div>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <div style={{ padding: '10px 12px', borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 10, background: '#000000', flexShrink: 0 }}>
          <textarea id="message-input" placeholder="Message..." value={text} onChange={e => setText(e.target.value)} onKeyDown={handleKey} rows={1} style={{ flex: 1, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 22, padding: '10px 16px', fontSize: 15, color: 'var(--color-text)', resize: 'none', maxHeight: 120, outline: 'none' }} />
          <button onClick={sendMessage} disabled={!text.trim() || sending} style={{ background: 'none', border: 'none', color: text.trim() ? 'var(--color-primary)' : 'var(--color-text-2)', fontWeight: 700, fontSize: 15, cursor: text.trim() ? 'pointer' : 'default', padding: '8px 4px', transition: 'color 0.2s' }}>
            {sending ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <Send size={22} />}
          </button>
        </div>
      </div>
    );
  }

  // ── List View
  return (
    <div className="page messages-page">
      <div className="conversations-panel">
        <div className="conv-header" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 50 }}>
          <h2 className="conv-title" style={{ fontSize: 16, fontWeight: 800 }}>{me?.username}</h2>
        </div>
        <div className="conv-search-wrap">
          <Search size={15} className="conv-search-icon" />
          <input id="message-search" className="conv-search-input" placeholder="Search members..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', padding: '12px 20px 4px 20px' }}>
          <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--color-text)' }}>Messages</span>
        </div>
        {search && searchResults.length > 0 && (
          <div className="search-drop">
            {searchResults.map(u => (
              <div key={u._id} className="conv-item" onClick={() => { setSearch(''); openChat(u); }} id={`start-chat-${u.username}`}>
                {avatarEl(u)}
                <div className="conv-info" style={{ display: 'flex', flexDirection: 'column' }}>
                  <div className="conv-name" style={{ fontSize: 14, fontWeight: 700 }}>{u.name}</div>
                  <div className="conv-preview" style={{ fontSize: 13, color: 'var(--color-text-2)' }}>@{u.username}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="conv-list">
          {listLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="conv-item" style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                <div className="skeleton" style={{ width: 54, height: 54, borderRadius: '50%', flexShrink: 0 }} />
                <div className="conv-info">
                  <div className="skeleton" style={{ width: '60%', height: 16, borderRadius: 4, marginBottom: 8 }} />
                  <div className="skeleton" style={{ width: '85%', height: 14, borderRadius: 4 }} />
                </div>
              </div>
            ))
          ) : conversations.length === 0 ? null : conversations.map(conv => (
            <div key={conv.partner._id} className={`conv-item ${activeUser?._id === conv.partner._id ? 'active' : ''}`} onClick={() => openChat(conv.partner)} id={`conv-${conv.partner.username}`}>
              {avatarEl(conv.partner)}
              <div className="conv-info">
                <div className="conv-name-row">
                  <span className="conv-name">{conv.partner.name}</span>
                  <span className="conv-time">{formatTime(conv.lastMessage.createdAt)}</span>
                </div>
                <div className="conv-preview-row">
                  <span className="conv-preview">{conv.lastMessage.content}</span>
                  {conv.unread > 0 && <span className="unread-badge">{conv.unread}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="chat-panel hidden-mobile">
        <div className="chat-empty">
          <div style={{ fontSize: 48, opacity: 0.2 }}>💬</div>
        </div>
      </div>
    </div>
  );
}
