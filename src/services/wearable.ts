/**
 * src/services/wearable.ts
 * ─────────────────────────────────────────────────────────────────
 * Bluetooth Low Energy link to a fitness watch or band.
 *
 * Reads the two standard GATT services that almost every tracker
 * exposes, so this works with a generic device rather than only with
 * one vendor's SDK:
 *
 *   Heart Rate  0x180D / 0x2A37   live bpm notifications
 *   Battery     0x180F / 0x2A19   battery level, read once
 *
 * Step count has no standard BLE characteristic. Vendors each use
 * their own, so steps still come from the phone's own pedometer in
 * services/sensors.ts, and this file does not pretend otherwise.
 *
 * BLE needs native code, so it cannot run in Expo Go or on web. Both
 * are detected up front and reported as a state the UI can explain,
 * rather than failing at the first call.
 * ─────────────────────────────────────────────────────────────────
 */
import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

/** Standard Bluetooth SIG assigned numbers, in the full UUID form. */
const HEART_RATE_SERVICE = '0000180d-0000-1000-8000-00805f9b34fb';
const HEART_RATE_MEASUREMENT = '00002a37-0000-1000-8000-00805f9b34fb';
const BATTERY_SERVICE = '0000180f-0000-1000-8000-00805f9b34fb';
const BATTERY_LEVEL = '00002a19-0000-1000-8000-00805f9b34fb';

const STORAGE_KEY = 'muvibe:wearable:last-device';
const SCAN_TIMEOUT_MS = 12000;

const IS_EXPO_GO =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export type WearableState =
  | 'idle'
  | 'unsupported'
  /** Expo Go has no BLE native module: a development build is needed. */
  | 'needs-dev-build'
  | 'bluetooth-off'
  | 'denied'
  | 'scanning'
  | 'connecting'
  | 'connected'
  | 'error';

export interface WearableDevice {
  id: string;
  name: string;
  /** Signal strength, dBm. Closer to 0 is nearer. */
  rssi: number | null;
}

export interface WearableReading {
  heartRate: number | null;
  batteryLevel: number | null;
  updatedAt: number | null;
}

export interface WearableSnapshot {
  state: WearableState;
  device: WearableDevice | null;
  reading: WearableReading;
  /** Devices seen during the current or last scan. */
  found: WearableDevice[];
  message: string | null;
}

const EMPTY_READING: WearableReading = {
  heartRate: null,
  batteryLevel: null,
  updatedAt: null,
};

/**
 * The BLE module is loaded lazily and defensively.
 *
 * Importing react-native-ble-plx at module scope throws in Expo Go and
 * on web, which would take down any screen that merely imports this
 * file. Requiring it only when BLE is actually usable keeps the
 * Settings screen renderable everywhere.
 */
function loadBleManager(): any | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { BleManager } = require('react-native-ble-plx');
    return new BleManager();
  } catch {
    return null;
  }
}

/** Why BLE cannot be used here, or null when it can. */
export function bleUnavailableReason(): WearableState | null {
  if (Platform.OS === 'web') return 'unsupported';
  if (IS_EXPO_GO) return 'needs-dev-build';
  return null;
}

/** Heart rate measurement, per the Bluetooth SIG layout. */
function parseHeartRate(base64: string | null): number | null {
  if (!base64) return null;
  try {
    const bytes = Uint8Array.from(
      // atob exists in React Native's Hermes runtime and in browsers.
      atob(base64),
      (c) => c.charCodeAt(0)
    );
    if (bytes.length < 2) return null;
    // Bit 0 of the flags byte says whether bpm is 8 or 16 bit.
    const isSixteenBit = (bytes[0] & 0x01) === 1;
    return isSixteenBit ? bytes[1] | (bytes[2] << 8) : bytes[1];
  } catch {
    return null;
  }
}

function parseBattery(base64: string | null): number | null {
  if (!base64) return null;
  try {
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    return bytes.length ? bytes[0] : null;
  } catch {
    return null;
  }
}

/**
 * The snapshot a screen can render before any link exists.
 *
 * Pure, so a component can seed its state with it instead of
 * constructing a WearableLink and reading it back inside an effect.
 */
export function initialWearableSnapshot(): WearableSnapshot {
  const reason = bleUnavailableReason();
  return {
    state: reason ?? 'idle',
    device: null,
    reading: { ...EMPTY_READING },
    found: [],
    message: reason === 'unsupported'
      ? 'Bluetooth is not available in a browser. Open MUVIBE on your phone.'
      : reason === 'needs-dev-build'
        ? 'Bluetooth needs a development build. Expo Go cannot load the BLE module.'
        : null,
  };
}

export class WearableLink {
  private manager: any | null = null;
  private connected: any | null = null;
  private hrSubscription: { remove: () => void } | null = null;
  private scanTimer: ReturnType<typeof setTimeout> | null = null;

  private snapshot: WearableSnapshot = {
    state: 'idle',
    device: null,
    reading: { ...EMPTY_READING },
    found: [],
    message: null,
  };

  constructor(private readonly onUpdate: (snap: WearableSnapshot) => void) {
    this.snapshot = initialWearableSnapshot();
  }

