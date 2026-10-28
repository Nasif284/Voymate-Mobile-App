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
            const inactiveColor = '#5C6861';

            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                onPress={onPress}
                onLongPress={onLongPress}
                activeOpacity={0.75}
                style={styles.tabSlot}
              >
                <View
                  style={[
                    styles.tabPill,
                    isFocused && styles.tabPillActive,
                  ]}
                >
                  <IconComponent
                    size={21}
                    color={isFocused ? activeColor : inactiveColor}
                    strokeWidth={isFocused ? 2.3 : 1.9}
                  />
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
    shadowColor: '#0A2920',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 22,
    elevation: 16,
  },
  islandClipContainer: {
    flex: 1,
    borderRadius: 34,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
  },
  iosGlassTint: {
    backgroundColor: 'rgba(255, 255, 255, 0.52)',
  },
  androidGlassTint: {
    backgroundColor: 'rgba(255, 255, 255, 0.93)',
  },
  tabsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
  },
  tabSlot: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabPill: {
    width: '92%',
    height: 50,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 2,
  },
  tabPillActive: {
    backgroundColor: 'rgba(0, 84, 64, 0.11)',
    borderColor: 'rgba(0, 84, 64, 0.16)',
  },
  tabLabel: {
    fontSize: 10,
    letterSpacing: -0.2,
  },
  tabLabelActive: {
    fontWeight: '700',
    color: theme.colors.primary,
  },
  tabLabelInactive: {
    fontWeight: '500',
    color: '#5C6861',
  },
});
