import HomePage from "../pages/home/home-page";
import AboutPage from "../pages/about/about-page";
import SubscriptionPage from "../pages/subscription/subscription-page";
import LoginPage from "../pages/auth/login-page";
import RegisterPage from "../pages/auth/register-page";
import AddPage from "../pages/add/add-page";
import FavoritesPage from "../pages/favorites/favorites-page";

const routes = {
  "/": new HomePage(),
  "/about": new AboutPage(),
  "/subscription": new SubscriptionPage(),
  "/login": new LoginPage(),
  "/register": new RegisterPage(),
  "/add": new AddPage(),
  "/favorites": new FavoritesPage(),
};

export default routes;
