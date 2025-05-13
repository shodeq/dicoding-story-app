import HomePage from '../pages/home/home-page';
import AboutPage from '../pages/about/about-page';
import LoginPage from '../pages/auth/login-page';
import RegisterPage from '../pages/auth/register-page';
import AddStoryPage from '../pages/story/add-story-page';
import DetailStoryPage from '../pages/story/detail-story-page';
import FavoritePage from '../pages/favorite/favorite-page';
import NotFoundPage from '../pages/not-found-page';

const routes = {
  '/': new HomePage(),
  '/about': new AboutPage(),
  '/login': new LoginPage(),
  '/register': new RegisterPage(),
  '/add': new AddStoryPage(),
  '/story/:id': new DetailStoryPage(),
  '/favorite': new FavoritePage(),  // Pastikan route ini ada
  '/not-found': new NotFoundPage(),
};

export default routes;