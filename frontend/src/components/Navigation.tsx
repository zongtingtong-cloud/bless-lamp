// Bottom Navigation Component
import { motion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';

export default function Navigation() {
  const { currentPage, setCurrentPage } = useAppStore();

  const navItems = [
    { id: 'home', icon: '🏠', label: '首页' },
    { id: 'prayer-wall', icon: '🧧', label: '祈福墙' },
    { id: 'profile', icon: '👤', label: '我的' },
    { id: 'admin', icon: '📊', label: '管理' }
  ];

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-black via-black/95 to-transparent pb-safe"
    >
      <div className="flex justify-around items-center px-4 py-3 max-w-md mx-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentPage(item.id)}
            className={`flex flex-col items-center gap-1 transition-all ${
              currentPage === item.id
                ? 'text-[#d4a550] scale-110'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <motion.span
              className="text-2xl"
              whileTap={{ scale: 0.9 }}
            >
              {item.icon}
            </motion.span>
            <span className="text-xs">{item.label}</span>
            {currentPage === item.id && (
              <motion.div
                layoutId="activeNav"
                className="absolute -bottom-1 w-8 h-0.5 bg-[#d4a550] rounded-full"
              />
            )}
          </button>
        ))}
      </div>
    </motion.nav>
  );
}
