import { describe, it, expect, beforeEach, vi } from 'vitest';
import { isTimerMuted, setTimerMuted, TIMER_SOUND_STORAGE_KEY } from '../../src/lib/utils/timerAudio';
import { useRestTimerStore } from '../../src/lib/stores/useRestTimerStore';

describe('Rest Timer and Server Wall-Clock calculations', () => {
  beforeEach(() => {
    localStorage.clear();
    useRestTimerStore.getState().skip();
  });

  it('calculates remaining rest seconds accurately from target end timestamp', () => {
    const now = Date.now();
    const targetEndTime = now + 45 * 1000; // 45 seconds remaining

    const remainingSeconds = Math.max(0, Math.ceil((targetEndTime - now) / 1000));
    expect(remainingSeconds).toBe(45);
  });

  it('detects timer completion when elapsed time passes even if tab was inactive', () => {
    const pastTime = Date.now() - 5000; // 5 seconds ago
    const remainingSeconds = Math.max(0, Math.ceil((pastTime - Date.now()) / 1000));
    const isExpired = Date.now() >= pastTime;

    expect(remainingSeconds).toBe(0);
    expect(isExpired).toBe(true);
  });

  it('calculates workout elapsed seconds from server startedAt timestamp', () => {
    const startedAt = new Date(Date.now() - 3665 * 1000).toISOString(); // 1 hour, 1 min, 5 sec ago
    const startedMs = new Date(startedAt).getTime();
    const elapsedSeconds = Math.max(0, Math.floor((Date.now() - startedMs) / 1000));

    expect(elapsedSeconds).toBeGreaterThanOrEqual(3665);
    expect(elapsedSeconds).toBeLessThanOrEqual(3667);
  });

  it('stores and retrieves timer sound mute preferences in localStorage', () => {
    expect(isTimerMuted()).toBe(false);

    setTimerMuted(true);
    expect(localStorage.getItem(TIMER_SOUND_STORAGE_KEY)).toBe('true');
    expect(isTimerMuted()).toBe(true);

    setTimerMuted(false);
    expect(localStorage.getItem(TIMER_SOUND_STORAGE_KEY)).toBe('false');
    expect(isTimerMuted()).toBe(false);
  });

  it('resumes rest timer on page reload/re-entry when remaining time exists', async () => {
    // Simulate active timer with 40s remaining saved before page reload / app crash
    const futureTarget = Date.now() + 40 * 1000;
    useRestTimerStore.setState({
      targetEndTime: futureTarget,
      totalSeconds: 90,
      isActive: true,
      isOpen: true,
    });

    // Mock fetch for server sync
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        active: true,
        targetEndTime: new Date(futureTarget).toISOString(),
        totalSeconds: 90,
      }),
    });

    await useRestTimerStore.getState().syncWithServer();

    const state = useRestTimerStore.getState();
    expect(state.isActive).toBe(true);
    expect(state.isOpen).toBe(true);
    expect(state.timeLeft).toBeGreaterThanOrEqual(38);
    expect(state.timeLeft).toBeLessThanOrEqual(40);
  });

  it('marks timer finished on page re-entry if time expired while app was closed', async () => {
    // Simulate timer that expired 10s ago while tab was closed
    const pastTarget = Date.now() - 10 * 1000;
    useRestTimerStore.setState({
      targetEndTime: pastTarget,
      totalSeconds: 90,
      isActive: true,
      isOpen: true,
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        active: false,
        timeLeft: 0,
      }),
    });

    await useRestTimerStore.getState().syncWithServer();

    const state = useRestTimerStore.getState();
    expect(state.isActive).toBe(false);
    expect(state.isFinished).toBe(true);
    expect(state.timeLeft).toBe(0);
  });

  it('cancels active workout immediately, issues DELETE request, and prevents resurrection', async () => {
    const { useWorkoutStore } = await import('../../src/lib/stores/useWorkoutStore');
    useWorkoutStore.getState().startWorkout('Leg Day');
    expect(useWorkoutStore.getState().activeWorkout).not.toBeNull();

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
    global.fetch = fetchMock;

    await useWorkoutStore.getState().cancelWorkout();

    expect(useWorkoutStore.getState().activeWorkout).toBeNull();
    expect(fetchMock).toHaveBeenCalledWith('/api/workouts/active', { method: 'DELETE' });

    // Stale server sync attempt should not resurrect it
    await useWorkoutStore.getState().syncWithServer();
    expect(useWorkoutStore.getState().activeWorkout).toBeNull();
  });
});
