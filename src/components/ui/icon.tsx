import React from 'react';
import { ColorValue } from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { Palette } from '@/constants/theme';

export type IconType = 'ion' | 'mci' | 'feather';

interface AppIconProps {
  name: string;
  type?: IconType;
  size?: number;
  color?: any;
}

export function AppIcon({
  name,
  type = 'ion',
  size = 20,
  color = Palette.ink,
}: AppIconProps) {
  if (type === 'mci') {
    return <MaterialCommunityIcons name={name as any} size={size} color={color} />;
  }
  if (type === 'feather') {
    return <Feather name={name as any} size={size} color={color} />;
  }
  return <Ionicons name={name as any} size={size} color={color} />;
}
