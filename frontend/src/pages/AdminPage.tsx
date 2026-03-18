// Admin Dashboard Page
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

type Tab = 'orders' | 'prayers' | 'stats';

interface Order {
  id: number;
  lamp_name: string;
  package_name: string;
  amount: number;
  status: string;
  prayer_target: string;
  created_at: string;
}

interface Prayer {
  id: number;
  lamp_type_name: string;
  prayer_text: string;
  prayer_target: string;
  is_anonymous: boolean;
  likes: number;
  created_at: string;
}

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tab === 'orders') fetchOrders();
    if (tab === 'prayers') fetchPrayers();
  }, [tab]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/order.php?action=list&user_id=1');
      const data = await res.json();
      if (data.success) setOrders(data.data || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const fetchPrayers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/prayer_wall.php?action=list');
      const data = await res.json();
      if (data.success) setPrayers(data.data || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const stats = {
    totalOrders: orders.length,
    totalRevenue: orders.reduce((sum, o) => sum + (o.status === 'paid' ? o.amount : 0), 0),
    totalPrayers: prayers.length,
    totalLikes: prayers.reduce((sum, p) => sum + p.likes, 0),
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] via-[#1a1a2e] to-[#0a0a0a]">
      {/* Header */}
      <div className="p-4 bg-[#d4a550]/10 border-b border-[#d4a550]/30">
        <h1 className="text-xl font-bold text-[#d4a550]">📊 管理后台</h1>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#8B4513]/30">
        {(['orders', 'prayers', 'stats'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              tab === t ? 'text-[#d4a550] border-b-2 border-[#d4a550]' : 'text-gray-400'
            }`}
          >
            {t === 'orders' && '订单'}
            {t === 'prayers' && '祈福'}
            {t === 'stats' && '统计'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4">
        {loading && <p className="text-center text-gray-400">加载中...</p>}

        {tab === 'orders' && !loading && (
          <div className="space-y-3">
            {orders.length === 0 ? (
              <p className="text-center text-gray-500">暂无订单</p>
            ) : (
              orders.map((order) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-black/30 rounded-xl border border-[#8B4513]/30"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-white font-medium">{order.lamp_name}</p>
                      <p className="text-gray-400 text-sm">{order.package_name}</p>
                      <p className="text-gray-500 text-xs mt-1">
                        祈福对象: {order.prayer_target} | {order.created_at}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[#d4a550] font-bold">¥{order.amount}</p>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        order.status === 'paid' ? 'bg-green-600' : 'bg-yellow-600'
                      }`}>
                        {order.status === 'paid' ? '已支付' : '待支付'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}

        {tab === 'prayers' && !loading && (
          <div className="space-y-3">
            {prayers.length === 0 ? (
              <p className="text-center text-gray-500">暂无祈福记录</p>
            ) : (
              prayers.map((prayer) => (
                <motion.div
                  key={prayer.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-black/30 rounded-xl border border-[#8B4513]/30"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">🪔</span>
                    <div className="flex-1">
                      <p className="text-white">{prayer.prayer_text}</p>
                      <p className="text-gray-400 text-sm mt-1">
                        {prayer.is_anonymous ? '匿名' : '善缘居士'} · {prayer.prayer_target}
                      </p>
                      <p className="text-gray-500 text-xs mt-1">
                        {prayer.created_at} · 👍 {prayer.likes}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}

        {tab === 'stats' && !loading && (
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-[#d4a550]/10 rounded-xl border border-[#d4a550]/30 text-center">
              <p className="text-3xl font-bold text-[#d4a550]">{stats.totalOrders}</p>
              <p className="text-gray-400 text-sm">总订单</p>
            </div>
            <div className="p-4 bg-[#d4a550]/10 rounded-xl border border-[#d4a550]/30 text-center">
              <p className="text-3xl font-bold text-[#d4a550]">¥{stats.totalRevenue.toFixed(2)}</p>
              <p className="text-gray-400 text-sm">总收入</p>
            </div>
            <div className="p-4 bg-[#d4a550]/10 rounded-xl border border-[#d4a550]/30 text-center">
              <p className="text-3xl font-bold text-[#d4a550]">{stats.totalPrayers}</p>
              <p className="text-gray-400 text-sm">祈福次数</p>
            </div>
            <div className="p-4 bg-[#d4a550]/10 rounded-xl border border-[#d4a550]/30 text-center">
              <p className="text-3xl font-bold text-[#d4a550]">{stats.totalLikes}</p>
              <p className="text-gray-400 text-sm">总点赞</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 p-2 bg-[#1a1a2e] border-t border-[#8B4513]/30 flex justify-around">
        <button onClick={() => window.location.href = '/'} className="p-2 text-gray-400">
          <span className="text-xl">🏠</span>
        </button>
        <button className="p-2 text-[#d4a550]">
          <span className="text-xl">📊</span>
        </button>
      </div>
    </div>
  );
}