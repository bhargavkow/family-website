// Shared TypeScript types for the Family Website

export interface User {
  _id: string;
  username: string;
  name: string;
  bio: string;
  occupation: string;
  dob: string | null;
  profilePhoto: { url: string; publicId: string };
  followers: User[] | string[];
  following: User[] | string[];
  isActive: boolean;
  isAdmin: boolean;
  createdAt: string;
}

export interface Post {
  _id: string;
  author: User;
  mediaUrl: string;
  mediaPublicId: string;
  mediaType: 'image' | 'video';
  caption: string;
  likes: string[];
  createdAt: string;
}

export interface Message {
  _id: string;
  sender: User;
  receiver: User;
  content: string;
  read: boolean;
  createdAt: string;
}

export interface Conversation {
  partner: User;
  lastMessage: Message;
  unread: number;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
}
export interface FamilyEvent {
  _id: string;
  name: string;
  description: string;
  photo?: { url: string; publicId: string };
  date: string;
  createdAt: string;
}
