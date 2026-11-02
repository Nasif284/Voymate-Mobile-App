import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { theme } from '../../../config/theme';
import { Send, X, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { cn } from '../../../utils/cn';

interface ConnectModalProps {
  visible: boolean;
  recipientName: string;
  onClose: () => void;
  onSend: (message: string) => Promise<void>;
}

const QUICK_STARTERS = [
  'Hey! Heading there too, would love to team up! 🎒',
  'Loved your travel style! Let’s coordinate plans ⛰️',
  'Saying hi! Would love to connect for the road 🌍',
];

export const ConnectModal: React.FC<ConnectModalProps> = ({
  visible,
  recipientName,
  onClose,
  onSend,
}) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSelectStarter = (starter: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMessage(starter);
  };

  const handleSend = () => {
    if (isSending) return;
    setIsSending(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Promise.resolve(
      onSend(message.trim() || `Hey ${recipientName}, let's connect on Voymate!`)
    )
      .then(() => {
        setMessage('');
        onClose();
      })
      .catch(() => {})
      .finally(() => {
        setIsSending(false);
      });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="flex-1 bg-black/50 justify-end">
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            className="w-full"
          >
            <View className="bg-surface rounded-t-[28px] p-5 pb-9 border-t border-border shadow-floating">
              <View className="flex-row justify-between items-center mb-4">
                <View>
                  <Text className="text-lg font-semibold text-text-primary tracking-tight">
                    Connect with {recipientName}
                  </Text>
                  <Text className="text-xs text-text-muted mt-0.5">
                    Add a short note with your request
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  className="w-8 h-8 rounded-full bg-surface-subtle items-center justify-center"
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <X size={18} color={theme.colors.textMuted} />
                </TouchableOpacity>
              </View>

              <View className="mb-4">
                <View className="flex-row items-center gap-1.5 mb-2">
                  <Sparkles size={13} color={theme.colors.primary} />
                  <Text className="text-xs font-semibold text-text-secondary">
                    Suggested Messages
                  </Text>
                </View>
                <View className="gap-2">
                  {QUICK_STARTERS.map((starter, idx) => (
                    <TouchableOpacity
                      key={idx}
                      className="bg-surface-subtle py-2.5 px-3 rounded-xl border border-border"
                      onPress={() => handleSelectStarter(starter)}
                      activeOpacity={0.7}
                    >
                      <Text className="text-xs text-text-secondary font-medium" numberOfLines={1}>
                        {starter}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TextInput
                className="bg-surface-subtle rounded-2xl border border-border p-3.5 text-sm text-text-primary min-h-[90px] leading-5 mb-4"
                placeholder={`Hey ${recipientName}, I saw your trip and would love to connect...`}
                placeholderTextColor={theme.colors.textMuted}
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                maxLength={300}
              />

              <View className="flex-row gap-3">
                <TouchableOpacity
                  className="flex-1 py-3.5 rounded-2xl bg-surface-subtle items-center justify-center border border-border"
                  onPress={onClose}
                  disabled={isSending}
                >
                  <Text className="text-sm font-semibold text-text-secondary">Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className={cn(
                    'flex-1 flex-row items-center justify-center py-3.5 rounded-2xl bg-primary gap-1.5 shadow-card',
                    isSending && 'opacity-60'
                  )}
                  onPress={handleSend}
                  disabled={isSending}
                >
                  {isSending ? (
                    <ActivityIndicator size="small" color={theme.colors.white} />
                  ) : (
                    <>
                      <Send size={15} color={theme.colors.white} />
                      <Text className="text-sm font-semibold text-white">Send Request</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};
