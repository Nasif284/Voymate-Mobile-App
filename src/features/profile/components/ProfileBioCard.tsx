import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { User, Quote, Plus } from 'lucide-react-native';
import { theme } from '../../../config/theme';

interface ProfileBioCardProps {
  name: string;
  bio?: string | null;
  onAddBio?: () => void;
}

export const ProfileBioCard: React.FC<ProfileBioCardProps> = ({ name, bio, onAddBio }) => {
  const hasBio = Boolean(bio && bio.trim().length > 0);
  if (!hasBio && !onAddBio) return null;

  const firstName = name?.split(' ')[0] || 'Traveler';

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <User size={15} color={theme.colors.primary} />
        </View>
        <Text style={styles.headerTitle}>About {firstName}</Text>
      </View>

      {hasBio ? (
        <View style={styles.content}>
          <Quote
            size={16}
            color={theme.colors.primaryLight}
            style={styles.quoteIcon}
          />
          <Text style={styles.bioText}>{bio!.trim()}</Text>
        </View>
      ) : (
        <TouchableOpacity style={styles.emptyPrompt} onPress={onAddBio} activeOpacity={0.8}>
          <Text style={styles.emptyPromptText}>
            Add a short bio about your travel style so potential travel mates know more about you.
          </Text>
          <View style={styles.addBioPill}>
            <Plus size={13} color={theme.colors.primary} />
            <Text style={styles.addBioPillText}>Add Bio</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  headerIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.primaryMist,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    letterSpacing: -0.2,
  },
  content: {
    position: 'relative',
    paddingLeft: 4,
  },
  quoteIcon: {
    marginBottom: 4,
  },
  bioText: {
    fontSize: 14,
    color: theme.colors.textPrimary,
    lineHeight: 22,
    fontWeight: '500',
  },
  emptyPrompt: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 10,
  },
  emptyPromptText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 19,
  },
  addBioPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.primaryMist,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  addBioPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary,
  },
});
