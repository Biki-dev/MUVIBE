import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ScrollView,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  type ScrollViewInstance,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Palette, Radius, Spacing, Typography, FontFamily } from '@/constants/theme';
import { AppIcon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';

/**
 * First-launch intro. Shown once, before the auth screen. After the
 * last slide (or Skip) the flag is written to the local database and
 * the user lands on Guest / Sign in.
 */

interface Slide {
  key: string;
  icon: string;
  iconType: 'ion' | 'mci';
  eyebrow: string;
  title: string;
  body: string;
}

const SLIDES: Slide[] = [
  {
    key: 'welcome',
    icon: 'flash',
    iconType: 'ion',
    eyebrow: 'Welcome to MUVIBE',
    title: 'Campus fitness, made social.',
    body: 'Log your workouts, join your college crowd and keep moving between lectures.',
  },
  {
    key: 'track',
    icon: 'run',
    iconType: 'mci',
    eyebrow: 'Track',
    title: 'Every walk, run and ride counts.',
    body: 'Start a session, let the timer run, and see your steps, distance and streak build up day by day.',
  },
  {
    key: 'challenge',
    icon: 'trophy-outline',
    iconType: 'ion',
    eyebrow: 'Challenge',
    title: 'Set a goal. Beat it with friends.',
    body: 'Join campus challenges, watch your progress bar move with each activity, and earn reward points on completion.',
  },
  {
    key: 'community',
    icon: 'people-outline',
    iconType: 'ion',
    eyebrow: 'Community',
    title: 'Find your club. Climb the board.',
    body: 'Running, cycling, yoga, badminton: join a club, post in its discussion and compete on the leaderboard.',
  },
  {
    key: 'private',
    icon: 'phone-portrait-outline',
    iconType: 'ion',
    eyebrow: 'Yours',
    title: 'Your data stays on your phone.',
    body: 'Start as a guest with no account at all. Everything is saved locally. Nothing is sent anywhere.',
  },
];

const LOGO = require('../../assets/images/logo-round.png');

export default function IntroScreen() {
  const router = useRouter();
  const { markIntroSeen } = useAuth();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollViewInstance>(null);
  const [index, setIndex] = useState(0);

  const isLast = index === SLIDES.length - 1;

  const finish = async () => {
    await markIntroSeen();
    router.replace('/auth');
  };

  const goTo = (next: number) => {
    scrollRef.current?.scrollTo({ x: next * width, animated: true });
    setIndex(next);
  };

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / width);
    if (next !== index) setIndex(next);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <Image source={LOGO} style={styles.brandMark} />
          <Text style={styles.brandText}>MUVIBE</Text>
        </View>
        {!isLast && (
          <Pressable onPress={finish} hitSlop={10}>
            <Text style={styles.skip}>Skip</Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumEnd}
        style={styles.pager}>
        {SLIDES.map((slide) => (
          <View key={slide.key} style={[styles.slide, { width }]}>
            <View style={styles.hero}>
              <View style={styles.heroRingOuter}>
                <View style={styles.heroRingInner}>
                  <AppIcon
                    name={slide.icon}
                    type={slide.iconType}
                    size={44}
                    color={Palette.lime}
                  />
                </View>
              </View>
              <View style={styles.eyebrowPill}>
                <Text style={styles.eyebrowText}>{slide.eyebrow}</Text>
              </View>
            </View>

            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.body}>{slide.body}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((s, i) => (
            <View
              key={s.key}
              style={[styles.dot, i === index && styles.dotActive]}
            />
          ))}
        </View>

        <Button
          label={isLast ? 'Get started' : 'Next'}
          variant="primary"
          size="md"
          onPress={() => (isLast ? finish() : goTo(index + 1))}
          icon={<AppIcon name="arrow-forward" size={18} color={Palette.ink} />}
          iconPosition="right"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Palette.canvas,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.space5,
    paddingVertical: Spacing.space3,
  },
  brandMark: {
    width: 28,
    height: 28,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space2,
  },
  brandText: {
    ...Typography.cardHeading,
    color: Palette.forest,
    letterSpacing: 1.5,
  },
  skip: {
    ...Typography.bodyBold,
    color: Palette.muted,
  },
  pager: {
    flex: 1,
  },
  slide: {
    flex: 1,
    paddingHorizontal: Spacing.space5,
    paddingTop: Spacing.space4,
  },
  hero: {
    backgroundColor: Palette.forest,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.space8,
    alignItems: 'center',
    marginBottom: Spacing.space6,
  },
  heroRingOuter: {
    width: 148,
    height: 148,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: 'rgba(197, 243, 107, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.space5,
  },
  heroRingInner: {
    width: 104,
    height: 104,
    borderRadius: Radius.full,
    backgroundColor: Palette.borderDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrowPill: {
    backgroundColor: 'rgba(197, 243, 107, 0.14)',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.space3,
    paddingVertical: 6,
  },
  eyebrowText: {
    ...Typography.supporting,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
    color: Palette.lime,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  title: {
    ...Typography.pageTitle,
    color: Palette.ink,
    marginBottom: Spacing.space3,
  },
  body: {
    ...Typography.body,
    fontSize: 15.5,
    lineHeight: 23,
    color: Palette.muted,
  },
  footer: {
    paddingHorizontal: Spacing.space5,
    paddingBottom: Spacing.space5,
    paddingTop: Spacing.space3,
    gap: Spacing.space5,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: Radius.full,
    backgroundColor: Palette.border,
  },
  dotActive: {
    width: 22,
    backgroundColor: Palette.forest,
  },
});
