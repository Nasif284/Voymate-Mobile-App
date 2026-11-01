import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Compass, Sparkles, Globe, Award, Heart } from 'lucide-react-native';
import { theme } from '../../../config/theme';

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
          <Compass size={16} color={theme.colors.primary} />
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
                <Sparkles size={12} color={theme.colors.primary} />
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
            <Globe size={13} color={theme.colors.textSecondary} />
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
            <Award size={13} color={theme.colors.textSecondary} />
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
            <Heart size={13} color={theme.colors.textSecondary} />
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
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
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
    fontWeight: '600',
    color: theme.colors.textSecondary,
    letterSpacing: 0.6,
  },
  stylePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.primaryMist,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.primaryBorder,
    alignSelf: 'flex-start',
  },
  stylePillText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  personalityPill: {
    backgroundColor: theme.colors.surfaceSubtle,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    alignSelf: 'flex-start',
  },
  personalityPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textPrimary,
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
    backgroundColor: theme.colors.surfaceSubtle,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  langTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  skillTag: {
    backgroundColor: theme.colors.primaryMist,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.primaryBorder,
  },
  skillTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  interestTag: {
    backgroundColor: theme.colors.surfaceSubtle,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  interestTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
});
