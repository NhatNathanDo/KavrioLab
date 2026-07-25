// KavrioLab System Web Push Service Worker (M32)

self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const payload = event.data.json();
    const title = payload.title || 'KavrioLab Reminder';
    const options = {
      body: payload.body || 'You have an active workout or habit reminder.',
      icon: payload.icon || '/favicon.ico',
      badge: '/favicon.ico',
      data: { url: payload.url || '/dashboard' },
      tag: payload.tag || 'kavriolab-notification',
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    console.error('Error handling push event:', err);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
