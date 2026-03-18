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

// 检测运行环境
const getRuntime = () => {
  const ua = navigator.userAgent.toLowerCase();
  if (ua.indexOf('micromessenger') > -1) return 'wechat';
  if (ua.indexOf('alipayclient') > -1) return 'alipay';
  return 'browser';
};

export default function PaymentModal({ isOpen, onClose, onPay }: PaymentModalProps) {
  const {
    currentUser,
    selectedLamp,
    selectedPackage,
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
  const [isProcessing, setIsProcessing] = useState(false);

  const runtime = getRuntime();

  // 如果没有选择套餐，直接关闭
  useEffect(() => {
    if (isOpen && (!selectedLamp || !selectedPackage)) {
      onClose();
    }
  }, [isOpen, selectedLamp, selectedPackage, onClose]);

  // 轮询检查支付状态
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
            onPay();
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

  const handleCloseQR = () => {
    setShowQRCode(false);
    setPolling(false);
    setQrCode('');
  };

  // 处理微信支付
  const handleWechatPay = async () => {
    if (!currentUser || !selectedLamp || !selectedPackage) return;
    
    setIsProcessing(true);
    try {
      // 创建订单
      let order = currentOrder;
      if (!order) {
        order = await createOrder();
      }
      
      if (order) {
        // 调用微信JS支付
        const result = await createPayment(
          String(order.id),
          String(currentUser.id),
          'wechat'
        );
        
        if (result.success && result.data?.wechat_js) {
          // 调用微信支付
          const payData = result.data.wechat_js;
          (window as any).WeixinJSBridge?.invoke(
            'getBrandWCPayRequest',
            {
              appId: payData.appId,
              timeStamp: payData.timeStamp,
              nonceStr: payData.nonceStr,
              package: payData.package,
              signType: payData.signType,
              paySign: payData.paySign
            },
            (res: any) => {
              if (res.err_msg === 'get_brand_wcpay_request:ok') {
                onPay();
              }
            }
          );
        }
      }
    } catch (error) {
      console.error('微信支付失败:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // 处理支付宝支付
  const handleAlipay = async () => {
    if (!currentUser || !selectedLamp || !selectedPackage) return;
    
    setIsProcessing(true);
    try {
      let order = currentOrder;
      if (!order) {
        order = await createOrder();
      }
      
      if (order) {
        const result = await createPayment(
          String(order.id),
          String(currentUser.id),
          'alipay'
        );
        
        if (result.success && result.data?.alipay_js) {
          // 支付宝JS支付
          const payData = result.data.alipay_js;
          (window as any).AlipayJSBridge?.call(
            'tradePay',
            {
              orderStr: payData.orderStr
            },
            (res: any) => {
              if (res.resultCode === '9000') {
                onPay();
              }
            }
          );
        }
      }
    } catch (error) {
      console.error('支付宝支付失败:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // 处理二维码支付
  const handleQRPayment = async (paymentType: 'wechat' | 'alipay') => {
    console.log('支付点击:', { paymentType, currentUser: !!currentUser, selectedLamp: !!selectedLamp, selectedPackage: !!selectedPackage, currentOrder });
    
    if (!currentUser) {
      console.error('用户未登录');
      alert('请先登录');
      return;
    }
    if (!selectedLamp) {
      console.error('未选择灯型');
      alert('请选择灯型');
      return;
    }
    if (!selectedPackage) {
      console.error('未选择套餐');
      alert('请选择套餐');
      return;
    }

    setActivePayment(paymentType);
    setShowQRCode(true);

    try {
      let order = currentOrder;
      if (!order) {
        order = await createOrder();
      }

      if (order) {
        setOrderId(order.id);

        const result = await createPayment(
          String(order.id),
          String(currentUser.id),
          paymentType
        );

        if (result.success) {
          const qr = paymentType === 'wechat'
            ? result.data?.wechat_qr
            : result.data?.alipay_qr;
          setQrCode(qr);
          setPolling(true);
        }
      }
    } catch (error) {
      console.error('创建支付失败:', error);
    }
  };

  const basePrice = selectedLamp?.base_price * selectedPackage?.minutes || 0;
  const withDiscount = basePrice * (selectedPackage?.discount_rate || 1);
  const memberDiscount = currentUser?.membership_level === 'yearly' ? 0.6 :
                        currentUser?.membership_level === 'monthly' ? 0.8 : 1;
  const price = Math.round(withDiscount * memberDiscount * 100) / 100;

  const canUseBalance = currentUser && currentUser.wallet_balance >= price;

  // 余额支付弹窗
  if (showQRCode && qrCode) {
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
            <div className="text-center mb-4">
              <h3 className="text-xl font-bold text-[#d4a550]">扫码支付</h3>
              <p className="text-gray-400 text-sm mt-1">{selectedLamp?.name}</p>
            </div>

            <div className="flex justify-center mb-4">
              <div className="bg-white p-2 rounded-lg">
                <img src={qrCode} alt="支付二维码" className="w-48 h-48" />
              </div>
            </div>

            <p className="text-center text-gray-400 text-sm mb-4">
              {activePayment === 'wechat' ? '微信' : '支付宝'}扫码 · ¥{price.toFixed(2)}
            </p>

            <button
              onClick={handleCloseQR}
              className="w-full py-3 rounded-xl border-2 border-[#8B4513]/50 text-gray-300 hover:border-[#d4a550]/50"
            >
              取消
            </button>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // 主支付弹窗
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/70"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-gradient-to-b from-[#1a1a2e] to-[#0a0a0a] rounded-t-3xl w-full max-w-md border-t border-[#d4a550]/30"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 pb-4 border-b border-[#8B4513]/30">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-[#d4a550]">确认支付</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <p className="text-gray-400 text-sm mt-1">{selectedLamp?.name}</p>
          </div>

          {/* Price */}
          <div className="p-6 pb-4">
            <div className="text-center mb-6">
              <p className="text-gray-400 text-sm">祈福时长：{selectedPackage?.name}</p>
              <p className="text-4xl font-bold text-[#d4a550]">
                ¥{price.toFixed(2)}
              </p>
            </div>

            {/* Payment Methods */}
            <div className="space-y-3">
              {/* 根据运行环境显示支付方式 */}
              {runtime === 'wechat' && (
                <motion.button
                  onClick={handleWechatPay}
                  disabled={isProcessing}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 rounded-xl bg-[#07c160] text-white font-bold text-lg flex items-center justify-center gap-3 shadow-lg disabled:opacity-50"
                >
                  <span>💚</span>
                  {isProcessing ? '处理中...' : '微信支付'}
                </motion.button>
              )}

              {runtime === 'alipay' && (
                <motion.button
                  onClick={handleAlipay}
                  disabled={isProcessing}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 rounded-xl bg-[#1677ff] text-white font-bold text-lg flex items-center justify-center gap-3 shadow-lg disabled:opacity-50"
                >
                  <span>💙</span>
                  {isProcessing ? '处理中...' : '支付宝支付'}
                </motion.button>
              )}

              {runtime === 'browser' && (
                <>
                  <motion.button
                    onClick={() => handleQRPayment('wechat')}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-4 rounded-xl bg-[#07c160] text-white font-bold text-lg flex items-center justify-center gap-3 shadow-lg"
                  >
                    <span>💚</span> 微信支付
                  </motion.button>

                  <motion.button
                    onClick={() => handleQRPayment('alipay')}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-4 rounded-xl bg-[#1677ff] text-white font-bold text-lg flex items-center justify-center gap-3 shadow-lg"
                  >
                    <span>💙</span> 支付宝支付
                  </motion.button>
                </>
              )}

              {/* 余额支付 */}
              {canUseBalance && (
                <motion.button
                  onClick={onPay}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 rounded-xl border-2 border-[#d4a550] text-[#d4a550] font-bold text-lg"
                >
                  余额支付（¥{currentUser.wallet_balance.toFixed(2)}）
                </motion.button>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 pb-6">
            <p className="text-center text-gray-500 text-xs">
              {runtime === 'wechat' && '微信环境内，使用微信支付'}
              {runtime === 'alipay' && '支付宝环境内，使用支付宝支付'}
              {runtime === 'browser' && '选择支付方式后扫码支付'}
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}