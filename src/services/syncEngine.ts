import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  onSnapshot, 
  updateDoc, 
  serverTimestamp,
  query,
  orderBy,
  limit,
  where,
  getDocs,
  getDoc
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { 
  DeviceInfo, 
  PairingSessionData, 
  RemoteCommand, 
  ConnectionProtocol, 
  LatencyStats, 
  AccessoryType,
  AccessoryBatteryInfo
} from '../types/sync';

// WebRTC ICE Servers (STUN for LAN/P2P NAT traversal)
const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export class SyncEngine {
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private currentSessionId: string | null = null;
  private unsubscribeSession: (() => void) | null = null;
  private unsubscribeSignals: (() => void) | null = null;
  private onCommandCallback: ((cmd: RemoteCommand) => void) | null = null;
  private onStatusChangeCallback: ((status: 'idle' | 'waiting' | 'connected' | 'disconnected', protocol: ConnectionProtocol) => void) | null = null;
  private onLatencyUpdateCallback: ((stats: LatencyStats) => void) | null = null;
  private onRemoteStreamCallback: ((stream: MediaStream) => void) | null = null;
  private onBatteryUpdateCallback: ((info: AccessoryBatteryInfo) => void) | null = null;
  
  private packetsSent = 0;
  private packetsReceived = 0;
  private pingInterval: number | null = null;
  private activeProtocol: ConnectionProtocol = 'firebase_relay';
  private localStream: MediaStream | null = null;

  public getDeviceInfo(): DeviceInfo {
    const ua = navigator.userAgent;
    const isMobile = /Android|iPhone|iPad|iPod/i.test(ua);
    const isTablet = /iPad|Tablet/i.test(ua);
    
    let os = 'Unknown OS';
    if (/Windows/i.test(ua)) os = 'Windows';
    else if (/Mac/i.test(ua)) os = 'macOS';
    else if (/Android/i.test(ua)) os = 'Android';
    else if (/iPhone|iPad/i.test(ua)) os = 'iOS';
    else if (/Linux/i.test(ua)) os = 'Linux';

    let browser = 'Browser';
    if (/Chrome/i.test(ua)) browser = 'Chrome';
    else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
    else if (/Firefox/i.test(ua)) browser = 'Firefox';
    else if (/Edge/i.test(ua)) browser = 'Edge';

    const id = localStorage.getItem('syncpulse_device_id') || `dev_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem('syncpulse_device_id', id);

    let defaultName = `${os} (${browser})`;
    if (isMobile) defaultName = `Celular ${os}`;

    return {
      id,
      name: defaultName,
      type: isTablet ? 'tablet' : isMobile ? 'phone' : 'pc',
      browser,
      os,
    };
  }

  public setCallbacks(handlers: {
    onCommand: (cmd: RemoteCommand) => void;
    onStatusChange: (status: 'idle' | 'waiting' | 'connected' | 'disconnected', protocol: ConnectionProtocol) => void;
    onLatencyUpdate: (stats: LatencyStats) => void;
    onRemoteStream?: (stream: MediaStream) => void;
    onBatteryUpdate?: (info: AccessoryBatteryInfo) => void;
  }) {
    this.onCommandCallback = handlers.onCommand;
    this.onStatusChangeCallback = handlers.onStatusChange;
    this.onLatencyUpdateCallback = handlers.onLatencyUpdate;
    if (handlers.onRemoteStream) {
      this.onRemoteStreamCallback = handlers.onRemoteStream;
    }
    if (handlers.onBatteryUpdate) {
      this.onBatteryUpdateCallback = handlers.onBatteryUpdate;
    }
  }

  // 1. HOST: Create a pairing session
  public async createHostSession(userId: string, hostName: string): Promise<{ sessionId: string; code: string }> {
    this.cleanup();
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const sessionId = `ses_${code}`;
    const dev = this.getDeviceInfo();

    const sessionData: PairingSessionData = {
      sessionId,
      code,
      hostUserId: userId,
      hostDeviceId: dev.id,
      hostName: hostName || dev.name,
      status: 'waiting',
      permissionsGranted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'pairingSessions', sessionId), sessionData);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `pairingSessions/${sessionId}`);
    }

    this.currentSessionId = sessionId;
    this.listenToSession(sessionId, true);
    return { sessionId, code };
  }

  // 2. ACCESSORY: Join by 6-digit Code
  public async joinSessionByCode(
    code: string, 
    userId: string, 
    accessoryName: string, 
    accessoryType: AccessoryType
  ): Promise<PairingSessionData> {
    this.cleanup();
    const cleanCode = code.replace(/\D/g, '').trim();
    if (cleanCode.length < 6) {
      throw new Error('Código PIN inválido. Digite os 6 dígitos.');
    }

    let session: PairingSessionData | null = null;
    try {
      // Direct O(1) document lookup by sessionId (ses_<6-digit-code>)
      const directSnap = await getDoc(doc(db, 'pairingSessions', `ses_${cleanCode}`));
      if (directSnap.exists()) {
        session = directSnap.data() as PairingSessionData;
      } else {
        throw new Error('Código não encontrado ou sessão expirada. Verifique o código exibido na tela principal.');
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes('Código')) {
        throw err;
      }
      handleFirestoreError(err, OperationType.GET, `pairingSessions/ses_${cleanCode}`);
    }

    if (!session) throw new Error('Sessão não disponível.');

    const dev = this.getDeviceInfo();
    this.currentSessionId = session.sessionId;

    // Update session as connected
    try {
      await updateDoc(doc(db, 'pairingSessions', session.sessionId), {
        accessoryDeviceId: dev.id,
        accessoryName: accessoryName || dev.name,
        accessoryType: accessoryType,
        status: 'connected',
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `pairingSessions/${session.sessionId}`);
    }

    this.listenToSession(session.sessionId, false);
    // Start WebRTC connection setup as accessory (initiator or responder)
    await this.initiateWebRTCAsAccessory(session.sessionId);

    return session;
  }

  // Grant or deny permissions on Host
  public async setPermissionsGranted(sessionId: string, granted: boolean) {
    try {
      await updateDoc(doc(db, 'pairingSessions', sessionId), {
        permissionsGranted: granted,
        updatedAt: new Date().toISOString(),
      });
      this.sendCommand({
        id: `perm_${Date.now()}`,
        type: 'PERMISSION_RESPONSE',
        timestamp: Date.now(),
        payload: { granted },
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `pairingSessions/${sessionId}`);
    }
  }

  // Listen to session changes
  private listenToSession(sessionId: string, isHost: boolean) {
    this.unsubscribeSession = onSnapshot(doc(db, 'pairingSessions', sessionId), (snap) => {
      if (!snap.exists()) {
        this.onStatusChangeCallback?.('disconnected', this.activeProtocol);
        return;
      }
      const data = snap.data() as PairingSessionData;
      if (data.status === 'connected') {
        this.onStatusChangeCallback?.('connected', this.activeProtocol);
        if (isHost && !this.peerConnection) {
          // Prepare WebRTC on Host
          this.initiateWebRTCAsHost(sessionId);
        }
      } else if (data.status === 'terminated') {
        this.onStatusChangeCallback?.('disconnected', this.activeProtocol);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `pairingSessions/${sessionId}`);
    });

    // Listen to signaling messages
    const signalsRef = collection(db, 'pairingSessions', sessionId, 'signals');
    const qSignals = query(signalsRef, orderBy('createdAt', 'desc'), limit(20));

    const myDevId = this.getDeviceInfo().id;
    this.unsubscribeSignals = onSnapshot(qSignals, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const sig = change.doc.data();
          if (sig.senderId !== myDevId) {
            this.handleSignalingMessage(sig, isHost);
          }
        }
      });
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `pairingSessions/${sessionId}/signals`);
    });

    this.startHeartbeat();
  }

  // WebRTC Setup: Host prepares to receive offer and creates answer
  private async initiateWebRTCAsHost(sessionId: string) {
    try {
      this.peerConnection = new RTCPeerConnection(RTC_CONFIG);

      this.peerConnection.ondatachannel = (event) => {
        this.dataChannel = event.channel;
        this.setupDataChannel(this.dataChannel);
      };

      this.peerConnection.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          this.onRemoteStreamCallback?.(event.streams[0]);
        }
      };

      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          this.sendSignal('candidate', JSON.stringify(event.candidate));
        }
      };

      this.peerConnection.oniceconnectionstatechange = () => {
        const state = this.peerConnection?.iceConnectionState;
        if (state === 'connected' || state === 'completed') {
          this.activeProtocol = 'webrtc_lan';
          this.onStatusChangeCallback?.('connected', 'webrtc_lan');
        } else if (state === 'disconnected' || state === 'failed') {
          this.activeProtocol = 'firebase_relay';
          this.onStatusChangeCallback?.('connected', 'firebase_relay');
        }
      };
    } catch (e) {
      console.warn('WebRTC initialization fallback to Firestore:', e);
    }
  }

  // WebRTC Setup: Accessory creates Offer & DataChannel
  private async initiateWebRTCAsAccessory(sessionId: string) {
    try {
      this.peerConnection = new RTCPeerConnection(RTC_CONFIG);

      // Create high-speed low-latency DataChannel (unordered, maxRetransmits: 0 for fast mouse/sensor input)
      this.dataChannel = this.peerConnection.createDataChannel('syncpulse_control', {
        ordered: false,
        maxRetransmits: 0,
      });
      this.setupDataChannel(this.dataChannel);

      this.peerConnection.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          this.onRemoteStreamCallback?.(event.streams[0]);
        }
      };

      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          this.sendSignal('candidate', JSON.stringify(event.candidate));
        }
      };

      this.peerConnection.oniceconnectionstatechange = () => {
        const state = this.peerConnection?.iceConnectionState;
        if (state === 'connected' || state === 'completed') {
          this.activeProtocol = 'webrtc_lan';
          this.onStatusChangeCallback?.('connected', 'webrtc_lan');
        }
      };

      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      await this.sendSignal('offer', JSON.stringify(offer));
    } catch (e) {
      console.warn('WebRTC offer failed, using Firestore real-time channel:', e);
    }
  }

  private setupDataChannel(channel: RTCDataChannel) {
    channel.onopen = () => {
      this.activeProtocol = 'webrtc_lan';
      this.onStatusChangeCallback?.('connected', 'webrtc_lan');
    };

    channel.onclose = () => {
      this.activeProtocol = 'firebase_relay';
    };

    channel.onmessage = (event) => {
      try {
        const cmd: RemoteCommand = JSON.parse(event.data);
        this.processIncomingCommand(cmd);
      } catch (e) {
        console.error('Failed to parse DataChannel message:', e);
      }
    };
  }

  private async handleSignalingMessage(sig: any, isHost: boolean) {
    if (!this.peerConnection) return;

    try {
      if (sig.type === 'offer' && isHost) {
        const offer = JSON.parse(sig.payload);
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);
        await this.sendSignal('answer', JSON.stringify(answer));
      } else if (sig.type === 'answer' && !isHost) {
        const answer = JSON.parse(sig.payload);
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      } else if (sig.type === 'candidate') {
        const candidate = JSON.parse(sig.payload);
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } else if (sig.type === 'command') {
        // Fallback command delivery via Firestore
        const cmd: RemoteCommand = JSON.parse(sig.payload);
        this.processIncomingCommand(cmd);
      }
    } catch (e) {
      console.warn('Error handling signaling message:', e);
    }
  }

  private async sendSignal(type: string, payload: string) {
    if (!this.currentSessionId) return;
    try {
      const dev = this.getDeviceInfo();
      const signalsRef = collection(db, 'pairingSessions', this.currentSessionId, 'signals');
      await addDoc(signalsRef, {
        sessionId: this.currentSessionId,
        senderId: dev.id,
        type,
        payload,
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Failed to send signal:', err);
    }
  }

  // Send Remote Command (Mouse, Key, Audio, etc.)
  public sendCommand(cmd: RemoteCommand) {
    this.packetsSent++;
    const str = JSON.stringify(cmd);

    // Prefer fast WebRTC DataChannel if open
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      try {
        this.dataChannel.send(str);
        return;
      } catch (err) {
        console.warn('DataChannel send failed, falling back to Firestore:', err);
      }
    }

    // Fallback to Firestore signaling channel (throttled for mouse moves)
    if (cmd.type !== 'MOUSE_MOVE' || Math.random() < 0.25) {
      this.sendSignal('command', str);
    }
  }

  // Send Battery Status from Accessory to Host
  public sendBatteryUpdate(batteryLevel: number, isCharging: boolean) {
    this.sendCommand({
      id: `bat_${Date.now()}`,
      type: 'BATTERY_STATUS',
      timestamp: Date.now(),
      payload: {
        batteryLevel,
        isCharging,
      },
    });
  }

  private processIncomingCommand(cmd: RemoteCommand) {
    this.packetsReceived++;
    if (cmd.type === 'PING') {
      this.sendCommand({
        id: `pong_${Date.now()}`,
        type: 'PONG',
        timestamp: cmd.timestamp,
        payload: {},
      });
      return;
    }

    if (cmd.type === 'PONG') {
      const rtt = Math.max(1, Date.now() - cmd.timestamp);
      this.onLatencyUpdateCallback?.({
        rtt,
        protocol: this.activeProtocol,
        packetsSent: this.packetsSent,
        packetsReceived: this.packetsReceived,
        lastPing: Date.now(),
      });
      return;
    }

    if (cmd.type === 'BATTERY_STATUS') {
      const level = typeof cmd.payload.batteryLevel === 'number' ? cmd.payload.batteryLevel : 85;
      const isCharging = Boolean(cmd.payload.isCharging);
      this.onBatteryUpdateCallback?.({
        level,
        isCharging,
        lastUpdated: Date.now(),
      });
      this.onCommandCallback?.(cmd);
      return;
    }

    this.onCommandCallback?.(cmd);
  }

  private startHeartbeat() {
    if (this.pingInterval) clearInterval(this.pingInterval);
    this.pingInterval = window.setInterval(() => {
      this.sendCommand({
        id: `ping_${Date.now()}`,
        type: 'PING',
        timestamp: Date.now(),
        payload: {},
      });
    }, 2000);
  }

  // Audio stream sharing helper
  public async startAudioStream(): Promise<MediaStream | null> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      this.localStream = stream;
      if (this.peerConnection) {
        stream.getTracks().forEach((track) => {
          this.peerConnection?.addTrack(track, stream);
        });
        // Renegotiate
        const offer = await this.peerConnection.createOffer();
        await this.peerConnection.setLocalDescription(offer);
        await this.sendSignal('offer', JSON.stringify(offer));
      }
      return stream;
    } catch (err) {
      console.warn('Microphone stream error:', err);
      return null;
    }
  }

  // Screen sharing for Extra Monitor
  public async startScreenShare(): Promise<MediaStream | null> {
    try {
      if (!navigator.mediaDevices.getDisplayMedia) {
        throw new Error('Compartilhamento de tela não suportado neste navegador.');
      }
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'monitor' },
        audio: false,
      });
      this.localStream = stream;
      if (this.peerConnection) {
        stream.getTracks().forEach((track) => {
          this.peerConnection?.addTrack(track, stream);
        });
        const offer = await this.peerConnection.createOffer();
        await this.peerConnection.setLocalDescription(offer);
        await this.sendSignal('offer', JSON.stringify(offer));
      }
      return stream;
    } catch (err) {
      console.warn('Screen share error:', err);
      return null;
    }
  }

  public cleanup() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    if (this.unsubscribeSession) {
      this.unsubscribeSession();
      this.unsubscribeSession = null;
    }
    if (this.unsubscribeSignals) {
      this.unsubscribeSignals();
      this.unsubscribeSignals = null;
    }
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
      this.localStream = null;
    }
    this.currentSessionId = null;
  }
}

export const syncEngine = new SyncEngine();
