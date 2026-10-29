import React, { useState } from 'react';
import { Sliders, X, RotateCcw, Volume2, Sparkles, Power, Zap, Layers } from 'lucide-react';
import { EQ_PRESETS, audioEngine } from '../services/audioEngine';
import { EqualizerPreset } from '../types/audio';

interface EqualizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (
    presetName: string,
    gains: number[],
    bassBoost: number,
    bassBoostEnabled: boolean,
    crossfade?: number,
    gapless?: boolean
  ) => void;
}

export const EqualizerModal: React.FC<EqualizerModalProps> = ({ isOpen, onClose, onSave }) => {
  const [selectedPreset, setSelectedPreset] = useState<string>('Flat');
  const [gains, setGains] = useState<number[]>(() => audioEngine.getEqGains());
  const [bassBoost, setBassBoost] = useState<number>(() => audioEngine.getBassBoost());
  const [bassBoostEnabled, setBassBoostEnabled] = useState<boolean>(() => audioEngine.getBassBoostEnabled());
  const [crossfadeDuration, setCrossfadeDuration] = useState<number>(() => audioEngine.getCrossfadeDuration());
  const [gaplessEnabled, setGaplessEnabled] = useState<boolean>(() => audioEngine.getGaplessEnabled());

  if (!isOpen) return null;

  const bandLabels = ['60 Hz', '230 Hz', '910 Hz', '3.6 kHz', '14 kHz'];
  const bandDescriptions = ['Sub Bass', 'Low Bass', 'Mid-Range', 'Presence', 'Brilliance'];

  const handleBandChange = (index: number, val: number) => {
    const updated = [...gains];
    updated[index] = val;
    setGains(updated);
    setSelectedPreset('Custom');
    audioEngine.setEqGain(index, val);
    onSave?.('Custom', updated, bassBoost, bassBoostEnabled, crossfadeDuration, gaplessEnabled);
  };

  const handleBassToggle = () => {
    const nextState = !bassBoostEnabled;
    setBassBoostEnabled(nextState);
    audioEngine.setBassBoostEnabled(nextState);
    onSave?.(selectedPreset, gains, bassBoost, nextState, crossfadeDuration, gaplessEnabled);
  };

  const handleBassChange = (val: number) => {
    setBassBoost(val);
    audioEngine.setBassBoost(val);
    onSave?.(selectedPreset, gains, val, bassBoostEnabled, crossfadeDuration, gaplessEnabled);
  };

  const handleGaplessToggle = () => {
    const nextState = !gaplessEnabled;
    setGaplessEnabled(nextState);
    audioEngine.setGaplessEnabled(nextState);
    onSave?.(selectedPreset, gains, bassBoost, bassBoostEnabled, crossfadeDuration, nextState);
  };

  const handleCrossfadeChange = (val: number) => {
    setCrossfadeDuration(val);
    audioEngine.setCrossfadeDuration(val);
    onSave?.(selectedPreset, gains, bassBoost, bassBoostEnabled, val, gaplessEnabled);
  };

  const handlePresetSelect = (preset: EqualizerPreset) => {
    setSelectedPreset(preset.name);
    setGains([...preset.gains]);
    let nextBassBoost = bassBoost;
    let nextBassBoostEnabled = bassBoostEnabled;
    if (preset.bassBoost !== undefined) {
      nextBassBoost = preset.bassBoost;
      setBassBoost(nextBassBoost);
    }
    if (preset.bassBoostEnabled !== undefined) {
      nextBassBoostEnabled = preset.bassBoostEnabled;
      setBassBoostEnabled(nextBassBoostEnabled);
    }
    audioEngine.setEqPreset(preset);
    onSave?.(preset.name, [...preset.gains], nextBassBoost, nextBassBoostEnabled, crossfadeDuration, gaplessEnabled);
  };

  const handleReset = () => {
    const flat = [0, 0, 0, 0, 0];
    setSelectedPreset('Flat');
    setGains(flat);
    setBassBoost(8);
    setBassBoostEnabled(false);
    setCrossfadeDuration(3);
    setGaplessEnabled(true);
    audioEngine.setEqPreset({ name: 'Flat', gains: flat });
    audioEngine.setBassBoostEnabled(false);
    audioEngine.setBassBoost(8);
    audioEngine.setCrossfadeDuration(3);
    audioEngine.setGaplessEnabled(true);
    onSave?.('Flat', flat, 8, false, 3, true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 pt-[max(env(safe-area-inset-top,0px),1.75rem)] pb-[max(env(safe-area-inset-bottom,0px),1.5rem)] animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-sm bg-[#16161a] border-2 border-[#f2efeb] shadow-2xl p-5 sm:p-6 text-[#f2efeb] flex flex-col max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#f2efeb]/15">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-sm bg-[#ff3e3e]/15 text-[#ff3e3e] border border-[#ff3e3e]/30">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-syne text-lg font-bold text-[#f2efeb]">Audio Equalizer & DSP Engine</h2>
              <p className="label !opacity-60 text-[10px]">Predefined presets, 5-band manual control & Bass Boost</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 transition"
              title="Reset to Flat"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition"
              aria-label="Close equalizer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Presets row: Includes Rock, Pop, Classical, Jazz, Electronic, Hip-Hop, Flat, etc. */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
              <Sparkles className="w-3.5 h-3.5 text-red-500" />
              <span>Equalizer Presets</span>
            </div>
            <span className="text-[11px] font-mono text-red-400 font-bold">Current: {selectedPreset}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {EQ_PRESETS.map((p) => {
              const isActive = selectedPreset === p.name;
              return (
                <button
                  key={p.name}
                  onClick={() => handlePresetSelect(p)}
                  className={`px-3 py-1.5 rounded-sm text-xs font-semibold tracking-wide transition-all ${
                    isActive
                      ? 'bg-[#ff3e3e] text-black font-extrabold shadow-lg shadow-[#ff3e3e]/30 scale-102 border border-[#ff3e3e]'
                      : 'bg-[#0c0c0e] text-[#f2efeb]/80 hover:bg-[#202026] hover:text-white border border-[#f2efeb]/15'
                  }`}
                >
                  {p.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* 5-Band Manual Frequency Sliders */}
        <div className="mt-6 p-4 rounded-xl bg-zinc-950 border border-zinc-900">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-zinc-300">Manual Band Tuning (-12 dB to +12 dB)</span>
            <span className="text-[10px] text-zinc-500">Tap or drag sliders to customize</span>
          </div>
          <div className="grid grid-cols-5 gap-2 sm:gap-4 items-end text-center">
            {bandLabels.map((label, index) => {
              const gain = gains[index] ?? 0;
              return (
                <div key={label} className="flex flex-col items-center">
                  <span
                    className={`text-[11px] font-mono font-medium mb-2 ${
                      gain > 0 ? 'text-red-400 font-bold' : gain < 0 ? 'text-rose-400' : 'text-zinc-500'
                    }`}
                  >
                    {gain > 0 ? `+${gain}` : gain} dB
                  </span>

                  {/* Vertical Slider Simulation */}
                  <div className="relative h-44 w-8 flex items-center justify-center bg-black rounded-lg p-1 border border-zinc-800">
                    {/* Zero center indicator line */}
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-zinc-800 z-0 pointer-events-none" />

                    <input
                      type="range"
                      min="-12"
                      max="12"
                      step="1"
                      value={gain}
                      onChange={(e) => handleBandChange(index, parseFloat(e.target.value))}
                      className="w-36 h-2 -rotate-90 origin-center cursor-pointer bg-zinc-900 appearance-none rounded-lg z-10 accent-red-600"
                      aria-label={`${label} equalizer gain`}
                    />
                  </div>

                  <span className="mt-3 text-xs font-bold text-zinc-200">{label}</span>
                  <span className="text-[10px] text-zinc-500 truncate max-w-[50px]">{bandDescriptions[index]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Toggleable Bass Boost Effect Section */}
        <div className="mt-5 p-4 rounded-xl bg-zinc-950 border border-zinc-900 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className={`p-2 rounded-xl transition ${
                  bassBoostEnabled
                    ? 'bg-red-500/20 text-red-400 shadow-md shadow-red-500/20'
                    : 'bg-zinc-900 text-zinc-600'
                }`}
              >
                <Zap className={`w-4 h-4 ${bassBoostEnabled ? 'fill-current' : ''}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-100">Bass Boost Effect</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold uppercase transition ${
                      bassBoostEnabled
                        ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                        : 'bg-zinc-900 text-zinc-500'
                    }`}
                  >
                    {bassBoostEnabled ? 'ON' : 'OFF'}
                  </span>
                </div>
                <div className="text-[11px] text-zinc-400">Low-shelf resonant subwoofer boost at 80 Hz</div>
              </div>
            </div>

            {/* Toggle Switch */}
            <button
              onClick={handleBassToggle}
              aria-label={`Toggle bass boost ${bassBoostEnabled ? 'off' : 'on'}`}
              className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors focus:outline-none ${
                bassBoostEnabled ? 'bg-gradient-to-r from-red-600 to-rose-600' : 'bg-zinc-800'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  bassBoostEnabled ? 'translate-x-7 shadow-md' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Bass Intensity Controls (active when enabled) */}
          <div
            className={`pt-2 transition-opacity ${
              bassBoostEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'
            }`}
          >
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-zinc-400">Boost Intensity</span>
              <span className="font-mono font-bold text-red-400">
                {bassBoostEnabled ? `+${bassBoost} dB` : 'Bypassed (0 dB)'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="2"
                max="14"
                step="1"
                disabled={!bassBoostEnabled}
                value={bassBoost}
                onChange={(e) => handleBassChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-zinc-900 rounded-lg cursor-pointer accent-red-600"
                aria-label="Bass boost gain slider"
              />
            </div>
            <div className="flex gap-2 mt-2">
              {[
                { label: 'Subtle (+4dB)', val: 4 },
                { label: 'Punchy (+8dB)', val: 8 },
                { label: 'Maximum (+12dB)', val: 12 },
              ].map((lvl) => (
                <button
                  key={lvl.label}
                  type="button"
                  onClick={() => handleBassChange(lvl.val)}
                  disabled={!bassBoostEnabled}
                  className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-medium transition ${
                    bassBoost === lvl.val && bassBoostEnabled
                      ? 'bg-red-600/30 text-red-300 border border-red-500/40'
                      : 'bg-black text-zinc-400 hover:text-white border border-zinc-800'
                  }`}
                >
                  {lvl.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Seamless Playback & Cross-Fade Engine Section */}
        <div className="mt-5 p-4 rounded-xl bg-zinc-950 border border-zinc-900 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className={`p-2 rounded-xl transition ${
                  gaplessEnabled
                    ? 'bg-[#ff3e3e]/20 text-[#ff3e3e] shadow-md shadow-[#ff3e3e]/20'
                    : 'bg-zinc-900 text-zinc-600'
                }`}
              >
                <Layers className={`w-4 h-4 ${gaplessEnabled ? 'fill-current' : ''}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-100">Gapless Playback & Cross-Fade</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold uppercase transition ${
                      gaplessEnabled
                        ? 'bg-[#ff3e3e]/20 text-red-300 border border-[#ff3e3e]/30'
                        : 'bg-zinc-900 text-zinc-500'
                    }`}
                  >
                    {gaplessEnabled ? 'ACTIVE' : 'OFF'}
                  </span>
                </div>
                <div className="text-[11px] text-zinc-400">Dual-channel pre-buffering & zero-silence track blending</div>
              </div>
            </div>

            {/* Gapless Toggle Switch */}
            <button
              onClick={handleGaplessToggle}
              aria-label={`Toggle gapless playback ${gaplessEnabled ? 'off' : 'on'}`}
              className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${
                gaplessEnabled ? 'bg-gradient-to-r from-red-600 to-rose-600' : 'bg-zinc-800'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  gaplessEnabled ? 'translate-x-7 shadow-md' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Cross-fade duration control (active when gapless is enabled) */}
          <div
            className={`pt-2 transition-opacity ${
              gaplessEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'
            }`}
          >
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-zinc-400">Cross-Fade Overlap</span>
              <span className="font-mono font-bold text-red-400">
                {crossfadeDuration === 0 ? '0s (Pure Gapless Cut)' : `${crossfadeDuration}s Smooth Cross-Fade`}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="12"
                step="1"
                disabled={!gaplessEnabled}
                value={crossfadeDuration}
                onChange={(e) => handleCrossfadeChange(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-zinc-900 rounded-lg cursor-pointer accent-red-600"
                aria-label="Cross-fade duration slider"
              />
            </div>
            <div className="flex gap-1.5 sm:gap-2 mt-2">
              {[
                { label: '0s Gapless', val: 0 },
                { label: '2s Blend', val: 2 },
                { label: '4s Normal', val: 4 },
                { label: '6s Smooth', val: 6 },
                { label: '8s Extended', val: 8 },
                { label: '12s DJ Mix', val: 12 },
              ].map((lvl) => (
                <button
                  key={lvl.label}
                  type="button"
                  onClick={() => handleCrossfadeChange(lvl.val)}
                  disabled={!gaplessEnabled}
                  className={`flex-1 py-1 px-1 rounded-lg text-[10px] font-medium transition cursor-pointer text-center ${
                    crossfadeDuration === lvl.val && gaplessEnabled
                      ? 'bg-[#ff3e3e]/30 text-red-300 border border-[#ff3e3e]/40 font-bold'
                      : 'bg-black text-zinc-400 hover:text-white border border-zinc-800'
                  }`}
                >
                  {lvl.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium text-sm transition shadow-lg shadow-red-600/25 active:scale-95"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
