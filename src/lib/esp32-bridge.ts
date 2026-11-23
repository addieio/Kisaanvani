// ESP32-C6 Web Bluetooth & Web Serial Communication Bridge
// Connects to "KRISHI-AGRO-C6" via Web Bluetooth (BLE) or USB-C Web Serial API
// Includes realistic Simulated Fallback for browsers or offline demos.

import { ESP32DeviceState, ESP32ConnectionType, SensorReading } from './types';
import { soundFX } from './audio-effects';

// Nordic UART Service (NUS) UUIDs
export const BLE_SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
export const BLE_RX_UUID = '6e400002-b5a3-f393-e0a9-e50e24dcca9e'; // Phone/Web -> ESP32 Write
export const BLE_TX_UUID = '6e400003-b5a3-f393-e0a9-e50e24dcca9e'; // ESP32 -> Phone/Web Notify

type StateChangeCallback = (state: ESP32DeviceState) => void;
type TelemetryCallback = (telemetry: Partial<SensorReading>) => void;

class ESP32Bridge {
  private state: ESP32DeviceState = {
    status: 'DISCONNECTED',
    connectionType: 'NONE',
    deviceName: null,
    rssi: null,
    batteryPct: 94,
    lastSyncTime: null,
    lastCommandSent: null,
    activeOledAlert: null,
  };

  private stateSubscribers: Set<StateChangeCallback> = new Set();
  private telemetrySubscribers: Set<TelemetryCallback> = new Set();

  // Web Bluetooth handles
  private bluetoothDevice: any = null;
  private gattServer: any = null;
  private rxCharacteristic: any = null;
  private txCharacteristic: any = null;

  // Web Serial handles
  private serialPort: any = null;
  private serialReader: any = null;
  private serialWriter: any = null;
  private serialKeepReading: boolean = false;

  // Simulation timer
  private simTimer: any = null;
  private oledAlertTimer: any = null;

  constructor() {}

  public getState(): ESP32DeviceState {
    return { ...this.state };
  }

  public subscribeState(cb: StateChangeCallback): () => void {
    this.stateSubscribers.add(cb);
    cb(this.getState());
    return () => this.stateSubscribers.delete(cb);
  }

  public subscribeTelemetry(cb: TelemetryCallback): () => void {
    this.telemetrySubscribers.add(cb);
    return () => this.telemetrySubscribers.delete(cb);
  }

  private notifyState(patch?: Partial<ESP32DeviceState>) {
    if (patch) {
      this.state = { ...this.state, ...patch };
    }
    const current = this.getState();
    this.stateSubscribers.forEach((cb) => cb(current));
  }

  private notifyTelemetry(partial: Partial<SensorReading>) {
    this.telemetrySubscribers.forEach((cb) => cb(partial));
  }

