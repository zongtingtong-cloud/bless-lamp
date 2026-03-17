// Simple Lotus Component - 简化版莲花，使用纯CSS动画
import { motion } from 'framer-motion';

interface LotusProps {
  color?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function SimpleLotus({ color = '#d4a550', size = 'md' }: LotusProps) {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  };

  return (
    <div className={`${sizeClasses[size]} relative flex items-center justify-center`}>
      {/* Outer petals */}
      {[0, 60, 120, 180, 240, 300].map((angle, i) => (
        <motion.div
          key={`outer-${i}`}
          className="absolute w-full h-full"
          animate={{
            rotate: angle,
            scale: [1, 1.05, 1]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.1,
            ease: "easeInOut"
          }}
        >
          <div
            className="absolute w-8 h-12 rounded-full opacity-80"
            style={{
              background: `linear-gradient(to top, ${color}40, ${color})`,
              top: '0%',
              left: '50%',
              transform: 'translateX(-50%) rotate(0deg)',
              transformOrigin: 'bottom center'
            }}
          />
        </motion.div>
      ))}

      {/* Inner petals */}
      {[30, 90, 150, 210, 270, 330].map((angle, i) => (
        <motion.div
          key={`inner-${i}`}
          className="absolute"
          animate={{
            rotate: angle,
            scale: [1, 1.08, 1]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.1 + 0.2,
            ease: "easeInOut"
          }}
        >
          <div
            className="absolute w-6 h-10 rounded-full opacity-90"
            style={{
              background: `linear-gradient(to top, ${color}60, ${color})`,
              top: '15%',
              left: '50%',
              transform: 'translateX(-50%)',
              transformOrigin: 'bottom center'
            }}
          />
        </motion.div>
      ))}

      {/* Center glow */}
      <motion.div
        className="absolute rounded-full"
        animate={{
          scale: [1, 1.2, 1],
          boxShadow: [
            `0 0 20px ${color}`,
            `0 0 40px ${color}`,
            `0 0 20px ${color}`
          ]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{
          width: '30%',
          height: '30%',
          background: `radial-gradient(circle, #ffd700, ${color})`
        }}
      />
    </div>
  );
}

// Particle Effect - 简化版粒子
export function SimpleParticles({ color = '#d4a550' }: { color?: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full"
          style={{
            backgroundColor: color,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -100],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: "easeOut"
          }}
        />
      ))}
    </div>
  );
}

// Candle Flame - 烛光效果
export function CandleFlame({ color = '#d4a550' }: { color?: string }) {
  return (
    <motion.div
      className="relative"
      animate={{
        scaleY: [1, 1.1, 0.9, 1],
        opacity: [1, 0.9, 1, 0.95]
      }}
      transition={{
        duration: 0.8,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      {/* Flame */}
      <div
        className="w-4 h-6 rounded-full"
        style={{
          background: `radial-gradient(ellipse at bottom, #fff 0%, ${color} 50%, transparent 70%)`,
          filter: `blur(1px)`
        }}
      />
      {/* Glow */}
      <motion.div
        className="absolute inset-0 rounded-full -z-10"
        animate={{
          boxShadow: [
            `0 0 10px ${color}`,
            `0 0 25px ${color}`,
            `0 0 10px ${color}`
          ]
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{ backgroundColor: color, opacity: 0.3 }}
      />
    </motion.div>
  );
}
