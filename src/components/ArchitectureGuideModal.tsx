import React, { useState } from 'react';
import { BookOpen, X, Layers, ShieldCheck, Cpu, Terminal, CheckCircle2, Copy, Check, AlertCircle } from 'lucide-react';

interface ArchitectureGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureGuideModal: React.FC<ArchitectureGuideModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'stack' | 'permissions' | 'audio_service' | 'flutter_code' | 'rn_code' | 'production'>('stack');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-4xl rounded-2xl bg-black border border-zinc-900 shadow-2xl p-5 sm:p-6 text-zinc-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-900">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-500/15 text-red-500 border border-red-500/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Cross-Platform Audio Engine Architecture</h2>
              <p className="text-xs text-zinc-400">Complete implementation guide for PWA, Flutter, and React Native</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition"
            aria-label="Close guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-3 border-b border-zinc-900 text-xs font-medium scrollbar-none">
          <button
            onClick={() => setActiveTab('stack')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition ${
              activeTab === 'stack' ? 'bg-red-600 text-white shadow-sm shadow-red-600/30 font-bold' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            1. Framework Comparison
          </button>
          <button
            onClick={() => setActiveTab('permissions')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition ${
              activeTab === 'permissions' ? 'bg-red-600 text-white shadow-sm shadow-red-600/30 font-bold' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            2. OS Permissions & Config
          </button>
          <button
            onClick={() => setActiveTab('audio_service')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition ${
              activeTab === 'audio_service' ? 'bg-red-600 text-white shadow-sm shadow-red-600/30 font-bold' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            3. Background Audio & Focus
          </button>
          <button
            onClick={() => setActiveTab('flutter_code')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition ${
              activeTab === 'flutter_code' ? 'bg-red-600 text-white shadow-sm shadow-red-600/30 font-bold' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            4. Flutter Architecture
          </button>
          <button
            onClick={() => setActiveTab('rn_code')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition ${
              activeTab === 'rn_code' ? 'bg-red-600 text-white shadow-sm shadow-red-600/30 font-bold' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            5. React Native TrackPlayer
          </button>
          <button
            onClick={() => setActiveTab('production')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition ${
              activeTab === 'production' ? 'bg-red-600 text-white shadow-sm shadow-red-600/30 font-bold' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            6. Production Checklist
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs sm:text-sm text-zinc-300">
          {activeTab === 'stack' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-zinc-950 border border-red-950/60">
                <h3 className="font-bold text-zinc-100 flex items-center gap-2 text-sm mb-1">
                  <Layers className="w-4 h-4 text-red-500" />
                  Tech Stack Evaluation for Offline Audio Apps
                </h3>
                <p className="text-xs text-zinc-400">
                  Selecting the right cross-platform framework depends on your target distribution, local storage access depth, and background audio reliability.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* PWA Card */}
                <div className="p-4 rounded-xl bg-zinc-950 border border-red-500/30 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-red-400">PWA (This App)</span>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-red-500/20 text-red-300 font-bold">Fastest Deploy</span>
                    </div>
                    <p className="text-xs text-zinc-400 mb-3">
                      HTML5 Audio, Web Audio API, IndexedDB, MediaSession API, and File System Access API.
                    </p>
                    <ul className="space-y-1.5 text-xs text-zinc-300">
                      <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-red-400 shrink-0" /><span>No App Store approval delays</span></li>
                      <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-red-400 shrink-0" /><span>Native lock-screen controls</span></li>
                      <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-red-400 shrink-0" /><span>Zero installation payload</span></li>
                      <li className="flex items-center gap-1.5 text-amber-300"><AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" /><span>iOS limits background if memory spikes</span></li>
                    </ul>
                  </div>
                  <div className="mt-4 pt-3 border-t border-zinc-900 text-[11px] text-zinc-400">
                    <strong>Verdict:</strong> Ideal for web-first distribution & PWA TWA (Bubblewrap) Google Play release.
                  </div>
                </div>

                {/* Flutter Card */}
                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-900 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-zinc-200">Flutter (Dart)</span>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-300 font-bold">Best Native Audio</span>
                    </div>
                    <p className="text-xs text-zinc-400 mb-3">
                      Using `just_audio`, `audio_service`, `on_audio_query`, and `hive` / `isar`.
                    </p>
                    <ul className="space-y-1.5 text-xs text-zinc-300">
                      <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-red-400 shrink-0" /><span>Unrestricted ForegroundService on Android</span></li>
                      <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-red-400 shrink-0" /><span>Scans MediaStore directly without file pickers</span></li>
                      <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-red-400 shrink-0" /><span>Native lock-screen & Android Auto controls</span></li>
                      <li className="flex items-center gap-1.5 text-amber-300"><AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" /><span>Requires Flutter toolchain & SDK setup</span></li>
                    </ul>
                  </div>
                  <div className="mt-4 pt-3 border-t border-zinc-900 text-[11px] text-zinc-400">
                    <strong>Verdict:</strong> Recommended choice for high-volume standalone native Android/iOS APK builds.
                  </div>
                </div>

                {/* React Native Card */}
                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-900 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-zinc-200">React Native / Expo</span>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-300 font-bold">Rich Ecosystem</span>
                    </div>
                    <p className="text-xs text-zinc-400 mb-3">
                      Using `react-native-track-player`, `expo-file-system`, and `mmkv`.
                    </p>
                    <ul className="space-y-1.5 text-xs text-zinc-300">
                      <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-red-400 shrink-0" /><span>JavaScript/TypeScript shared code</span></li>
                      <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-red-400 shrink-0" /><span>Battle-tested TrackPlayer service</span></li>
                      <li className="flex items-center gap-1.5 text-amber-300"><AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" /><span>Requires Expo Config Plugins & native build</span></li>
                      <li className="flex items-center gap-1.5 text-amber-300"><AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" /><span>Heavier bundle size than Flutter</span></li>
                    </ul>
                  </div>
                  <div className="mt-4 pt-3 border-t border-zinc-900 text-[11px] text-zinc-400">
                    <strong>Verdict:</strong> Best if your team already has React/React Native web & mobile shared components.
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'permissions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-zinc-100 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-red-400" />
                  Android Manifest Permissions (Android 13+ & Legacy)
                </h3>
                <button
                  onClick={() =>
                    copyToClipboard(
                      `<manifest xmlns:android="http://schemas.android.com/apk/res/android">\n    <!-- Audio Scanning Permissions -->\n    <!-- For Android 13+ (API 33+) -->\n    <uses-permission android:name="android.permission.READ_MEDIA_AUDIO" />\n    <!-- For Android 12 and below (API <= 32) -->\n    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />\n    \n    <!-- Foreground & Background Audio Services -->\n    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />\n    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK" />\n    <uses-permission android:name="android.permission.WAKE_LOCK" />\n</manifest>`,
                      'manifest'
                    )
                  }
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-xs text-zinc-300"
                >
                  {copiedKey === 'manifest' ? <Check className="w-3.5 h-3.5 text-red-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'manifest' ? 'Copied' : 'Copy XML'}</span>
                </button>
              </div>

              <pre className="p-3.5 rounded-xl bg-zinc-950 font-mono text-xs text-red-300 overflow-x-auto border border-zinc-900">
{`<!-- android/app/src/main/AndroidManifest.xml -->
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <!-- Local Audio Storage Permission (Android 13+ Granular Media Permissions) -->
    <uses-permission android:name="android.permission.READ_MEDIA_AUDIO" />
    
    <!-- Legacy Android 12 and below fallback -->
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
    
    <!-- Background Audio Playback & Notification Controls -->
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />

    <application ...>
        <!-- Audio Service Declaration with mediaPlayback type -->
        <service
            android:name="com.ryanheise.audioservice.AudioService"
            android:foregroundServiceType="mediaPlayback"
            android:exported="true">
            <intent-filter>
                <action android:name="android.media.browse.MediaBrowserService" />
            </intent-filter>
        </service>
    </application>
</manifest>`}
              </pre>

              <div className="pt-2">
                <h4 className="font-bold text-zinc-100 mb-1">iOS Info.plist Configuration</h4>
                <pre className="p-3.5 rounded-xl bg-zinc-950 font-mono text-xs text-zinc-300 overflow-x-auto border border-zinc-900">
{`<!-- ios/Runner/Info.plist -->
<key>UIBackgroundModes</key>
<array>
    <string>audio</string>
</array>
<key>NSAppleMusicUsageDescription</key>
<string>kaGO.PIaY needs access to your local music library to play offline audio tracks.</string>`}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'audio_service' && (
            <div className="space-y-4">
              <h3 className="font-bold text-zinc-100 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-red-400" />
                Audio Focus Loss, Interruption & Headphone Events
              </h3>
              <p className="text-xs text-zinc-300 leading-relaxed">
                A production-grade mobile music app must gracefully handle audio focus changes (phone calls, turn-by-turn GPS navigation) and hardware disconnection events.
              </p>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-900">
                  <h4 className="font-semibold text-zinc-200 text-xs">1. AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK (GPS Navigation)</h4>
                  <p className="text-xs text-zinc-400 mt-1">
                    Lower audio volume temporarily (ducking to 20%) while the other application speaks, then restore full volume when focus is regained.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-900">
                  <h4 className="font-semibold text-zinc-200 text-xs">2. AUDIOFOCUS_LOSS (Phone Call Incoming)</h4>
                  <p className="text-xs text-zinc-400 mt-1">
                    Pause playback immediately and update lock screen state to paused. Save current position so user can resume seamlessly when call finishes.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-900">
                  <h4 className="font-semibold text-zinc-200 text-xs">3. ACTION_AUDIO_BECOMING_NOISY (Headphones Unplugged / Bluetooth Disconnected)</h4>
                  <p className="text-xs text-zinc-400 mt-1">
                    Android standard behavior: pause playback immediately so music does not inadvertently blast through the device speakers in public.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'flutter_code' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-zinc-100">Flutter AudioHandler Implementation</h3>
                <button
                  onClick={() =>
                    copyToClipboard(
                      `// pubspec.yaml dependencies:\n// just_audio: ^0.9.36\n// audio_service: ^0.18.12\n// on_audio_query: ^2.9.0\n// permission_handler: ^11.3.1\n\nimport 'package:audio_service/audio_service.dart';\nimport 'package:just_audio/just_audio.dart';\n\nclass KaGoAudioHandler extends BaseAudioHandler with QueueHandler, SeekHandler {\n  final _player = AudioPlayer();\n\n  KaGoAudioHandler() {\n    _player.playbackEventStream.listen(_broadcastState);\n    _player.playerStateStream.listen((state) {\n      if (state.processingState == ProcessingState.completed) {\n        skipToNext();\n      }\n    });\n  }\n\n  @override\n  Future<void> play() => _player.play();\n\n  @override\n  Future<void> pause() => _player.pause();\n\n  @override\n  Future<void> seek(Duration position) => _player.seek(position);\n\n  void _broadcastState(PlaybackEvent event) {\n    playbackState.add(playbackState.value.copyWith(\n      controls: [\n        MediaControl.skipToPrevious,\n        _player.playing ? MediaControl.pause : MediaControl.play,\n        MediaControl.skipToNext,\n      ],\n      systemActions: const {MediaAction.seek},\n      androidCompactActionIndices: const [0, 1, 2],\n      processingState: const {\n        ProcessingState.idle: AudioProcessingState.idle,\n        ProcessingState.loading: AudioProcessingState.loading,\n        ProcessingState.buffering: AudioProcessingState.buffering,\n        ProcessingState.ready: AudioProcessingState.ready,\n        ProcessingState.completed: AudioProcessingState.completed,\n      }[_player.processingState]!,\n      playing: _player.playing,\n      updatePosition: _player.position,\n      bufferedPosition: _player.bufferedPosition,\n      speed: _player.speed,\n    ));\n  }\n}`,
                      'flutter'
                    )
                  }
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-xs text-zinc-300"
                >
                  {copiedKey === 'flutter' ? <Check className="w-3.5 h-3.5 text-red-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'flutter' ? 'Copied' : 'Copy Dart'}</span>
                </button>
              </div>

              <pre className="p-3.5 rounded-xl bg-zinc-950 font-mono text-xs text-red-300 overflow-x-auto border border-zinc-900">
{`// pubspec.yaml:
// dependencies:
//   just_audio: ^0.9.36
//   audio_service: ^0.18.12
//   on_audio_query: ^2.9.0

class KaGoAudioHandler extends BaseAudioHandler with QueueHandler, SeekHandler {
  final _player = AudioPlayer();

  KaGoAudioHandler() {
    _player.playbackEventStream.listen(_broadcastState);
  }

  @override
  Future<void> play() => _player.play();

  @override
  Future<void> pause() => _player.pause();

  @override
  Future<void> seek(Duration position) => _player.seek(position);

  void _broadcastState(PlaybackEvent event) {
    playbackState.add(playbackState.value.copyWith(
      controls: [
        MediaControl.skipToPrevious,
        _player.playing ? MediaControl.pause : MediaControl.play,
        MediaControl.skipToNext,
      ],
      systemActions: const {MediaAction.seek},
      androidCompactActionIndices: const [0, 1, 2],
      playing: _player.playing,
      updatePosition: _player.position,
    ));
  }
}`}
              </pre>
            </div>
          )}

          {activeTab === 'rn_code' && (
            <div className="space-y-3">
              <h3 className="font-bold text-zinc-100">React Native TrackPlayer Service</h3>
              <pre className="p-3.5 rounded-xl bg-zinc-950 font-mono text-xs text-red-300 overflow-x-auto border border-zinc-900">
{`// service.js
import TrackPlayer, { Event } from 'react-native-track-player';

module.exports = async function() {
  TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
  TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());
  TrackPlayer.addEventListener(Event.RemoteNext, () => TrackPlayer.skipToNext());
  TrackPlayer.addEventListener(Event.RemotePrevious, () => TrackPlayer.skipToPrevious());
  TrackPlayer.addEventListener(Event.RemoteSeek, (event) => TrackPlayer.seekTo(event.position));
  TrackPlayer.addEventListener(Event.RemoteDuck, async (event) => {
    if (event.paused) {
      await TrackPlayer.pause();
    } else {
      await TrackPlayer.play();
    }
  });
};`}
              </pre>
            </div>
          )}

          {activeTab === 'production' && (
            <div className="space-y-3">
              <h3 className="font-bold text-zinc-100 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-red-400" />
                Production Release Checklist
              </h3>
              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-900 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-semibold text-zinc-200">1. Battery Optimization Exemption</h5>
                    <p className="text-zinc-400 text-xs">Request `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` or prompt user to disable battery restrictions so Android OEMs do not kill background audio services after 15 minutes.</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-900 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-semibold text-zinc-200">2. Proguard & R8 Keep Rules</h5>
                    <p className="text-zinc-400 text-xs">Add <code className="text-zinc-300 font-mono">-keep class com.ryanheise.** &#123; *; &#125;</code> and media session classes to prevent code minification from stripping native audio bindings.</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-900 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-semibold text-zinc-200">3. Release Keystore & App Bundle</h5>
                    <p className="text-zinc-400 text-xs">Generate upload keystore (`keytool -genkey -v -keystore release.keystore ...`) and build with `gradlew bundleRelease` for Google Play.</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-900 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-semibold text-zinc-200">4. PWA to Play Store (Bubblewrap / TWA)</h5>
                    <p className="text-zinc-400 text-xs">This PWA can be wrapped directly into an Android App Bundle (AAB) using Google's official Bubblewrap CLI tool: `bubblewrap init --manifest=https://.../manifest.webmanifest && bubblewrap build`.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-zinc-900 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium text-xs shadow-md shadow-red-600/30 transition active:scale-95"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
