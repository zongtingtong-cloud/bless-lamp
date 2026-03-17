// Lamp Selection Component
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { LampType, useAppStore, useLampTypes } from '../store/useAppStore';

// 默认灯型数据
const defaultLamps = [
  { id: 1, name: '酥油灯', name_en: 'Ghee Lamp', icon: '🪔', description: '传统供养，象征虔诚之心，点亮智慧光明', base_price: 0.0001, color: '#d4a550', is_active: true, sort_order: 1 },
  { id: 2, name: '平安灯', name_en: 'Peace Lamp', icon: '🏮', description: '消灾免难，健康平安，护佑家宅安宁', base_price: 0.0001, color: '#e74c3c', is_active: true, sort_order: 2 },
  { id: 3, name: '智慧灯', name_en: 'Wisdom Lamp', icon: '💡', description: '启迪智慧，学业事业，金榜题名', base_price: 0.0001, color: '#3498db', is_active: true, sort_order: 3 },
  { id: 4, name: '功德灯', name_en: 'Merit Lamp', icon: '✨', description: '累积功德，福泽深厚，回向众生', base_price: 0.0002, color: '#f39c12', is_active: true, sort_order: 4 },
  { id: 5, name: '长寿灯', name_en: 'Longevity Lamp', icon: '🌸', description: '健康长寿，福寿安康，延年益寿', base_price: 0.0002, color: '#e91e63', is_active: true, sort_order: 5 },
  { id: 6, name: '财富灯', name_en: 'Wealth Lamp', icon: '💰', description: '财源广进，富贵吉祥，生意兴隆', base_price: 0.0002, color: '#27ae60', is_active: true, sort_order: 6 }
];

interface LampSelectionProps {
  onSelect: (lamp: LampType) => void;
  selectedLamp?: LampType | null;
}

export default function LampSelection({ onSelect, selectedLamp }: LampSelectionProps) {
  const lampTypes = useLampTypes();
  const loadInitialData = useAppStore((state) => state.loadInitialData);

  useEffect(() => {
    if (lampTypes.length === 0) {
      loadInitialData();
    }
  }, []);

  // 如果store没有数据，使用默认数据
  const displayLamps = lampTypes.length > 0 ? lampTypes : defaultLamps;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-[#d4a550] flex items-center gap-2">
        <span>🪔</span> 选择灯型
      </h3>

      <div className="grid grid-cols-2 gap-3">
        {displayLamps.map((lamp: any, index: number) => (
          <motion.button
            key={lamp.id}
            onClick={() => onSelect(lamp)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`relative p-4 rounded-xl border-2 transition-all ${
              selectedLamp?.id === lamp.id
                ? 'border-[#d4a550] bg-[#d4a550]/10 shadow-lg shadow-[#d4a550]/20'
                : 'border-[#8B4513]/50 bg-black/30 hover:border-[#d4a550]/50'
            }`}
          >
            {selectedLamp?.id === lamp.id && (
              <motion.div
                layoutId="selectedLamp"
                className="absolute top-2 right-2 w-3 h-3 bg-[#d4a550] rounded-full"
              />
            )}

            <div className="flex flex-col items-center gap-2">
              <span className="text-4xl">{lamp.icon}</span>
              <div className="text-center">
                <p className="font-semibold text-white">{lamp.name}</p>
                <p className="text-xs text-gray-400">{lamp.name_en}</p>
              </div>
              <p className="text-xs text-[#d4a550] mt-1">
                ¥{lamp.base_price * 60}/小时
              </p>
            </div>

            {/* Color indicator */}
            <div
              className="absolute bottom-0 left-0 right-0 h-1 rounded-b-xl"
              style={{ backgroundColor: lamp.color }}
            />
          </motion.button>
        ))}
      </div>

      {/* Description */}
      {selectedLamp && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="p-4 bg-[#d4a550]/10 rounded-xl border border-[#d4a550]/30"
        >
          <p className="text-sm text-gray-200">
            <span className="text-[#d4a550] font-semibold">寓意：</span>
            {selectedLamp.description}
          </p>
        </motion.div>
      )}
    </div>
  );
}
