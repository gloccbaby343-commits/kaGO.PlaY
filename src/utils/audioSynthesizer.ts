import { Track } from '../types/audio';
import { generateCoverGradient } from './formatters';

/**
 * Converts an AudioBuffer to an audio/wav Blob
 */
export function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const out = new DataView(new ArrayBuffer(length));
  const channels: Float32Array[] = [];
  let sampleRate = buffer.sampleRate;
  let offset = 0;
  let pos = 0;

  function writeString(str: string) {
    for (let i = 0; i < str.length; i++) {
      out.setUint8(pos++, str.charCodeAt(i));
    }
  }

  function setUint16(data: number) {
    out.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data: number) {
    out.setUint32(pos, data, true);
    pos += 4;
  }

  // RIFF identifier
  writeString('RIFF');
  // file length minus RIFF identifier & length itself
  setUint32(length - 8);
  // RIFF type & format chunk identifier
  writeString('WAVE');
  writeString('fmt ');
  // format chunk length
  setUint32(16);
  // sample format (raw PCM)
  setUint16(1);
  // channel count
  setUint16(numOfChan);
  // sample rate
  setUint32(sampleRate);
  // byte rate (sample rate * block align)
  setUint32(sampleRate * 2 * numOfChan);
  // block align (channel count * bytes per sample)
  setUint16(numOfChan * 2);
  // bits per sample
  setUint16(16);
  // data chunk identifier
  writeString('data');
  // data chunk length
  setUint32(length - pos - 4);

  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (offset < buffer.length) {
    for (let i = 0; i < numOfChan; i++) {
      let sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      out.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([out], { type: 'audio/wav' });
}

/**
 * Procedurally generates high quality studio demo tracks offline
 */
export async function generateDemoTracks(): Promise<Track[]> {
  const sampleRate = 44100;

  // Track 1: Neon Horizon (Synthwave) - 24s loop
  const t1 = await synthesizeSynthwave(sampleRate, 24);
  const blob1 = audioBufferToWav(t1);
  const url1 = URL.createObjectURL(blob1);

  // Track 2: Midnight Rain (Lo-Fi Chill) - 24s loop
  const t2 = await synthesizeLofi(sampleRate, 24);
  const blob2 = audioBufferToWav(t2);
  const url2 = URL.createObjectURL(blob2);

  // Track 3: Solar Wind (Ambient Drone) - 28s loop
  const t3 = await synthesizeAmbient(sampleRate, 28);
  const blob3 = audioBufferToWav(t3);
  const url3 = URL.createObjectURL(blob3);

  // Track 4: Cyber Pulse (Electro Groove) - 24s loop
  const t4 = await synthesizeElectro(sampleRate, 24);
  const blob4 = audioBufferToWav(t4);
  const url4 = URL.createObjectURL(blob4);

  return [
    {
      id: 'demo-1-neon-horizon',
      title: 'Neon Horizon',
      artist: 'Aura Studio',
      album: 'Retrowave Nights',
      duration: 24,
      url: url1,
      format: 'wav',
      coverArtUrl: '/src/assets/images/kago_default_cover_1793108092140.jpg',
      coverGradient: generateCoverGradient('Neon Horizon'),
      fileSize: blob1.size,
      bitrate: 705,
      addedAt: Date.now() - 3600000 * 24,
      isFavorite: true,
      fileName: 'AuraStudio_NeonHorizon.wav',
    },
    {
      id: 'demo-2-midnight-rain',
      title: 'Midnight Rain',
      artist: 'Serene Sound',
      album: 'Late Night Coffee',
      duration: 24,
      url: url2,
      format: 'wav',
      coverGradient: generateCoverGradient('Midnight Rain'),
      fileSize: blob2.size,
      bitrate: 705,
      addedAt: Date.now() - 3600000 * 12,
      isFavorite: false,
      fileName: 'SereneSound_MidnightRain.wav',
    },
    {
      id: 'demo-3-solar-wind',
      title: 'Solar Wind',
      artist: 'Nebula Drift',
      album: 'Cosmic Horizons',
      duration: 28,
      url: url3,
      format: 'wav',
      coverGradient: generateCoverGradient('Solar Wind'),
      fileSize: blob3.size,
      bitrate: 705,
      addedAt: Date.now() - 3600000 * 6,
      isFavorite: true,
      fileName: 'NebulaDrift_SolarWind.wav',
    },
    {
      id: 'demo-4-cyber-pulse',
      title: 'Cyber Pulse',
      artist: 'HyperDrive',
      album: 'Future Core',
      duration: 24,
      url: url4,
      format: 'wav',
      coverGradient: generateCoverGradient('Cyber Pulse'),
      fileSize: blob4.size,
      bitrate: 705,
      addedAt: Date.now() - 3600000 * 2,
      isFavorite: false,
      fileName: 'HyperDrive_CyberPulse.wav',
    },
  ];
}

async function synthesizeSynthwave(sampleRate: number, duration: number): Promise<AudioBuffer> {
  const ctx = new OfflineAudioContext(2, sampleRate * duration, sampleRate);
  const bpm = 120;
  const beatTime = 60 / bpm; // 0.5s

  // Bass Synth (A minor: A1, F1, C2, G1)
  const bassNotes = [55, 43.65, 65.41, 49]; // A1, F1, C2, G1
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.7, 0);
  masterGain.connect(ctx.destination);

  // Arpeggio notes: A3 (220), C4 (261.6), E4 (329.6), G4 (392), B4 (493.8), A4 (440)
  const arpNotes = [220, 261.63, 329.63, 392, 440, 392, 329.63, 261.63];

  for (let bar = 0; bar < duration / (beatTime * 4); bar++) {
    const barStart = bar * beatTime * 4;
    const bassFreq = bassNotes[bar % bassNotes.length];

    // Bassline 16th notes
    for (let s = 0; s < 16; s++) {
      const time = barStart + s * (beatTime / 4);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(bassFreq, time);

      // Low pass filter
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, time);
      filter.frequency.exponentialRampToValueAtTime(120, time + 0.1);

      gain.gain.setValueAtTime(0.25, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);

      osc.start(time);
      osc.stop(time + 0.13);
    }

    // Melodic Arpeggio
    for (let step = 0; step < 8; step++) {
      const time = barStart + step * (beatTime / 2);
      const note = arpNotes[(bar * 2 + step) % arpNotes.length];
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(note, time);

      gain.gain.setValueAtTime(0.18, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(time);
      osc.stop(time + 0.36);
    }

    // Drums (Kick & Snare)
    for (let b = 0; b < 4; b++) {
      const beatStartTime = barStart + b * beatTime;

      // Kick on 1, 2, 3, 4
      const kickOsc = ctx.createOscillator();
      const kickGain = ctx.createGain();
      kickOsc.frequency.setValueAtTime(140, beatStartTime);
      kickOsc.frequency.exponentialRampToValueAtTime(40, beatStartTime + 0.1);
      kickGain.gain.setValueAtTime(0.6, beatStartTime);
      kickGain.gain.exponentialRampToValueAtTime(0.001, beatStartTime + 0.2);
      kickOsc.connect(kickGain);
      kickGain.connect(masterGain);
      kickOsc.start(beatStartTime);
      kickOsc.stop(beatStartTime + 0.2);

      // Snare on 2 and 4
      if (b === 1 || b === 3) {
        const noise = ctx.createBufferSource();
        const noiseBuffer = ctx.createBuffer(1, sampleRate * 0.15, sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        noise.buffer = noiseBuffer;

        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.setValueAtTime(1000, beatStartTime);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.3, beatStartTime);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, beatStartTime + 0.14);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(masterGain);
        noise.start(beatStartTime);
        noise.stop(beatStartTime + 0.15);
      }
    }
  }

  return await ctx.startRendering();
}