  // ---------------------------------------------------------------------------
  // 1. Web Bluetooth (BLE) Connection
  // ---------------------------------------------------------------------------
  public async connectBluetooth(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    const nav = navigator as any;

    if (!nav.bluetooth) {
      console.warn('[ESP32Bridge] Web Bluetooth is not supported in this browser. Falling back to Simulated Link.');
      return this.connectSimulated();
    }

    try {
      this.notifyState({ status: 'SCANNING', connectionType: 'BLE' });
      soundFX.click();

      // Request device with name "KRISHI-AGRO-C6" or with Nordic UART service
      const device = await nav.bluetooth.requestDevice({
        filters: [
          { name: 'KRISHI-AGRO-C6' },
          { namePrefix: 'KRISHI' },
          { services: [BLE_SERVICE_UUID] },
        ],
        optionalServices: [BLE_SERVICE_UUID, 'battery_service'],
      });

      this.bluetoothDevice = device;
      this.notifyState({ status: 'CONNECTING', deviceName: device.name || 'KRISHI-AGRO-C6' });

      device.addEventListener('gattserverdisconnected', () => {
        this.handleDisconnect('Bluetooth disconnected unexpectedly');
      });

      const server = await device.gatt.connect();
      this.gattServer = server;

      const service = await server.getPrimaryService(BLE_SERVICE_UUID);
      this.rxCharacteristic = await service.getCharacteristic(BLE_RX_UUID);
      this.txCharacteristic = await service.getCharacteristic(BLE_TX_UUID);

      // Start notifications from ESP32
      await this.txCharacteristic.startNotifications();
      this.txCharacteristic.addEventListener('characteristicvaluechanged', (event: any) => {
        const value = event.target.value;
        const decoder = new TextDecoder('utf-8');
        const text = decoder.decode(value);
        this.parseIncomingData(text);
      });

      soundFX.connectedChime();
      this.notifyState({
        status: 'CONNECTED',
        connectionType: 'BLE',
        deviceName: device.name || 'KRISHI-AGRO-C6',
        rssi: -54,
        batteryPct: 92,
        lastSyncTime: new Date().toLocaleTimeString('en-IN'),
      });

      return true;
    } catch (err: any) {
      console.warn('[ESP32Bridge] BLE connection cancelled or failed:', err);
      if (err.name === 'NotFoundError') {
        // User cancelled scan prompt
        this.notifyState({ status: 'DISCONNECTED', connectionType: 'NONE' });
      } else {
        // Fall back to simulation if hardware not in range
        return this.connectSimulated();
      }
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // 2. Web Serial (USB-C Cable) Connection
  // ---------------------------------------------------------------------------
  public async connectSerial(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    const nav = navigator as any;

    if (!nav.serial) {
      console.warn('[ESP32Bridge] Web Serial not supported. Connecting simulated.');
      return this.connectSimulated();
    }

    try {
      this.notifyState({ status: 'SCANNING', connectionType: 'SERIAL' });
      soundFX.click();

      const port = await nav.serial.requestPort();
      await port.open({ baudRate: 115200 });

      this.serialPort = port;
      this.serialWriter = port.writable.getWriter();
      this.serialKeepReading = true;

      soundFX.connectedChime();
      this.notifyState({
        status: 'CONNECTED',
        connectionType: 'SERIAL',
        deviceName: 'ESP32-C6 (USB-C COM)',
        rssi: 0,
        batteryPct: 100,
        lastSyncTime: new Date().toLocaleTimeString('en-IN'),
      });

      this.readSerialLoop(port);
      return true;
    } catch (err: any) {
      console.warn('[ESP32Bridge] Serial connect cancelled or failed:', err);
      if (err.name !== 'NotFoundError') {
        return this.connectSimulated();
      }
      this.notifyState({ status: 'DISCONNECTED', connectionType: 'NONE' });
      return false;
    }
  }

  private async readSerialLoop(port: any) {
    const textDecoder = new TextDecoder();
    while (port.readable && this.serialKeepReading) {
      this.serialReader = port.readable.getReader();
      try {
        let buffer = '';
        while (true) {
          const { value, done } = await this.serialReader.read();
          if (done) break;
          buffer += textDecoder.decode(value);
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            this.parseIncomingData(line.trim());
          }
        }
      } catch (err) {
        console.warn('[ESP32Bridge] Serial read loop note:', err);
      } finally {
        this.serialReader.releaseLock();
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 3. Simulated Controller Link (Interactive Mock with realistic sync)
  // ---------------------------------------------------------------------------
  public connectSimulated(): boolean {
    this.notifyState({ status: 'CONNECTING', connectionType: 'SIMULATED', deviceName: 'KRISHI-AGRO-C6 (Simulated)' });
    soundFX.click();

    setTimeout(() => {
      soundFX.connectedChime();
      this.notifyState({
        status: 'CONNECTED',
        connectionType: 'SIMULATED',
        deviceName: 'KRISHI-AGRO-C6 (Active Virtual Link)',
        rssi: -58,
        batteryPct: 94,
        lastSyncTime: new Date().toLocaleTimeString('en-IN'),
      });

      // Periodic simulated telemetry jitter
      if (this.simTimer) clearInterval(this.simTimer);
      this.simTimer = setInterval(() => {
        if (this.state.status === 'CONNECTED' && this.state.connectionType === 'SIMULATED') {
          this.notifyState({
            lastSyncTime: new Date().toLocaleTimeString('en-IN'),
            batteryPct: Math.max(20, this.state.batteryPct - 0.05),
          });
        }
      }, 5000);
    }, 800);

    return true;
  }

  // ---------------------------------------------------------------------------
  // 4. Disconnect
  // ---------------------------------------------------------------------------
  public async disconnect(): Promise<void> {
    soundFX.click();
    if (this.simTimer) clearInterval(this.simTimer);
    if (this.oledAlertTimer) clearTimeout(this.oledAlertTimer);

    if (this.gattServer && this.gattServer.connected) {
      try {
        await this.gattServer.disconnect();
      } catch {}
    }

    if (this.serialPort) {
      try {
        this.serialKeepReading = false;
        if (this.serialReader) await this.serialReader.cancel();
        if (this.serialWriter) await this.serialWriter.close();
        await this.serialPort.close();
      } catch {}
    }

    this.bluetoothDevice = null;
    this.gattServer = null;
    this.rxCharacteristic = null;
    this.txCharacteristic = null;
    this.serialPort = null;

    this.notifyState({
      status: 'DISCONNECTED',
      connectionType: 'NONE',
      deviceName: null,
      rssi: null,
      lastSyncTime: null,
      lastCommandSent: null,
      activeOledAlert: null,
    });
  }

  private handleDisconnect(reason: string) {
    console.log('[ESP32Bridge] Disconnected:', reason);
    this.disconnect();
  }

  // ---------------------------------------------------------------------------
  // 5. Send Command to ESP32 (BLE / Serial / Simulation)
  // ---------------------------------------------------------------------------
  public async sendCommand(cmd: string, alertTitle?: string, alertDetail?: string): Promise<boolean> {
    const rawCmd = cmd.endsWith('\n') ? cmd : cmd + '\n';
    const now = Date.now();

    // Trigger local 5-second OLED Alert Simulator
    const displayTitle = alertTitle || 'APP OVERRIDE';
    const displayDetail = alertDetail || cmd.trim();

    soundFX.alertTone();

    this.triggerLocalOledAlert(displayTitle, displayDetail, 5000);

    this.notifyState({
      lastCommandSent: cmd.trim(),
      lastSyncTime: new Date().toLocaleTimeString('en-IN'),
    });

    // 1. Send via BLE
    if (this.state.connectionType === 'BLE' && this.rxCharacteristic) {
      try {
        const encoder = new TextEncoder();
        const data = encoder.encode(rawCmd);
        await this.rxCharacteristic.writeValue(data);
        console.log('[ESP32Bridge] BLE command sent:', cmd.trim());
        return true;
      } catch (err) {
        console.warn('[ESP32Bridge] BLE write error:', err);
      }
    }

    // 2. Send via Serial
    if (this.state.connectionType === 'SERIAL' && this.serialWriter) {
      try {
        const encoder = new TextEncoder();
        await this.serialWriter.write(encoder.encode(rawCmd));
        console.log('[ESP32Bridge] Serial command sent:', cmd.trim());
        return true;
      } catch (err) {
        console.warn('[ESP32Bridge] Serial write error:', err);
      }
    }

    // 3. Simulated Link
    if (this.state.connectionType === 'SIMULATED') {
      console.log('[ESP32Bridge] (Simulated) ESP32-C6 received:', cmd.trim());
      return true;
    }

    return false;
  }

  // ---------------------------------------------------------------------------
  // 5-Second OLED Alert State Manager
  // ---------------------------------------------------------------------------
  public triggerLocalOledAlert(title: string, detail: string, durationMs: number = 5000) {
    if (this.oledAlertTimer) clearTimeout(this.oledAlertTimer);

    const expiresAt = Date.now() + durationMs;
    this.notifyState({
      activeOledAlert: {
        title,
        detail,
        expiresAt,
      },
    });

    this.oledAlertTimer = setTimeout(() => {
      this.notifyState({ activeOledAlert: null });
    }, durationMs);
  }

  // ---------------------------------------------------------------------------
  // Parsing Inbound Telemetry from ESP32
  // ---------------------------------------------------------------------------
  private parseIncomingData(line: string) {
    if (!line) return;

    // Example 1: TELEM:54,28.5,58.0,1
    if (line.startsWith('TELEM:')) {
      const parts = line.substring(6).split(',');
      if (parts.length >= 4) {
        const moist = parseFloat(parts[0]);
        const temp = parseFloat(parts[1]);
        const hum = parseFloat(parts[2]);
        const pump = parseInt(parts[3]) === 1;
        this.notifyTelemetry({
          moisture: isNaN(moist) ? undefined : moist,
          air_temp: isNaN(temp) ? undefined : temp,
          pump_relay_state: pump,
        });
      }
    }
    // Example 2: [SOIL D1] ADC=... | Voltage=... | Moist= 54%
    else if (line.includes('Moist=')) {
      const match = line.match(/Moist=\s*(\d+)%/);
      if (match && match[1]) {
        const m = parseInt(match[1]);
        this.notifyTelemetry({ moisture: m });
      }
    }
    // Example 3: [CALL_REQ:TWILIO_EXPERT]
    else if (line.includes('CALL_REQ:TWILIO_EXPERT')) {
      console.log('[ESP32Bridge] Twilio Call request received from ESP32 hardware button!');
      soundFX.alertTone();
      window.dispatchEvent(new CustomEvent('esp32:twilio-call-requested'));
    }
  }

  // ---------------------------------------------------------------------------
  // High-Level Helper Commands
  // ---------------------------------------------------------------------------
  public async sendMoisture(pct: number): Promise<boolean> {
    const val = Math.round(pct);
    return this.sendCommand(`SET:MOIST=${val}`, 'APP: MOIST SET', `MOISTURE -> ${val}%`);
  }

  public async sendNPK(n: number, p: number, k: number, ph?: number): Promise<boolean> {
    const phVal = ph ? ph.toFixed(1) : '6.8';
    return this.sendCommand(
      `SET:NPK=${Math.round(n)},${Math.round(p)},${Math.round(k)},${phVal}`,
      'APP: NPK UPDATE',
      `N${Math.round(n)} P${Math.round(p)} K${Math.round(k)}`
    );
  }

  public async sendPump(active: boolean): Promise<boolean> {
    return this.sendCommand(
      `SET:PUMP=${active ? 1 : 0}`,
      'APP: PUMP CMD',
      active ? 'PUMP: [ACTIVE ON]' : 'PUMP: [STOPPED/IDLE]'
    );
  }

  public async sendCallExpert(): Promise<boolean> {
    return this.sendCommand('CMD:CALL_EXPERT', 'TWILIO CALL', 'CALLING DR. SHARMA');
  }

  public async sendReZero(): Promise<boolean> {
    return this.sendCommand('CMD:REZERO', 'RE-ZERO CALIB', 'BASELINE 0% SET');
  }
}

export const esp32Bridge = new ESP32Bridge();

