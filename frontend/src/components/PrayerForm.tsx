// Prayer Form Component
import { motion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';

interface PrayerFormProps {
  onNext: () => void;
}

export default function PrayerForm({ onNext }: PrayerFormProps) {
  const {
    prayerText,
    setPrayerText,
    prayerTarget,
    setPrayerTarget,
    isAnonymous,
    setIsAnonymous,
    aiSuggestion,
    generateAISuggestion,
    selectedLamp,
    selectedPackage
  } = useAppStore();

  const targets = ['自己', '家人', '父母', '孩子', '朋友', '众生'];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-[#d4a550] flex items-center gap-2">
        <span>🙏</span> 填写祈愿
      </h3>

      {/* Prayer Target */}
      <div className="space-y-2">
        <label className="text-sm text-gray-400">祈福对象</label>
        <div className="flex flex-wrap gap-2">
          {targets.map((target) => (
            <button
              key={target}
              onClick={() => setPrayerTarget(target)}
              className={`px-4 py-2 rounded-full border-2 transition-all ${
                prayerTarget === target
                  ? 'border-[#d4a550] bg-[#d4a550]/20 text-[#d4a550]'
                  : 'border-[#8B4513]/50 bg-black/30 text-gray-300 hover:border-[#d4a550]/50'
              }`}
            >
              {target}
            </button>
          ))}
        </div>
      </div>

      {/* Prayer Text */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm text-gray-400">祈愿内容</label>
          <button
            onClick={generateAISuggestion}
            disabled={!selectedLamp}
            className="text-sm text-[#3498db] hover:text-[#5dade2] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <span>✨</span> AI生成祝福
          </button>
        </div>

        {aiSuggestion && (
          <motion.button
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            onClick={() => setPrayerText(aiSuggestion)}
            className="w-full p-3 bg-gradient-to-r from-[#3498db]/20 to-[#5dade2]/20 border border-[#3498db]/30 rounded-lg text-sm text-gray-200 text-left hover:border-[#3498db]/50 transition-all"
          >
            <p className="text-[#3498db] font-semibold mb-1">✨ AI推荐祝福语</p>
            {aiSuggestion}
          </motion.button>
        )}

        <textarea
          value={prayerText}
          onChange={(e) => setPrayerText(e.target.value)}
          placeholder="请输入您的祈愿内容..."
          maxLength={500}
          rows={4}
          className="w-full p-4 bg-black/30 border-2 border-[#8B4513]/50 rounded-xl text-white placeholder-gray-500 focus:border-[#d4a550] focus:outline-none transition-all resize-none"
        />

        <p className="text-xs text-gray-500 text-right">
          {prayerText.length}/500
        </p>
      </div>

      {/* Anonymous Option */}
      <div className="flex items-center justify-between p-4 bg-black/30 border-2 border-[#8B4513]/50 rounded-xl">
        <div>
          <p className="text-white font-medium">匿名祈福</p>
          <p className="text-xs text-gray-400">匿名后您的昵称将不会显示在祈福墙</p>
        </div>
        <button
          onClick={() => setIsAnonymous(!isAnonymous)}
          className={`relative w-12 h-6 rounded-full transition-all ${
            isAnonymous ? 'bg-[#d4a550]' : 'bg-gray-600'
          }`}
        >
          <motion.div
            animate={{ x: isAnonymous ? 24 : 2 }}
            className="absolute top-1 w-4 h-4 bg-white rounded-full shadow"
          />
        </button>
      </div>

      {/* Continue Button */}
      <motion.button
        onClick={onNext}
        disabled={!prayerText.trim()}
        whileTap={{ scale: 0.98 }}
        className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
          prayerText.trim()
            ? 'bg-gradient-to-r from-[#d4a550] to-[#ffd700] text-black shadow-lg shadow-[#d4a550]/30 hover:shadow-[#d4a550]/50'
            : 'bg-gray-700 text-gray-500 cursor-not-allowed'
        }`}
      >
        {selectedLamp && selectedPackage
          ? `立即祈福 · ¥${(selectedLamp.base_price * selectedPackage.minutes * selectedPackage.discount_rate).toFixed(2)}`
          : '请完善信息'}
      </motion.button>
    </div>
  );
}
