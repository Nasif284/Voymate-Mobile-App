import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Image } from 'expo-image';
import { theme } from '../../../config/theme';
import {
  X,
  ShieldCheck,
  UserX,
  FileText,
  Lock,
  LogOut,
  ChevronRight,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '../../../store/authStore';
import { useSafetyStore } from '../../../store/safetyStore';
import { useDeleteAccount, useUpdateProfile } from '../hooks/profile.hooks';
import { UserProfileData } from '../types';

interface AccountSettingsModalProps {
  visible: boolean;
  profile: UserProfileData;
  onClose: () => void;
}

export const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({
  visible,
  profile,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'MAIN' | 'BLOCKED_USERS'>('MAIN');

  const { logout } = useAuthStore();
  const { blockedUsers, unblockUser } = useSafetyStore();
  const deleteAccountMutation = useDeleteAccount();
  const updateProfileMutation = useUpdateProfile();

  const blockedList = Object.values(blockedUsers);

  useEffect(() => {
    if (visible) {
      void useSafetyStore.getState().loadBlockedUsers();
    }
  }, [visible]);

  const handleClose = () => {
    setActiveTab('MAIN');
    onClose();
  };

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Log Out', 'Are you sure you want to log out of Voymate?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: () => {
          handleClose();
          logout();
        },
      },
    ]);
  };

  // Retention-First 2-Step Account Deletion Flow
  const handleDeleteAccountFlow = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

    // Step 1: Retention Save
    Alert.alert(
      'Pause Traveling Mode Instead?',
      'If you need a break or want to stop meeting people temporarily, you can simply turn off Traveling Mode. Your profile will be hidden from discovery, but your trips and chats will stay safe.',
      [
        {
          text: 'Turn Off Traveling Mode',
          onPress: async () => {
            try {
              await updateProfileMutation.mutateAsync({
                fullName: profile.fullName,
                bio: profile.bio || '',
                isTraveling: false,
              });
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Traveling Mode Paused', 'You are now hidden from public traveler discovery.');
              handleClose();
            } catch {
              // error handled by mutation
            }
          },
        },
        {
          text: 'Continue Deletion',
          style: 'destructive',
          onPress: promptFinalPermanentDeletion,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  // Step 2: Final Destructive Confirmation (Complies strictly with Apple Guideline 5.1.1(v) & Google Play)
  const promptFinalPermanentDeletion = () => {
    Alert.alert(
      'Permanently Delete Account?',
      'This will permanently scrub your personal data, cancel your active journeys, and remove your account from Voymate. This action cannot be reversed.',
      [
        { text: 'Keep My Account', style: 'cancel' },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccountMutation.mutateAsync();
              handleClose();
              await logout();
              Alert.alert(
                'Account Deleted',
                'Your account and personal data have been permanently removed.'
              );
            } catch {
              // Handled by hook error alert
            }
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-black/60 justify-end">
        <View className="bg-surface rounded-t-[32px] border-t border-border max-h-[85%] pb-9">
          {/* Header */}
          <View className="flex-row items-center justify-between px-6 pt-5 pb-4 border-b border-border/40">
            <View className="flex-row items-center gap-2">
              <ShieldCheck size={20} color={theme.colors.primary} />
              <Text className="text-base font-bold text-text-primary">
                {activeTab === 'BLOCKED_USERS' ? 'Blocked Travelers' : 'Settings & Safety'}
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

          <ScrollView
            className="px-6 pt-3"
            showsVerticalScrollIndicator={false}
          >
            {activeTab === 'MAIN' ? (
              <View className="gap-5 pb-6">
                {/* Community Safety Notice */}
                <View className="bg-primary/10 border border-primary/20 rounded-2xl p-4 flex-row items-start gap-3">
                  <ShieldCheck size={20} color={theme.colors.primary} className="mt-0.5" />
                  <View className="flex-1">
                    <Text className="text-xs font-bold text-primary mb-1">
                      Safe & Respectful Community
                    </Text>
                    <Text className="text-[11.5px] leading-4 text-text-secondary">
                      Voymate strictly enforces zero tolerance for objectionable content, harassment, or abusive users. Inappropriate accounts are permanently banned.
                    </Text>
                  </View>
                </View>

                {/* Section: Safety & Controls */}
                <View>
                  <Text className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                    Safety & Moderation
                  </Text>
                  <View className="bg-surface-subtle rounded-2xl border border-border overflow-hidden">
                    <TouchableOpacity
                      onPress={() => setActiveTab('BLOCKED_USERS')}
                      className="flex-row items-center justify-between p-3.5 border-b border-border/40"
                      activeOpacity={0.7}
                    >
                      <View className="flex-row items-center gap-3">
                        <UserX size={18} color={theme.colors.textSecondary} />
                        <Text className="text-sm font-semibold text-text-primary">
                          Blocked Travelers
                        </Text>
                      </View>
                      <View className="flex-row items-center gap-2">
                        {blockedList.length > 0 && (
                          <View className="bg-surface px-2 py-0.5 rounded-full border border-border">
                            <Text className="text-xs font-bold text-text-secondary">
                              {blockedList.length}
                            </Text>
                          </View>
                        )}
                        <ChevronRight size={16} color={theme.colors.textMuted} />
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={async () => {
                        const url = 'https://voymate.app/safety';
                        try {
                          if (await Linking.canOpenURL(url)) {
                            await Linking.openURL(url);
                            return;
                          }
                        } catch {}
                        Alert.alert(
                          'Community Guidelines',
                          'Voymate connects genuine travelers around the globe. We require all members to treat others with kindness, respect local customs, and report any abusive or suspicious behavior.'
                        );
                      }}
                      className="flex-row items-center justify-between p-3.5"
                      activeOpacity={0.7}
                    >
                      <View className="flex-row items-center gap-3">
                        <FileText size={18} color={theme.colors.textSecondary} />
                        <Text className="text-sm font-semibold text-text-primary">
                          Community Guidelines
                        </Text>
                      </View>
                      <ChevronRight size={16} color={theme.colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Section: Legal */}
                <View>
                  <Text className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                    Legal & Privacy
                  </Text>
                  <View className="bg-surface-subtle rounded-2xl border border-border overflow-hidden">
                    <TouchableOpacity
                      onPress={async () => {
                        const url = 'https://voymate.app/terms';
                        try {
                          if (await Linking.canOpenURL(url)) {
                            await Linking.openURL(url);
                            return;
                          }
                        } catch {}
                        Alert.alert(
                          'Terms of Service',
                          'By using Voymate, travelers agree to uphold community safety, accurate identity representation, and zero tolerance for harassment or unauthorized solicitation.'
                        );
                      }}
                      className="flex-row items-center justify-between p-3.5 border-b border-border/40"
                      activeOpacity={0.7}
                    >
                      <View className="flex-row items-center gap-3">
                        <FileText size={18} color={theme.colors.textSecondary} />
                        <Text className="text-sm font-semibold text-text-primary">
                          Terms of Service
                        </Text>
                      </View>
                      <ChevronRight size={16} color={theme.colors.textMuted} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={async () => {
                        const url = 'https://voymate.app/privacy';
                        try {
                          if (await Linking.canOpenURL(url)) {
                            await Linking.openURL(url);
                            return;
                          }
                        } catch {}
                        Alert.alert(
                          'Privacy Policy',
                          'Voymate protects your travel data. Exact GPS coordinates are never broadcast publicly — only approximate city or district level proximity is displayed.'
                        );
                      }}
                      className="flex-row items-center justify-between p-3.5"
                      activeOpacity={0.7}
                    >
                      <View className="flex-row items-center gap-3">
                        <Lock size={18} color={theme.colors.textSecondary} />
                        <Text className="text-sm font-semibold text-text-primary">
                          Privacy Policy
                        </Text>
                      </View>
                      <ChevronRight size={16} color={theme.colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Section: Account Actions */}
                <View>
                  <Text className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                    Account
                  </Text>
                  <View className="bg-surface-subtle rounded-2xl border border-border overflow-hidden">
                    <TouchableOpacity
                      onPress={handleLogout}
                      className="flex-row items-center justify-between p-3.5"
                      activeOpacity={0.7}
                    >
                      <View className="flex-row items-center gap-3">
                        <LogOut size={18} color={theme.colors.error} />
                        <Text className="text-sm font-bold text-error">
                          Log Out
                        </Text>
                      </View>
                      <ChevronRight size={16} color={theme.colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Apple Guideline 5.1.1(v) Compliant In-App Account Deletion (Strategically de-emphasized for retention) */}
                <View className="items-center mt-3 pt-2">
                  <TouchableOpacity
                    onPress={handleDeleteAccountFlow}
                    disabled={deleteAccountMutation.isPending}
                    className="py-2 px-3"
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    {deleteAccountMutation.isPending ? (
                      <ActivityIndicator size="small" color={theme.colors.textMuted} />
                    ) : (
                      <Text className="text-xs font-medium text-text-placeholder underline">
                        Delete Account
                      </Text>
                    )}
                  </TouchableOpacity>
                  <Text className="text-[10px] text-text-placeholder/70 mt-1">
                    Voymate v1.0.0
                  </Text>
                </View>
              </View>
            ) : (
              /* Blocked Users View */
              <View className="pb-6">
                <TouchableOpacity
                  onPress={() => setActiveTab('MAIN')}
                  className="mb-4 flex-row items-center gap-1.5"
                >
                  <Text className="text-xs font-bold text-primary">← Back to Settings</Text>
                </TouchableOpacity>

                {blockedList.length === 0 ? (
                  <View className="py-12 items-center justify-center">
                    <UserX size={40} color={theme.colors.textMuted} />
                    <Text className="text-sm font-semibold text-text-primary mt-3">
                      No Blocked Travelers
                    </Text>
                    <Text className="text-xs text-text-secondary mt-1 text-center max-w-[240px]">
                      Travelers you block will be listed here. You can unblock them at any time.
                    </Text>
                  </View>
                ) : (
                  <View className="gap-2.5">
                    {blockedList.map((blocked) => (
                      <View
                        key={blocked.id}
                        className="flex-row items-center justify-between p-3.5 bg-surface-subtle border border-border rounded-2xl"
                      >
                        <View className="flex-row items-center gap-3 flex-1 mr-2">
                          <View className="w-10 h-10 rounded-full bg-primary overflow-hidden items-center justify-center">
                            {blocked.avatar ? (
                              <Image
                                source={{ uri: blocked.avatar }}
                                className="w-full h-full"
                                contentFit="cover"
                              />
                            ) : (
                              <Text className="text-white font-bold text-sm">
                                {blocked.name?.charAt(0)?.toUpperCase() || 'U'}
                              </Text>
                            )}
                          </View>
                          <View className="flex-1">
                            <Text
                              className="text-sm font-bold text-text-primary"
                              numberOfLines={1}
                            >
                              {blocked.name || 'Traveler'}
                            </Text>
                            <Text className="text-[11px] text-text-secondary mt-0.5">
                              Blocked
                            </Text>
                          </View>
                        </View>

                        <TouchableOpacity
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            unblockUser(blocked.id);
                            Alert.alert(
                              'Traveler Unblocked',
                              `${blocked.name || 'Traveler'} has been unblocked.`
                            );
                          }}
                          className="px-3 py-1.5 rounded-full bg-surface border border-border"
                        >
                          <Text className="text-xs font-semibold text-text-primary">
                            Unblock
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
