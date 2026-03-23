export type Role = 'admin' | 'employee' | null;
export type View = 'role-selection' | 'login' | 'register' | 'admin' | 'chat';
export type AdminSubView = 'kb-list' | 'file-mgmt' | 'upload' | 'preview' | 'file-preview';

export interface KnowledgeBase {
  id: string;
  name: string;
  description: string;
  fileCount: number;
  indexCount: number;
  createdAt: string;
}

export interface FileItem {
  id: string;
  name: string;
  format: string;
  createdAt: string;
  status: boolean; // true = on (green), false = off (gray)
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  references?: string[];
  isFavorited?: boolean;
  likeStatus?: 'like' | 'dislike' | null;
  dislikeComment?: string;
  type?: 'diagram';
}
