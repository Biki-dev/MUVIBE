/**
 * src/components/settings/wearable-section.tsx
 * ─────────────────────────────────────────────────────────────────
 * "Connected devices" on the Settings screen: scan for a watch or
 * band over Bluetooth, connect, and show what it reports.
 *
 * It never claims a capability it does not have. On web and in Expo
 * Go it says plainly why Bluetooth is unavailable instead of offering
 * a scan button that could only fail.
 * ─────────────────────────────────────────────────────────────────
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { FontFamily, Palette, Radius, Spacing, Typography } from '@/constants/theme';
import { AppIcon } from '@/components/ui/icon';
import {
  WearableDevice,
  WearableLink,
  WearableSnapshot,
  bleUnavailableReason,
  initialWearableSnapshot,
} from '@/services/wearable';

export function WearableSection() {
  const linkRef = useRef<WearableLink | null>(null);
  // Seeded from a pure helper so the effect does not have to set state
  // synchronously just to show the starting state.
  const [snap, setSnap] = useState<WearableSnapshot>(initialWearableSnapshot);
  const [lastDevice, setLastDevice] = useState<WearableDevice | null>(null);

  useEffect(() => {
    const link = new WearableLink(setSnap);
    linkRef.current = link;
    WearableLink.lastDevice().then(setLastDevice);
    return () => {
      link.destroy();
      linkRef.current = null;
    };
  }, []);

  const scan = useCallback(() => linkRef.current?.scan(), []);
  const connect = useCallback((id: string) => linkRef.current?.connect(id), []);
  const disconnect = useCallback(() => {
    linkRef.current?.disconnect();
    setLastDevice(null);
  }, []);

  const blocked = bleUnavailableReason();
  const state = snap.state;
  const scanning = state === 'scanning';
  const connecting = state === 'connecting';
  const connected = state === 'connected' && snap.device;

  return (
    <View style={styles.card}>
      <Text style={styles.heading}>CONNECTED DEVICES</Text>

      {/* Bluetooth unavailable: say why, offer nothing that cannot work. */}
      {blocked ? (
        <View style={styles.noteRow}>
          <AppIcon name="information-circle-outline" size={16} color={Palette.muted} />
          <Text style={styles.noteText}>{snap.message}</Text>
        </View>
      ) : (
        <>
          {connected ? (
            <View style={styles.connectedBlock}>
              <View style={styles.deviceRow}>
                <View style={styles.deviceIconOn}>
                  <AppIcon name="watch-outline" size={18} color={Palette.forest} />
                </View>
                <View style={styles.deviceText}>
                  <Text style={styles.deviceName} numberOfLines={1}>
                    {snap.device?.name}
                  </Text>
                  <Text style={styles.deviceMeta}>Connected</Text>
                </View>
                <Pressable
                  onPress={disconnect}
                  style={({ pressed }) => [styles.smallBtn, pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel="Disconnect device">
                  <Text style={styles.smallBtnText}>Disconnect</Text>
                </Pressable>
              </View>

              <View style={styles.statRow}>
                <View style={styles.statCell}>
                  <Text style={styles.statValue}>
                    {snap.reading.heartRate ?? '--'}
                  </Text>
                  <Text style={styles.statLabel}>bpm</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statCell}>
                  <Text style={styles.statValue}>
                    {snap.reading.batteryLevel != null
                      ? `${snap.reading.batteryLevel}%`
                      : '--'}
                  </Text>
                  <Text style={styles.statLabel}>battery</Text>
                </View>
              </View>

              <Text style={styles.footNote}>
                Steps still come from the phone. Bluetooth has no standard step
                reading, so each brand exposes its own.
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.blurb}>
                Pair a watch or band to read your live heart rate while you train.
              </Text>

              {lastDevice ? (
                <Pressable
                  onPress={() => connect(lastDevice.id)}
                  style={({ pressed }) => [styles.deviceRow, pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel={`Reconnect to ${lastDevice.name}`}>
                  <View style={styles.deviceIcon}>
                    <AppIcon name="watch-outline" size={18} color={Palette.muted} />
                  </View>
                  <View style={styles.deviceText}>
                    <Text style={styles.deviceName} numberOfLines={1}>
                      {lastDevice.name}
                    </Text>
                    <Text style={styles.deviceMeta}>Last paired, tap to reconnect</Text>
                  </View>
                  <AppIcon name="chevron-forward" size={16} color={Palette.muted} />
                </Pressable>
              ) : null}

              {snap.found.map((d) => (
                <Pressable
                  key={d.id}
                  onPress={() => connect(d.id)}
                  style={({ pressed }) => [styles.deviceRow, pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel={`Connect to ${d.name}`}>
                  <View style={styles.deviceIcon}>
                    <AppIcon name="watch-outline" size={18} color={Palette.muted} />
                  </View>
                  <View style={styles.deviceText}>
                    <Text style={styles.deviceName} numberOfLines={1}>
                      {d.name}
                    </Text>
                    <Text style={styles.deviceMeta}>
                      {d.rssi != null ? `Signal ${d.rssi} dBm` : 'Nearby'}
                    </Text>
                  </View>
                  <AppIcon name="chevron-forward" size={16} color={Palette.muted} />
                </Pressable>
              ))}

              <Pressable
                onPress={scan}
                disabled={scanning || connecting}
                style={({ pressed }) => [
                  styles.scanBtn,
                  (scanning || connecting) && styles.btnBusy,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Scan for Bluetooth devices">
                {scanning || connecting ? (
                  <ActivityIndicator size="small" color={Palette.forest} />
                ) : (
                  <AppIcon name="bluetooth-outline" size={16} color={Palette.forest} />
                )}
                <Text style={styles.scanBtnText}>
                  {scanning ? 'Scanning…' : connecting ? 'Connecting…' : 'Scan for devices'}
                </Text>
              </Pressable>
            </>
          )}

          {snap.message && !blocked ? (
            <View style={styles.noteRow}>
              <AppIcon
                name="information-circle-outline"
                size={16}
                color={state === 'error' ? Palette.coral : Palette.muted}
              />
              <Text
                style={[styles.noteText, state === 'error' && styles.noteTextError]}>
                {snap.message}
              </Text>
            </View>
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Palette.white,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.space4,
    marginBottom: Spacing.space4,
    gap: Spacing.space3,
  },
  heading: {
    ...Typography.supporting,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    color: Palette.muted,
    letterSpacing: 0.6,
  },
  blurb: {
    ...Typography.supporting,
    color: Palette.muted,
  },

  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space3,
    paddingVertical: Spacing.space2,
    paddingHorizontal: Spacing.space3,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.white,
  },
  deviceIcon: {
    width: 34,
    height: 34,
    borderRadius: Radius.sm,
    backgroundColor: Palette.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceIconOn: {
    width: 34,
    height: 34,
    borderRadius: Radius.sm,
    backgroundColor: Palette.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceText: {
    flex: 1,
  },
  deviceName: {
    ...Typography.bodyBold,
    color: Palette.ink,
  },
  deviceMeta: {
    ...Typography.supporting,
    color: Palette.muted,
  },

  connectedBlock: {
    gap: Spacing.space3,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.space3,
    borderRadius: Radius.sm,
    backgroundColor: Palette.surfaceHighlight,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: Palette.border,
  },
  statValue: {
    ...Typography.stats,
    fontSize: 24,
    lineHeight: 30,
    color: Palette.forest,
  },
  statLabel: {
    ...Typography.supporting,
    color: Palette.muted,
  },
  footNote: {
    ...Typography.supporting,
    color: Palette.muted,
  },

  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.space2,
    paddingVertical: 13,
    borderRadius: Radius.btn,
    backgroundColor: Palette.lime,
  },
  btnBusy: {
    opacity: 0.7,
  },
  scanBtnText: {
    ...Typography.bodyBold,
    color: Palette.forest,
  },
  smallBtn: {
    paddingHorizontal: Spacing.space3,
    paddingVertical: 7,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  smallBtnText: {
    ...Typography.supporting,
    fontFamily: FontFamily.medium,
    color: Palette.ink,
  },

  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.space2,
    padding: Spacing.space3,
    borderRadius: Radius.sm,
    backgroundColor: Palette.surfaceSubtle,
  },
  noteText: {
    ...Typography.supporting,
    color: Palette.muted,
    flex: 1,
  },
  noteTextError: {
    color: Palette.coral,
  },
  pressed: {
    opacity: 0.75,
  },
});
