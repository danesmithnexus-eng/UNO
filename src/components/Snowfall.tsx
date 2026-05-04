import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface Snowflake {
  id: number;
  x: string;
  delay: number;
  duration: number;
  size: number;
  opacity: number;
}

export const Snowfall: React.FC = () => {
  const snowflakes = useMemo<Snowflake[]>(() => {
    return Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      x: `${Math.random() * 100}%`,
      delay: Math.random() * 10,
      duration: 10 + Math.random() * 10,
      size: 4 + Math.random() * 6,
      opacity: 0.4 + Math.random() * 0.4,
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[100]">
      {snowflakes.map((snowflake) => (
        <motion.div
          key={snowflake.id}
          initial={{ 
            top: '-5%', 
            left: snowflake.x, 
            opacity: 0 
          }}
          animate={{ 
            top: '105%',
            left: `calc(${snowflake.x} + ${Math.random() * 20 - 10}%)`,
            opacity: [0, snowflake.opacity, snowflake.opacity, 0]
          }}
          transition={{
            duration: snowflake.duration,
            repeat: Infinity,
            delay: snowflake.delay,
            ease: "linear"
          }}
          className="absolute bg-white rounded-full blur-[1px]"
          style={{
            width: snowflake.size,
            height: snowflake.size,
          }}
        />
      ))}
    </div>
  );
};
