// Success Modal Component
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SuccessModal({ isOpen, onClose }: SuccessModalProps) {
  const { selectedLamp, selectedPackage, prayerText, prayerTarget } = useAppStore();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          {/* Backdrop with blur */}
          <motion.div
            initial={{ backdropFilter: 'blur(0px)' }}
            animate={{ backdropFilter: 'blur(10px)' }}
            exit={{ backdropFilter: 'blur(0px)' }}
            className="absolute inset-0 bg-black/80"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ type: 'spring', damping: 15, stiffness: 200 }}
            className="relative w-full max-w-md mx-4 bg-gradient-to-b from-[#1a1a2e] to-[#0a0a0a] rounded-3xl p-8 text-center overflow-hidden"
          >
            {/* Fireworks Effect Background */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{
                    x: '50%',
                    y: '50%',
                    scale: 0,
                    opacity: 1
                  }}
                  animate={{
                    x: `${Math.random() * 100}%`,
                    y: `${Math.random() * 100}%`,
                    scale: [0, 1, 0],
                    opacity: [1, 1, 0]
                  }}
                  transition={{
                    duration: 2,
                    delay: i * 0.1,
                    repeat: Infinity,
                    repeatDelay: 3
                  }}
                  className="absolute w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: ['#d4a550', '#ffd700', '#e74c3c', '#07c160'][i % 4]
                  }}
                />
              ))}
            </div>

            {/* Success Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="mb-6"
            >
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-[#d4a550] to-[#ffd700] flex items-center justify-center shadow-lg shadow-[#d4a550]/50">
                <span className="text-5xl">✨</span>
              </div>
            </motion.div>

            {/* Title */}
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-bold text-[#d4a550] mb-2"
            >
              祈福成功
            </motion.h2>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-gray-300 mb-6"
            >
              您的祈福已点燃，照亮前行之路
            </motion.p>

            {/* Blessing Details */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="space-y-3 mb-8 p-4 bg-[#d4a550]/10 rounded-xl border border-[#d4a550]/30"
            >
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl">{selectedLamp?.icon}</span>
                <span className="text-lg text-white font-medium">
                  {selectedLamp?.name}
                </span>
              </div>

              <p className="text-sm text-gray-300 italic">"{prayerText}"</p>

              <p className="text-xs text-gray-500">
                为 {prayerTarget} 祈福 · {selectedPackage?.name}
              </p>
            </motion.div>

            {/* Blessing Message */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mb-8"
            >
              <p className="text-sm text-gray-400">
                愿佛光照耀您和您的家人
                <br />
                消灾解难，增福延寿
              </p>
            </motion.div>

            {/* Actions */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="space-y-3"
            >
              <button
                onClick={onClose}
                className="w-full py-3 bg-gradient-to-r from-[#d4a550] to-[#ffd700] text-black font-bold rounded-xl hover:shadow-lg hover:shadow-[#d4a550]/30 transition-all"
              >
                祈福墙上墙
              </button>

              <button
                onClick={onClose}
                className="w-full py-3 text-gray-400 hover:text-white transition-colors"
              >
                返回首页
              </button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
