import "leaflet/dist/leaflet.css";
import "../styles/styles.css";
import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";

import App from "./pages/app";
import { isUserLoggedIn, removeUserToken, getUserToken } from "./utils/auth";


delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});


document.addEventListener("DOMContentLoaded", async () => {
  const app = new App({
    content: document.querySelector("#main-content"),
    drawerButton: document.querySelector("#drawer-button"),
    navigationDrawer: document.querySelector("#navigation-drawer"),
  });

  const logoutButton = document.getElementById("logout-button");
  const loginNav = document.getElementById("login-nav");
  const navList = document.getElementById("nav-list"); 

  if (isUserLoggedIn()) {
    // Tampilkan tombol Logout
    logoutButton.style.display = "block";

    // Sembunyikan tombol Login
    if (loginNav) loginNav.style.display = "none";

  } else {
    // Sembunyikan tombol Logout
    logoutButton.style.display = "none";
    // Tampilkan tombol Login
    if (loginNav) loginNav.style.display = "block";
  }

  // Event listener untuk Logout
  logoutButton.addEventListener("click", (e) => {
    e.preventDefault();
    removeUserToken();
    window.location.hash = "#/login";
    window.location.reload();
  });

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
  });

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("message", (event) => {
      // Cek apakah pesannya adalah permintaan token
      if (event.data && event.data.type === "GET_TOKEN") {
        console.log("Client: Service Worker meminta token...");
        const token = getUserToken();
        // Kirim balasan token ke Service Worker
        event.ports[0].postMessage({ token: token });
      }
    });
  }

});