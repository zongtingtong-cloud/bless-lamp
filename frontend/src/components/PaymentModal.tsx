// Payment Modal Component
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore, useRechargePackages } from '../store/useAppStore';
import { createPayment } from '../services/api';

// 默认充值套餐
const defaultRechargePackages = [
  { id: 1, amount: 30, bonus: 3, label: '充30送3' },
  { id: 2, amount: 100, bonus: 15, label: '充100送15' },
  { id: 3, amount: 500, bonus: 100, label: '充500送100' },
  { id: 4, amount: 1000, bonus: 250, label: '充1000送250' }
];

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPay: () => void;
}

export default function PaymentModal({ isOpen, onClose, onPay }: PaymentModalProps) {
  const {
    currentUser,
    selectedLamp,
    selectedPackage,
    prayerText,
    prayerTarget,
    currentOrder,
    createOrder
  } = useAppStore();

  const rechargePackages = useRechargePackages();
  const packages = rechargePackages.length > 0 ? rechargePackages : defaultRechargePackages;

  const [showQRCode, setShowQRCode] = useState(false);
  const [activePayment, setActivePayment] = useState<'wechat' | 'alipay'>('wechat');
  const [qrCode, setQrCode] = useState('');
  const [orderId, setOrderId] = useState<number | null>(null);
  const [polling, setPolling] = useState(false);

  // 轮询检查支付状态 - 必须在 early return 之前
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (polling && orderId) {
      interval = setInterval(async () => {
        try {
          const response = await fetch(`/api/order.php?action=get&id=${orderId}`);
          const data = await response.json();
          if (data.success && data.data?.status === 'paid') {
            setPolling(false);
            setShowQRCode(false);
            onPay(); // 支付成功
          }
        } catch (e) {
          console.error('检查支付状态失败:', e);
        }
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [polling, orderId, onPay]);

  const handleBalancePayment = () => {
    if (canUseBalance) {
      onPay();
    }
  };

  const handleCloseQR = () => {
    setShowQRCode(false);
    setPolling(false);
    setQrCode('');
  };

  // 余额支付弹窗
  if (showQRCode) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
          onClick={handleCloseQR}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-gradient-to-b from-[#1a1a2e] to-[#0a0a0a] rounded-2xl p-6 max-w-sm w-full border border-[#d4a550]/30"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="text-center mb-4">
              <h3 className="text-xl font-bold text-[#d4a550]">扫码支付</h3>
              <p className="text-gray-400 text-sm mt-1">{selectedLamp.name}</p>
            </div>

            {/* Amount */}
            <div className="text-center mb-6">
              <span className="text-3xl font-bold text-white">¥{Number(price).toFixed(2)}</span>
            </div>

            {/* Payment Tabs */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => handleQRPayment('wechat')}
                className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                  activePayment === 'wechat'
                    ? 'bg-[#07C160] text-white'
                    : 'bg-[#07C160]/20 text-[#07C160]'
                }`}
              >
                微信支付
              </button>
              <button
                onClick={() => handleQRPayment('alipay')}
                className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                  activePayment === 'alipay'
                    ? 'bg-[#1677FF] text-white'
                    : 'bg-[#1677FF]/20 text-[#1677FF]'
                }`}
              >
                支付宝
              </button>
            </div>

            {/* QR Code Display */}
            <div className="flex justify-center mb-6">
              {qrCode ? (
                <div className="bg-white p-4 rounded-xl">
                  <div className="w-40 h-40 flex items-center justify-center">
                    {activePayment === 'wechat' ? (
                      <div className="text-center">
                        <div className="text-4xl mb-2">💚</div>
                        <p className="text-xs text-gray-600">微信扫码</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="text-4xl mb-2">💙</div>
                        <p className="text-xs text-gray-600">支付宝扫码</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="w-40 h-40 flex items-center justify-center bg-white/10 rounded-xl">
                  <div className="animate-spin w-8 h-8 border-2 border-[#d4a550] border-t-transparent rounded-full" />
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="text-center text-gray-400 text-sm mb-4">
              <p>请使用{activePayment === 'wechat' ? '微信' : '支付宝'}扫码支付</p>
              <p className="text-xs mt-1">支付完成后自动确认</p>
            </div>

            {/* Loading indicator */}
            {polling && (
              <div className="flex items-center justify-center gap-2 text-[#d4a550] mb-4">
                <div className="animate-pulse">等待支付中...</div>
              </div>
            )}

            {/* Close Button */}
            <button
              onClick={handleCloseQR}
              className="w-full py-3 rounded-xl border border-gray-600 text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
            >
              取消支付
            </button>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // 正常支付弹窗
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-gradient-to-b from-[#1a1a2e] to-[#0a0a0a] rounded-t-3xl sm:rounded-3xl p-6"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-[#d4a550] mb-2">确认祈福</h2>
              <div className="flex items-center justify-center gap-2">
                <span className="text-4xl">{selectedLamp.icon}</span>
                <span className="text-xl text-white">{selectedLamp.name}</span>
              </div>
            </div>

            {/* Order Details */}
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-300">
                <span>套餐</span>
                <span>{selectedPackage.name}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>时长</span>
                <span>
                  {selectedPackage.minutes >= 1440
                    ? `${Math.floor(selectedPackage.minutes / 1440)}天`
                    : `${Math.floor(selectedPackage.minutes / 60)}小时`}
                </span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>祈福对象</span>
                <span>{prayerTarget}</span>
              </div>
              <div className="border-t border-[#8B4513]/30 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg text-white">应付金额</span>
                  <span className="text-2xl font-bold text-[#d4a550]">¥{Number(price).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="space-y-3 mb-6">
              <p className="text-sm text-gray-400 mb-2">选择支付方式</p>

              {/* WeChat Pay with QR */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => handleQRPayment('wechat')}
                className="w-full p-4 rounded-xl border-2 border-[#07c160]/50 bg-[#07c160]/10 flex items-center justify-between hover:border-[#07c160]"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">💚</span>
                  <div className="text-left">
                    <p className="text-white font-medium">微信支付</p>
                    <p className="text-xs text-gray-400">扫码付款</p>
                  </div>
                </div>
                <span className="text-[#07c160]">→</span>
              </motion.button>

              {/* Alipay with QR */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => handleQRPayment('alipay')}
                className="w-full p-4 rounded-xl border-2 border-[#1677FF]/50 bg-[#1677FF]/10 flex items-center justify-between hover:border-[#1677FF]"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">💙</span>
                  <div className="text-left">
                    <p className="text-white font-medium">支付宝</p>
                    <p className="text-xs text-gray-400">扫码付款</p>
                  </div>
                </div>
                <span className="text-[#1677FF]">→</span>
              </motion.button>

              {/* Balance Payment */}
              {currentUser && (
                <motion.button
                  onClick={handleBalancePayment}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full p-4 rounded-xl border-2 flex items-center justify-between transition-all ${
                    canUseBalance
                      ? 'border-[#d4a550] bg-[#d4a550]/10 hover:border-[#ffd700]'
                      : 'border-red-500/50 bg-red-500/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">💰</span>
                    <div className="text-left">
                      <p className="text-white font-medium">余额支付</p>
                      <p className="text-xs text-gray-400">
                        余额：¥{Number(currentUser.wallet_balance).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  {canUseBalance ? (
                    <span className="text-[#d4a550]">✓</span>
                  ) : (
                    <span className="text-red-500 text-sm">余额不足</span>
                  )}
                </motion.button>
              )}
            </div>

            {/* Login Prompt */}
            {!currentUser && (
              <div className="text-center p-4 bg-[#d4a550]/10 rounded-xl">
                <p className="text-gray-300 mb-2">请先登录后再进行祈福</p>
                <p className="text-sm text-gray-500">点击上方按钮登录</p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
