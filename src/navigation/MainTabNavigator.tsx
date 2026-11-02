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
import { cn } from '../utils/cn';

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
      className="absolute left-4 right-4 h-16 rounded-[34px] shadow-floating"
      style={[{ bottom: bottomOffset }, theme.shadows.floating]}
      pointerEvents="box-none"
    >
      <View className="flex-1 rounded-[34px] overflow-hidden border border-border bg-surface">
        {/* Native Liquid Glass Blur Layer */}
        <BlurView
          tint={isIos ? 'systemChromeMaterialLight' : 'light'}
          intensity={isIos ? 88 : 100}
          style={StyleSheet.absoluteFill}
        />

        {/* Luminous Frosted Tint Overlay */}
        <View
          style={StyleSheet.absoluteFill}
          className={isIos ? 'bg-white/90' : 'bg-surface'}
        />

        {/* Tab Items Row */}
        <View className="flex-1 flex-row items-center justify-around px-2">
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
                className="flex-1 h-full items-center justify-center"
              >
                <View className="items-center justify-center gap-[3px]">
                  <View
                    className={cn(
                      'w-[42px] h-[28px] rounded-full items-center justify-center',
                      isFocused ? 'bg-primary-mist' : 'bg-transparent'
                    )}
                  >
                    <IconComponent
                      size={20}
                      color={isFocused ? activeColor : inactiveColor}
                      strokeWidth={isFocused ? 2.2 : 1.75}
                    />
                  </View>
                  <Text
                    className={cn(
                      'text-[10.5px] tracking-[-0.1px]',
                      isFocused ? 'font-semibold text-primary' : 'font-medium text-textMuted'
                    )}
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
