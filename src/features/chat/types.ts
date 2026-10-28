export interface ChatAttachment {
  id?: string;
  storageKey: string;
  fileName?: string;
  mimeType: string;
  fileSize?: number;
  url?: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  type: 'TEXT' | 'IMAGE';
  status?: 'SENT' | 'DELIVERED' | 'READ';
  readAt?: Date | string | null;
  sender?: {
    fullName: string;
    avatarUrl: string | null;
  };
  content?: string;
  attachment?: ChatAttachment;
  createdAt: string | Date;
  updatedAt?: string | Date;
}

export interface ConversationUser {
  id: string;
  name: string;
  profileImage?: string | null;
  isOnline?: boolean;
}

export interface Conversation {
  conversationId: string;
  user: ConversationUser;
  lastMessage?: {
    content?: string;
    createdAt: string | Date;
    senderId?: string;
    status?: 'SENT' | 'DELIVERED' | 'READ';
    type?: 'TEXT' | 'IMAGE';
  };
  unreadCount?: number;
  updatedAt: string | Date;
}
