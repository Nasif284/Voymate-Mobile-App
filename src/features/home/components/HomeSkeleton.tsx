import React from 'react';
import { View, StyleSheet } from 'react-native';

export const HomeSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Header Placeholder */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <View style={[styles.shimmerBox, { width: 90, height: 13, marginBottom: 6 }]} />
          <View style={[styles.shimmerBox, { width: 140, height: 22, marginBottom: 6 }]} />
          <View style={[styles.shimmerBox, { width: 110, height: 16, borderRadius: 8 }]} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={[styles.shimmerBox, { width: 85, height: 32, borderRadius: 16 }]} />
          <View style={[styles.shimmerBox, { width: 44, height: 44, borderRadius: 22 }]} />
        </View>
      </View>

      {/* Cards Placeholder */}
      {[1, 2].map((i) => (
        <View key={i} style={styles.card}>
          <View style={[styles.shimmerBox, { width: '100%', height: 120, borderRadius: 0 }]} />
          <View style={{ padding: 18 }}>
            <View style={[styles.shimmerBox, { width: 150, height: 20, marginBottom: 10 }]} />
            <View style={[styles.shimmerBox, { width: 100, height: 14, marginBottom: 16 }]} />
            <View style={[styles.shimmerBox, { width: '100%', height: 50, borderRadius: 12, marginBottom: 16 }]} />
            <View style={[styles.shimmerBox, { width: '100%', height: 44, borderRadius: 14 }]} />
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerText: {
    flex: 1,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E8ECE9',
    overflow: 'hidden',
    marginBottom: 20,
  },
  shimmerBox: {
    backgroundColor: '#EAEFEA',
    borderRadius: 8,
  },
});
