import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { RoleSelector } from './components/RoleSelector';
import { AccessorySelector } from './components/AccessorySelector';
import { PairingModal } from './components/PairingModal';
import { 
  SensorPermissionPrompt, 
  HostControlAuthorizationModal 
} from './components/PermissionPrompt';
import { MouseController } from './components/accessories/MouseController';
import { KeyboardController } from './components/accessories/KeyboardController';
import { SpeakerController } from './components/accessories/SpeakerController';
import { MonitorController } from './components/accessories/MonitorController';
import { AllInOneController } from './components/accessories/AllInOneController';
import { HostScreen } from './components/host/HostScreen';
import { AuthModal } from './components/AuthModal';
import { PWAInstallModal } from './components/PWAInstallModal';
import { InitialPermissionsModal } from './components/InitialPermissionsModal';

import { 
  DeviceRole, 
  AccessoryType, 
  ConnectionProtocol, 
  LatencyStats, 
  RemoteCommand,
  AccessoryBatteryInfo
} from './types/sync';
import { syncEngine } from './services/syncEngine';
import { batteryService } from './services/batteryService';
import { usePWAInstall } from './hooks/usePWAInstall';

function AppContent() {
  const { user, isGuest, guestName } = useAuth();
  const { canPrompt, triggerInstallPrompt, os, isInstalled } = usePWAInstall();

  // Workflow state
  const [role, setRole] = useState<DeviceRole | null>(null);
  const [accessoryType, setAccessoryType] = useState<AccessoryType | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'waiting' | 'connected' | 'disconnected'>('idle');
  const [protocol, setProtocol] = useState<ConnectionProtocol>('webrtc_lan');
  const [latencyStats, setLatencyStats] = useState<LatencyStats | null>(null);
  const [lastCommand, setLastCommand] = useState<RemoteCommand | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [accessoryBattery, setAccessoryBattery] = useState<AccessoryBatteryInfo | null>(null);

  // Modals
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSensorPrompt, setShowSensorPrompt] = useState(false);
  const [showHostAuthModal, setShowHostAuthModal] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [showInitialPermissions, setShowInitialPermissions] = useState(false);
  const [pendingAccessoryName, setPendingAccessoryName] = useState('Celular Remoto');

  // Active Session info
  const [sessionCode, setSessionCode] = useState<string>('');

  // Check for initial permissions prompt on entry
  useEffect(() => {
    const reviewed = localStorage.getItem('sincropulso_permissions_reviewed');
    if (!reviewed) {
      setShowInitialPermissions(true);
    }
  }, []);

  // Register SyncEngine callbacks
  useEffect(() => {
    syncEngine.setCallbacks({
      onCommand: (cmd) => {
        setLastCommand(cmd);

        if (cmd.type === 'PERMISSION_REQUEST') {
          setPendingAccessoryName(cmd.payload.message || 'Celular Remoto');
          setShowHostAuthModal(true);
        }
      },
      onStatusChange: (status, currentProtocol) => {
        setConnectionStatus(status);
        setProtocol(currentProtocol);

        if (status === 'connected') {
          // If accessory, start battery reporting to host
          if (role === 'accessory') {
            batteryService.startMonitoring();

            // Check if iOS DeviceOrientation requires user gesture permission
            if (accessoryType === 'mouse_keyboard' || accessoryType === 'all_in_one') {
              if (typeof (DeviceOrientationEvent as any)?.requestPermission === 'function') {
                setShowSensorPrompt(true);
              }
            }
          }
        } else {
          batteryService.stopMonitoring();
        }
      },
      onLatencyUpdate: (stats) => {
        setLatencyStats(stats);
      },
      onBatteryUpdate: (bat) => {
        setAccessoryBattery(bat);
      },
      onRemoteStream: (stream) => {
        setRemoteStream(stream);
      },
    });

    return () => {
      syncEngine.cleanup();
      batteryService.stopMonitoring();
    };
  }, [role, accessoryType]);

  const handleSelectRole = (newRole: DeviceRole) => {
    setRole(newRole);
    if (newRole === 'host') {
      setConnectionStatus('waiting');
    }
  };

  const handleResetRole = () => {
    syncEngine.cleanup();
    batteryService.stopMonitoring();
    setRole(null);
    setAccessoryType(null);
    setConnectionStatus('idle');
    setLatencyStats(null);
    setLastCommand(null);
    setRemoteStream(null);
    setAccessoryBattery(null);
  };

  const handleGrantSensors = async () => {
    if (typeof (DeviceOrientationEvent as any)?.requestPermission === 'function') {
      try {
        const response = await (DeviceOrientationEvent as any).requestPermission();
        if (response === 'granted') {
          console.log('DeviceOrientation permission granted');
        }
      } catch (e) {
        console.warn('Sensor permission error:', e);
      }
    }
    setShowSensorPrompt(false);
  };

  const currentUserId = user?.uid || (isGuest ? `guest_${guestName}` : 'demo_user');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      {/* Top Navigation with SincroPulso branding, Ping/Lag and PWA Install */}
      <Navbar
        role={role}
        onResetRole={handleResetRole}
        status={connectionStatus}
        protocol={protocol}
        latencyStats={latencyStats}
        onOpenInstallModal={() => setShowInstallModal(true)}
        onOpenAuth={() => setShowAuthModal(true)}
        sessionId={sessionCode}
      />

      {/* Main Container */}
      <main className="flex-1 w-full">
        {/* STEP 1: Choose Role (Conectar com Dispositivo ou Ser Acessório) */}
        {!role && (
          <RoleSelector 
            onSelectRole={handleSelectRole} 
            onOpenInstallModal={() => setShowInstallModal(true)}
          />
        )}

        {/* STEP 2 (Accessory only): Choose which accessory to be */}
        {role === 'accessory' && !accessoryType && (
          <AccessorySelector
            onSelectAccessory={(type) => setAccessoryType(type)}
            onBack={() => setRole(null)}
          />
        )}

        {/* STEP 3 (Host or Accessory): Pairing Screen (PIN / QR Code) until connected */}
        {role && (connectionStatus === 'idle' || connectionStatus === 'waiting') && (role === 'host' || !!accessoryType) && (
          <PairingModal
            role={role}
            accessoryType={accessoryType || undefined}
            hostSessionCode={sessionCode}
            userId={currentUserId}
            onSessionCreated={(code) => setSessionCode(code)}
            onProtocolChange={(p) => setProtocol(p)}
            onConnected={() => setConnectionStatus('connected')}
            onBack={() => {
              if (role === 'accessory') setAccessoryType(null);
              else setRole(null);
            }}
          />
        )}

        {/* STEP 4: Connected Views */}
        {connectionStatus === 'connected' && (
          <>
            {/* Host Dashboard with live Accessory Battery Tracking & Ping/Lag */}
            {role === 'host' && (
              <HostScreen
                sessionCode={sessionCode}
                accessoryName={pendingAccessoryName}
                latencyStats={latencyStats}
                lastCommand={lastCommand}
                accessoryBattery={accessoryBattery}
              />
            )}

            {/* Accessory Controllers */}
            {role === 'accessory' && (
              <>
                {accessoryType === 'all_in_one' && (
                  <AllInOneController 
                    remoteStream={remoteStream} 
                    requestSensorPermission={() => setShowSensorPrompt(true)}
                  />
                )}
                {accessoryType === 'mouse_keyboard' && (
                  <MouseController 
                    requestSensorPermission={() => setShowSensorPrompt(true)}
                  />
                )}
                {accessoryType === 'keyboard' && <KeyboardController />}
                {accessoryType === 'speaker' && <SpeakerController />}
                {accessoryType === 'extra_monitor' && <MonitorController remoteStream={remoteStream} />}
              </>
            )}
          </>
        )}
      </main>

      {/* Entry Permissions Modal (Appears upfront on opening app) */}
      <InitialPermissionsModal
        isOpen={showInitialPermissions}
        onClose={() => setShowInitialPermissions(false)}
      />

      {/* PWA Install Modal with OS Auto-Detection (iOS, Android, PC) */}
      <PWAInstallModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
        detectedOs={os}
        canPrompt={canPrompt}
        onTriggerPrompt={async () => {
          await triggerInstallPrompt();
          setShowInstallModal(false);
        }}
        isInstalled={isInstalled}
      />

      {/* Permission Prompts & Dialogs */}
      <SensorPermissionPrompt
        isOpen={showSensorPrompt}
        onGrantSensors={handleGrantSensors}
        onUseTouchpadFallback={() => setShowSensorPrompt(false)}
      />

      <HostControlAuthorizationModal
        isOpen={showHostAuthModal}
        accessoryName={pendingAccessoryName}
        onAuthorize={() => {
          setShowHostAuthModal(false);
          syncEngine.setPermissionsGranted(sessionCode, true);
        }}
        onDeny={() => {
          setShowHostAuthModal(false);
          syncEngine.setPermissionsGranted(sessionCode, false);
        }}
      />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
