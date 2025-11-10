// Lokasi: src/scripts/index.js

import "leaflet/dist/leaflet.css";
import "../styles/styles.css";
import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";

import App from "./pages/app";
// HAPUS 'import StoryApi from './data/api';' (sudah tidak perlu di sini)
import { isUserLoggedIn, removeUserToken, getUserToken } from "./utils/auth";

// --- Kode Perbaikan Ikon Leaflet - TIDAK BERUBAH ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});
// --- Akhir Kode ---

document.addEventListener("DOMContentLoaded", async () => {
  const app = new App({
    content: document.querySelector("#main-content"),
    drawerButton: document.querySelector("#drawer-button"),
    navigationDrawer: document.querySelector("#navigation-drawer"),
  }); // --- Kode Setup Nav & Logout - TIDAK BERUBAH ---

  const logoutButton = document.getElementById("logout-button");
  const loginNav = document.getElementById("login-nav");
  const navList = document.getElementById("nav-list");

  if (isUserLoggedIn()) {
    logoutButton.style.display = "block";
    const addStoryLink = document.createElement("li");
    addStoryLink.innerHTML = '<a href="#/add">Tambah Story</a>';
    navList.appendChild(addStoryLink);
    if (loginNav) loginNav.style.display = "none";
  } else {
    logoutButton.style.display = "none";
    if (loginNav) loginNav.style.display = "block";
  }
  logoutButton.addEventListener("click", (e) => {
    e.preventDefault();
    removeUserToken();
    window.location.hash = "#/login";
    window.location.reload();
  }); // --- Kode Transisi Halaman - TIDAK BERUBAH ---
  // --- Akhir Kode ---

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
  window.addEventListener("hashchange", async () => {
    await renderWithTransition();
  }); // --- Kode Listener GET_TOKEN - TIDAK BERUBAH ---
  // --- Akhir Kode ---

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data && event.data.type === "GET_TOKEN") {
        console.log("Client: Service Worker meminta token...");
        const token = getUserToken();
        event.ports[0].postMessage({ token: token });
      }
    });
  }
  // --- Akhir Kode ---
});
