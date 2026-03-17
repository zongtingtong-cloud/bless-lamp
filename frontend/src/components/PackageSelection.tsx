// Package Selection Component
import { motion } from 'framer-motion';
import { TimePackage, useAppStore, useTimePackages } from '../store/useAppStore';

// 默认套餐数据
const defaultPackages = [
  { id: 1, name: '体验祈福', minutes: 60, original_price: 0.36, discount_price: 0.36, discount_rate: 1.00, label: '体验', is_active: true, sort_order: 1 },
  { id: 2, name: '一日虔心', minutes: 1440, original_price: 8.64, discount_price: 5.18, discount_rate: 0.60, label: '6折', is_active: true, sort_order: 2 },
  { id: 3, name: '七日修行', minutes: 10080, original_price: 60.48, discount_price: 36.29, discount_rate: 0.60, label: '6折', is_active: true, sort_order: 3 },
  { id: 4, name: '月度供奉', minutes: 43200, original_price: 259.20, discount_price: 155.52, discount_rate: 0.60, label: '6折', is_active: true, sort_order: 4 },
  { id: 5, name: '年度功德', minutes: 525600, original_price: 3153.60, discount_price: 1892.16, discount_rate: 0.60, label: '6折', is_active: true, sort_order: 5 },
  { id: 6, name: '终生光明', minutes: 5256000, original_price: 31536.00, discount_price: 15768.00, discount_rate: 0.50, label: '5折', is_active: true, sort_order: 6 }
];

interface PackageSelectionProps {
  onSelect: (pkg: TimePackage) => void;
  selectedPackage?: TimePackage | null;
}

export default function PackageSelection({ onSelect, selectedPackage }: PackageSelectionProps) {
  const { currentUser, selectedLamp } = useAppStore();
  const timePackages = useTimePackages();

  // 如果store没有数据，使用默认数据
  const displayPackages = timePackages.length > 0 ? timePackages : defaultPackages;

  // 计算价格
  const getPrice = (pkg: any) => {
    if (!selectedLamp) return pkg.discount_price || pkg.original_price;
    const basePrice = selectedLamp.base_price * pkg.minutes;
    const withDiscount = basePrice * pkg.discount_rate;
    const memberDiscount = currentUser?.membership_level === 'yearly' ? 0.6 :
                          currentUser?.membership_level === 'monthly' ? 0.8 : 1;
    return Math.round(withDiscount * memberDiscount * 100) / 100;
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-[#d4a550] flex items-center gap-2">
        <span>⏱️</span> 选择时长
      </h3>

      <div className="space-y-2">
        {displayPackages.map((pkg: any, index: number) => {
          const price = getPrice(pkg);

          return (
            <motion.button
              key={pkg.id}
              onClick={() => onSelect(pkg)}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between ${
                selectedPackage?.id === pkg.id
                  ? 'border-[#d4a550] bg-[#d4a550]/10 shadow-lg shadow-[#d4a550]/20'
                  : 'border-[#8B4513]/50 bg-black/30 hover:border-[#d4a550]/50'
              }`}
            >
              <div className="flex items-center gap-3">
                {selectedPackage?.id === pkg.id && (
                  <motion.div
                    layoutId="selectedPackage"
                    className="w-5 h-5 rounded-full bg-[#d4a550] flex items-center justify-center"
                  >
                    <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </motion.div>
                )}

                <div className="text-left">
                  <p className="font-semibold text-white">{pkg.name}</p>
                  <p className="text-xs text-gray-400">
                    {pkg.minutes >= 525600
                      ? '永久'
                      : pkg.minutes >= 1440
                        ? `${Math.floor(pkg.minutes / 1440)}天`
                        : pkg.minutes >= 60
                          ? `${Math.floor(pkg.minutes / 60)}小时`
                          : `${pkg.minutes}分钟`}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-lg font-bold text-[#d4a550]">
                  ¥{price.toFixed(2)}
                </p>
                {pkg.discount_rate < 1 && (
                  <div className="flex items-center gap-1 justify-end">
                    <span className="text-xs text-gray-500 line-through">
                      ¥{pkg.original_price.toFixed(2)}
                    </span>
                    <span className="px-1.5 py-0.5 bg-[#e74c3c] text-white text-xs rounded">
                      {Math.round(pkg.discount_rate * 100)}折
                    </span>
                  </div>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Package Label */}
      {selectedPackage && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <span className="inline-block px-4 py-1 bg-gradient-to-r from-[#d4a550] to-[#ffd700] text-black text-sm font-bold rounded-full">
            {selectedPackage.label}
          </span>
        </motion.div>
      )}
    </div>
  );
}
