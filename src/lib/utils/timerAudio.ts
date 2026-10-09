'use client';

// Web Audio API based chime synthesizer for timer alerts.
// Works reliably across all browsers without external audio assets.

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtxClass) return null;

  if (!audioCtx || audioCtx.state === 'closed') {
    audioCtx = new AudioCtxClass();
  }

  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {
      // Audio context resume might require direct user interaction
    });
  }

  return audioCtx;
}

export const TIMER_SOUND_STORAGE_KEY = 'kavrio_timer_sound_muted';

export function isTimerMuted(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(TIMER_SOUND_STORAGE_KEY) === 'true';
}

export function setTimerMuted(muted: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TIMER_SOUND_STORAGE_KEY, muted ? 'true' : 'false');
}

/**
 * Play a multi-tone countdown completion chime
 */
export function playRestCompleteSound(): void {
  if (isTimerMuted()) return;

  // Trigger haptic vibration on mobile devices
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate([200, 100, 200, 100, 400]);
    } catch {
      // Ignore vibration errors if blocked by browser policy
    }
  }

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // Sequence: 3 cheerful ascending beeps followed by a sustained chime
    const notes = [
      { freq: 659.25, start: 0.0, duration: 0.12 },   // E5
      { freq: 783.99, start: 0.14, duration: 0.12 },  // G5
      { freq: 1046.5, start: 0.28, duration: 0.45 },  // C6 (high finish)
    ];

    notes.forEach(({ freq, start, duration }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + start);

      // Smooth attack and exponential decay to prevent audio pops
      gain.gain.setValueAtTime(0.001, now + start);
      gain.gain.exponentialRampToValueAtTime(0.3, now + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + start);
      osc.stop(now + start + duration + 0.05);
    });
  } catch (err) {
    console.warn('Audio playback not allowed or failed:', err);
  }
}
