// Profile Page
import { useState } from 'react';
import { motion } from 'framer-motion';
import Header from '../components/Header';
import Navigation from '../components/Navigation';
import {
  useAppStore,
  useMembershipRules,
  useRechargePackages
} from '../store/useAppStore';
import { formatRelativeTime } from '../services/mockData';

export default function ProfilePage() {
  const {
    currentUser,
    isLoggedIn,
    login,
    logout,
    orders,
    activeLamps,
    recharge,
    setShowPaymentModal
  } = useAppStore();

  const [showRecharge, setShowRecharge] = useState(false);
  const [activeTab, setActiveTab] = useState<'orders' | 'lamps' | 'membership'>('orders');

  const membershipRules = useMembershipRules();
  const rechargePackages = useRechargePackages();

  if (!isLoggedIn || !currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] via-[#1a1a2e] to-[#0a0a0a] flex flex-col items-center justify-center px-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-8xl mb-6"
        >
          🪔
        </motion.div>
        <h2 className="text-2xl font-bold text-[#d4a550] mb-4">云端祈福坛</h2>
        <p className="text-gray-400 text-center mb-8">
          登录后查看您的祈福记录和专属权益
        </p>
        <motion.button
          onClick={login}
          whileTap={{ scale: 0.95 }}
          className="px-8 py-3 bg-gradient-to-r from-[#d4a550] to-[#ffd700] text-black font-bold rounded-full"
        >
          微信一键登录
        </motion.button>
      </div>
    );
  }

  const membership = membershipRules.find(m => m.level === currentUser.membership_level);
  const perks = membership?.perks?.split('|') || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] via-[#1a1a2e] to-[#0a0a0a]">
      <Header title="个人中心" />

      <div className="pt-20 px-4 pb-24 space-y-6">
        {/* User Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-gradient-to-r from-[#1a1a2e] to-[#0a0a0a] rounded-2xl border border-[#d4a550]/30"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#d4a550]">
              <img
                src={currentUser.avatar_url}
                alt={currentUser.nickname}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-1">
              <h3 className="text-xl font-bold text-white">{currentUser.nickname}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 bg-gradient-to-r from-[#d4a550] to-[#ffd700] text-black text-xs font-bold rounded">
                  {membership?.name}
                </span>
                <span className="text-xs text-gray-400">
                  累计消费 ¥{currentUser.total_spend.toFixed(2)}
                </span>
              </div>
            </div>

            <button
              onClick={logout}
              className="text-gray-500 hover:text-white"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </motion.div>

        {/* Wallet */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 bg-gradient-to-r from-[#d4a550]/20 to-[#ffd700]/10 rounded-xl border border-[#d4a550]/30"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">账户余额</p>
              <p className="text-2xl font-bold text-[#d4a550]">
                ¥{currentUser.wallet_balance.toFixed(2)}
              </p>
            </div>

            <button
              onClick={() => setShowRecharge(true)}
              className="px-4 py-2 bg-[#d4a550] text-black font-semibold rounded-lg hover:bg-[#ffd700] transition-colors"
            >
              充值
            </button>
          </div>
        </motion.div>

        {/* Recharge Panel */}
        {showRecharge && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="p-4 bg-black/50 rounded-xl border border-[#d4a550]/20"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-white font-medium">充值套餐</h4>
              <button
                onClick={() => setShowRecharge(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {rechargePackages.map((pkg) => (
                <button
                  key={pkg.id}
                  onClick={() => {
                    recharge(pkg.amount, pkg.bonus);
                    setShowRecharge(false);
                  }}
                  className="p-3 bg-[#d4a550]/10 border border-[#d4a550]/30 rounded-lg text-center hover:bg-[#d4a550]/20 transition-colors"
                >
                  <p className="text-lg font-bold text-[#d4a550]">¥{pkg.amount}</p>
                  <p className="text-xs text-green-400">送¥{pkg.bonus}</p>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Membership Perks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          <h4 className="text-white font-medium">会员权益</h4>
          <div className="grid grid-cols-2 gap-2">
            {perks.map((perk, index) => (
              <div
                key={index}
                className="p-3 bg-black/30 rounded-lg text-sm text-gray-300"
              >
                {perk}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2">
          {(['orders', 'lamps'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab
                  ? 'bg-[#d4a550] text-black'
                  : 'bg-black/30 text-gray-400 hover:text-white'
              }`}
            >
              {tab === 'orders' ? '订单记录' : '我的祈福'}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-2">
          {activeTab === 'orders' && orders.length > 0 && orders.map((order) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-3 bg-black/30 rounded-lg flex items-center justify-between"
            >
              <div>
                <p className="text-white text-sm">订单 #{order.id.slice(-6)}</p>
                <p className="text-xs text-gray-400">
                  {formatRelativeTime(order.created_at)}
                </p>
              </div>
              <span className={`text-sm ${
                order.status === 'paid' ? 'text-green-400' : 'text-yellow-400'
              }`}>
                {order.status === 'paid' ? '已完成' : '待支付'}
              </span>
            </motion.div>
          ))}

          {activeTab === 'lamps' && activeLamps.length > 0 && activeLamps.map((lamp) => (
            <motion.div
              key={lamp.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-3 bg-black/30 rounded-lg flex items-center gap-3"
            >
              <span className="text-2xl">{lamp.lamp_type.icon}</span>
              <div className="flex-1">
                <p className="text-white text-sm">{lamp.lamp_type.name}</p>
                <p className="text-xs text-gray-400">
                  剩余 {Math.floor(lamp.remaining_minutes / 60)} 小时
                </p>
              </div>
              <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
                进行中
              </span>
            </motion.div>
          ))}

          {((activeTab === 'orders' && orders.length === 0) ||
            (activeTab === 'lamps' && activeLamps.length === 0)) && (
            <div className="text-center py-8 text-gray-500">
              <p>暂无记录</p>
            </div>
          )}
        </div>
      </div>

      <Navigation />
    </div>
  );
}
