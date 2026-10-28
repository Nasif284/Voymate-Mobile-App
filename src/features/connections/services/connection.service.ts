import { apiClient } from '../../../api/client';
import { ENDPOINTS } from '../../../api/endpoints';
import {
  ConnectionUser,
  IncomingRequest,
  SentRequest,
  SendConnectionPayload,
} from '../types';

export const connectionService = {
  getConnections: async (): Promise<ConnectionUser[]> => {
    const res = await apiClient.get(ENDPOINTS.CONNECTIONS.LIST);
    const data = res.data?.data || res.data;
    return data?.connections || (Array.isArray(data) ? data : []);
  },

  getIncomingRequests: async (): Promise<IncomingRequest[]> => {
    const res = await apiClient.get(ENDPOINTS.CONNECTIONS.REQUESTS_INCOMING);
    const data = res.data?.data || res.data;
    return data?.requests || (Array.isArray(data) ? data : []);
  },

  getSentRequests: async (): Promise<SentRequest[]> => {
    const res = await apiClient.get(ENDPOINTS.CONNECTIONS.REQUESTS_SENT);
    const data = res.data?.data || res.data;
    return data?.requests || (Array.isArray(data) ? data : []);
  },

  getAllRequests: async () => {
    const res = await apiClient.get(ENDPOINTS.CONNECTIONS.REQUESTS_ALL);
    return res.data?.data || res.data;
  },

  sendRequest: async (payload: SendConnectionPayload) => {
    const res = await apiClient.post(ENDPOINTS.CONNECTIONS.SEND, payload);
    return res.data;
  },

  acceptRequest: async (requestId: string) => {
    const res = await apiClient.patch(ENDPOINTS.CONNECTIONS.ACCEPT(requestId));
    return res.data;
  },

  rejectRequest: async (requestId: string) => {
    const res = await apiClient.patch(ENDPOINTS.CONNECTIONS.REJECT(requestId));
    return res.data;
  },

  withdrawRequest: async (requestId: string) => {
    const res = await apiClient.patch(ENDPOINTS.CONNECTIONS.WITHDRAW(requestId));
    return res.data;
  },

  disconnect: async (connectionId: string) => {
    const res = await apiClient.patch(ENDPOINTS.CONNECTIONS.DISCONNECT(connectionId));
    return res.data;
  },
};
