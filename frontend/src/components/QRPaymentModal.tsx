import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';

interface QRPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId?: number;
  amount: number;
  lampName: string;
  onSuccess?: () => void;
}

export default function QRPaymentModal({
  isOpen,
  onClose,
  orderId,
  amount,
  lampName,
  onSuccess
}: QRPaymentModalProps) {
  const [activeTab, setActiveTab] = useState<'wechat' | 'alipay'>('wechat');
  const [qrCode, setQrCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const { currentUser, createPayment, checkPaymentStatus } = useAppStore();

  // 创建支付订单
  useEffect(() => {
    if (isOpen && orderId && currentUser) {
      createQRCode();
    }
  }, [isOpen, orderId, currentUser]);

  // 轮询检查支付状态
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (polling && orderId) {
      interval = setInterval(async () => {
        const result = await checkPaymentStatus(orderId);
        if (result) {
          setPolling(false);
          onSuccess?.();
          onClose();
        }
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [polling, orderId, checkPaymentStatus, onSuccess, onClose]);

  const createQRCode = async () => {
    if (!orderId || !currentUser) return;

    setLoading(true);
    try {
      const response = await fetch('/api/order.php?action=create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderId,
          user_id: currentUser.id,
          payment_type: 'unified', // 同时获取微信和支付宝二维码
        }),
      });

      const data = await response.json();

      if (data.success) {
        // 设置默认二维码
        const qr = activeTab === 'wechat' ? data.data.wechat_qr : data.data.alipay_qr;
        setQrCode(qr);
        setPolling(true);
      }
    } catch (error) {
      console.error('创建支付失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const switchTab = async (tab: 'wechat' | 'alipay') => {
    setActiveTab(tab);
    if (orderId && currentUser) {
      setLoading(true);
      try {
        const response = await fetch('/api/order.php?action=create-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order_id: orderId,
            user_id: currentUser.id,
            payment_type: tab,
          }),
        });

        const data = await response.json();
        if (data.success) {
          const qr = tab === 'wechat' ? data.data.wechat_qr : data.data.alipay_qr;
          setQrCode(qr);
        }
      } catch (error) {
        console.error('切换支付方式失败:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-gradient-to-b from-[#1a1a2e] to-[#0a0a0a] rounded-2xl p-6 max-w-sm w-full border border-[#d4a550]/30"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-[#d4a550]">扫码支付</h3>
              <p className="text-gray-400 text-sm mt-1">{lampName}</p>
            </div>

            {/* Amount */}
            <div className="text-center mb-6">
              <span className="text-3xl font-bold text-white">¥{amount.toFixed(2)}</span>
            </div>

            {/* Payment Tabs */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => switchTab('wechat')}
                className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                  activeTab === 'wechat'
                    ? 'bg-[#07C160] text-white'
                    : 'bg-[#07C160]/20 text-[#07C160]'
                }`}
              >
                微信支付
              </button>
              <button
                onClick={() => switchTab('alipay')}
                className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                  activeTab === 'alipay'
                    ? 'bg-[#1677FF] text-white'
                    : 'bg-[#1677FF]/20 text-[#1677FF]'
                }`}
              >
                支付宝
              </button>
            </div>

            {/* QR Code */}
            <div className="flex justify-center mb-6">
              {loading ? (
                <div className="w-48 h-48 flex items-center justify-center">
                  <div className="animate-spin w-10 h-10 border-4 border-[#d4a550] border-t-transparent rounded-full" />
                </div>
              ) : qrCode ? (
                <div className="bg-white p-4 rounded-xl">
                  {qrCode.startsWith('weixin://') || qrCode.startsWith('https://') ? (
                    <QRCodeCanvas value={qrCode} size={160} />
                  ) : (
                    <div className="w-40 h-40 flex items-center justify-center text-gray-400 text-sm">
                      请使用{activeTab === 'wechat' ? '微信' : '支付宝'}扫码
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-gray-400">
                  暂无二维码
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="text-center text-gray-400 text-sm mb-6">
              <p>请使用{activeTab === 'wechat' ? '微信' : '支付宝'}扫码支付</p>
              <p className="text-xs mt-1">支付完成后自动确认</p>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl border border-gray-600 text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
            >
              取消支付
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Simple QR Code Canvas component (no external library needed)
function QRCodeCanvas({ value, size }: { value: string; size: number }) {
  // Generate a simple placeholder for demo - in production use qrcode library
  return (
    <div
      className="flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <div className="relative" style={{ width: size, height: size }}>
        {/* Simplified QR pattern visualization */}
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <rect width={size} height={size} fill="white" />
          {/* Position markers */}
          <rect x={size * 0.1} y={size * 0.1} width={size * 0.2} height={size * 0.2} fill="black" />
          <rect x={size * 0.7} y={size * 0.1} width={size * 0.2} height={size * 0.2} fill="black" />
          <rect x={size * 0.1} y={size * 0.7} width={size * 0.2} height={size * 0.2} fill="black" />
          {/* Data pattern (simplified) */}
          {[...Array(20)].map((_, i) => (
            <rect
              key={i}
              x={size * (0.1 + Math.random() * 0.8)}
              y={size * (0.1 + Math.random() * 0.8)}
              width={size * 0.05}
              height={size * 0.05}
              fill="black"
            />
          ))}
        </svg>
        {/* Overlay message */}
        <div className="absolute inset-0 flex items-center justify-center bg-white/80">
          <div className="text-center p-2">
            <p className="text-xs text-gray-600 font-medium">
              {value.startsWith('weixin://') ? '微信扫码' : '支付宝扫码'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
