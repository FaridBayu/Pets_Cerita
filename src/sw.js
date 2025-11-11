import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';

import StoryApi from './scripts/data/api';
import StoryDb from './scripts/utils/db';

console.log('Custom Service Worker is running!');

cleanupOutdatedCaches();


precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener('push', (event) => {
    console.log('Service Worker: Push received');
    let data;

    try {
        data = event.data.json();
    } catch (e) {
        data = { body: event.data.text() };
    }

    const title = data.title || 'Peta Cerita';
    const options = {
        body: data.body || 'Ada notifikasi baru!',
        icon: '/images/logo-192.png',
        badge: '/images/logo-192.png',
        data: {
            url: data.url || '/'
        },
        actions: [
            { action: 'open_url', title: 'Buka Cerita' },
            { action: 'close', title: 'Tutup' }
        ]
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const urlToOpen = event.notification.data.url;
    if (event.action === 'open_url' || !event.action) {
        event.waitUntil(clients.openWindow(urlToOpen));
    }
});

self.addEventListener('sync', (event) => {
    console.log('Service Worker: Sync event triggered!', event.tag);
    if (event.tag === 'sync-new-stories') {
        event.waitUntil(syncOutboxStories());
    }
});

async function getTokenFromClient() {
    const clients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
    if (clients.length === 0) return null;

    return new Promise((resolve) => {
        const channel = new MessageChannel();
        channel.port1.onmessage = (event) => {
            resolve(event.data.token);
        };
        clients[0].postMessage({ type: 'GET_TOKEN' }, [channel.port2]);
    });
}


async function syncOutboxStories() {
    console.log('Service Worker: Syncing outbox stories...');
    try {
        const stories = await StoryDb.getAllOutboxStories();
    } catch (error) {
        console.error('Service Worker: Error during sync:', error);
    }
}