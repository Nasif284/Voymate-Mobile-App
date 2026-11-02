import React from 'react';
import { View } from 'react-native';

export const HomeSkeleton: React.FC = () => {
  return (
    <View className="px-5 pt-2.5">
      {/* Header Placeholder */}
      <View className="flex-row justify-between items-center mb-5">
        <View className="flex-1">
          <View className="w-[90px] h-[13px] rounded-lg bg-surface-subtle mb-1.5" />
          <View className="w-[140px] h-[22px] rounded-lg bg-surface-subtle mb-1.5" />
          <View className="w-[110px] h-4 rounded-lg bg-surface-subtle" />
        </View>
        <View className="flex-row items-center gap-2.5">
          <View className="w-[85px] h-8 rounded-full bg-surface-subtle" />
          <View className="w-11 h-11 rounded-full bg-surface-subtle" />
        </View>
      </View>

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
