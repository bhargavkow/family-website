import client from './client';
import type { User, Post, Message, Conversation } from '../types';

// ─── Auth ────────────────────────────────────────────────
export const apiLogin = (username: string, password: string) =>
  client.post<{ user: User }>('/auth/login', { username, password });

export const apiLogout = () => client.post('/auth/logout');

export const apiMe = () => client.get<{ user: User }>('/auth/me');

// ─── Members ─────────────────────────────────────────────
export const apiGetMembers = () => client.get<User[]>('/members');

export const apiGetMember = (username: string) =>
  client.get<{ user: User; posts: Post[] }>(`/members/${username}`);

export const apiUpdateProfile = (username: string, data: FormData) =>
  client.put<{ user: User }>(`/members/${username}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const apiFollow = (username: string) =>
  client.post<{ following: boolean }>(`/members/${username}/follow`);

export const apiGetFollowers = (username: string) =>
  client.get<User[]>(`/members/${username}/followers`);

export const apiGetFollowing = (username: string) =>
  client.get<User[]>(`/members/${username}/following`);

// ─── Posts ───────────────────────────────────────────────
export const apiCreatePost = (data: FormData) =>
  client.post<Post>('/posts', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const apiGetFeed = (page = 1) =>
  client.get<{ posts: Post[]; total: number; pages: number }>(`/posts/feed?page=${page}`);

export const apiGetMemberPosts = (username: string) =>
  client.get<Post[]>(`/posts/member/${username}`);

export const apiLikePost = (id: string) =>
  client.post<{ liked: boolean; likeCount: number }>(`/posts/${id}/like`);

export const apiDeletePost = (id: string) => client.delete(`/posts/${id}`);

// ─── Messages ────────────────────────────────────────────
export const apiGetConversations = () =>
  client.get<Conversation[]>('/messages/conversations');

export const apiGetThread = (userId: string) =>
  client.get<Message[]>(`/messages/${userId}`);

export const apiSendMessage = (userId: string, content: string) =>
  client.post<Message>(`/messages/${userId}`, { content });

// ─── Search ──────────────────────────────────────────────
export const apiSearchMembers = (q: string) =>
  client.get<User[]>(`/search/members?q=${encodeURIComponent(q)}`);

// ─── Admin ───────────────────────────────────────────────
export const apiAdminStats = () =>
  client.get<{
    totalMembers: number;
    activeMembers: number;
    disabledMembers: number;
    totalPosts: number;
    totalMessages: number;
  }>('/admin/stats');

export const apiAdminGetMembers = () => client.get<User[]>('/admin/members');

export const apiAdminCreateMember = (data: FormData) =>
  client.post<User>('/admin/members', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const apiAdminToggleMember = (id: string) =>
  client.patch<{ isActive: boolean }>(`/admin/members/${id}/toggle`);

export const apiAdminDeleteMember = (id: string) =>
  client.delete(`/admin/members/${id}`);

export const apiAdminGetPosts = (page = 1) =>
  client.get<{ posts: Post[]; total: number; pages: number }>(`/admin/posts?page=${page}`);

export const apiAdminDeletePost = (id: string) =>
  client.delete(`/admin/posts/${id}`);

export const apiAdminUpdateMember = (id: string, data: FormData) =>
  client.patch<User>(`/admin/members/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

