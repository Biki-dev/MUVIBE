import React from 'react';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { Palette } from '@/constants/theme';
import { LUCIDE_ICONS, PHOSPHOR_ICONS, TABLER_ICONS } from './icon-registry';

/**
 * One icon component for all five sets the app uses.
 *
 *   ion | mci | feather   font based, from @expo/vector-icons
 *   lucide | phosphor | tabler   SVG based, from icon-registry.ts
 *
 * Names for the SVG sets come from the registry, not the package, so
 * add an icon there before using it. An unknown name renders nothing
 * rather than throwing, and warns in development.
 */
export type IconType = 'ion' | 'mci' | 'feather' | 'lucide' | 'phosphor' | 'tabler';

interface AppIconProps {
  name: string;
  type?: IconType;
  size?: number;
  color?: any;
}

const SVG_SETS = {
  lucide: LUCIDE_ICONS,
  phosphor: PHOSPHOR_ICONS,
  tabler: TABLER_ICONS,
} as const;

export function AppIcon({
  name,
  type = 'ion',
  size = 20,
  color = Palette.ink,
}: AppIconProps) {
  if (type === 'lucide' || type === 'phosphor' || type === 'tabler') {
    const Component = SVG_SETS[type][name];
    if (!Component) {
      if (__DEV__) {
        console.warn(
          `[AppIcon] "${name}" is not in the ${type} registry. ` +
            'Add it to src/components/ui/icon-registry.ts.'
        );
      }
      return null;
    }
    return <Component size={size} color={color} />;
  }

  if (type === 'mci') {
    return <MaterialCommunityIcons name={name as any} size={size} color={color} />;
  }
  if (type === 'feather') {
    return <Feather name={name as any} size={size} color={color} />;
  }
  return <Ionicons name={name as any} size={size} color={color} />;
}
