import 'leaflet/dist/leaflet.css';
import '../styles/styles.css';
import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';

import App from './pages/app';

import { isUserLoggedIn, removeUserToken, getUserToken } from './utils/auth';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

document.addEventListener('DOMContentLoaded', async () => {
  const app = new App({
    content: document.querySelector('#main-content'),
    drawerButton: document.querySelector('#drawer-button'),
    navigationDrawer: document.querySelector('#navigation-drawer'),
  });


  const logoutButton = document.getElementById('logout-button');
  const loginNav = document.getElementById('login-nav');
  const navList = document.getElementById('nav-list');

  if (isUserLoggedIn()) {
    // Tampilkan tombol Add Story & Logout
    logoutButton.style.display = 'block';
    const addStoryLink = document.createElement('li');
    addStoryLink.innerHTML = '<a href="#/add">Tambah Story</a>';
    navList.appendChild(addStoryLink);

    // Sembunyikan tombol Login
    if (loginNav) loginNav.style.display = 'none';

  } else {
    // Sembunyikan tombol Logout
    logoutButton.style.display = 'none';

    // Tampilkan tombol Login 
    if (loginNav) loginNav.style.display = 'block';
  }

  // Event listener untuk Logout 
  logoutButton.addEventListener('click', (e) => {
    e.preventDefault();
    removeUserToken();
    window.location.hash = '#/login';
    window.location.reload();
  });
  // Logika transisi halaman 
  const renderWithTransition = async () => {
    if (!document.startViewTransition) {
      await app.renderPage();
      return;
    }

    document.startViewTransition(async () => {
      await app.renderPage();
    });
  };

  await renderWithTransition();

  window.addEventListener('hashchange', async () => {
    await renderWithTransition();
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      // Cek apakah pesannya adalah permintaan token
      if (event.data && event.data.type === 'GET_TOKEN') {
        console.log('Client: Service Worker meminta token...');
        // Ambil token dari sessionStorage (menggunakan fungsi Anda)
        const token = getUserToken();
        // Kirim balasan token ke Service Worker
        event.ports[0].postMessage({ token: token });
      }
    });
  }

  // fungsi subscribe 
  // Panggil fungsi subscribe jika user sudah login
  if (isUserLoggedIn()) {
    console.log('Client: User login, mendaftarkan Push Notifications...');
    subscribeToPushNotifications();
  }
});





function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}


async function subscribeToPushNotifications() {
  try {
    // Tunggu sampai Service Worker siap
    const swRegistration = await navigator.serviceWorker.ready;

    // Minta Izin Notifikasi ke User
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Izin notifikasi ditolak oleh user.');
      return;
    }

    // Ambil VAPID Public Key (Sudah benar)
    const VAPID_PUBLIC_KEY = 'BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk';

    const options = {
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    };

    const subscription = await swRegistration.pushManager.subscribe(options);
    console.log('Berhasil subscribe Push Notification:', JSON.stringify(subscription));

  } catch (error) {
    console.error('Gagal melakukan subscribe Push Notification:', error);
  }
}