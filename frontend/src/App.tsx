import { useAppStore } from './store/useAppStore';
import HomePage from './pages/HomePage';
import PrayerWallPage from './pages/PrayerWallPage';
import ProfilePage from './pages/ProfilePage';
import Navigation from './components/Navigation';

function App() {
  const { currentPage } = useAppStore();

  return (
    <div className="min-h-screen bg-black">
      {currentPage === 'home' && <HomePage />}
      {currentPage === 'prayer-wall' && <PrayerWallPage />}
      {currentPage === 'profile' && <ProfilePage />}

      {currentPage !== 'profile' && <Navigation />}
    </div>
  );
}

export default App;
