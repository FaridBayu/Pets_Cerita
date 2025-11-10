// Lokasi: src/sw.js
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import CONFIG from './scripts/config'; // Impor CONFIG
import StoryApi from './scripts/data/api'; // Impor API helper Anda
import StoryDb from './scripts/utils/db'; // Impor DB helper Anda

console.log('Custom Service Worker is running!');

// 1. Bersihkan cache lama
cleanupOutdatedCaches();

// 2. Pre-cache App Shell (diurus otomatis oleh vite-plugin-pwa)
// Variabel __WB_MANIFEST akan disuntikkan oleh plugin
precacheAndRoute(self.__WB_MANIFEST);

// 3. Caching API (Kriteria 3 Advanced - Stale-While-Revalidate)

registerRoute(
    ({ url }) => url.href.startsWith(CONFIG.BASE_URL),
    new StaleWhileRevalidate({
        cacheName: 'story-api-cache',
        plugins: [
            new CacheableResponsePlugin({ statuses: [0, 200] }),
            new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 30 * 24 * 60 * 60 }), // Cache 30 hari
        ],
    }),
    'GET' // Hanya cache request GET
);

// 4. Push Notification (Kriteria 2)
self.addEventListener('push', (event) => {
    console.log('Service Worker: Push received');

    const data = event.data.json();
    const title = data.title || 'Peta Cerita';
    const options = {
        body: data.body || 'Ada notifikasi baru!',
        icon: '/images/logo-192.png', // Path dari public folder
        badge: '/images/logo-192.png', // Path dari public folder
        data: {
            url: data.url || '/' // URL untuk dibuka
        },
        // Kriteria 2 Advanced (Actions)
        actions: [
            { action: 'open_url', title: 'Buka Cerita' },
            { action: 'close', title: 'Tutup' }
        ]
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

// 5. Notification Click Handler (Kriteria 2 Advanced)
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const urlToOpen = event.notification.data.url;

    if (event.action === 'open_url' || !event.action) {
        event.waitUntil(clients.openWindow(urlToOpen));
    }
});

// 6. Background Sync (Kriteria 4 Advanced)
self.addEventListener('sync', (event) => {
    console.log('Service Worker: Sync event triggered!', event.tag);
    if (event.tag === 'sync-new-stories') {
        event.waitUntil(syncOutboxStories());
    }
});

// Helper untuk mengambil token dari client (sessionStorage tidak bisa diakses SW)
async function getTokenFromClient() {
    const clients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
    if (clients.length === 0) return null;

    return new Promise((resolve) => {
        const channel = new MessageChannel();
        channel.port1.onmessage = (event) => {
            resolve(event.data.token);
        };
        // Kirim pesan ke client pertama yang ditemukan
        clients[0].postMessage({ type: 'GET_TOKEN' }, [channel.port2]);
    });
}

// Fungsi untuk sync (Kriteria 4 Advanced)
async function syncOutboxStories() {
    console.log('Service Worker: Syncing outbox stories...');
    try {
        const stories = await StoryDb.getAllOutboxStories();
        if (stories.length === 0) {
            console.log('Service Worker: Outbox is empty.');
            return;
        }

        const token = await getTokenFromClient();
        if (!token) {
            console.error('Service Worker: Sync failed, no token from client.');
            return; // Coba lagi di sync berikutnya
        }

        for (const story of stories) {
            console.log('Service Worker: Trying to sync story ID:', story.id);

            const formData = new FormData();
            formData.append('photo', story.photo); // 'story.photo' adalah File/Blob
            formData.append('description', story.description);
            formData.append('lat', story.lat);
            formData.append('lon', story.lon);

            // Gunakan StoryApi.addNewStory
            // Pastikan 'addNewStory' di-ekspor dengan benar (bukan hanya 'default')
            // Jika StoryApi adalah 'export default', ini tidak akan berfungsi.
            // Asumsi: StoryApi adalah kelas dengan metode statis.
            const response = await StoryApi.addNewStory(token, formData);

            if (!response.error) {
                console.log('Service Worker: Story synced successfully!', story.id);
                await StoryDb.deleteOutboxStory(story.id); // Hapus dari outbox
            } else {
                console.error('Service Worker: Sync failed for story ID:', story.id, response.message);
            }
        }

    } catch (error) {
        console.error('Service Worker: Error during sync:', error);
    }
}