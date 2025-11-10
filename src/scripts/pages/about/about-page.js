// Lokasi: src/pages/about/about-page.js

import {
  getExistingSubscription,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
} from "../../utils/notification-helper"; // <-- 1. PERBAIKAN PATH (sudah benar)
import { isUserLoggedIn } from "../../utils/auth"; // <-- 2. PERBAIKAN PATH (../ menjadi ../../)

export default class AboutPage {
  constructor() {
    this._isSubscribed = false;
    this._notificationButton = null;
  }

  async render() {
    return `
      <section class="container about-page-container">
        <h1>About Page</h1>
        <p>Apakah anda ingin Berlangganan ?.</p>
        
        <div id="notification-settings" class="notification-settings" style="display: none;">
          <h2>Notifikasi</h2>
          <p>Subscribe untuk mendapatkan notifikasi cerita baru secara manual.</p>
          <button id="notification-toggle-button" class="button-primary">
            Cek Status Notifikasi...
          </button>
        </div>
      </section>
    `;
  }

  async afterRender() {
    // Hanya tampilkan jika user login
    if (!isUserLoggedIn()) return;

    const notificationSettings = document.getElementById(
      "notification-settings"
    );
    notificationSettings.style.display = "block";

    this._notificationButton = document.getElementById(
      "notification-toggle-button"
    );

    // Inisialisasi status tombol
    await this._updateNotificationButtonState();

    // Tambahkan listener
    this._notificationButton.addEventListener(
      "click",
      this._handleNotificationToggle.bind(this)
    );
  }

  /**
   * Cek status izin dan subscription, lalu perbarui tombolnya
   */
  async _updateNotificationButtonState() {
    if (!this._notificationButton) return;

    try {
      // Cek izin dulu
      const permission = Notification.permission;
      if (permission === "denied") {
        this._notificationButton.textContent = "Notifikasi Diblokir";
        this._notificationButton.disabled = true;
        return;
      }

      const subscription = await getExistingSubscription();
      this._isSubscribed = !!subscription;

      if (this._isSubscribed) {
        this._notificationButton.textContent = "Unsubscribe Notifikasi";
        this._notificationButton.classList.add("button-delete"); // Tambah kelas merah
      } else {
        this._notificationButton.textContent = "Subscribe Notifikasi";
        this._notificationButton.classList.remove("button-delete"); // Hapus kelas merah
      }
      this._notificationButton.disabled = false;
    } catch (error) {
      console.error("Gagal cek subscription:", error);
      this._notificationButton.textContent = "Gagal Cek Status";
      this._notificationButton.disabled = true;
    }
  }

  /**
   * Menangani klik tombol subscribe/unsubscribe
   * (Fungsi yang terpotong kini sudah lengkap)
   */
  async _handleNotificationToggle() {
    if (!this._notificationButton) return;

    this._notificationButton.disabled = true;
    this._notificationButton.textContent = "Memproses...";

    try {
      if (this._isSubscribed) {
        // Lakukan Unsubscribe
        await unsubscribeFromPushNotifications();
        alert("Berhasil unsubscribe notifikasi.");
      } else {
        // Lakukan Subscribe
        await subscribeToPushNotifications();
        alert("Berhasil subscribe notifikasi!");
      }
    } catch (error) {
      console.error("Aksi notifikasi gagal:", error);
      alert(`Gagal: ${error.message}`);
    }

    // Perbarui status tombol setelah aksi selesai
    await this._updateNotificationButtonState();
  }
}
