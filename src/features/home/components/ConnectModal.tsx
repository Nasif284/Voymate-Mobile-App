import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
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
        <View style={styles.overlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.sheetContainer}
          >
            <View style={styles.sheet}>
              <View style={styles.header}>
                <View>
                  <Text style={styles.title}>Connect with {recipientName}</Text>
                  <Text style={styles.subtitle}>Add a short note with your request</Text>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.closeBtn}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <X size={20} color={theme.colors.textMuted} />
                </TouchableOpacity>
              </View>

              <View style={styles.quickStarters}>
                <View style={styles.startersHeader}>
                  <Sparkles size={13} color={theme.colors.primary} />
                  <Text style={styles.startersLabel}>Suggested Messages</Text>
                </View>
                {QUICK_STARTERS.map((starter, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.starterChip}
                    onPress={() => handleSelectStarter(starter)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.starterText} numberOfLines={1}>
                      {starter}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={styles.input}
                placeholder={`Hey ${recipientName}, I saw your trip and would love to connect...`}
                placeholderTextColor={theme.colors.textMuted}
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                maxLength={300}
              />

              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={onClose}
                  disabled={isSending}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.sendBtn, isSending && styles.btnDisabled]}
                  onPress={handleSend}
                  disabled={isSending}
                >
                  {isSending ? (
                    <ActivityIndicator size="small" color={theme.colors.white} />
                  ) : (
                    <>
                      <Send size={15} color={theme.colors.white} style={{ marginRight: 6 }} />
                      <Text style={styles.sendText}>Send Request</Text>
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

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    width: '100%',
  },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    shadowColor: theme.colors.cardShadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: 20,
  },
  quickStarters: {
    marginBottom: 14,
  },
  startersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 4,
  },
  startersLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: theme.colors.primary,
  },
  starterChip: {
    backgroundColor: theme.colors.surfaceSubtle,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  starterText: {
    fontSize: 12,
    color: theme.colors.textPrimary,
    fontWeight: '500',
  },
  input: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 14,
    fontSize: 14,
    color: theme.colors.textPrimary,
    minHeight: 80,
    marginBottom: 18,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: theme.colors.surfaceSubtle,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  sendBtn: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  sendText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.onPrimary,
  },
});
