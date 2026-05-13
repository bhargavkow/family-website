import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Send, Search, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  apiGetConversations, apiGetThread, apiSendMessage, apiSearchMembers
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

  // Load conversations
  const loadConversations = async () => {
    try {
      const res = await apiGetConversations();
      setConversations(res.data);
    } catch { /* no-op */ }
  };

  useEffect(() => { loadConversations(); }, []);

  // Open chat from URL param or route
  useEffect(() => {
    const uid = routeUserId || searchParams.get('user');
    if (uid && conversations.length > 0) {
      const conv = conversations.find(c => c.partner._id === uid);
      if (conv) openChat(conv.partner);
    }
  }, [routeUserId, conversations]);

  // Search members to start new chat
  useEffect(() => {
    if (!search.trim()) { setSearchResults([]); return; }
    apiSearchMembers(search).then(res => setSearchResults(res.data)).catch(() => {});
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
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch { /* no-op */ }
  };

  const startPolling = (uid: string) => {
    clearInterval(pollRef.current);
    pollRef.current = setInterval(() => loadThread(uid), 3000);
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

  return (
    <div className="page messages-page">
      {/* ── Left Panel — Conversations ─────────────── */}
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

      {/* ── Right Panel — Chat ─────────────────────── */}
      <div className={`chat-panel ${view === 'list' ? 'hidden-mobile' : ''}`}>
        {!activeUser ? (
          <div className="chat-empty">
            <div style={{ fontSize: 48 }}>💬</div>
            <h3 style={{ fontWeight: 600, marginTop: 16 }}>Your Messages</h3>
            <p style={{ color: 'var(--color-text-2)', fontSize: 14, marginTop: 8 }}>
              Select a conversation or search for a member to start chatting
            </p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="chat-header">
              <button className="back-btn" onClick={() => { setView('list'); setActiveUser(null); clearInterval(pollRef.current); }} id="back-to-list">
                <ArrowLeft size={20} />
              </button>
              {avatarEl(activeUser, 36)}
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{activeUser.name}</div>
                <div style={{ color: 'var(--color-text-2)', fontSize: 12 }}>@{activeUser.username}</div>
              </div>
            </div>

            {/* Messages */}
            <div className="chat-messages" id="chat-messages">
              {messages.map(msg => {
                const isMine = msg.sender._id === me?._id || msg.sender === me?._id as any;
                return (
                  <div key={msg._id} className={`bubble-wrap ${isMine ? 'mine' : 'theirs'}`}>
                    <div className={`bubble ${isMine ? 'bubble-mine' : 'bubble-theirs'}`}>
                      {msg.content}
                    </div>
                    <span className="bubble-time">{formatTime(msg.createdAt)}</span>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="chat-input-wrap">
              <textarea
                id="message-input"
                className="chat-input"
                placeholder="Write a message..."
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={handleKey}
                rows={1}
              />
              <button
                className="send-btn"
                onClick={sendMessage}
                disabled={!text.trim() || sending}
                id="send-btn"
              >
                {sending ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <Send size={18} />}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