  getSnapshot(): WearableSnapshot {
    return { ...this.snapshot, found: [...this.snapshot.found] };
  }

  private patch(next: Partial<WearableSnapshot>) {
    this.snapshot = { ...this.snapshot, ...next };
    this.onUpdate(this.getSnapshot());
  }

  /** Scans for nearby devices advertising the heart rate service. */
  async scan(): Promise<void> {
    const reason = bleUnavailableReason();
    if (reason) return;

    if (!this.manager) this.manager = loadBleManager();
    if (!this.manager) {
      this.patch({
        state: 'error',
        message: 'The Bluetooth module failed to load. Rebuild the app and try again.',
      });
      return;
    }

    this.patch({ state: 'scanning', found: [], message: null });

    try {
      const state = await this.manager.state();
      if (state !== 'PoweredOn') {
        this.patch({
          state: 'bluetooth-off',
          message: 'Turn Bluetooth on, then scan again.',
        });
        return;
      }
    } catch {
      // An older platform may not answer; carry on and let the scan fail.
    }

    const seen = new Map<string, WearableDevice>();

    this.manager.startDeviceScan(
      [HEART_RATE_SERVICE],
      { allowDuplicates: false },
      (error: any, device: any) => {
        if (error) {
          this.stopScan();
          this.patch({
            // A scan refusal on Android is almost always the runtime
            // permission prompt being declined.
            state: error?.reason?.includes('permission') ? 'denied' : 'error',
            message: error?.message ?? 'Scan failed.',
          });
          return;
        }
        if (!device?.id || seen.has(device.id)) return;
        seen.set(device.id, {
          id: device.id,
          name: device.name || device.localName || 'Unnamed device',
          rssi: typeof device.rssi === 'number' ? device.rssi : null,
        });
        this.patch({ found: [...seen.values()] });
      }
    );

    // Scanning is expensive, so it always stops on its own.
    this.scanTimer = setTimeout(() => {
      this.stopScan();
      this.patch({
        state: this.snapshot.device ? 'connected' : 'idle',
        message: seen.size === 0 ? 'No heart rate devices found nearby.' : null,
      });
    }, SCAN_TIMEOUT_MS);
  }

  stopScan() {
    if (this.scanTimer) {
      clearTimeout(this.scanTimer);
      this.scanTimer = null;
    }
    try {
      this.manager?.stopDeviceScan();
    } catch {
      // Already stopped.
    }
  }

  /** Connects, then subscribes to heart rate and reads the battery. */
  async connect(deviceId: string): Promise<void> {
    if (bleUnavailableReason() || !this.manager) return;
    this.stopScan();
    this.patch({ state: 'connecting', message: null });

    try {
      const device = await this.manager.connectToDevice(deviceId, { timeout: 10000 });
      await device.discoverAllServicesAndCharacteristics();
      this.connected = device;

      const named: WearableDevice = {
        id: device.id,
        name: device.name || 'Fitness device',
        rssi: null,
      };
      this.patch({ state: 'connected', device: named });
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(named)).catch(() => {});

      // Live heart rate.
      this.hrSubscription = device.monitorCharacteristicForService(
        HEART_RATE_SERVICE,
        HEART_RATE_MEASUREMENT,
        (error: any, characteristic: any) => {
          if (error || !characteristic) return;
          const bpm = parseHeartRate(characteristic.value);
          if (bpm == null) return;
          this.patch({
            reading: {
              ...this.snapshot.reading,
              heartRate: bpm,
              updatedAt: Date.now(),
            },
          });
        }
      );

      // Battery, read once. Plenty of devices do not expose it.
      try {
        const c = await device.readCharacteristicForService(
          BATTERY_SERVICE,
          BATTERY_LEVEL
        );
        const level = parseBattery(c?.value ?? null);
        if (level != null) {
          this.patch({ reading: { ...this.snapshot.reading, batteryLevel: level } });
        }
      } catch {
        // No battery service: leave it null rather than guessing.
      }

      // A watch that walks out of range should not look connected.
      device.onDisconnected(() => {
        this.patch({
          state: 'idle',
          device: null,
          reading: { ...EMPTY_READING },
          message: 'Device disconnected.',
        });
      });
    } catch (error: any) {
      this.patch({
        state: 'error',
        message: error?.message ?? 'Could not connect to that device.',
      });
    }
  }

  async disconnect(): Promise<void> {
    this.hrSubscription?.remove();
    this.hrSubscription = null;
    try {
      if (this.connected) await this.connected.cancelConnection();
    } catch {
      // Already gone.
    }
    this.connected = null;
    await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
    this.patch({
      state: 'idle',
      device: null,
      reading: { ...EMPTY_READING },
      message: null,
    });
  }

  /** The last device paired on this phone, for showing before a scan. */
  static async lastDevice(): Promise<WearableDevice | null> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as WearableDevice) : null;
    } catch {
      return null;
    }
  }

  destroy() {
    this.stopScan();
    this.hrSubscription?.remove();
    this.hrSubscription = null;
    try {
      this.connected?.cancelConnection();
      this.manager?.destroy();
    } catch {
      // Nothing to tidy.
    }
    this.manager = null;
  }
}
