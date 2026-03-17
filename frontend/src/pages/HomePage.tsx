// Home Page
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../components/Header';
import SimpleLotus, { SimpleParticles, CandleFlame } from '../components/SimpleLotus';
import LampSelection from '../components/LampSelection';
import PackageSelection from '../components/PackageSelection';
import PrayerForm from '../components/PrayerForm';
import PaymentModal from '../components/PaymentModal';
import SuccessModal from '../components/SuccessModal';
import { useAppStore, LampType, TimePackage } from '../store/useAppStore';

type Step = 'lamp' | 'package' | 'prayer';

export default function HomePage() {
  const [step, setStep] = useState<Step>('lamp');

  const {
    selectedLamp,
    selectedPackage,
    selectLamp,
    selectPackage,
    showPaymentModal,
    showSuccessModal,
    setShowPaymentModal,
    setShowSuccessModal,
    createOrder,
    completePayment,
    resetSelection,
    setCurrentPage
  } = useAppStore();

  const handleLampSelect = (lamp: LampType) => {
    selectLamp(lamp);
    setStep('package');
  };

  const handlePackageSelect = (pkg: TimePackage) => {
    selectPackage(pkg);
    setStep('prayer');
  };

  const handlePrayerSubmit = () => {
    createOrder();
    setShowPaymentModal(true);
  };

  const handlePayment = () => {
    completePayment();
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    resetSelection();
    setStep('lamp');
    setCurrentPage('prayer-wall');
  };

  const handleBack = () => {
    if (step === 'package') setStep('lamp');
    else if (step === 'prayer') setStep('package');
  };

  const lampColor = selectedLamp?.color || '#d4a550';

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] via-[#1a1a2e] to-[#0a0a0a]">
      <Header showBack={step !== 'lamp'} onBack={handleBack} />

      {/* Lotus Scene */}
      <div className="h-[45vh] relative flex items-center justify-center">
        {/* Background particles */}
        <SimpleParticles color={lampColor} />

        {/* Lotus */}
        <motion.div
          className="relative z-10 cursor-pointer"
          onClick={() => !selectedLamp && setStep('lamp')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <SimpleLotus color={lampColor} size="lg" />

          {/* Candle flames around lotus */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              style={{
                top: '50%',
                left: '50%',
                transform: `translate(-50%, -50%) rotate(${i * 45}deg) translateY(-80px)`,
              }}
            >
              <CandleFlame color={lampColor} />
            </motion.div>
          ))}
        </motion.div>

        {/* Title */}
        <motion.div
          className="absolute top-4 left-0 right-0 text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-2xl font-bold text-gradient-gold">云端祈福坛</h2>
          <p className="text-sm text-gray-400 mt-1">心诚则灵 · 祈福平安</p>
        </motion.div>

        {/* Tap hint */}
        <AnimatePresence>
          {!selectedLamp && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute bottom-8 left-0 right-0 text-center"
            >
              <p className="text-[#d4a550] text-sm animate-pulse">
                点击莲花选择灯型
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Selection Panel */}
      <div className="h-[55vh] overflow-y-auto px-4 pb-24">
        <AnimatePresence mode="wait">
          {step === 'lamp' && (
            <motion.div
              key="lamp"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.3 }}
            >
              <LampSelection
                onSelect={handleLampSelect}
                selectedLamp={selectedLamp}
              />
            </motion.div>
          )}

          {step === 'package' && selectedLamp && (
            <motion.div
              key="package"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.3 }}
            >
              <PackageSelection
                onSelect={handlePackageSelect}
                selectedPackage={selectedPackage}
              />
            </motion.div>
          )}

          {step === 'prayer' && selectedLamp && selectedPackage && (
            <motion.div
              key="prayer"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.3 }}
            >
              <PrayerForm onNext={handlePrayerSubmit} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onPay={handlePayment}
      />

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={handleSuccessClose}
      />
    </div>
  );
}
