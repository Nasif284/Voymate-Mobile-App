import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Compass, Sparkles, Globe, Award, Heart } from 'lucide-react-native';

interface ProfileAttributesCardProps {
  travelType?: string | null;
  travelPersonality?: string | null;
  skills?: string[];
  interests?: string[];
  languages?: string[];
}

export const ProfileAttributesCard: React.FC<ProfileAttributesCardProps> = ({
  travelType,
  travelPersonality,
  skills = [],
  interests = [],
  languages = [],
}) => {
  const hasAny =
    Boolean(travelType) ||
    Boolean(travelPersonality) ||
    skills.length > 0 ||
    interests.length > 0 ||
    languages.length > 0;

  if (!hasAny) return null;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Compass size={16} color="#005440" />
        </View>
        <Text style={styles.headerTitle}>Travel Preferences</Text>
      </View>

      {/* Travel Style & Personality Highlight Row */}
      {(travelType || travelPersonality) && (
        <View style={styles.highlightSection}>
          {travelType ? (
            <View style={styles.highlightItem}>
              <Text style={styles.subLabel}>TRAVEL STYLE</Text>
              <View style={styles.stylePill}>
                <Sparkles size={12} color="#005440" />
                <Text style={styles.stylePillText}>{travelType}</Text>
              </View>
            </View>
          ) : null}

          {travelPersonality ? (
            <View style={styles.highlightItem}>
              <Text style={styles.subLabel}>PERSONALITY</Text>
              <View style={styles.personalityPill}>
                <Text style={styles.personalityPillText}>{travelPersonality}</Text>
              </View>
            </View>
          ) : null}
        </View>
      )}

      {/* Languages */}
      {languages.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionLabelRow}>
            <Globe size={13} color="#5C6B64" />
            <Text style={styles.subLabel}>LANGUAGES</Text>
          </View>
          <View style={styles.tagWrap}>
            {languages.map((lang, idx) => (
              <View key={idx} style={styles.langTag}>
                <Text style={styles.langTagText}>{lang}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionLabelRow}>
            <Award size={13} color="#5C6B64" />
            <Text style={styles.subLabel}>SKILLS</Text>
          </View>
          <View style={styles.tagWrap}>
            {skills.map((skill, idx) => (
              <View key={idx} style={styles.skillTag}>
                <Text style={styles.skillTagText}>{skill}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Interests */}
      {interests.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionLabelRow}>
            <Heart size={13} color="#5C6B64" />
            <Text style={styles.subLabel}>INTERESTS</Text>
          </View>
          <View style={styles.tagWrap}>
            {interests.map((interest, idx) => (
              <View key={idx} style={styles.interestTag}>
                <Text style={styles.interestTagText}>{interest}</Text>
              </View>
            ))}
          </View>
        </View>
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
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F1',
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
  highlightSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  highlightItem: {
    flex: 1,
    minWidth: 130,
    gap: 6,
  },
  subLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#5C6B64',
    letterSpacing: 0.6,
  },
  stylePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E8F5EE',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#C9EADB',
    alignSelf: 'flex-start',
  },
  stylePillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#005440',
  },
  personalityPill: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    alignSelf: 'flex-start',
  },
  personalityPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  section: {
    gap: 8,
  },
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  langTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  langTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  skillTag: {
    backgroundColor: '#E8F5EE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D4EBE0',
  },
  skillTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#005440',
  },
  interestTag: {
    backgroundColor: '#F8FAF8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2EBE5',
  },
  interestTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#151D19',
  },
});
