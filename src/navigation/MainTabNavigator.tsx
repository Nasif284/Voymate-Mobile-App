import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
} from 'react-native';
import {
  createBottomTabNavigator,
  BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { MainTabParamList } from './types';
import { theme } from '../config/theme';
import { HomeScreen } from '../features/home/screens/HomeScreen';
import { MatchesScreen } from '../features/matches/screens/MatchesScreen';
import { ExploreScreen } from '../features/explore/screens/ExploreScreen';
import { MessagesScreen } from '../features/chat/screens/MessagesScreen';
import { ProfileScreen } from '../features/profile/screens/ProfileScreen';
import {
  Home,
  Heart,
  Compass,
  MessageSquare,
  User,
} from 'lucide-react-native';
import { useHaptics } from '../hooks/useHaptics';

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_CONFIG: Record<
  keyof MainTabParamList,
  {
    label: string;
    Icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  }
> = {
  HomeTab: { label: 'Home', Icon: Home },
  MatchesTab: { label: 'Matches', Icon: Heart },
  ExploreTab: { label: 'Explore', Icon: Compass },
  MessagesTab: { label: 'Messages', Icon: MessageSquare },
  ProfileTab: { label: 'Profile', Icon: User },
};

const FloatingIslandTabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();
  const isIos = Platform.OS === 'ios';

  const bottomOffset = Math.max(insets.bottom, 12);

  return (
    <View
      style={[
        styles.floatingShadowWrapper,
        { bottom: bottomOffset },
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.islandClipContainer}>
        {/* Native Liquid Glass Blur Layer */}
        <BlurView
          tint={isIos ? 'systemChromeMaterialLight' : 'light'}
          intensity={isIos ? 88 : 100}
          style={StyleSheet.absoluteFill}
        />

        {/* Luminous Frosted Tint Overlay */}
        <View
          style={[
            StyleSheet.absoluteFill,
            isIos ? styles.iosGlassTint : styles.androidGlassTint,
          ]}
        />

        {/* Tab Items Row */}
        <View style={styles.tabsRow}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;
            const config =
              TAB_CONFIG[route.name as keyof MainTabParamList] ||
              TAB_CONFIG.HomeTab;
            const IconComponent = config.Icon;

            const onPress = () => {
              haptics.selection();
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            const onLongPress = () => {
              navigation.emit({
                type: 'tabLongPress',
                target: route.key,
              });
            };

            const activeColor = theme.colors.primary;
            const inactiveColor = theme.colors.textMuted;

            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                onPress={onPress}
                onLongPress={onLongPress}
                activeOpacity={0.7}
                style={styles.tabSlot}
              >
                <View style={styles.tabContent}>
                  <View
                    style={[
                      styles.iconWrapper,
                      isFocused && styles.iconWrapperActive,
                    ]}
                  >
                    <IconComponent
                      size={20}
                      color={isFocused ? activeColor : inactiveColor}
                      strokeWidth={isFocused ? 2.2 : 1.75}
                    />
                  </View>
                  <Text
                    style={[
                      styles.tabLabel,
                      isFocused ? styles.tabLabelActive : styles.tabLabelInactive,
                    ]}
                    numberOfLines={1}
                  >
                    {config.label}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
};

export const MainTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingIslandTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} />
      <Tab.Screen name="MatchesTab" component={MatchesScreen} />
      <Tab.Screen name="ExploreTab" component={ExploreScreen} />
      <Tab.Screen name="MessagesTab" component={MessagesScreen} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  floatingShadowWrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: 64,
    borderRadius: 34,
    // Floating ambient drop shadow
    shadowColor: theme.colors.cardShadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 8,
  },
  islandClipContainer: {
    flex: 1,
    borderRadius: 34,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  iosGlassTint: {
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
  },
  androidGlassTint: {
    backgroundColor: theme.colors.surface,
  },
  tabsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  tabSlot: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  iconWrapper: {
    width: 42,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  iconWrapperActive: {
    backgroundColor: theme.colors.primaryMist,
  },
  tabLabel: {
    fontSize: 10.5,
    letterSpacing: -0.1,
  },
  tabLabelActive: {
    fontWeight: '600',
    color: theme.colors.primary,
  },
  tabLabelInactive: {
    fontWeight: '500',
    color: theme.colors.textMuted,
  },
});
