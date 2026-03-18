import { useAppStore } from './store/useAppStore';
import HomePage from './pages/HomePage';
import PrayerWallPage from './pages/PrayerWallPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import Navigation from './components/Navigation';

function App() {
  const { currentPage } = useAppStore();

  return (
    <div className="min-h-screen bg-black">
      {currentPage === 'home' && <HomePage />}
      {currentPage === 'prayer-wall' && <PrayerWallPage />}
      {currentPage === 'profile' && <ProfilePage />}
      {currentPage === 'admin' && <AdminPage />}

      {currentPage !== 'profile' && currentPage !== 'admin' && <Navigation />}
    </div>
  );
}

export default App;
