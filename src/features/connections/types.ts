export interface ConnectionUser {
  id: string;
  userId: string;
  fullName: string;
  state?: string | null;
  country?: string | null;
  avatarUrl?: string | null;
}

export interface IncomingRequest {
  id: string;
  status: string;
  message: string | null;
  matchId: string | null;
  createdAt: string | Date;
  sender: {
    id: string;
    avatarUrl: string | null;
    fullName: string;
    state?: string | null;
    country?: string | null;
  };
}

export interface SentRequest {
  id: string;
  status: string;
  message: string | null;
  matchId: string | null;
  createdAt: string | Date;
  receiver: {
    id: string;
    avatarUrl: string | null;
    fullName: string;
    state?: string | null;
    country?: string | null;
  };
}

export interface SendConnectionPayload {
  receiverId: string;
  message: string;
  matchId?: string;
}
