/**
 * src/components/ui/icon-registry.ts
 * ─────────────────────────────────────────────────────────────────
 * Lucide, Phosphor and Tabler icons, imported one file at a time.
 *
 * Every import below is a per-icon subpath, never the package root.
 * That is not a style choice. These packages export 7057 (lucide),
 * 3024 (phosphor) and 6353 (tabler) icons, each in its own file, and
 * Metro does not tree-shake. Importing the barrel makes Metro crawl
 * every one of those files: the bundle balloons, and on Windows the
 * dev server dies outright with
 *
 *   Error: EMFILE: too many open files, open '...IconGlassGin.mjs'
 *
 * which is exactly what happened here before this file was changed.
 * Per-icon subpaths pull in 1 file each instead of thousands.
 *
 * To add an icon: find it in the gallery, add one import line and one
 * registry entry. The subpath shape differs per package:
 *
 *   lucide     https://lucide.dev/icons      lucide-react-native/icons/<kebab-case>
 *   phosphor   https://phosphoricons.com     phosphor-react-native/src/icons/<PascalCase>
 *   tabler     https://tabler.io/icons       @tabler/icons-react-native/Icon<PascalCase>
 *
 * Ionicons and MaterialCommunityIcons are font based and need no
 * registry: pass their name straight to AppIcon with type "ion"/"mci".
 * https://oblador.github.io/react-native-vector-icons/
 * ─────────────────────────────────────────────────────────────────
 */
import type { ComponentType } from 'react';

import LucideActivity from 'lucide-react-native/icons/activity';
import LucideBike from 'lucide-react-native/icons/bike';
import LucideClock from 'lucide-react-native/icons/clock';
import LucideDumbbell from 'lucide-react-native/icons/dumbbell';
import LucideFlame from 'lucide-react-native/icons/flame';
import LucideFootprints from 'lucide-react-native/icons/footprints';
import LucideMapPin from 'lucide-react-native/icons/map-pin';
import LucideNavigation from 'lucide-react-native/icons/navigation';
import LucideTimer from 'lucide-react-native/icons/timer';
import LucideTrophy from 'lucide-react-native/icons/trophy';
import LucideUsers from 'lucide-react-native/icons/users';

import { Barbell as PhosphorBarbell } from 'phosphor-react-native/src/icons/Barbell';
import { Bicycle as PhosphorBicycle } from 'phosphor-react-native/src/icons/Bicycle';
import { Clock as PhosphorClock } from 'phosphor-react-native/src/icons/Clock';
import { Fire as PhosphorFire } from 'phosphor-react-native/src/icons/Fire';
import { Footprints as PhosphorFootprints } from 'phosphor-react-native/src/icons/Footprints';
import { MapPin as PhosphorMapPin } from 'phosphor-react-native/src/icons/MapPin';
import { NavigationArrow as PhosphorNavigationArrow } from 'phosphor-react-native/src/icons/NavigationArrow';
import { PersonSimpleRun as PhosphorRun } from 'phosphor-react-native/src/icons/PersonSimpleRun';
import { Trophy as PhosphorTrophy } from 'phosphor-react-native/src/icons/Trophy';
import { Users as PhosphorUsers } from 'phosphor-react-native/src/icons/Users';

// Tabler's per-icon files export the component as default.
import IconBarbell from '@tabler/icons-react-native/IconBarbell';
import IconBike from '@tabler/icons-react-native/IconBike';
import IconClock from '@tabler/icons-react-native/IconClock';
import IconFlame from '@tabler/icons-react-native/IconFlame';
import IconMapPin from '@tabler/icons-react-native/IconMapPin';
import IconNavigation from '@tabler/icons-react-native/IconNavigation';
import IconRun from '@tabler/icons-react-native/IconRun';
import IconTrophy from '@tabler/icons-react-native/IconTrophy';
import IconUsers from '@tabler/icons-react-native/IconUsers';

export interface VectorIconProps {
  size?: number;
  color?: string;
}

type IconComponent = ComponentType<VectorIconProps>;

export const LUCIDE_ICONS: Record<string, IconComponent> = {
  activity: LucideActivity,
  bike: LucideBike,
  clock: LucideClock,
  dumbbell: LucideDumbbell,
  flame: LucideFlame,
  footprints: LucideFootprints,
  'map-pin': LucideMapPin,
  navigation: LucideNavigation,
  timer: LucideTimer,
  trophy: LucideTrophy,
  users: LucideUsers,
};

export const PHOSPHOR_ICONS: Record<string, IconComponent> = {
  barbell: PhosphorBarbell,
  bicycle: PhosphorBicycle,
  clock: PhosphorClock,
  fire: PhosphorFire,
  footprints: PhosphorFootprints,
  'map-pin': PhosphorMapPin,
  'navigation-arrow': PhosphorNavigationArrow,
  run: PhosphorRun,
  trophy: PhosphorTrophy,
  users: PhosphorUsers,
};

export const TABLER_ICONS: Record<string, IconComponent> = {
  barbell: IconBarbell,
  bike: IconBike,
  clock: IconClock,
  flame: IconFlame,
  'map-pin': IconMapPin,
  navigation: IconNavigation,
  run: IconRun,
  trophy: IconTrophy,
  users: IconUsers,
};
