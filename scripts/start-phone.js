/**
 * scripts/start-phone.js
 * ─────────────────────────────────────────────────────────────────
 * Starts the Expo dev server with the LAN address the phone can
 * actually reach.
 *
 * Why this exists: with a VPN running (Cloudflare WARP, for example)
 * Expo can pick the wrong network interface and advertise
 * http://127.0.0.1:8081 in the QR code. The phone then tries to connect
 * to itself and Expo Go reports that it cannot open the project, even
 * though the server is running and reachable.
 *
 * This picks the real LAN IPv4, skipping loopback and the usual VPN
 * ranges, and pins it with EXPO_PACKAGER_PROXY_URL.
 *
 *   node scripts/start-phone.js            port 8081
 *   node scripts/start-phone.js 8099       another port
 *
 * If it still will not connect, the network is probably blocking
 * device-to-device traffic. Use a tunnel instead:
 *   npx expo start --tunnel
 * ─────────────────────────────────────────────────────────────────
 */
const os = require('os');
const http = require('http');
const { spawn } = require('child_process');

const PORT = process.argv[2] || '8081';
/** Where server/index.js listens. */
const SOCKET_PORT = process.env.BLITZ_SOCKET_PORT || '3001';

/** Interfaces that exist but are not reachable from a phone on the Wi-Fi. */
function isVirtual(name, address) {
  const n = name.toLowerCase();
  if (/warp|cloudflare|vmware|virtualbox|vethernet|hyper-v|loopback|docker|wsl|tailscale|zerotier/.test(n)) {
    return true;
  }
  // WARP hands out 172.16.0.x; Docker and friends live in 172.17+.
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(address)) return true;
  return false;
}

function findLanIp() {
  const ifaces = os.networkInterfaces();
  const candidates = [];

  for (const [name, addrs] of Object.entries(ifaces)) {
    for (const a of addrs || []) {
      if (a.family !== 'IPv4' || a.internal) continue;
      if (a.address.startsWith('169.254.')) continue; // link-local
      if (isVirtual(name, a.address)) continue;
      // Prefer Wi-Fi, then Ethernet, then anything else.
      const rank = /wi-?fi|wlan/i.test(name) ? 0 : /ethernet|eth/i.test(name) ? 1 : 2;
      candidates.push({ name, address: a.address, rank });
    }
  }

  candidates.sort((a, b) => a.rank - b.rank);
  return candidates[0] || null;
}

const lan = findLanIp();

if (!lan) {
  console.error('\nNo usable LAN address found. Every interface looked virtual.');
  console.error('Turn the VPN off, or run:  npx expo start --tunnel\n');
  process.exit(1);
}

const url = `http://${lan.address}:${PORT}`;

// Blitz private rooms talk to server/index.js. The phone cannot reach
// it on localhost, so point the app at the same LAN address the dev
// server is using. An explicit EXPO_PUBLIC_SOCKET_URL still wins, for
// when the match server lives somewhere else.
const socketUrl =
  process.env.EXPO_PUBLIC_SOCKET_URL || `http://${lan.address}:${SOCKET_PORT}`;

console.log(`\nServing to phones at ${url}  (interface: ${lan.name})`);
console.log(`Blitz match server      ${socketUrl}`);
console.log('Scan the QR code with Expo Go. Phone and PC must share the Wi-Fi.\n');

// Say so up front if the match server is down: the Blitz room screen
// would otherwise just sit there failing to connect.
http
  .get(`${socketUrl}/health`, { timeout: 2000 }, (res) => {
    if (res.statusCode === 200) console.log('Match server is up.\n');
    res.resume();
  })
  .on('error', () => {
    console.log('Match server is NOT running. Private rooms will not connect.');
    console.log('Start it in another terminal:  npm run server\n');
  })
  .on('timeout', function () {
    this.destroy();
  });

// --go forces Expo Go mode. Without it the CLI defaults to development
// build mode and prints an exp+muvibe:// deep link, which Expo Go cannot
// open, so the project simply never appears on the phone.
const child = spawn('npx', ['expo', 'start', '--go', '--port', PORT], {
  cwd: require('path').join(__dirname, '..'),
  env: {
    ...process.env,
    EXPO_PACKAGER_PROXY_URL: url,
    EXPO_PUBLIC_SOCKET_URL: socketUrl,
  },
  stdio: 'inherit',
  shell: true,
});

child.on('exit', (code) => process.exit(code === null ? 1 : code));
