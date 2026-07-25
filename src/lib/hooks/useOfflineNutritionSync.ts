'use client';

import { useState, useEffect, useCallback } from 'react';

export interface QueuedNutritionMutation {
  id: string;
  type: 'LOG_MEAL_ITEM';
  payload: {
    date: string;
    mealName: string;
    foodItemId: string;
    servingQuantity: number;
    unit?: string;
  };
  createdAt: string;
}

const STORAGE_KEY = 'kavriolab_offline_nutrition_queue';

export function useOfflineNutritionSync(onSyncSuccess?: () => void) {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [queue, setQueue] = useState<QueuedNutritionMutation[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Load initial status and queue
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          setQueue(JSON.parse(saved));
        } catch {
          setQueue([]);
        }
      }

      const handleOnline = () => {
        setIsOnline(true);
      };
      const handleOffline = () => {
        setIsOnline(false);
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  const saveQueueToStorage = useCallback((updatedQueue: QueuedNutritionMutation[]) => {
    setQueue(updatedQueue);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedQueue));
    }
  }, []);

  const logMutationOffline = useCallback(
    (mutationPayload: QueuedNutritionMutation['payload']) => {
      const newMutation: QueuedNutritionMutation = {
        id: crypto.randomUUID(),
        type: 'LOG_MEAL_ITEM',
        payload: mutationPayload,
        createdAt: new Date().toISOString(),
      };
      const updated = [...queue, newMutation];
      saveQueueToStorage(updated);
      return newMutation;
    },
    [queue, saveQueueToStorage]
  );

  const syncNow = useCallback(async () => {
    if (!isOnline || queue.length === 0 || isSyncing) return;

    setIsSyncing(true);
    try {
      const response = await fetch('/api/nutrition/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mutations: queue }),
      });

      if (response.ok) {
        saveQueueToStorage([]);
        if (onSyncSuccess) {
          onSyncSuccess();
        }
      }
    } catch (err) {
      console.error('Failed to sync offline nutrition queue:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, queue, isSyncing, saveQueueToStorage, onSyncSuccess]);

  // Automatically try syncing when coming back online
  useEffect(() => {
    if (isOnline && queue.length > 0) {
      syncNow();
    }
  }, [isOnline, queue.length, syncNow]);

  return {
    isOnline,
    queue,
    isSyncing,
    logMutationOffline,
    syncNow,
    clearQueue: () => saveQueueToStorage([]),
  };
}
