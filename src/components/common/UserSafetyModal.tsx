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
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { theme } from '../../config/theme';
import {
  X,
  ShieldAlert,
  UserX,
  Flag,
  ChevronRight,
  ChevronLeft,
  Check,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useBlockUser, useReportUser } from '../../features/profile/hooks/profile.hooks';
import { useSafetyStore } from '../../store/safetyStore';

interface UserSafetyModalProps {
  visible: boolean;
  targetUserId: string;
  targetUserName: string;
  targetUserAvatar?: string;
  onClose: () => void;
  onUserBlocked?: () => void;
}

const REPORT_REASONS = [
  'Harassment or bullying',
  'Inappropriate or offensive content',
  'Spam, scam, or fake profile',
  'Impersonation of someone else',
  'Other safety or policy violation',
];

export const UserSafetyModal: React.FC<UserSafetyModalProps> = ({
  visible,
  targetUserId,
  targetUserName,
  targetUserAvatar,
  onClose,
  onUserBlocked,
}) => {
  const [view, setView] = useState<'ACTIONS' | 'REPORT'>('ACTIONS');
  const [selectedReason, setSelectedReason] = useState<string>(REPORT_REASONS[0]);
  const [details, setDetails] = useState('');

  const blockMutation = useBlockUser();
  const reportMutation = useReportUser();
  const blockUserInStore = useSafetyStore((s) => s.blockUser);

  const resetModal = () => {
    setView('ACTIONS');
    setSelectedReason(REPORT_REASONS[0]);
    setDetails('');
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const handleConfirmBlock = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      `Block ${targetUserName}?`,
      `They will not be able to message you, view your profile, or find you on Voymate. They will also be removed immediately from your chats and feeds.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block Traveler',
          style: 'destructive',
          onPress: async () => {
            try {
              await blockMutation.mutateAsync(targetUserId);
              await blockUserInStore({
                id: targetUserId,
                name: targetUserName,
                avatar: targetUserAvatar,
              });
              handleClose();
              if (onUserBlocked) {
                onUserBlocked();
              }
              Alert.alert(
                'Traveler Blocked',
                `${targetUserName} has been blocked and removed from your view.`
              );
            } catch {
              // Mutation hook already alerts on error
            }
          },
        },
      ]
    );
  };

  const handleSubmitReport = async () => {
    if (reportMutation.isPending) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      await reportMutation.mutateAsync({
        targetUserId,
        reason: selectedReason,
        details: details.trim() || undefined,
      });

      Alert.alert(
        'Report Submitted',
        'Thank you for helping keep Voymate safe. Our trust & safety team reviews reports within 24 hours. Would you like to block this traveler as well?',
        [
          {
            text: 'No, Keep Visible',
            style: 'cancel',
            onPress: handleClose,
          },
          {
            text: 'Block Traveler',
            style: 'destructive',
            onPress: async () => {
              try {
                await blockMutation.mutateAsync(targetUserId);
                await blockUserInStore({
                  id: targetUserId,
                  name: targetUserName,
                  avatar: targetUserAvatar,
                });
                handleClose();
                if (onUserBlocked) {
                  onUserBlocked();
                }
              } catch {
                handleClose();
              }
            },
          },
        ]
      );
    } catch {
      // Mutation hook handles error alert
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="flex-1 bg-black/60 justify-end">
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View className="bg-surface rounded-t-[28px] border-t border-border px-6 pt-5 pb-9">
              {/* Header */}
              <View className="flex-row items-center justify-between pb-4 border-b border-border/40 mb-4">
                <View className="flex-row items-center gap-2">
                  {view === 'REPORT' && (
                    <TouchableOpacity
                      onPress={() => setView('ACTIONS')}
                      className="mr-1 p-1"
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <ChevronLeft size={20} color={theme.colors.textSecondary} />
                    </TouchableOpacity>
                  )}
                  <ShieldAlert size={20} color={theme.colors.primary} />
                  <Text className="text-base font-bold text-text-primary">
                    {view === 'ACTIONS' ? 'Safety & Moderation' : 'Report Traveler'}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={handleClose}
                  className="w-8 h-8 rounded-full bg-surface-subtle items-center justify-center"
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <X size={16} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Target Traveler Mini Card */}
              <View className="flex-row items-center gap-3 bg-surface-subtle p-3 rounded-2xl mb-5 border border-border/50">
                <View className="w-11 h-11 rounded-full overflow-hidden bg-primary items-center justify-center">
                  {targetUserAvatar ? (
                    <Image
                      source={{ uri: targetUserAvatar }}
                      className="w-full h-full"
                      contentFit="cover"
                      transition={150}
                    />
                  ) : (
                    <Text className="text-white font-bold text-base">
                      {targetUserName?.charAt(0)?.toUpperCase() || 'U'}
                    </Text>
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-[15px] font-bold text-text-primary" numberOfLines={1}>
                    {targetUserName}
                  </Text>
                  <Text className="text-xs text-text-secondary mt-0.5">
                    Voymate Community Member
                  </Text>
                </View>
              </View>

              {/* View 1: Quick Actions */}
              {view === 'ACTIONS' && (
                <View className="gap-3">
                  {/* Report Button */}
                  <TouchableOpacity
                    className="flex-row items-center justify-between p-4 rounded-2xl bg-surface-subtle border border-border"
                    activeOpacity={0.7}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setView('REPORT');
                    }}
                  >
                    <View className="flex-row items-center gap-3 flex-1 mr-2">
                      <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center">
                        <Flag size={20} color={theme.colors.primary} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-[15px] font-semibold text-text-primary">
                          Report Traveler
                        </Text>
                        <Text className="text-xs text-text-secondary mt-0.5">
                          Flag abusive, fraudulent, or objectionable behavior
                        </Text>
                      </View>
                    </View>
                    <ChevronRight size={18} color={theme.colors.textMuted} />
                  </TouchableOpacity>

                  {/* Block Button */}
                  <TouchableOpacity
                    className="flex-row items-center justify-between p-4 rounded-2xl bg-error-light border border-error-light"
                    activeOpacity={0.7}
                    onPress={handleConfirmBlock}
                    disabled={blockMutation.isPending}
                  >
                    <View className="flex-row items-center gap-3 flex-1 mr-2">
                      <View className="w-10 h-10 rounded-xl bg-error/15 items-center justify-center">
                        <UserX size={20} color={theme.colors.error} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-[15px] font-bold text-error">
                          Block Traveler
                        </Text>
                        <Text className="text-xs text-error/80 mt-0.5">
                          Hide profile, chats, and block future interactions
                        </Text>
                      </View>
                    </View>
                    {blockMutation.isPending ? (
                      <ActivityIndicator size="small" color={theme.colors.error} />
                    ) : (
                      <ChevronRight size={18} color={theme.colors.error} />
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {/* View 2: Report Form */}
              {view === 'REPORT' && (
                <View>
                  <Text className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2.5">
                    Select a reason
                  </Text>

                  <View className="gap-2 mb-4">
                    {REPORT_REASONS.map((reason) => {
                      const isSelected = selectedReason === reason;
                      return (
                        <TouchableOpacity
                          key={reason}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setSelectedReason(reason);
                          }}
                          className={`flex-row items-center justify-between p-3 rounded-xl border ${
                            isSelected
                              ? 'bg-primary/10 border-primary'
                              : 'bg-surface-subtle border-border'
                          }`}
                        >
                          <Text
                            className={`text-[13.5px] ${
                              isSelected ? 'font-bold text-primary' : 'font-medium text-text-primary'
                            }`}
                          >
                            {reason}
                          </Text>
                          {isSelected && <Check size={16} color={theme.colors.primary} />}
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <Text className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                    Additional Details (Optional)
                  </Text>
                  <TextInput
                    value={details}
                    onChangeText={setDetails}
                    placeholder="Describe what occurred..."
                    placeholderTextColor={theme.colors.textMuted}
                    multiline
                    numberOfLines={3}
                    className="bg-surface-subtle border border-border rounded-xl p-3 text-sm text-text-primary mb-5"
                    style={{ minHeight: 70, textAlignVertical: 'top' }}
                    maxLength={500}
                  />

                  {/* Submit Button */}
                  <TouchableOpacity
                    onPress={handleSubmitReport}
                    disabled={reportMutation.isPending}
                    className="h-[48px] rounded-xl bg-primary items-center justify-center flex-row gap-2"
                  >
                    {reportMutation.isPending ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Flag size={16} color="#fff" />
                        <Text className="text-white font-bold text-[14.5px]">
                          Submit Report
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};
