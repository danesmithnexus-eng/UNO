import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface Flame {
  id: number;
  left: string;
  delay: number;
  duration: number;
  size: number;
}

export const FireEffect: React.FC = () => {
  const flames = useMemo<Flame[]>(() => {
    return Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: Math.random() * 2,
      duration: 1 + Math.random() * 1,
      size: 20 + Math.random() * 40,
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[100] bg-orange-900/10 backdrop-brightness-75">
      {flames.map((flame) => (
        <motion.div
          key={flame.id}
          initial={{ 
            bottom: '-10%', 
            left: flame.left, 
            scale: 1,
            opacity: 0 
          }}
          animate={{ 
            bottom: '110%',
            left: `calc(${flame.left} + ${Math.random() * 10 - 5}%)`,
            scale: [1, 1.5, 0.5],
            opacity: [0, 0.8, 0]
          }}
          transition={{
            duration: flame.duration,
            repeat: Infinity,
            delay: flame.delay,
            ease: "easeOut"
          }}
          className="absolute"
          style={{
            width: flame.size,
            height: flame.size * 1.5,
          }}
        >
          <div className="w-full h-full bg-gradient-to-t from-red-600 via-orange-500 to-yellow-300 rounded-full blur-md opacity-60" />
        </motion.div>
      ))}
      
      {/* Heat Haze Overlay */}
      <motion.div 
        animate={{ 
          opacity: [0.1, 0.2, 0.1],
          scale: [1, 1.02, 1]
        }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute inset-0 bg-gradient-to-t from-orange-500/20 to-transparent mix-blend-overlay"
      />
    </div>
  );
};
