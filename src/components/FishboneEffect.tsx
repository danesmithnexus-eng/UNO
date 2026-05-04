import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface Fishbone {
  id: number;
  y: string;
  delay: number;
  duration: number;
  scale: number;
}

export const FishboneEffect: React.FC = () => {
  const fishbones = useMemo<Fishbone[]>(() => {
    return Array.from({ length: 5 }).map((_, i) => ({
      id: i,
      y: `${20 + Math.random() * 60}%`, // Stay within central 60% of screen
      delay: i * 0.8 + Math.random() * 0.5, // Staggered entry
      duration: 4 + Math.random() * 2,
      scale: 0.8 + Math.random() * 0.4,
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[100]">
      {fishbones.map((bone) => (
        <motion.div
          key={bone.id}
          initial={{ 
            left: '-20%', 
            top: bone.y,
            rotate: 0,
            opacity: 0 
          }}
          animate={{ 
            left: '120%',
            rotate: [0, 5, -5, 0], // Subtle "swimming" rotation
            opacity: [0, 1, 1, 0]
          }}
          transition={{
            duration: bone.duration,
            repeat: Infinity,
            delay: bone.delay,
            ease: "linear",
            rotate: {
              duration: 0.5,
              repeat: Infinity,
              ease: "easeInOut"
            }
          }}
          className="absolute"
          style={{
            width: 80 * bone.scale,
            height: 40 * bone.scale,
          }}
        >
          {/* Pixel Art Fishbone SVG */}
          <svg viewBox="0 0 100 50" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-[2px_2px_0px_rgba(0,0,0,0.5)]">
            {/* Head */}
            <path d="M5 25C5 15 15 10 25 10V40C15 40 5 35 5 25Z" fill="#e2e2d2" stroke="#4a4a3a" strokeWidth="2"/>
            <circle cx="15" cy="22" r="2" fill="#4a4a3a"/>
            <path d="M8 32H15" stroke="#4a4a3a" strokeWidth="2"/>
            
            {/* Spine */}
            <path d="M25 25H85" stroke="#e2e2d2" strokeWidth="4" strokeLinecap="round"/>
            
            {/* Ribs */}
            {[35, 45, 55, 65, 75].map((x, i) => (
              <React.Fragment key={i}>
                <path d={`M${x} 25V${10 + i}`} stroke="#e2e2d2" strokeWidth="3" strokeLinecap="round"/>
                <path d={`M${x} 25V${40 - i}`} stroke="#e2e2d2" strokeWidth="3" strokeLinecap="round"/>
              </React.Fragment>
            ))}
            
            {/* Tail */}
            <path d="M85 25L95 15V35L85 25Z" fill="#e2e2d2" stroke="#4a4a3a" strokeWidth="2"/>
          </svg>
        </motion.div>
      ))}
    </div>
  );
};
