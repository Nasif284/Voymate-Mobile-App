import { Alert } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import {
  getApiErrorMessage,
  invalidateRelationshipQueries,
  QUERY_KEYS,
} from '../../../api/queryClient';
import { useAuthStore } from '../../../store/authStore';
import { useConnectionStore } from '../../../store/connectionStore';
import { connectionService } from '../services/connection.service';
import { SendConnectionPayload } from '../types';

export function useGetConnections(enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.connections,
    queryFn: async () => {
      const conns = await connectionService.getConnections();
      const setRelationship = useConnectionStore.getState().setRelationship;
      conns.forEach((c) => {
        if (c.userId) {
          setRelationship(c.userId, 'CONNECTED', null, c.id);
        }
      });
      return conns;
    },
    enabled,
  });
}

export function useGetIncomingRequests(enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.incomingRequests,
    queryFn: async () => {
      const reqs = await connectionService.getIncomingRequests();
      const setRelationship = useConnectionStore.getState().setRelationship;
      reqs.forEach((r) => {
        if (r.sender?.id) {
          setRelationship(r.sender.id, 'REQUEST_RECEIVED', r.id, null);
        }
      });
      return reqs;
    },
    enabled,
  });
}

export function useGetSentRequests(enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.sentRequests,
    queryFn: async () => {
      const reqs = await connectionService.getSentRequests();
      const setRelationship = useConnectionStore.getState().setRelationship;
      reqs.forEach((r) => {
        if (r.receiver?.id) {
          setRelationship(r.receiver.id, 'REQUEST_SENT', r.id, null);
        }
      });
      return reqs;
    },
    enabled,
  });
}

export function useSendConnectionRequest() {
  const queryClient = useQueryClient();
  const setRelationship = useConnectionStore((s) => s.setRelationship);

  return useMutation({
    mutationFn: (payload: SendConnectionPayload) => connectionService.sendRequest(payload),
    onSuccess: (_res, variables) => {
      setRelationship(variables.receiverId, 'REQUEST_SENT');
      invalidateRelationshipQueries(queryClient);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (error) => {
      Alert.alert(
        'Request Error',
        getApiErrorMessage(error, 'Could not send request. Please try again.')
      );
    },
  });
}

export function useAcceptConnectionRequest() {
  const queryClient = useQueryClient();
  const acceptUserRequest = useConnectionStore((s) => s.acceptUserRequest);
  const currentUserId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: ({
      targetUserId,
      requestId,
    }: {
      targetUserId: string;
      requestId?: string | null;
    }) => acceptUserRequest(targetUserId, requestId, currentUserId),
    onSuccess: () => {
      invalidateRelationshipQueries(queryClient);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (error) => {
      Alert.alert(
        'Error',
        getApiErrorMessage(error, 'Could not accept connection request.')
      );
    },
  });
}

export function useRejectConnectionRequest() {
  const queryClient = useQueryClient();
  const setRelationship = useConnectionStore((s) => s.setRelationship);

  return useMutation({
    mutationFn: ({
      requestId,
      senderId,
    }: {
      requestId: string;
      senderId?: string;
    }) => connectionService.rejectRequest(requestId).then((res) => ({ res, senderId })),
    onSuccess: ({ senderId }) => {
      if (senderId) {
        setRelationship(senderId, 'NONE', null, null);
      }
      invalidateRelationshipQueries(queryClient);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    onError: (error) => {
      Alert.alert(
        'Error',
        getApiErrorMessage(error, 'Failed to decline connection request.')
      );
    },
  });
}

export function useWithdrawConnectionRequest() {
  const queryClient = useQueryClient();
  const setRelationship = useConnectionStore((s) => s.setRelationship);

  return useMutation({
    mutationFn: ({
      requestId,
      receiverId,
    }: {
      requestId: string;
      receiverId?: string;
    }) => connectionService.withdrawRequest(requestId).then((res) => ({ res, receiverId })),
    onSuccess: ({ receiverId }) => {
      if (receiverId) {
        setRelationship(receiverId, 'NONE', null, null);
      }
      invalidateRelationshipQueries(queryClient);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    onError: (error) => {
      Alert.alert(
        'Error',
        getApiErrorMessage(error, 'Failed to withdraw connection request.')
      );
    },
  });
}

export function useDisconnectConnection() {
  const queryClient = useQueryClient();
  const setRelationship = useConnectionStore((s) => s.setRelationship);

  return useMutation({
    mutationFn: ({
      connectionId,
      userId,
    }: {
      connectionId: string;
      userId?: string;
    }) => connectionService.disconnect(connectionId).then((res) => ({ res, userId })),
    onSuccess: ({ userId }) => {
      if (userId) {
        setRelationship(userId, 'NONE', null, null);
      }
      invalidateRelationshipQueries(queryClient);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (error) => {
      Alert.alert(
        'Error',
        getApiErrorMessage(error, 'Failed to remove connection.')
      );
    },
  });
}