async function synthesizeLofi(sampleRate: number, duration: number): Promise<AudioBuffer> {
  const ctx = new OfflineAudioContext(2, sampleRate * duration, sampleRate);
  const bpm = 80;
  const beatTime = 60 / bpm; // 0.75s

  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.65, 0);
  masterGain.connect(ctx.destination);

  // Warm Rhodes chords (Dm7, G7, Cmaj7, Am7)
  const chords = [
    [146.83, 174.61, 220.0, 261.63], // Dm7
    [196.0, 246.94, 293.66, 349.23], // G7
    [130.81, 164.81, 196.0, 246.94], // Cmaj7
    [110.0, 130.81, 164.81, 196.0],  // Am7
  ];

  for (let bar = 0; bar < duration / (beatTime * 4); bar++) {
    const barStart = bar * beatTime * 4;
    const chord = chords[bar % chords.length];

    // Play chord tones
    for (const freq of chord) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, barStart);

      // Lowpass for warmth
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(650, barStart);

      gain.gain.setValueAtTime(0.12, barStart);
      gain.gain.exponentialRampToValueAtTime(0.01, barStart + beatTime * 3.5);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);

      osc.start(barStart);
      osc.stop(barStart + beatTime * 3.8);
    }

    // Lo-fi vinyl crackle simulation
    const crackle = ctx.createBufferSource();
    const crackleBuf = ctx.createBuffer(1, sampleRate * (beatTime * 4), sampleRate);
    const cData = crackleBuf.getChannelData(0);
    for (let i = 0; i < cData.length; i++) {
      cData[i] = (Math.random() > 0.995 ? (Math.random() - 0.5) * 0.3 : 0);
    }
    crackle.buffer = crackleBuf;
    const crackleGain = ctx.createGain();
    crackleGain.gain.setValueAtTime(0.08, barStart);
    crackle.connect(crackleGain);
    crackleGain.connect(masterGain);
    crackle.start(barStart);

    // Lo-fi kick & rimshot
    for (let b = 0; b < 4; b++) {
      const bTime = barStart + b * beatTime;
      if (b === 0 || b === 2.5) {
        const kOsc = ctx.createOscillator();
        const kGain = ctx.createGain();
        kOsc.frequency.setValueAtTime(90, bTime);
        kOsc.frequency.exponentialRampToValueAtTime(35, bTime + 0.15);
        kGain.gain.setValueAtTime(0.5, bTime);
        kGain.gain.exponentialRampToValueAtTime(0.001, bTime + 0.2);
        kOsc.connect(kGain);
        kGain.connect(masterGain);
        kOsc.start(bTime);
        kOsc.stop(bTime + 0.2);
      }
    }
  }

  return await ctx.startRendering();
}

