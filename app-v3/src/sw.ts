/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';

declare const self: ServiceWorkerGlobalScope;

// Ny versjon tar over umiddelbart — uten dette blir den nye service workeren
// stående i «waiting» til ALLE faner/appen lukkes helt, og brukerne fortsetter
// på den gamle precachede versjonen lenge etter deploy.
self.skipWaiting();
clientsClaim();
cleanupOutdatedCaches();

// VitePWA injiserer precache-manifestet her.
precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener('push', (event) => {
  if (!event.data) return;
  let payload: { title: string; body: string; url?: string };
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'GloseMester', body: event.data.text() };
  }
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/icon.png',
      badge: '/icon.png',
      data: payload.url ? { url: payload.url } : undefined,
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url: string | undefined = (event.notification.data as { url?: string } | undefined)?.url;
  if (url) {
    event.waitUntil(
      (self.clients as Clients).openWindow(url),
    );
  }
});
