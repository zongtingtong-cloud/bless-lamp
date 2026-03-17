// Header Component
import { useAppStore } from '../store/useAppStore';
import { motion } from 'framer-motion';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
}

export default function Header({ title = '云端祈福坛', showBack = false, onBack }: HeaderProps) {
  const { currentUser, isLoggedIn, login } = useAppStore();

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 to-transparent px-4 py-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {showBack && (
            <button
              onClick={onBack}
              className="text-[#d4a550] hover:text-[#ffd700] transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <h1 className="text-xl font-bold text-[#d4a550]">{title}</h1>
        </div>

        <div className="flex items-center gap-3">
          {isLoggedIn && currentUser ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-[#d4a550]">
                <img
                  src={currentUser.avatar_url}
                  alt={currentUser.nickname}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-sm text-[#d4a550] hidden sm:inline">{currentUser.nickname}</span>
            </div>
          ) : (
            <button
              onClick={login}
              className="px-4 py-2 bg-gradient-to-r from-[#d4a550] to-[#ffd700] text-black rounded-full text-sm font-semibold hover:shadow-lg hover:shadow-[#d4a550]/30 transition-all"
            >
              登录
            </button>
          )}
        </div>
      </div>
    </motion.header>
  );
}
