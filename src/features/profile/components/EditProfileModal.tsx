import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
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
import { UserProfileData, UpdatePersonalProfilePayload } from '../types';

interface EditProfileModalProps {
  visible: boolean;
  profile: UserProfileData;
  onClose: () => void;
  onSave: (payload: UpdatePersonalProfilePayload) => Promise<void>;
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
  onSave,
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

  const [isSaving, setIsSaving] = useState(false);

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

  const handleSave = async () => {
    setIsSaving(true);
    try {
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

      await onSave(payload);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onClose();
    } catch {
      // Handled by caller
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={22} color="#151D19" />
            </TouchableOpacity>
            <Text style={styles.title}>Edit Profile</Text>
            <TouchableOpacity
              onPress={handleSave}
              disabled={isSaving}
              style={[styles.saveBtn, isSaving && { opacity: 0.6 }]}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#005440" />
              ) : (
                <Text style={styles.saveBtnText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.formScroll}
            contentContainerStyle={styles.formContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Full Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>FULL NAME</Text>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Your full name"
                placeholderTextColor="#88978E"
              />
            </View>

            {/* Bio */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>BIO</Text>
              <TextInput
                style={[styles.input, styles.bioInput]}
                value={bio}
                onChangeText={setBio}
                placeholder="Tell other travelers about yourself and where you want to go..."
                placeholderTextColor="#88978E"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Travel Style */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>TRAVEL STYLE</Text>
              <View style={styles.pillWrap}>
                {TRAVEL_STYLES.map((style) => {
                  const isSelected = travelType.toUpperCase() === style;
                  return (
                    <TouchableOpacity
                      key={style}
                      style={[styles.pill, isSelected && styles.pillSelected]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setTravelType(style);
                      }}
                    >
                      {isSelected && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                      <Text
                        style={[styles.pillText, isSelected && styles.pillTextSelected]}
                      >
                        {style}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Personality */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>TRAVEL PERSONALITY</Text>
              <View style={styles.pillWrap}>
                {PERSONALITIES.map((item) => {
                  const isSelected = travelPersonality.toUpperCase() === item;
                  return (
                    <TouchableOpacity
                      key={item}
                      style={[styles.pill, isSelected && styles.pillSelected]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setTravelPersonality(item);
                      }}
                    >
                      {isSelected && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                      <Text
                        style={[styles.pillText, isSelected && styles.pillTextSelected]}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Interests */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>INTERESTS</Text>
              <View style={styles.pillWrap}>
                {POPULAR_INTERESTS.map((interest) => {
                  const isSelected = interests.includes(interest);
                  return (
                    <TouchableOpacity
                      key={interest}
                      style={[styles.pill, isSelected && styles.pillSelected]}
                      onPress={() => toggleInterest(interest)}
                    >
                      {isSelected && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                      <Text
                        style={[styles.pillText, isSelected && styles.pillTextSelected]}
                      >
                        {interest}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Skills */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>SKILLS</Text>
              <View style={styles.pillWrap}>
                {POPULAR_SKILLS.map((skill) => {
                  const isSelected = skills.includes(skill);
                  return (
                    <TouchableOpacity
                      key={skill}
                      style={[styles.pill, isSelected && styles.pillSelected]}
                      onPress={() => toggleSkill(skill)}
                    >
                      {isSelected && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                      <Text
                        style={[styles.pillText, isSelected && styles.pillTextSelected]}
                      >
                        {skill}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Languages */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>LANGUAGES (SEPARATE BY COMMA)</Text>
              <TextInput
                style={styles.input}
                value={languagesInput}
                onChangeText={setLanguagesInput}
                placeholder="English, Spanish, French..."
                placeholderTextColor="#88978E"
              />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: '#F8FAF8',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAF8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#E6EFE9',
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#151D19',
  },
  saveBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#E8F5EE',
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#005440',
  },
  formScroll: {
    flex: 1,
  },
  formContent: {
    padding: 20,
    gap: 20,
    paddingBottom: 40,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    color: '#5C6B64',
    letterSpacing: 0.6,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6EFE9',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#151D19',
    fontWeight: '600',
  },
  bioInput: {
    height: 100,
    paddingTop: 12,
  },
  pillWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6EFE9',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
  },
  pillSelected: {
    backgroundColor: '#005440',
    borderColor: '#005440',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
  pillTextSelected: {
    color: '#FFFFFF',
  },
});
