import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { X, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useUpdateProfile } from '../hooks/profile.hooks';
import { UserProfileData, UpdatePersonalProfilePayload } from '../types';
import { theme } from '../../../config/theme';
import { cn } from '../../../utils/cn';

interface EditProfileModalProps {
  visible: boolean;
  profile: UserProfileData;
  onClose: () => void;
  onSave?: (payload: UpdatePersonalProfilePayload) => Promise<void>;
}

const TRAVEL_STYLES = ['BACKPACKER', 'BUDGET', 'LUXURY', 'ADVENTURE', 'CULTURAL'];
const PERSONALITIES = ['INTROVERT', 'AMBIVERT', 'EXTROVERT'];
const POPULAR_INTERESTS = [
  'Mountains',
  'Beach',
  'Foodie',
  'Culture',
  'Hiking',
  'Party',
  'Road Trips',
  'Wildlife',
  'Wellness',
  'Photography',
];
const POPULAR_SKILLS = [
  'Photography',
  'Navigation',
  'First Aid',
  'Driving',
  'Cooking',
  'Language Exchange',
  'Hiking Guide',
];

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  visible,
  profile,
  onClose,
}) => {
  const [fullName, setFullName] = useState(profile.fullName || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [travelType, setTravelType] = useState(profile.travelType || 'BACKPACKER');
  const [travelPersonality, setTravelPersonality] = useState(
    profile.travelPersonality || 'AMBIVERT'
  );
  const [interests, setInterests] = useState<string[]>(profile.interests || []);
  const [skills, setSkills] = useState<string[]>(profile.skills || []);
  const [languagesInput, setLanguagesInput] = useState(
    (profile.languages || []).join(', ')
  );

  const updateProfileMutation = useUpdateProfile();
  const isSaving = updateProfileMutation.isPending;

  const toggleInterest = (interest: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const toggleSkill = (skill: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleSave = () => {
    const languages = languagesInput
      .split(',')
      .map((l) => l.trim())
      .filter(Boolean);

    const payload: UpdatePersonalProfilePayload = {
      fullName: fullName.trim() || profile.fullName,
      bio: bio.trim(),
      travelType,
      travelPersonalityCode: travelPersonality,
      interests,
      skills,
      languages,
    };

    updateProfileMutation.mutate(payload, {
      onSuccess: () => {
        onClose();
      },
    });
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView
        className="flex-1 bg-background"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View className="flex-1 bg-background">
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 py-[18px] border-b border-border bg-surface">
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={22} color={theme.colors.textPrimary} />
            </TouchableOpacity>
            <Text className="text-[17px] font-bold text-text-primary">Edit Profile</Text>
            <TouchableOpacity
              onPress={handleSave}
              disabled={isSaving}
              className={cn('px-3.5 py-1.5 rounded-xl bg-surface border border-primary', isSaving && 'opacity-60')}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : (
                <Text className="text-sm font-semibold text-primary">Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView
            className="flex-1"
            contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Full Name */}
            <View className="gap-2">
              <Text className="text-[10px] font-semibold text-text-secondary tracking-[0.6px]">FULL NAME</Text>
              <TextInput
                className="bg-surface-subtle border border-border rounded-[14px] px-4 py-3 text-sm text-text-primary font-semibold"
                value={fullName}
                onChangeText={setFullName}
                placeholder="Your full name"
                placeholderTextColor={theme.colors.textPlaceholder}
              />
            </View>

            {/* Bio */}
            <View className="gap-2">
              <Text className="text-[10px] font-semibold text-text-secondary tracking-[0.6px]">BIO</Text>
              <TextInput
                className="bg-surface-subtle border border-border rounded-[14px] px-4 py-3 text-sm text-text-primary font-semibold h-[100px] pt-3"
                value={bio}
                onChangeText={setBio}
                placeholder="Tell other travelers about yourself and where you want to go..."
                placeholderTextColor={theme.colors.textPlaceholder}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Travel Style */}
            <View className="gap-2">
              <Text className="text-[10px] font-semibold text-text-secondary tracking-[0.6px]">TRAVEL STYLE</Text>
              <View className="flex-row flex-wrap gap-2">
                {TRAVEL_STYLES.map((style) => {
                  const isSelected = travelType.toUpperCase() === style;
                  return (
                    <TouchableOpacity
                      key={style}
                      className={cn(
                        'flex-row items-center gap-1.5 bg-surface-subtle border border-border px-3.5 py-2 rounded-[14px]',
                        isSelected && 'bg-primary border-primary'
                      )}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setTravelType(style);
                      }}
                    >
                      {isSelected && <Check size={12} color={theme.colors.white} strokeWidth={3} />}
                      <Text
                        className={cn(
                          'text-xs font-bold text-text-secondary',
                          isSelected && 'text-white'
                        )}
                      >
                        {style}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Personality */}
            <View className="gap-2">
              <Text className="text-[10px] font-semibold text-text-secondary tracking-[0.6px]">TRAVEL PERSONALITY</Text>
              <View className="flex-row flex-wrap gap-2">
                {PERSONALITIES.map((item) => {
                  const isSelected = travelPersonality.toUpperCase() === item;
                  return (
                    <TouchableOpacity
                      key={item}
                      className={cn(
                        'flex-row items-center gap-1.5 bg-surface-subtle border border-border px-3.5 py-2 rounded-[14px]',
                        isSelected && 'bg-primary border-primary'
                      )}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setTravelPersonality(item);
                      }}
                    >
                      {isSelected && <Check size={12} color={theme.colors.white} strokeWidth={3} />}
                      <Text
                        className={cn(
                          'text-xs font-bold text-text-secondary',
                          isSelected && 'text-white'
                        )}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Interests */}
            <View className="gap-2">
              <Text className="text-[10px] font-semibold text-text-secondary tracking-[0.6px]">INTERESTS</Text>
              <View className="flex-row flex-wrap gap-2">
                {POPULAR_INTERESTS.map((interest) => {
                  const isSelected = interests.includes(interest);
                  return (
                    <TouchableOpacity
                      key={interest}
                      className={cn(
                        'flex-row items-center gap-1.5 bg-surface-subtle border border-border px-3.5 py-2 rounded-[14px]',
                        isSelected && 'bg-primary border-primary'
                      )}
                      onPress={() => toggleInterest(interest)}
                    >
                      {isSelected && <Check size={12} color={theme.colors.white} strokeWidth={3} />}
                      <Text
                        className={cn(
                          'text-xs font-bold text-text-secondary',
                          isSelected && 'text-white'
                        )}
                      >
                        {interest}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Skills */}
            <View className="gap-2">
              <Text className="text-[10px] font-semibold text-text-secondary tracking-[0.6px]">SKILLS</Text>
              <View className="flex-row flex-wrap gap-2">
                {POPULAR_SKILLS.map((skill) => {
                  const isSelected = skills.includes(skill);
                  return (
                    <TouchableOpacity
                      key={skill}
                      className={cn(
                        'flex-row items-center gap-1.5 bg-surface-subtle border border-border px-3.5 py-2 rounded-[14px]',
                        isSelected && 'bg-primary border-primary'
                      )}
                      onPress={() => toggleSkill(skill)}
                    >
                      {isSelected && <Check size={12} color={theme.colors.white} strokeWidth={3} />}
                      <Text
                        className={cn(
                          'text-xs font-bold text-text-secondary',
                          isSelected && 'text-white'
                        )}
                      >
                        {skill}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Languages */}
            <View className="gap-2">
              <Text className="text-[10px] font-semibold text-text-secondary tracking-[0.6px]">LANGUAGES (SEPARATE BY COMMA)</Text>
              <TextInput
                className="bg-surface-subtle border border-border rounded-[14px] px-4 py-3 text-sm text-text-primary font-semibold"
                value={languagesInput}
                onChangeText={setLanguagesInput}
                placeholder="English, Spanish, French..."
                placeholderTextColor={theme.colors.textPlaceholder}
              />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
