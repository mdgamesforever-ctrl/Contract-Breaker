'use strict';
/* Contract Breaker -- lightweight placeholder audio manager.
 *
 * Every sound here is synthesized at runtime with the Web Audio API
 * (oscillators + gain envelopes) rather than loaded from real audio files --
 * there are no music/SFX files in the project yet, by design (see
 * ASSET_TODO.md for what real audio should eventually replace each one).
 * This keeps the whole thing self-contained (no binary assets, nothing to
 * fetch) while still giving every screen music and every key event an SFX.
 *
 * Browsers block audio before a user gesture, so AudioManager.init() must
 * be called from within a real click/tap handler -- app.js does this once,
 * on the first pointerdown anywhere in the page.
 */
const AudioManager = (() => {
  let ctx = null;
  let muted = false;
  let musicNodes = null; // { stop() } for whatever loop is currently playing
  let currentMusicName = null;

  function ensureContext() {
    if (ctx) return ctx;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    ctx = new Ctx();
    return ctx;
  }

  function init() {
    const c = ensureContext();
    if (c && c.state === 'suspended') c.resume().catch(() => {});
  }

  function setMuted(value) {
    muted = value;
  }

  function isMuted() {
    return muted;
  }

  function toggleMuted() {
    muted = !muted;
    if (muted) stopMusic();
    return muted;
  }

  // ---- One-shot SFX: short oscillator envelopes, no persistent state. ----
  function tone(freq, { duration = 0.18, type = 'sine', startGain = 0.18, delay = 0 } = {}) {
    if (muted) return;
    const c = ensureContext();
    if (!c) return;
    const t0 = c.currentTime + delay;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(startGain, t0 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  }

  function noiseBurst({ duration = 0.15, startGain = 0.2 } = {}) {
    if (muted) return;
    const c = ensureContext();
    if (!c) return;
    const t0 = c.currentTime;
    const bufferSize = Math.floor(c.sampleRate * duration);
    const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const src = c.createBufferSource();
    src.buffer = buffer;
    const gain = c.createGain();
    gain.gain.setValueAtTime(startGain, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    const filter = c.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 900;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(c.destination);
    src.start(t0);
  }

  const SFX = {
    cardPlay: () => tone(520, { duration: 0.12, type: 'triangle', startGain: 0.12 }),
    damage: () => noiseBurst({ duration: 0.16, startGain: 0.22 }),
    victory: () => {
      [523, 659, 784, 1047].forEach((freq, i) => tone(freq, { duration: 0.3, type: 'triangle', startGain: 0.14, delay: i * 0.11 }));
    },
    defeat: () => {
      [392, 349, 311, 262].forEach((freq, i) => tone(freq, { duration: 0.4, type: 'sawtooth', startGain: 0.12, delay: i * 0.14 }));
    },
    anchor: () => tone(90, { duration: 0.6, type: 'sine', startGain: 0.22 }),
    graft: () => {
      tone(880, { duration: 0.2, type: 'sine', startGain: 0.14 });
      tone(1318, { duration: 0.25, type: 'sine', startGain: 0.1, delay: 0.06 });
    },
    // Soft, gentle -- deliberately not a fanfare; mercy is a quiet choice.
    mercy: () => {
      tone(392, { duration: 0.5, type: 'sine', startGain: 0.1 });
      tone(494, { duration: 0.6, type: 'sine', startGain: 0.08, delay: 0.12 });
    },
  };

  function sfx(name) {
    const fn = SFX[name];
    if (fn) fn();
  }

  // ---- Looping ambient music per screen: a couple of detuned drones. ----
  function stopMusic() {
    if (musicNodes) {
      try {
        musicNodes.stop();
      } catch (e) {
        /* already stopped */
      }
      musicNodes = null;
    }
    currentMusicName = null;
  }

  const MUSIC_PROFILES = {
    title: { freqs: [110, 165], type: 'sine', gain: 0.05, pulse: null },
    map: { freqs: [98, 147, 220], type: 'sine', gain: 0.045, pulse: null },
    combat: { freqs: [130.81, 196], type: 'triangle', gain: 0.05, pulse: 0.9 },
    boss: { freqs: [87.31, 130.81, 174.61], type: 'sawtooth', gain: 0.045, pulse: 1.6 },
  };

  function playMusic(name) {
    if (currentMusicName === name) return;
    stopMusic();
    currentMusicName = name;
    if (muted) return;
    const profile = MUSIC_PROFILES[name] || MUSIC_PROFILES.map;
    const c = ensureContext();
    if (!c) return;

    const master = c.createGain();
    master.gain.setValueAtTime(0, c.currentTime);
    master.gain.linearRampToValueAtTime(profile.gain, c.currentTime + 1.2);
    master.connect(c.destination);

    const oscillators = profile.freqs.map((freq) => {
      const osc = c.createOscillator();
      osc.type = profile.type;
      osc.frequency.value = freq;
      osc.connect(master);
      osc.start();
      return osc;
    });

    let pulseInterval = null;
    if (profile.pulse) {
      pulseInterval = setInterval(() => {
        if (muted) return;
        const now = c.currentTime;
        master.gain.cancelScheduledValues(now);
        master.gain.setValueAtTime(profile.gain, now);
        master.gain.linearRampToValueAtTime(profile.gain * 0.5, now + profile.pulse / 2);
        master.gain.linearRampToValueAtTime(profile.gain, now + profile.pulse);
      }, profile.pulse * 1000);
    }

    musicNodes = {
      stop() {
        if (pulseInterval) clearInterval(pulseInterval);
        const now = c.currentTime;
        master.gain.cancelScheduledValues(now);
        master.gain.setValueAtTime(master.gain.value, now);
        master.gain.linearRampToValueAtTime(0, now + 0.3);
        oscillators.forEach((osc) => {
          try {
            osc.stop(now + 0.32);
          } catch (e) {
            /* already stopped */
          }
        });
      },
    };
  }

  return { init, sfx, playMusic, stopMusic, setMuted, isMuted, toggleMuted };
})();