async function synthesizeAmbient(sampleRate: number, duration: number): Promise<AudioBuffer> {
  const ctx = new OfflineAudioContext(2, sampleRate * duration, sampleRate);
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.6, 0);
  masterGain.connect(ctx.destination);

  // Pad tones (F major: F2, C3, A3, C4, E4)
  const freqs = [87.31, 130.81, 220.0, 261.63, 329.63];

  freqs.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    // Gentle vibrato
    osc.frequency.setValueAtTime(freq, 0);

    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.setValueAtTime(0.2 + idx * 0.05, 0);
    lfoGain.gain.setValueAtTime(1.5, 0);
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    lfo.start(0);

    gain.gain.setValueAtTime(0.01, 0);
    gain.gain.linearRampToValueAtTime(0.12, 4);
    gain.gain.linearRampToValueAtTime(0.08, duration - 4);
    gain.gain.linearRampToValueAtTime(0.001, duration);

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(0);
    osc.stop(duration);
  });

  return await ctx.startRendering();
}

async function synthesizeElectro(sampleRate: number, duration: number): Promise<AudioBuffer> {
  const ctx = new OfflineAudioContext(2, sampleRate * duration, sampleRate);
  const bpm = 126;
  const beatTime = 60 / bpm;

  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.65, 0);
  masterGain.connect(ctx.destination);

  for (let bar = 0; bar < duration / (beatTime * 4); bar++) {
    const barStart = bar * beatTime * 4;

    for (let b = 0; b < 4; b++) {
      const time = barStart + b * beatTime;

      // Heavy Kick
      const kick = ctx.createOscillator();
      const kGain = ctx.createGain();
      kick.frequency.setValueAtTime(150, time);
      kick.frequency.exponentialRampToValueAtTime(32, time + 0.12);
      kGain.gain.setValueAtTime(0.7, time);
      kGain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);
      kick.connect(kGain);
      kGain.connect(masterGain);
      kick.start(time);
      kick.stop(time + 0.2);

      // Hi-hat on offbeat
      const hatTime = time + beatTime * 0.5;
      const noise = ctx.createBufferSource();
      const nBuf = ctx.createBuffer(1, sampleRate * 0.06, sampleRate);
      const data = nBuf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      noise.buffer = nBuf;
      const hFilter = ctx.createBiquadFilter();
      hFilter.type = 'highpass';
      hFilter.frequency.setValueAtTime(7000, hatTime);
      const hGain = ctx.createGain();
      hGain.gain.setValueAtTime(0.2, hatTime);
      hGain.gain.exponentialRampToValueAtTime(0.001, hatTime + 0.05);
      noise.connect(hFilter);
      hFilter.connect(hGain);
      hGain.connect(masterGain);
      noise.start(hatTime);
      noise.stop(hatTime + 0.06);
    }
  }

  return await ctx.startRendering();
}
