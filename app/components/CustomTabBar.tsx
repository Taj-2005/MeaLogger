import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useMemo } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Icon configuration with valid icon names
const getTabIcon = (routeName: string, isFocused: boolean) => {
  const icons: Record<string, { name: string; library: 'Ionicons' | 'MaterialIcons' }> = {
    index: {
      name: isFocused ? 'home' : 'home-outline',
      library: 'Ionicons',
    },
    timeline: {
      name: 'restaurant-menu',
      library: 'MaterialIcons',
    },
    'meal-logging': {
      name: isFocused ? 'camera' : 'camera-outline',
      library: 'Ionicons',
    },
    remainder: {
      name: 'notifications',
      library: 'MaterialIcons',
    },
    settings: {
      name: isFocused ? 'settings' : 'settings-outline',
      library: 'Ionicons',
    },
  };

  const config = icons[routeName];
  if (!config) {
    return { name: 'ellipse-outline', library: 'Ionicons' as const };
  }

  return {
    name: config.name as any,
    library: config.library,
  };
};

// CustomTabBar MUST always render content - never return null
// This component receives BottomTabBarProps and renders the tab bar UI
const CustomTabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const indicatorPosition = useSharedValue(0);
  const indicatorWidth = useSharedValue(0);
  const tabsContainerRef = React.useRef<View>(null);
  const tabsContainerWidth = React.useRef(0);

  // Use state.index directly from Tabs navigator - this is the active tab index
  const activeTabIndex = state.index;
  
  // Filter out routes that shouldn't be shown in tab bar (e.g., href: null)
  // Memoize to avoid recalculating on every render
  const visibleRoutes = useMemo(() => {
    return state.routes.filter((route) => {
      const { options } = descriptors[route.key];
      return options.href !== null && options.href !== undefined;
    });
  }, [state.routes, descriptors]);
  
  const tabCount = visibleRoutes.length;

  const updateIndicatorPosition = useCallback(() => {
    if (tabsContainerWidth.current > 0 && tabCount > 0) {
      // Find the position of the active tab in the visible routes array
      const activeRoute = state.routes[activeTabIndex];
      const activeVisibleIndex = visibleRoutes.findIndex((r) => r.key === activeRoute?.key);
      
      if (activeVisibleIndex >= 0) {
        // Calculate tab width: container width divided by number of visible tabs
        const tabWidth = tabsContainerWidth.current / tabCount;
        
        // Calculate position: activeVisibleIndex * tabWidth
        const position = activeVisibleIndex * tabWidth;
      
        indicatorPosition.value = withSpring(position, {
          damping: 20,
          stiffness: 300,
          mass: 0.8,
        });
        indicatorWidth.value = withSpring(tabWidth, {
          damping: 20,
          stiffness: 300,
          mass: 0.8,
        });
      }
    }
  }, [activeTabIndex, tabCount, visibleRoutes, state.routes]);

  useEffect(() => {
    updateIndicatorPosition();
  }, [updateIndicatorPosition]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorPosition.value }],
    width: Math.max(indicatorWidth.value, 0),
  }));

  const handleTabsContainerLayout = (event: any) => {
    const { width } = event.nativeEvent.layout;
    if (width > 0 && width !== tabsContainerWidth.current) {
      tabsContainerWidth.current = width;
      updateIndicatorPosition();
    }
  };

  // Always return UI - never return null (this ensures tab bar is always visible)
  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: Math.max(insets.bottom, 8),
        },
      ]}
    >
      {/* Floating background card */}
      <View
        style={[
          styles.background,
          {
            backgroundColor: colors.surface,
            shadowColor: colors.shadow,
          },
        ]}
      />

      {/* Tab buttons container with indicator */}
      <View
        ref={tabsContainerRef}
        style={styles.tabsContainer}
        collapsable={false}
        onLayout={handleTabsContainerLayout}
      >
        {/* Animated active indicator - positioned relative to tabsContainer */}
        <Animated.View
          style={[
            styles.indicator,
            {
              backgroundColor: `${colors.primary}15`,
            },
            indicatorStyle,
          ]}
        />

        {visibleRoutes.map((route) => {
          const { options } = descriptors[route.key];
          // Find the index of this route in the original state.routes array
          const routeIndex = state.routes.findIndex((r) => r.key === route.key);
          // Tab is focused if its route index matches the active tab index
          const isFocused = routeIndex === activeTabIndex;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              if (Platform.OS === 'ios') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <TabButton
              key={route.key}
              routeKey={route.key}
              label={options.title || route.name}
              routeName={route.name}
              isFocused={isFocused}
              onPress={onPress}
              onLongPress={onLongPress}
              colors={colors}
            />
          );
        })}
      </View>
    </View>
  );
};

interface TabButtonProps {
  routeKey: string;
  label: string;
  routeName: string;
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
  colors: any;
}

const TabButton: React.FC<TabButtonProps> = ({
  routeKey,
  label,
  routeName,
  isFocused,
  onPress,
  onLongPress,
  colors,
}) => {
  const scale = useSharedValue(1);
  const iconScale = useSharedValue(1);
  const labelOpacity = useSharedValue(isFocused ? 1 : 0.7);

  useEffect(() => {
    iconScale.value = withSpring(isFocused ? 1.1 : 1, {
      damping: 15,
      stiffness: 300,
    });
    labelOpacity.value = withTiming(isFocused ? 1 : 0.7, {
      duration: 200,
      easing: Easing.out(Easing.ease),
    });
  }, [isFocused]);

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: labelOpacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.92, {
      damping: 15,
      stiffness: 400,
    });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 400,
    });
  };

  const iconConfig = getTabIcon(routeName, isFocused);
  const IconComponent = iconConfig.library === 'MaterialIcons' ? MaterialIcons : Ionicons;

  return (
    <View
      collapsable={false}
      style={styles.tabButtonWrapper}
    >
      <AnimatedPressable
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.tabButton, buttonStyle]}
        accessibilityRole="button"
        accessibilityState={isFocused ? { selected: true } : {}}
        accessibilityLabel={label}
      >
        <Animated.View style={[styles.iconContainer, iconStyle]}>
          <IconComponent
            name={iconConfig.name}
            size={24}
            color={isFocused ? colors.primary : colors.textSecondary}
          />
        </Animated.View>
        <Animated.Text
          style={[
            styles.label,
            {
              color: isFocused ? colors.primary : colors.textSecondary,
            },
            labelStyle,
          ]}
          numberOfLines={1}
        >
          {label}
        </Animated.Text>
      </AnimatedPressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 12,
    paddingHorizontal: 8,
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    bottom: 0,
    borderRadius: 24,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 12,
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 8,
    position: 'relative',
    overflow: 'hidden',
    minHeight: 60,
  },
  indicator: {
    position: 'absolute',
    top: 6,
    height: 48,
    borderRadius: 16,
    zIndex: 0,
  },
  tabButtonWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    minHeight: 60,
  },
  tabButton: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    minHeight: 60,
  },
  iconContainer: {
    marginBottom: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default CustomTabBar;
