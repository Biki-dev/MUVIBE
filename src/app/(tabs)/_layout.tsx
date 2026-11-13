import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Palette, FontFamily } from '@/constants/theme';
import { AppIcon } from '@/components/ui/icon';

const BAR_CONTENT_HEIGHT = 60;

export default function TabsLayout() {
  // The bar previously used a flat height of 60 with 8px of bottom
  // padding, which sat underneath the Android navigation bar and made
  // the tabs unreachable on a real phone. The inset has to be added to
  // both the height and the padding, not just the padding, or the
  // content is squashed instead of lifted.
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Palette.forest,
        tabBarInactiveTintColor: Palette.muted,
        tabBarStyle: {
          backgroundColor: Palette.white,
          borderTopColor: Palette.border,
          borderTopWidth: 1,
          height: BAR_CONTENT_HEIGHT + insets.bottom,
          paddingBottom: insets.bottom + 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11.5,
          fontWeight: '600',
          fontFamily: FontFamily.medium,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <AppIcon
              name={focused ? 'home' : 'home-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: 'Activity',
          tabBarIcon: ({ color, focused }) => (
            <AppIcon
              name={focused ? 'pulse' : 'pulse-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="challenges"
        options={{
          title: 'Challenges',
          tabBarIcon: ({ color, focused }) => (
            <AppIcon
              name={focused ? 'trophy' : 'trophy-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: 'Community',
          tabBarIcon: ({ color, focused }) => (
            <AppIcon
              name={focused ? 'people' : 'people-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <AppIcon
              name={focused ? 'person' : 'person-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
