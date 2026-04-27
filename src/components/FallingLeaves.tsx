import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface Leaf {
  id: number;
  x: string;
  delay: number;
  duration: number;
  size: number;
  rotation: number;
  color: string;
}

const LEAF_COLORS = ['#d97706', '#92400e', '#b45309', '#78350f', '#f59e0b'];

export const FallingLeaves: React.FC = () => {
  const leaves = useMemo(() => {
    return Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      x: `${Math.random() * 100}%`,
      delay: Math.random() * 5,
      duration: 6 + Math.random() * 6,
      size: 12 + Math.random() * 12,
      rotation: Math.random() * 360,
      color: LEAF_COLORS[Math.floor(Math.random() * LEAF_COLORS.length)],
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {leaves.map((leaf) => (
        <motion.div
          key={leaf.id}
          initial={{ 
            top: '-5%', 
            left: leaf.x, 
            rotate: leaf.rotation,
            opacity: 0 
          }}
          animate={{ 
            top: '105%',
            left: `calc(${leaf.x} + ${Math.random() * 15 - 7.5}%)`,
            rotate: leaf.rotation + 720,
            opacity: [0, 1, 1, 0]
          }}
          transition={{
            duration: leaf.duration,
            repeat: Infinity,
            delay: leaf.delay,
            ease: "linear"
          }}
          className="absolute"
          style={{
            width: leaf.size,
            height: leaf.size,
          }}
        >
          {/* Pixel-art style leaf */}
          <div className="w-full h-full relative" style={{ color: leaf.color }}>
             <div className="absolute inset-0 bg-current pixel-border-sm" style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }} />
             <div className="absolute inset-0 bg-black/20 scale-50 translate-x-1" style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }} />
          </div>
        </motion.div>
      ))}
    </div>
  );
};
