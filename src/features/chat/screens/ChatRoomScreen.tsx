import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/types';
import { chatService } from '../services/chat.service';
import { socketService } from '../services/socket.service';
import { ChatMessage } from '../types';
import { useAuthStore } from '../../../store/authStore';
import * as ImagePicker from 'expo-image-picker';
import {
  ChevronLeft,
  Send,
  Image as ImageIcon,
  Check,
  CheckCheck,
  Phone,
  Video,
  User as UserIcon,
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';

type Props = NativeStackScreenProps<RootStackParamList, 'ChatRoom'>;

const formatMessageTime = (dateStr?: string | Date) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
};

const formatDateDivider = (dateStr?: string | Date) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return 'Today';
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
};

export const ChatRoomScreen: React.FC<Props> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { user: currentUser } = useAuthStore();
  const {
    conversationId: initialConvId,
    targetUserId,
    targetUserName,
    targetUserAvatar,
  } = route.params;

  const [conversationId, setConversationId] = useState<string | null>(initialConvId || null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isTargetOnline, setIsTargetOnline] = useState(false);

  // Initialize and load conversation
  const initChat = useCallback(async () => {
    try {
      let convId = conversationId;
      if (!convId && targetUserId) {
        convId = await chatService.getDirectChat(targetUserId);
        if (convId) {
          setConversationId(convId);
        }
      }

      if (convId) {
        const msgs = await chatService.getMessages(convId);
        // Order: newest first for inverted list
        setMessages(msgs.reverse());
        socketService.joinConversation(convId);
        socketService.markAsRead(convId);
      }
    } catch (err) {
      console.warn('Error loading chat:', err);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, targetUserId]);

  useEffect(() => {
    socketService.connect();
    initChat();

    // Listen for incoming messages
    const handleIncomingMessage = (newMsg: ChatMessage) => {
      if (newMsg.conversationId === conversationId || (!conversationId && newMsg.senderId === targetUserId)) {
        setMessages((prev) => [newMsg, ...prev]);
        if (newMsg.conversationId) {
          socketService.markAsRead(newMsg.conversationId);
        }
      }
    };

    // Listen for read receipts
    const handleMessagesRead = (data: { conversationId: string; readerId: string }) => {
      if (data.conversationId === conversationId && data.readerId !== currentUser?.id) {
        setMessages((prev) =>
          prev.map((m) =>
            m.senderId === currentUser?.id ? { ...m, status: 'READ' } : m
          )
        );
      }
    };

    // Listen for presence
    const handlePresence = (data: { userId: string; isOnline: boolean }) => {
      if (data.userId === targetUserId) {
        setIsTargetOnline(data.isOnline);
      }
    };

    socketService.onMessage(handleIncomingMessage);
    socketService.onMessagesRead(handleMessagesRead);
    socketService.onPresenceChange(handlePresence);

    return () => {
      socketService.offMessage(handleIncomingMessage);
      socketService.offMessagesRead(handleMessagesRead);
      if (conversationId) {
        socketService.leaveConversation(conversationId);
      }
    };
  }, [conversationId, targetUserId, initChat, currentUser?.id]);

  // Send Text Message
  const handleSendText = async () => {
    const trimmed = inputText.trim();
    if (!trimmed || isSending) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInputText('');

    // Optimistic message
    const tempId = `temp_${Date.now()}`;
    const optimisticMsg: ChatMessage = {
      id: tempId,
      conversationId: conversationId || '',
      senderId: currentUser?.id || '',
      type: 'TEXT',
      content: trimmed,
      status: 'SENT',
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [optimisticMsg, ...prev]);

    try {
      socketService.sendMessage(
        {
          conversationId: conversationId || undefined,
          recipientId: !conversationId ? targetUserId : undefined,
        },
        trimmed
      );
    } catch (err) {
      console.warn('Send error:', err);
    }
  };

  // Pick and Send Image
  const handlePickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Please allow gallery access to share photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        setIsSending(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        const uploadRes = await chatService.uploadImage(result.assets[0].uri);
        if (uploadRes?.storageKey) {
          socketService.sendImageMessage(
            {
              conversationId: conversationId || undefined,
              recipientId: !conversationId ? targetUserId : undefined,
            },
            uploadRes
          );
        }
      }
    } catch {
      Alert.alert('Upload Failed', 'Could not upload photo.');
    } finally {
      setIsSending(false);
    }
  };

  // Call Placeholders
  const handleCall = (type: 'audio' | 'video') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      type === 'audio' ? 'Audio Call' : 'Video Call',
      `${type === 'audio' ? 'Audio' : 'Video'} calling will be available in the upcoming release.`
    );
  };

  const renderMessageItem = ({ item, index }: { item: ChatMessage; index: number }) => {
    const isMe = item.senderId === currentUser?.id;
    const timeStr = formatMessageTime(item.createdAt);

    // Show date divider if previous message is from a different day
    const nextItem = messages[index + 1];
    const currentDate = new Date(item.createdAt).toDateString();
    const nextDate = nextItem ? new Date(nextItem.createdAt).toDateString() : null;
    const showDateDivider = currentDate !== nextDate;

    return (
      <View>
        {showDateDivider && (
          <View style={styles.dateDivider}>
            <Text style={styles.dateDividerText}>
              {formatDateDivider(item.createdAt)}
            </Text>
          </View>
        )}

        <View
          style={[
            styles.bubbleRow,
            isMe ? styles.bubbleRowMe : styles.bubbleRowOther,
          ]}
        >
          <View
            style={[
              styles.bubble,
              isMe ? styles.bubbleMe : styles.bubbleOther,
            ]}
          >
            {item.type === 'IMAGE' && item.attachment?.url ? (
              <Image
                source={{ uri: item.attachment.url }}
                style={styles.attachedImage}
                resizeMode="cover"
              />
            ) : null}

            {item.content ? (
              <Text
                style={[
                  styles.messageText,
                  isMe ? styles.messageTextMe : styles.messageTextOther,
                ]}
              >
                {item.content}
              </Text>
            ) : null}

            <View style={styles.timeStatusRow}>
              <Text
                style={[
                  styles.timeText,
                  isMe ? styles.timeTextMe : styles.timeTextOther,
                ]}
              >
                {timeStr}
              </Text>

              {isMe && (
                <View style={styles.statusTick}>
                  {item.status === 'READ' ? (
                    <CheckCheck size={13} color="#4ADE80" />
                  ) : (
                    <Check size={13} color="rgba(255, 255, 255, 0.7)" />
                  )}
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Top Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ChevronLeft size={24} color="#151D19" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.userProfileLink}
            activeOpacity={0.8}
            onPress={() =>
              navigation.navigate('UserProfile', {
                userId: targetUserId,
                variant: 'PUBLIC',
              })
            }
          >
            <View style={styles.avatarWrap}>
              {targetUserAvatar ? (
                <Image source={{ uri: targetUserAvatar }} style={styles.avatarImg} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarInitial}>
                    {targetUserName?.charAt(0)?.toUpperCase() || 'U'}
                  </Text>
                </View>
              )}
              {isTargetOnline && <View style={styles.onlineDot} />}
            </View>

            <View style={styles.headerTextWrap}>
              <Text style={styles.headerName} numberOfLines={1}>
                {targetUserName || 'Traveler'}
              </Text>
              <Text style={styles.headerStatus}>
                {isTargetOnline ? 'Active now' : 'Direct message'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Action icons */}
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={() => handleCall('audio')}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Phone size={19} color="#005440" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={() => handleCall('video')}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Video size={20} color="#005440" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages FlatList */}
      <KeyboardAvoidingView
        style={styles.chatArea}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {isLoading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color="#005440" />
          </View>
        ) : (
          <FlatList
            data={messages}
            inverted
            keyExtractor={(item) => item.id}
            renderItem={renderMessageItem}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Input Bar */}
        <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <TouchableOpacity
            style={styles.attachBtn}
            onPress={handlePickImage}
            disabled={isSending}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <ImageIcon size={22} color="#005440" />
          </TouchableOpacity>

          <TextInput
            style={styles.textInput}
            placeholder="Type a message..."
            placeholderTextColor="#88978E"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
          />

          <TouchableOpacity
            style={[
              styles.sendBtn,
              inputText.trim() ? styles.sendBtnActive : styles.sendBtnInactive,
            ]}
            onPress={handleSendText}
            disabled={!inputText.trim()}
          >
            <Send size={16} color="#FFFFFF" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAF8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEF3F0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userProfileLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    position: 'relative',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    backgroundColor: '#005440',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  headerTextWrap: {
    flex: 1,
  },
  headerName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#151D19',
  },
  headerStatus: {
    fontSize: 11,
    color: '#5C6B64',
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F6F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatArea: {
    flex: 1,
  },
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
  },
  dateDivider: {
    alignItems: 'center',
    marginVertical: 12,
  },
  dateDividerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#88978E',
    backgroundColor: '#EEF3F0',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  bubbleRow: {
    flexDirection: 'row',
    marginVertical: 3,
  },
  bubbleRowMe: {
    justifyContent: 'flex-end',
  },
  bubbleRowOther: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleMe: {
    backgroundColor: '#005440',
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6EFE9',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  messageTextMe: {
    color: '#FFFFFF',
  },
  messageTextOther: {
    color: '#151D19',
  },
  attachedImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
    marginBottom: 6,
  },
  timeStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 4,
  },
  timeText: {
    fontSize: 10,
  },
  timeTextMe: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  timeTextOther: {
    color: '#88978E',
  },
  statusTick: {
    marginLeft: 2,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#EEF3F0',
    gap: 8,
  },
  attachBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F8FAF8',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E6EFE9',
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    color: '#151D19',
    maxHeight: 100,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnActive: {
    backgroundColor: '#005440',
  },
  sendBtnInactive: {
    backgroundColor: '#B5C4BC',
  },
});
