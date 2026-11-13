import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Palette, Radius } from '@/constants/theme';
import { buildRouteMapHtml, RouteMapPayload } from './route-map-html';

/**
 * Route map, web. Same Leaflet page as native, hosted in an iframe.
 * Browser geolocation feeds it through the same sensor tracker.
 */
export function RouteMap({ route, position, follow }: RouteMapPayload) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  const html = useMemo(() => buildRouteMapHtml(), []);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.data === 'route-map-ready') setReady(true);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const win = frameRef.current?.contentWindow as
      | (Window & { updateRoute?: (json: string) => void })
      | null
      | undefined;
    win?.updateRoute?.(JSON.stringify({ route, position, follow }));
  }, [ready, route, position, follow]);

  return (
    <View style={styles.wrap}>
      <iframe
        ref={frameRef}
        title="Route map"
        srcDoc={html}
        style={{ border: 0, width: '100%', height: '100%', display: 'block' }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 220,
    borderRadius: Radius.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.surfaceSubtle,
  },
});
