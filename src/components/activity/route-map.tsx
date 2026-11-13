import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView as RNWebView } from 'react-native-webview';
import type { WebViewMessageEvent } from 'react-native-webview';
import { Palette, Radius } from '@/constants/theme';
import { buildRouteMapHtml, RouteMapPayload } from './route-map-html';

// react-native-webview 14 ships class-component typings that collapse to
// `never` under React 19's types. The runtime component is fine; only the
// declaration is behind, so it is widened here in one place.
const WebView = RNWebView as unknown as React.ComponentType<
  Record<string, unknown> & { ref?: React.Ref<WebViewHandle> }
>;

interface WebViewHandle {
  injectJavaScript: (script: string) => void;
}

/**
 * Route map, native. Leaflet over OpenStreetMap inside a WebView, so it
 * needs no Google Maps key on Android. Route updates are pushed into the
 * page rather than reloading it.
 */
export function RouteMap({ route, position, follow }: RouteMapPayload) {
  const webRef = useRef<WebViewHandle>(null);
  const [ready, setReady] = useState(false);
  const html = useMemo(() => buildRouteMapHtml(), []);

  useEffect(() => {
    if (!ready) return;
    const payload = JSON.stringify({ route, position, follow });
    webRef.current?.injectJavaScript(
      `window.updateRoute(${JSON.stringify(payload)}); true;`
    );
  }, [ready, route, position, follow]);

  return (
    <View style={styles.wrap}>
      <WebView
        ref={webRef}
        originWhitelist={['*']}
        source={{ html }}
        onMessage={(e: WebViewMessageEvent) => {
          if (e.nativeEvent.data === 'ready') setReady(true);
        }}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        style={styles.web}
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
  web: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
