import { create } from 'zustand';
import { connectionService } from '../features/connections/services/connection.service';

export type ConnectionStatusType =
  | 'CONNECTED'
  | 'REQUEST_SENT'
  | 'REQUEST_RECEIVED'
  | 'NONE';

export interface RelationshipEntry {
  status: ConnectionStatusType;
  requestId?: string | null;
  connectionId?: string | null;
}

interface ConnectionStoreState {
  relationships: Record<string, RelationshipEntry>;
  hasSyncedFallback: boolean;

  setRelationship: (
    userId: string,
    status: ConnectionStatusType,
    requestId?: string | null,
    connectionId?: string | null
  ) => void;

  seedFromUsers: (
    users: {
      id: string;
      connectionStatus?: ConnectionStatusType;
      requestId?: string | null;
      connectionId?: string | null;
    }[]
  ) => void;

  seedFromMatches: (
    matches: {
      user: { id: string };
      connectionStatus?: ConnectionStatusType;
      requestId?: string | null;
      tripMatch?: {
        connectionStatus?: ConnectionStatusType;
        requestId?: string | null;
      };
    }[]
  ) => void;

  syncFromServerFallback: (
    currentUserId?: string,
    force?: boolean
  ) => Promise<Record<string, RelationshipEntry>>;

  acceptUserRequest: (
    targetUserId: string,
    explicitRequestId?: string | null,
    currentUserId?: string
  ) => Promise<void>;

  reset: () => void;
}

export const useConnectionStore = create<ConnectionStoreState>((set, get) => ({
  relationships: {},
  hasSyncedFallback: false,

  setRelationship: (userId, status, requestId = null, connectionId = null) => {
    if (!userId) return;
    set((state) => ({
      relationships: {
        ...state.relationships,
        [userId]: {
          status,
          requestId: requestId ?? state.relationships[userId]?.requestId ?? null,
          connectionId:
            connectionId ?? state.relationships[userId]?.connectionId ?? null,
        },
      },
    }));
  },

  seedFromUsers: (users) => {
    if (!Array.isArray(users) || users.length === 0) return;
    set((state) => {
      const next = { ...state.relationships };
      let changed = false;

      for (const u of users) {
        if (u?.id && u.connectionStatus) {
          next[u.id] = {
            status: u.connectionStatus,
            requestId: u.requestId ?? next[u.id]?.requestId ?? null,
            connectionId: u.connectionId ?? next[u.id]?.connectionId ?? null,
          };
          changed = true;
        }
      }

      return changed ? { relationships: next } : state;
    });
  },

  seedFromMatches: (matches) => {
    if (!Array.isArray(matches) || matches.length === 0) return;
    set((state) => {
      const next = { ...state.relationships };
      let changed = false;

      for (const m of matches) {
        const uid = m?.user?.id;
        const status = m?.connectionStatus || m?.tripMatch?.connectionStatus;
        const reqId = m?.requestId || m?.tripMatch?.requestId || null;
        if (uid && status) {
          next[uid] = {
            status,
            requestId: reqId ?? next[uid]?.requestId ?? null,
            connectionId: next[uid]?.connectionId ?? null,
          };
          changed = true;
        }
      }

      return changed ? { relationships: next } : state;
    });
  },

  syncFromServerFallback: async (currentUserId, force = false) => {
    if (get().hasSyncedFallback && !force) {
      return get().relationships;
    }

    try {
      const [connectionsRes, requestsRes] = await Promise.allSettled([
        connectionService.getConnections(),
        connectionService.getAllRequests(),
      ]);

      const next: Record<string, RelationshipEntry> = {
        ...get().relationships,
      };

      if (
        requestsRes.status === 'fulfilled' &&
        Array.isArray(requestsRes.value?.requests)
      ) {
        for (const req of requestsRes.value.requests) {
          if (currentUserId && req.senderId === currentUserId) {
            next[req.receiverId] = {
              status: 'REQUEST_SENT',
              requestId: req.id,
              connectionId: null,
            };
          } else if (currentUserId && req.receiverId === currentUserId) {
            next[req.senderId] = {
              status: 'REQUEST_RECEIVED',
              requestId: req.id,
              connectionId: null,
            };
          } else {
            const otherId =
              req.senderId === currentUserId ? req.receiverId : req.senderId;
            if (otherId) {
              next[otherId] = {
                status:
                  req.senderId === currentUserId
                    ? 'REQUEST_SENT'
                    : 'REQUEST_RECEIVED',
                requestId: req.id,
                connectionId: null,
              };
            }
          }
        }
      }

      if (
        connectionsRes.status === 'fulfilled' &&
        Array.isArray(connectionsRes.value)
      ) {
        for (const conn of connectionsRes.value) {
          const targetId = conn.userId || conn.id;
          if (targetId) {
            next[targetId] = {
              status: 'CONNECTED',
              requestId: null,
              connectionId: conn.id,
            };
          }
        }
      }

      set({ relationships: next, hasSyncedFallback: true });
      return next;
    } catch {
      return get().relationships;
    }
  },

  acceptUserRequest: async (targetUserId, explicitRequestId, currentUserId) => {
    let resolvedRequestId =
      explicitRequestId || get().relationships[targetUserId]?.requestId || null;

    if (!resolvedRequestId) {
      const synced = await get().syncFromServerFallback(currentUserId, true);
      resolvedRequestId = synced[targetUserId]?.requestId || null;
    }

    await connectionService.acceptRequest(resolvedRequestId || targetUserId);
    get().setRelationship(targetUserId, 'CONNECTED', null, null);
  },

  reset: () => set({ relationships: {}, hasSyncedFallback: false }),
}));
