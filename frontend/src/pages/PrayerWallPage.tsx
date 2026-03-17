// Prayer Wall Page
import { useState } from 'react';
import { motion } from 'framer-motion';
import Header from '../components/Header';
import { useAppStore } from '../store/useAppStore';
import { formatRelativeTime } from '../services/mockData';

export default function PrayerWallPage() {
  const { prayerWall, likePrayer, currentUser } = useAppStore();
  const [filter, setFilter] = useState<'all' | 'mine'>('all');

  const filteredWall = filter === 'mine'
    ? prayerWall.filter(item => item.user_id === currentUser?.id)
    : prayerWall;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] via-[#1a1a2e] to-[#0a0a0a]">
      <Header title="祈福墙" />

      <div className="pt-20 px-4 pb-24">
        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 grid grid-cols-3 gap-3"
        >
          <div className="p-3 bg-[#d4a550]/10 rounded-xl text-center border border-[#d4a550]/20">
            <p className="text-2xl font-bold text-[#d4a550]">{prayerWall.length}</p>
            <p className="text-xs text-gray-400">今日祈福</p>
          </div>
          <div className="p-3 bg-[#e74c3c]/10 rounded-xl text-center border border-[#e74c3c]/20">
            <p className="text-2xl font-bold text-[#e74c3c]">
              {prayerWall.reduce((acc, item) => acc + item.likes, 0)}
            </p>
            <p className="text-xs text-gray-400">累计功德</p>
          </div>
          <div className="p-3 bg-[#27ae60]/10 rounded-xl text-center border border-[#27ae60]/20">
            <p className="text-2xl font-bold text-[#27ae60]">
              {prayerWall.filter(item => {
                const date = new Date(item.created_at);
                const today = new Date();
                return date.toDateString() === today.toDateString();
              }).length}
            </p>
            <p className="text-xs text-gray-400">实时祈福</p>
          </div>
        </motion.div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === 'all'
                ? 'bg-[#d4a550] text-black'
                : 'bg-black/30 text-gray-400 hover:text-white'
            }`}
          >
            全部
          </button>
          <button
            onClick={() => setFilter('mine')}
            disabled={!currentUser}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === 'mine'
                ? 'bg-[#d4a550] text-black'
                : 'bg-black/30 text-gray-400 hover:text-white disabled:opacity-50'
            }`}
          >
            我的祈福
          </button>
        </div>

        {/* Prayer List */}
        <div className="space-y-4">
          {filteredWall.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-4 bg-gradient-to-r from-[#1a1a2e] to-[#0a0a0a] rounded-xl border border-[#8B4513]/30 overflow-hidden relative"
            >
              {/* Glowing border */}
              <div
                className="absolute left-0 top-0 bottom-0 w-1"
                style={{ backgroundColor: item.lamp_color }}
              />

              <div className="flex items-start gap-3">
                {/* Lamp Icon */}
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-2xl shrink-0"
                  style={{
                    backgroundColor: `${item.lamp_color}20`,
                    border: `2px solid ${item.lamp_color}`
                  }}
                >
                  {item.lamp_icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-sm font-medium"
                      style={{ color: item.lamp_color }}
                    >
                      {item.lamp_type_name}
                    </span>
                    <span className="text-xs text-gray-500">•</span>
                    <span className="text-xs text-gray-500">
                      {item.prayer_target}
                    </span>
                  </div>

                  <p className="text-sm text-gray-200 mb-2 line-clamp-2">
                    "{item.prayer_text}"
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {item.nickname} · {formatRelativeTime(item.created_at)}
                    </span>

                    <button
                      onClick={() => likePrayer(item.id)}
                      className="flex items-center gap-1 text-gray-400 hover:text-[#e74c3c] transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      <span className="text-xs">{item.likes}</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {filteredWall.length === 0 && (
          <div className="text-center py-12">
            <span className="text-6xl mb-4 block">🪔</span>
            <p className="text-gray-400">
              {filter === 'mine' ? '您还没有祈福过' : '暂无祈福记录'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
