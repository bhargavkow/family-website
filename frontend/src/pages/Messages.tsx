import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { Send, Search, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  apiGetConversations, apiGetThread, apiSendMessage, apiSearchMembers, apiGetMember
} from '../api';
import type { Conversation, Message, User } from '../types';
import './Messages.css';

function formatTime(date: string) {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return 'now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
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
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const didOpenFromState = useRef(false);

  // Load conversations
  const loadConversations = async () => {
    try {
      const res = await apiGetConversations();
      setConversations(res.data);
    } catch { /* no-op */ }
  };

  useEffect(() => { loadConversations(); }, []);

  // If navigated with a user object in state (from follower/following modal), open chat immediately
  useEffect(() => {
    if (didOpenFromState.current) return;
    const stateUser = (location.state as any)?.chatUser as User | undefined;
    if (stateUser) {
      didOpenFromState.current = true;
      openChat(stateUser);
    }
  }, [location.state]);

  // Open chat from URL param — works even if no conversation yet
  useEffect(() => {
    const uid = routeUserId || searchParams.get('user');
    if (!uid) return;

    // Try to find in existing conversations
    const conv = conversations.find(c => c.partner._id === uid);
    if (conv) {
      openChat(conv.partner);
      return;
    }

    // Otherwise fetch the user info directly by searching via ID or username
    // Try getting by ID via search, then fallback
    apiSearchMembers(uid)
      .then(res => {
        const found = (res.data as User[]).find(u => u._id === uid);
        if (found) { openChat(found); return; }
        // Maybe uid is a username, try fetching as member
        return apiGetMember(uid).then(r => { if (r.data?.user) openChat(r.data.user); });
      })
      .catch(() => {});
  }, [routeUserId, searchParams.get('user'), conversations.length]);

  // Search members to start new chat
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

  const avatarEl = (u: User, size = 44) => u.profilePhoto?.url
    ? <img src={u.profilePhoto.url} alt={u.name} className="avatar" style={{ width: size, height: size }} />
    : <div className="avatar msg-initial" style={{ width: size, height: size }}>{u.name?.[0]?.toUpperCase()}</div>;

  // ── Chat View (full screen on mobile, hides navbar)
  if (view === 'chat' && activeUser) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 500,
        display: 'flex', flexDirection: 'column',
        background: 'var(--color-bg)',
      }}>
        {/* ── Sticky Top Header */}
        <div style={{
          display: 'flex', alignItems: 'center',
          height: 60, padding: '0 8px',
          borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-bg)',
          flexShrink: 0, gap: 4,
        }}>
          {/* Back */}
          <button onClick={closeChat} style={{
            background: 'none', border: 'none', padding: '10px 8px',
            cursor: 'pointer', color: 'var(--color-text)', display: 'flex', alignItems: 'center',
          }}>
            <ArrowLeft size={24} strokeWidth={2.2} />
          </button>

          {/* Avatar + Name + Username */}
          <div
            onClick={() => navigate(`/members/${activeUser.username}`)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, cursor: 'pointer', minWidth: 0 }}
          >
            {activeUser.profilePhoto?.url ? (
              <img src={activeUser.profilePhoto.url} alt={activeUser.name}
                style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
            ) : (
              <div style={{
                width: 38, height: 38, borderRadius: '50%',
                background: 'var(--grad-primary)', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 16, flexShrink: 0,
              }}>{activeUser.name?.[0]?.toUpperCase()}</div>
            )}
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activeUser.name}</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-2)', marginTop: 1 }}>@{activeUser.username}</div>
            </div>
          </div>
        </div>

        {/* ── Scrollable Messages */}
        <div id="chat-messages" style={{
          flex: 1, overflowY: 'auto', padding: '16px 12px',
          display: 'flex', flexDirection: 'column', gap: 6,
          scrollbarWidth: 'none',
        }}>
          {messages.length === 0 && (
            <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--color-text-2)', paddingTop: 60 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>👋</div>
              <div style={{ fontWeight: 600 }}>Say hi to {activeUser.name}!</div>
            </div>
          )}
          {messages.map((msg, i) => {
            const isMine = (msg.sender as any)?._id === me?._id || msg.sender === me?._id as any;
            const showAvatar = !isMine && (i === 0 || (messages[i - 1].sender as any)?._id !== (msg.sender as any)?._id);
            return (
              <div key={msg._id} style={{
                display: 'flex',
                flexDirection: isMine ? 'row-reverse' : 'row',
                alignItems: 'flex-end', gap: 6,
                alignSelf: isMine ? 'flex-end' : 'flex-start',
                maxWidth: '78%',
              }}>
                {/* Avatar for received messages */}
                {!isMine && (
                  <div style={{ width: 28, flexShrink: 0 }}>
                    {showAvatar && (
                      activeUser.profilePhoto?.url
                        ? <img src={activeUser.profilePhoto.url} alt={activeUser.name}
                            style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
                        : <div style={{
                            width: 28, height: 28, borderRadius: '50%',
                            background: 'var(--grad-primary)', color: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 11, fontWeight: 700,
                          }}>{activeUser.name?.[0]?.toUpperCase()}</div>
                    )}
                  </div>
                )}
                {/* Bubble */}
                <div style={{
                  padding: '10px 14px',
                  borderRadius: 22,
                  fontSize: 15,
                  lineHeight: 1.4,
                  wordBreak: 'break-word',
                  background: isMine ? 'var(--color-primary)' : 'var(--color-surface-2)',
                  color: isMine ? '#fff' : 'var(--color-text)',
                  borderBottomRightRadius: isMine ? 4 : 22,
                  borderBottomLeftRadius: !isMine ? 4 : 22,
                  maxWidth: '100%',
                }}>
                  {msg.content}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* ── Bottom Input (sticky) */}
        <div style={{
          padding: '10px 12px',
          borderTop: '1px solid var(--color-border)',
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'var(--color-bg)',
          flexShrink: 0,
        }}>
          <textarea
            id="message-input"
            placeholder="Message..."
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKey}
            rows={1}
            style={{
              flex: 1,
              background: 'var(--color-surface-2)',
              border: '1px solid var(--color-border)',
              borderRadius: 22, padding: '10px 16px',
              fontSize: 15, color: 'var(--color-text)',
              resize: 'none', maxHeight: 120,
              outline: 'none',
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!text.trim() || sending}
            style={{
              background: 'none', border: 'none',
              color: text.trim() ? 'var(--color-primary)' : 'var(--color-text-2)',
              fontWeight: 700, fontSize: 15,
              cursor: text.trim() ? 'pointer' : 'default',
              padding: '8px 4px', transition: 'color 0.2s',
            }}
          >
            {sending
              ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
              : <Send size={22} />}
          </button>
        </div>
      </div>
    );
  }

  // ── List View
  return (
    <div className="page messages-page">
      {/* ── Left Panel — Conversations */}
      <div className={`conversations-panel ${view === 'chat' ? 'hidden-mobile' : ''}`}>
        <div className="conv-header">
          <h2 className="conv-title">Messages</h2>
        </div>

        {/* Search for new chat */}
        <div className="conv-search-wrap">
          <Search size={15} className="conv-search-icon" />
          <input
            id="message-search"
            className="conv-search-input"
            placeholder="Search members..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {search && searchResults.length > 0 && (
          <div className="search-drop">
            {searchResults.map(u => (
              <div key={u._id} className="conv-item" onClick={() => { setSearch(''); openChat(u); }} id={`start-chat-${u.username}`}>
                {avatarEl(u)}
                <div className="conv-info">
                  <span className="conv-name">{u.name}</span>
                  <span className="conv-preview">@{u.username}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Conversation list */}
        <div className="conv-list">
          {conversations.length === 0 ? (
            <p style={{ padding: 20, textAlign: 'center', color: 'var(--color-text-2)', fontSize: 13 }}>
              No conversations yet. Search above to start one!
            </p>
          ) : conversations.map(conv => (
            <div
              key={conv.partner._id}
              className={`conv-item ${activeUser?._id === conv.partner._id ? 'active' : ''}`}
              onClick={() => openChat(conv.partner)}
              id={`conv-${conv.partner.username}`}
            >
              {avatarEl(conv.partner)}
              <div className="conv-info">
                <div className="conv-name-row">
                  <span className="conv-name">{conv.partner.name}</span>
                  <span className="conv-time">{formatTime(conv.lastMessage.createdAt)}</span>
                </div>
                <div className="conv-preview-row">
                  <span className="conv-preview">{conv.lastMessage.content.slice(0, 40)}{conv.lastMessage.content.length > 40 ? '...' : ''}</span>
                  {conv.unread > 0 && <span className="unread-badge">{conv.unread}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right Panel — Chat (desktop only) */}
      <div className={`chat-panel ${view === 'list' ? 'hidden-mobile' : ''}`}>
        <div className="chat-empty">
          <div style={{ fontSize: 48 }}>💬</div>
          <h3 style={{ fontWeight: 600, marginTop: 16 }}>Your Messages</h3>
          <p style={{ color: 'var(--color-text-2)', fontSize: 14, marginTop: 8 }}>
            Select a conversation or search for a member to start chatting
          </p>
        </div>
      </div>
    </div>
  );
}
