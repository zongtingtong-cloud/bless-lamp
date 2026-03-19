// Admin Dashboard Page - 验证码登录版
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ADMIN_KEY = 'bless_admin_logged_in';

type Tab = 'orders' | 'prayers' | 'stats' | 'users';

interface Order {
  id: number;
  lamp_name: string;
  package_name: string;
  amount: number;
  status: string;
  prayer_target: string;
  prayer_text: string;
  created_at: string;
  paid_at: string;
  start_time: string;
  end_time: string;
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

interface User {
  id: number;
  nickname: string;
  wallet_balance: number;
  membership_level: string;
  total_orders: number;
  created_at: string;
}

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  // 登录状态
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem(ADMIN_KEY) === 'true');
  
  // 登录表单
  const [loginType, setLoginType] = useState<'phone' | 'email'>('phone');
  const [contact, setContact] = useState('');
  const [code, setCode] = useState('');
  const [sentCode, setSentCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [loginError, setLoginError] = useState('');
  const [codeError, setCodeError] = useState('');

  // 发送验证码
  const sendCode = async () => {
    if (!contact) {
      setLoginError('请输入手机号或邮箱');
      return;
    }
    
    // 验证格式
    const phoneRegex = /^1[3-9]\d{9}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (loginType === 'phone' && !phoneRegex.test(contact)) {
      setLoginError('请输入正确的手机号');
      return;
    }
    if (loginType === 'email' && !emailRegex.test(contact)) {
      setLoginError('请输入正确的邮箱');
      return;
    }

    // 生成6位验证码
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setSentCode(code);
    setLoginError('');
    setCodeError('');
    
    // 发送验证码（这里模拟发送，实际需要调用API）
    try {
      const res = await fetch('/api/admin.php?action=send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          contact, 
          type: loginType,
          code 
        })
      });
      const data = await res.json();
      if (data.success) {
        // 显示验证码（开发模式）
        alert(`验证码: ${code}`);
        setCountdown(60);
        const timer = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (e) {
      // 即使API失败也显示验证码（开发模式）
      alert(`验证码: ${code}`);
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  // 验证登录
  const handleLogin = async () => {
    if (!code) {
      setCodeError('请输入验证码');
      return;
    }
    if (code.length !== 6) {
      setCodeError('验证码错误');
      return;
    }

    try {
      const res = await fetch('/api/admin.php?action=verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact, code })
      });
      const data = await res.json();
      
      if (data.success) {
        setIsLoggedIn(true);
        localStorage.setItem(ADMIN_KEY, 'true');
        setLoginError('');
        setCodeError('');
      } else {
        setCodeError(data.message || '验证码错误');
      }
    } catch (e) {
      // 开发模式验证
      if (code === sentCode) {
        setIsLoggedIn(true);
        localStorage.setItem(ADMIN_KEY, 'true');
        setLoginError('');
        setCodeError('');
      } else {
        setCodeError('验证码错误');
      }
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem(ADMIN_KEY);
    window.location.href = '/';
  };

  // 未登录显示登录表单
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] via-[#1a1a2e] to-[#0a0a0a] flex items-center justify-center p-4">
        <div className="bg-gradient-to-b from-[#1a1a2e] to-[#0a0a0a] rounded-2xl p-8 w-full max-w-sm border border-[#d4a550]/30">
          <h2 className="text-2xl font-bold text-[#d4a550] text-center mb-6">🔐 管理后台</h2>
          
          {/* 登录方式切换 */}
          <div className="flex mb-4 border border-[#8B4513]/30 rounded-xl overflow-hidden">
            <button
              onClick={() => { setLoginType('phone'); setContact(''); setCode(''); setLoginError(''); }}
              className={`flex-1 py-2 text-sm ${loginType === 'phone' ? 'bg-[#d4a550] text-black' : 'bg-black/50 text-gray-400'}`}
            >
              手机号登录
            </button>
            <button
              onClick={() => { setLoginType('email'); setContact(''); setCode(''); setLoginError(''); }}
              className={`flex-1 py-2 text-sm ${loginType === 'email' ? 'bg-[#d4a550] text-black' : 'bg-black/50 text-gray-400'}`}
            >
              邮箱登录
            </button>
          </div>
          
          {/* 手机号/邮箱输入 */}
          <input
            type={loginType === 'phone' ? 'tel' : 'email'}
            placeholder={loginType === 'phone' ? '请输入手机号' : '请输入邮箱'}
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            className="w-full px-4 py-3 mb-4 bg-black/50 border border-[#8B4513]/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#d4a550]"
          />
          
          {/* 验证码输入 + 发送按钮 */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="请输入验证码"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              className="flex-1 px-4 py-3 bg-black/50 border border-[#8B4513]/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#d4a550]"
            />
            <button
              onClick={sendCode}
              disabled={countdown > 0}
              className={`px-4 py-2 rounded-xl text-sm font-medium ${
                countdown > 0 
                  ? 'bg-gray-600 text-gray-400' 
                  : 'bg-[#d4a550] text-black hover:bg-[#c49a40]'
              }`}
            >
              {countdown > 0 ? `${countdown}s` : '获取验证码'}
            </button>
          </div>
          
          {loginError && <p className="text-red-500 text-sm mb-4">{loginError}</p>}
          {codeError && <p className="text-red-500 text-sm mb-4">{codeError}</p>}
          
          <button
            onClick={handleLogin}
            className="w-full py-3 bg-[#d4a550] text-black font-bold rounded-xl hover:bg-[#c49a40]"
          >
            登录
          </button>
          
          <button
            onClick={() => window.location.href = '/'}
            className="w-full mt-3 py-2 border border-[#8B4513]/50 text-gray-400 rounded-xl hover:border-[#d4a550]/50"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  // 登录后加载数据
  useEffect(() => {
    if (tab === 'orders') fetchOrders();
    if (tab === 'prayers') fetchPrayers();
    if (tab === 'users') fetchUsers();
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

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/user.php?action=list');
      const data = await res.json();
      if (data.success) setUsers(data.data || []);
    } catch (e) {
      console.error(e);
      setUsers([
        { id: 1, nickname: '善缘居士', wallet_balance: 100, membership_level: '普通用户', total_orders: 5, created_at: '2024-01-01' },
        { id: 2, nickname: '匿名', wallet_balance: 50, membership_level: '普通用户', total_orders: 2, created_at: '2024-01-15' },
      ]);
    }
    setLoading(false);
  };

  const filteredOrders = orders.filter(o => 
    !searchKeyword || 
    o.lamp_name?.includes(searchKeyword) || 
    o.prayer_target?.includes(searchKeyword) ||
    o.id.toString().includes(searchKeyword)
  );

  const stats = {
    totalOrders: orders.length,
    totalRevenue: orders.reduce((sum, o) => sum + (o.status === 'paid' ? Number(o.amount) : 0), 0),
    totalPrayers: prayers.length,
    totalLikes: prayers.reduce((sum, p) => sum + p.likes, 0),
    totalUsers: users.length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] via-[#1a1a2e] to-[#0a0a0a] pb-20">
      {/* Header */}
      <div className="p-4 bg-[#d4a550]/10 border-b border-[#d4a550]/30">
        <h1 className="text-xl font-bold text-[#d4a550]">📊 管理后台</h1>
      </div>

      {/* Search */}
      {(tab === 'orders' || tab === 'prayers') && (
        <div className="p-4">
          <input
            type="text"
            placeholder="搜索..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="w-full px-4 py-2 bg-black/50 border border-[#8B4513]/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#d4a550]"
          />
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-[#8B4513]/30 overflow-x-auto">
        {(['orders', 'prayers', 'stats', 'users'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-sm font-medium transition-colors whitespace-nowrap px-2 ${
              tab === t ? 'text-[#d4a550] border-b-2 border-[#d4a550]' : 'text-gray-400'
            }`}
          >
            {t === 'orders' && '📝 订单'}
            {t === 'prayers' && '🧧 祈福'}
            {t === 'stats' && '📈 统计'}
            {t === 'users' && '👥 用户'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4">
        {loading && <p className="text-center text-gray-400">加载中...</p>}

        {tab === 'orders' && !loading && (
          <div className="space-y-3">
            {filteredOrders.length === 0 ? (
              <p className="text-center text-gray-500">暂无订单</p>
            ) : (
              filteredOrders.map((order) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setSelectedOrder(order)}
                  className="p-4 bg-black/30 rounded-xl border border-[#8B4513]/30 cursor-pointer hover:border-[#d4a550]/50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-white font-medium">
                        🪔 {order.lamp_name}
                        <span className="text-gray-400 text-sm ml-2">{order.package_name}</span>
                      </p>
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

        {tab === 'users' && !loading && (
          <div className="space-y-3">
            {users.length === 0 ? (
              <p className="text-center text-gray-500">暂无用户</p>
            ) : (
              users.map((user) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-black/30 rounded-xl border border-[#8B4513]/30"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-white font-medium">👤 {user.nickname}</p>
                      <p className="text-gray-500 text-xs mt-1">注册时间: {user.created_at}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[#d4a550]">¥{user.wallet_balance}</p>
                      <p className="text-gray-400 text-xs">{user.total_orders} 订单</p>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>

      {/* 订单详情弹窗 */}
      <AnimatePresence>
        {selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
            onClick={() => setSelectedOrder(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-b from-[#1a1a2e] to-[#0a0a0a] rounded-2xl p-6 max-w-sm w-full border border-[#d4a550]/30"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-[#d4a550] mb-4">📝 订单详情</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">订单ID</span>
                  <span className="text-white">#{selectedOrder.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">灯型</span>
                  <span className="text-white">{selectedOrder.lamp_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">套餐</span>
                  <span className="text-white">{selectedOrder.package_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">金额</span>
                  <span className="text-[#d4a550] font-bold">¥{selectedOrder.amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">状态</span>
                  <span className={selectedOrder.status === 'paid' ? 'text-green-500' : 'text-yellow-500'}>
                    {selectedOrder.status === 'paid' ? '已支付' : '待支付'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">祈福对象</span>
                  <span className="text-white">{selectedOrder.prayer_target}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-full mt-4 py-3 rounded-xl border-2 border-[#8B4513]/50 text-gray-300 hover:border-[#d4a550]/50"
              >
                关闭
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 p-2 bg-[#1a1a2e] border-t border-[#8B4513]/30 flex justify-around">
        <button onClick={() => window.location.href = '/'} className="p-2 text-gray-400">
          <span className="text-xl">🏠</span>
        </button>
        <button className="p-2 text-[#d4a550]">
          <span className="text-xl">📊</span>
        </button>
        <button onClick={handleLogout} className="p-2 text-gray-400">
          <span className="text-xl">🚪</span>
        </button>
      </div>
    </div>
  );
}