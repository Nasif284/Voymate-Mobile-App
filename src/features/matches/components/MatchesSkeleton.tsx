import React from 'react';
import { View } from 'react-native';

export const MatchesSkeleton: React.FC = () => {
  return (
    <View className="px-5 pt-2.5">
      {/* Header Placeholder */}
      <View className="mb-5">
        <View className="w-[140px] h-6 rounded-lg bg-surface-subtle mb-2" />
        <View className="w-[220px] h-3.5 rounded-lg bg-surface-subtle mb-4" />
        <View className="flex-row gap-2">
          <View className="w-[120px] h-8 rounded-2xl bg-surface-subtle" />
          <View className="w-[140px] h-8 rounded-2xl bg-surface-subtle" />
        </View>
      </View>

      {/* Capsule Placeholder */}
      <View className="w-full h-20 rounded-2xl bg-surface-subtle mb-5" />

      {/* Cards Placeholder */}
      {[1, 2].map((i) => (
        <View key={i} className="bg-surface rounded-3xl border border-border overflow-hidden mb-5">
          <View className="w-full h-[120px] bg-surface-subtle" />
          <View className="p-4.5">
            <View className="w-[150px] h-5 rounded-lg bg-surface-subtle mb-2.5" />
            <View className="w-[100px] h-3.5 rounded-lg bg-surface-subtle mb-4" />
            <View className="w-full h-[50px] rounded-xl bg-surface-subtle mb-4" />
            <View className="w-full h-11 rounded-2xl bg-surface-subtle" />
          </View>
        </View>
      ))}
    </View>
  );
};
