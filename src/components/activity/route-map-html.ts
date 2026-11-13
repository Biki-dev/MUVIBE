/**
 * Self-contained Leaflet page that draws the session route over
 * OpenStreetMap tiles. Shared by the native WebView and the web iframe.
 *
 * The host pushes updates by calling `window.updateRoute(json)` inside
 * the page, so the tiles load once and only the polyline changes.
 *
 * OSM tile usage policy: fine for a prototype at this volume. Switch to a
 * tile provider with an API key before any public release.
 */
import { GeoPoint } from '@/services/sensors';

export interface RouteMapPayload {
  route: GeoPoint[];
  position: GeoPoint | null;
  follow: boolean;
}

export const ROUTE_MAP_COLORS = {
  line: '#18352D',
  lineCasing: '#C5F36B',
  marker: '#C5F36B',
  markerRing: '#18352D',
};

export function buildRouteMapHtml(): string {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  html, body, #map { margin: 0; padding: 0; height: 100%; width: 100%; background: #EDF1E9; }
  .leaflet-control-attribution { font-size: 9px; }
  .you {
    width: 16px; height: 16px; border-radius: 50%;
    background: ${ROUTE_MAP_COLORS.marker};
    border: 3px solid ${ROUTE_MAP_COLORS.markerRing};
    box-shadow: 0 0 0 4px rgba(197,243,107,0.35);
  }
</style>
</head>
<body>
<div id="map"></div>
<script>
  var map = L.map('map', { zoomControl: false, attributionControl: true });
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  // Default view until the first fix arrives: Guwahati, where the campus is.
  map.setView([26.1445, 91.7362], 13);

  var casing = L.polyline([], { color: '${ROUTE_MAP_COLORS.lineCasing}', weight: 9, opacity: 0.9, lineJoin: 'round' }).addTo(map);
  var line = L.polyline([], { color: '${ROUTE_MAP_COLORS.line}', weight: 4, opacity: 1, lineJoin: 'round' }).addTo(map);
  var you = L.marker([26.1445, 91.7362], {
    icon: L.divIcon({ className: '', html: '<div class="you"></div>', iconSize: [16, 16], iconAnchor: [8, 8] })
  }).addTo(map);
  var centred = false;

  window.updateRoute = function (json) {
    try {
      var data = typeof json === 'string' ? JSON.parse(json) : json;
      var pts = (data.route || []).map(function (p) { return [p.latitude, p.longitude]; });
      casing.setLatLngs(pts);
      line.setLatLngs(pts);

      var pos = data.position;
      if (pos) {
        you.setLatLng([pos.latitude, pos.longitude]);
        if (!centred) {
          map.setView([pos.latitude, pos.longitude], 17);
          centred = true;
        } else if (data.follow) {
          map.panTo([pos.latitude, pos.longitude], { animate: true });
        }
      }
    } catch (e) {}
  };

  // Let the host know the page can accept updates.
  if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage('ready');
  window.parent && window.parent.postMessage('route-map-ready', '*');
</script>
</body>
</html>`;
}
