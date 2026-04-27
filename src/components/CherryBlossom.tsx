import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface Petal {
  id: number;
  x: string;
  delay: number;
  duration: number;
  size: number;
  rotation: number;
}

export const CherryBlossom: React.FC = () => {
  const petals = useMemo<Petal[]>(() => {
    return Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      x: `${Math.random() * 100}%`,
      delay: Math.random() * 5,
      duration: 5 + Math.random() * 5,
      size: 10 + Math.random() * 10,
      rotation: Math.random() * 360,
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {petals.map((petal) => (
        <motion.div
          key={petal.id}
          initial={{ 
            top: '-5%', 
            left: petal.x, 
            rotate: petal.rotation,
            opacity: 0 
          }}
          animate={{ 
            top: '105%',
            left: `calc(${petal.x} + ${Math.random() * 10 - 5}%)`,
            rotate: petal.rotation + 360,
            opacity: [0, 0.8, 0.8, 0]
          }}
          transition={{
            duration: petal.duration,
            repeat: Infinity,
            delay: petal.delay,
            ease: "linear"
          }}
          className="absolute"
          style={{
            width: petal.size,
            height: petal.size,
          }}
        >
          {/* Pixel-art style petal */}
          <div className="w-full h-full bg-[#ffb7c5] rounded-full relative">
             <div className="absolute inset-0 bg-[#ff99ac] rounded-full scale-75 translate-x-1" />
             <div className="absolute inset-0 border border-white/20 rounded-full" />
          </div>
        </motion.div>
      ))}
    </div>
  );
};
