import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { User, Quote, Plus } from 'lucide-react-native';

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
          <User size={15} color="#005440" />
        </View>
        <Text style={styles.headerTitle}>About {firstName}</Text>
      </View>

      {hasBio ? (
        <View style={styles.content}>
          <Quote
            size={16}
            color="#C9EADB"
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
            <Plus size={13} color="#005440" />
            <Text style={styles.addBioPillText}>Add Bio</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#E6EFE9',
    shadowColor: '#000',
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
    backgroundColor: '#E8F5EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#151D19',
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
    color: '#2D3732',
    lineHeight: 22,
    fontWeight: '500',
  },
  emptyPrompt: {
    backgroundColor: '#F8FAF8',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E6EFE9',
    gap: 10,
  },
  emptyPromptText: {
    fontSize: 13,
    color: '#5C6B64',
    lineHeight: 19,
  },
  addBioPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#E8F5EE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  addBioPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#005440',
  },
});
