export type DeviceRole = 'host' | 'accessory';

export type AccessoryType = 
  | 'all_in_one'
  | 'mouse_keyboard'
  | 'touchpad'
  | 'gyro_mouse'
  | 'keyboard'
  | 'speaker'
  | 'extra_monitor';

export type ConnectionProtocol = 'webrtc_lan' | 'firebase_relay' | 'local_mesh' | 'usb_cable';

export interface DeviceInfo {
  id: string;
  name: string;
  type: 'pc' | 'phone' | 'tablet';
  browser: string;
  os: string;
}

export interface PairingSessionData {
  sessionId: string;
  code: string;
  hostUserId: string;
  hostDeviceId: string;
  hostName: string;
  accessoryDeviceId?: string;
  accessoryName?: string;
  accessoryType?: AccessoryType;
  status: 'waiting' | 'connected' | 'terminated';
  permissionsGranted: boolean;
  createdAt: string;
  updatedAt: string;
}

export type RemoteCommandType =
  | 'MOUSE_MOVE'
  | 'MOUSE_CLICK'
  | 'MOUSE_DOUBLE_CLICK'
  | 'MOUSE_DOWN'
  | 'MOUSE_UP'
  | 'MOUSE_SCROLL'
  | 'KEY_DOWN'
  | 'KEY_UP'
  | 'TEXT_INPUT'
  | 'HOTKEY'
  | 'MEDIA_CONTROL'
  | 'AUDIO_STREAM_START'
  | 'AUDIO_STREAM_STOP'
  | 'AUDIO_PLAY_TONE'
  | 'SCREEN_REQUEST'
  | 'SCREEN_STREAM_OFFER'
  | 'PERMISSION_REQUEST'
  | 'PERMISSION_RESPONSE'
  | 'BATTERY_STATUS'
  | 'PING'
  | 'PONG';

export interface RemoteCommand {
  id: string;
  type: RemoteCommandType;
  timestamp: number;
  payload: {
    // Mouse
    dx?: number;
    dy?: number;
    x?: number; // Normalized 0-1
    y?: number; // Normalized 0-1
    button?: 'left' | 'right' | 'middle';
    deltaY?: number;
    deltaX?: number;
    
    // Keyboard
    key?: string;
    code?: string;
    ctrlKey?: boolean;
    altKey?: boolean;
    shiftKey?: boolean;
    metaKey?: boolean;
    text?: string;
    action?: string;

    // Audio
    frequency?: number;
    typeAudio?: 'sine' | 'square' | 'sawtooth' | 'beep' | 'alert' | 'notification' | 'click' | 'laser' | 'sub_bass';
    volume?: number;
    duration?: number;

    // Screen
    streamQuality?: 'low' | 'balanced' | 'high';
    fps?: number;

    // Battery & Device Health
    batteryLevel?: number; // 0 - 100
    isCharging?: boolean;
    chargingTime?: number;
    dischargingTime?: number;

    // Generic
    granted?: boolean;
    accessoryType?: AccessoryType;
    message?: string;
  };
}

export interface AccessoryBatteryInfo {
  level: number;
  isCharging: boolean;
  lastUpdated: number;
}

export interface LatencyStats {
  rtt: number;
  protocol: ConnectionProtocol;
  packetsSent: number;
  packetsReceived: number;
  lastPing: number;
}

export interface DevicePermissions {
  gyroscope: 'prompt' | 'granted' | 'denied' | 'unsupported';
  camera: 'prompt' | 'granted' | 'denied' | 'unsupported';
  microphone: 'prompt' | 'granted' | 'denied' | 'unsupported';
  remoteControl: 'prompt' | 'granted' | 'denied';
}
