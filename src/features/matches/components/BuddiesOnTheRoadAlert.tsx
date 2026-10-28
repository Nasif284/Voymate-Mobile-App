import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { theme } from '../../../config/theme';
import { TripMatchItem } from '../types';
import { MessageSquare, Users } from 'lucide-react-native';

interface BuddiesOnTheRoadAlertProps {
  buddies: TripMatchItem[];
  onMessagePress: (buddy: TripMatchItem) => void;
}

export const BuddiesOnTheRoadAlert: React.FC<BuddiesOnTheRoadAlertProps> = ({
  buddies,
  onMessagePress,
}) => {
  if (!buddies || buddies.length === 0) return null;

  const firstBuddy = buddies[0];
  const buddyName = firstBuddy.user.fullName || 'A friend';
  const count = buddies.length;

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <View style={styles.avatarWrapper}>
          {firstBuddy.user.avatarUrl ? (
            <Image
              source={{ uri: firstBuddy.user.avatarUrl }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarFallback}>
              <Users size={14} color="#FFFFFF" />
            </View>
          )}
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {count === 1
              ? `${buddyName} is heading here too!`
              : `${buddyName} + ${count - 1} mate${count > 2 ? 's' : ''} heading here!`}
          </Text>
          <Text style={styles.subtitle}>
            Connected buddies on the road around your dates
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.actionBtn}
        onPress={() => onMessagePress(firstBuddy)}
        activeOpacity={0.8}
      >
        <MessageSquare size={13} color="#FFFFFF" />
        <Text style={styles.actionBtnText}>Chat</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#005440',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 10,
    gap: 10,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  avatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.75)',
    marginTop: 1,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F6E56',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
