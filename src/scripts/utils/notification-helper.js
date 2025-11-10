// Lokasi: src/scripts/utils/notification-helper.js

import StoryApi from "../data/api";
import { getUserToken } from "./auth";

// --- Fungsi Helper Bawaan (dari index.js) ---
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// --- Fungsi Baru (Kriteria 2 Advanced) ---

/**
 * Mengambil subscription yang ada saat ini
 */
const getExistingSubscription = async () => {
  if (!("serviceWorker" in navigator)) {
    throw new Error("Service Worker tidak didukung");
  }
  const swRegistration = await navigator.serviceWorker.ready;
  return swRegistration.pushManager.getSubscription();
};

/**
 * Mendaftarkan user ke Push Notification (CREATE)
 */
const subscribeToPushNotifications = async () => {
  const swRegistration = await navigator.serviceWorker.ready;

  // 1. Minta Izin
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Izin notifikasi ditolak oleh user.");
  }

  // 2. VAPID Key Anda
  const VAPID_PUBLIC_KEY =
    "BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk";

  // 3. Subscribe ke Browser
  const options = {
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  };
  const subscription = await swRegistration.pushManager.subscribe(options);
  console.log("Berhasil subscribe ke browser:", JSON.stringify(subscription));

  // 4. KIRIM SUBSCRIPTION KE SERVER API
  const token = getUserToken();
  if (!token) {
    throw new Error("Tidak ada token, tidak bisa subscribe ke server API.");
  }

  const response = await StoryApi.subscribeNotification(token, subscription);
  if (response.error) {
    throw new Error(response.message);
  }

  console.log("Berhasil subscribe ke server API Dicoding!", response.data);
  return subscription;
};

/**
 * Membatalkan pendaftaran Push Notification (DELETE)
 */
const unsubscribeFromPushNotifications = async () => {
  const token = getUserToken();
  if (!token) {
    throw new Error("Tidak ada token, tidak bisa unsubscribe.");
  }

  const subscription = await getExistingSubscription();
  if (!subscription) {
    throw new Error("Tidak ada subscription untuk di-unsubscribe.");
  }

  // 1. KIRIM DELETE KE SERVER API
  const response = await StoryApi.unsubscribeNotification(
    token,
    subscription.endpoint
  );
  if (response.error) {
    throw new Error(`Gagal unsubscribe dari server API: ${response.message}`);
  }

  // 2. HAPUS DARI BROWSER
  await subscription.unsubscribe();

  console.log("Berhasil unsubscribe dari server API dan browser!");
};

export {
  getExistingSubscription,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  urlBase64ToUint8Array,
};
