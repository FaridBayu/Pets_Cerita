import routes from "../routes/routes.js";
import { getActiveRoute } from "../routes/url-parser.js";
import { isUserLoggedIn } from "../utils/auth.js";

export default class App {
  constructor({ content, drawerButton, navigationDrawer }) {
    this._content = content;
    this._drawerButton = drawerButton;
    this._navigationDrawer = navigationDrawer;

    this._initialDrawer();
  }

  _initialDrawer() {
    this._drawerButton.addEventListener("click", (event) => {
      event.stopPropagation();
      this._navigationDrawer.classList.add("open");
    });

    this._content.addEventListener("click", (event) => {
      event.stopPropagation();
      this._navigationDrawer.classList.remove("open");
    });

    document.body.addEventListener("click", (event) => {
      if (
        !this._navigationDrawer.contains(event.target) &&
        !this._drawerButton.contains(event.target)
      ) {
        this._navigationDrawer.classList.remove("open");
      }
    });
  }

  async renderPage() {
    const url = getActiveRoute();
    const page = routes[url];
    const protectedRoutes = ["/", "/add", "/favorites"];
    const guestOnlyRoutes = ["/login", "/register"];
    const userIsLoggedIn = isUserLoggedIn();

    if (protectedRoutes.includes(url) && !userIsLoggedIn) {
      // Jika mencoba akses halaman dilindungi tapi belum login -> redirect ke login
      window.location.hash = "#/login";
      return;
    }
    if (guestOnlyRoutes.includes(url) && userIsLoggedIn) {
      // Jika mencoba akses halaman login/register tapi sudah login -> redirect ke home
      window.location.hash = "#/";
      return;
    }

    try {
      this._content.innerHTML = await page.render();
      await page.afterRender();

      const mainContent = document.querySelector("#main-content");
      mainContent.focus();
    } catch (error) {
      console.error(error);
      this._content.innerHTML =
        '<p class="container error-message">Halaman tidak ditemukan atau gagal dimuat.</p>';
    }
  }
}
