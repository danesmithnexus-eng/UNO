import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card as CardType, Player, CardColor, CardValue } from '../logic/types';
import { Card } from './Card';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SpecialCardEffectProps {
  show: boolean;
  card: CardType;
  player: Player;
  chosenColor?: CardColor;
}

const PixelAnimeFace: React.FC<{ expression: 'DETERMINED' | 'SMUG' | 'SHOCKED' | 'AGGRESSIVE' | 'GRIN', color: string }> = ({ expression, color }) => {
  const getEyes = () => {
    switch (expression) {
      case 'GRIN':
        return (
          <>
            <rect x="1" y="5" width="4" height="1" fill="black" />
            <rect x="7" y="5" width="4" height="1" fill="black" />
            <rect x="2" y="4" width="2" height="1" fill="black" />
            <rect x="8" y="4" width="2" height="1" fill="black" />
            {/* Red Eye Glow */}
            <rect x="8" y="5" width="1" height="1" fill="#ff0000" />
          </>
        );
      case 'DETERMINED':
        return (
          <>
            <rect x="2" y="5" width="3" height="1" fill="black" />
            <rect x="7" y="5" width="3" height="1" fill="black" />
            <rect x="2" y="6" width="3" height="1" fill="black" />
            <rect x="7" y="6" width="3" height="1" fill="black" />
            {/* Star Glow */}
            <path d="M9 4 L10 5 L9 6 L8 5 Z" fill="#fff700" />
          </>
        );
      case 'SMUG':
        return (
          <>
            <rect x="2" y="6" width="3" height="1" fill="black" />
            <rect x="7" y="6" width="3" height="1" fill="black" />
            <rect x="2" y="5" width="1" height="1" fill="black" />
            <rect x="10" y="5" width="1" height="1" fill="black" />
            {/* Pupil */}
            <rect x="3" y="6" width="1" height="1" fill="#4a0000" />
          </>
        );
      case 'SHOCKED':
        return (
          <>
            <rect x="2" y="4" width="2" height="3" fill="white" />
            <rect x="8" y="4" width="2" height="3" fill="white" />
            <rect x="2.5" y="5" width="1" height="1" fill="black" />
            <rect x="8.5" y="5" width="1" height="1" fill="black" />
          </>
        );
      case 'AGGRESSIVE':
        return (
          <>
            <path d="M1 4 L4 6" stroke="black" strokeWidth="1" />
            <path d="M11 4 L8 6" stroke="black" strokeWidth="1" />
            <rect x="2" y="6" width="2" height="1" fill="black" />
            <rect x="8" y="6" width="2" height="1" fill="black" />
            <rect x="3" y="6" width="1" height="1" fill="white" />
          </>
        );
    }
  };

  const getMouth = () => {
    switch (expression) {
      case 'GRIN': 
        return (
          <path d="M3 10 Q6 13 9 10" fill="white" stroke="black" strokeWidth="1" />
        );
      case 'DETERMINED': return <rect x="5" y="10" width="2" height="1" fill="black" />;
      case 'SMUG': return <path d="M4 10 Q6 12 8 10" fill="#ff8080" stroke="black" strokeWidth="0.5" />;
      case 'SHOCKED': return <circle cx="6" cy="11" r="1.5" fill="black" />;
      case 'AGGRESSIVE': 
        return (
          <>
            <rect x="3" y="10" width="6" height="2" fill="white" />
            <path d="M3 10 L9 10 L9 12 L3 12 Z" fill="none" stroke="black" strokeWidth="0.5" />
            <rect x="4" y="10" width="0.5" height="2" fill="black" opacity="0.2" />
            <rect x="6" y="10" width="0.5" height="2" fill="black" opacity="0.2" />
            <rect x="8" y="10" width="0.5" height="2" fill="black" opacity="0.2" />
          </>
        );
    }
  };

  const getHair = () => {
    return (
      <>
        <path d="M0 0 L12 0 L12 4 L10 2 L8 5 L6 1 L4 4 L2 2 L0 5 Z" fill="#3d2b1f" />
        <path d="M0 0 L12 0 L12 3 L10 1 L8 4 L6 0 L4 3 L2 1 L0 4 Z" fill="#5c4033" />
      </>
    );
  };

  return (
    <svg viewBox="0 0 12 14" className="w-full h-full shape-rendering-pixelated">
      {/* Face Base */}
      <rect x="0" y="0" width="12" height="14" fill={color} />
      {/* Shadow */}
      <rect x="0" y="8" width="12" height="6" fill="black" fillOpacity="0.1" />
      {/* Features */}
      {getHair()}
      {getEyes()}
      {getMouth()}
      {/* Blushing */}
      <rect x="1" y="8" width="2" height="0.5" fill="#ff0000" fillOpacity="0.2" />
      <rect x="9" y="8" width="2" height="0.5" fill="#ff0000" fillOpacity="0.2" />
    </svg>
  );
};

export const SpecialCardEffect: React.FC<SpecialCardEffectProps> = ({ show, card, player, chosenColor }) => {
  if (!show) return null;

  const getExpression = (value: CardValue): 'DETERMINED' | 'SMUG' | 'SHOCKED' | 'AGGRESSIVE' | 'GRIN' => {
    switch (value) {
      case 'WILD_DRAW4': return 'AGGRESSIVE';
      case 'DRAW2': return 'GRIN';
      case 'SKIP': return 'DETERMINED';
      case 'REVERSE': return 'SMUG';
      case 'WILD': return 'SMUG';
      default: return 'SHOCKED';
    }
  };

  const getEffectColor = () => {
    const color = chosenColor || card.color;
    switch (color) {
      case 'RED': return 'from-red-600 to-red-900';
      case 'BLUE': return 'from-blue-600 to-blue-900';
      case 'GREEN': return 'from-green-600 to-green-900';
      case 'YELLOW': return 'from-yellow-500 to-yellow-700';
      default: return 'from-purple-600 to-purple-900';
    }
  };

  const getActionText = () => {
    switch (card.value) {
      case 'SKIP': return 'CANCELLED!';
      case 'REVERSE': return 'SWITCH!';
      case 'DRAW2': return 'TAKE TWO!';
      case 'WILD_DRAW4': return 'KABOOM!';
      case 'WILD': return 'WILD CARD!';
      default: return 'SPECIAL!';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[1000] flex items-center justify-center overflow-hidden pointer-events-none"
      >
        {/* Anime Speed Lines Background */}
        <div className="absolute inset-0 bg-black/40" />
        
        {/* Diagonal Split Background */}
        <motion.div
          initial={{ x: '-100%' }}
          animate={{ x: '0%' }}
          exit={{ x: '100%' }}
          transition={{ duration: 0.3, ease: 'circOut' }}
          className={cn(
            "absolute inset-0 bg-gradient-to-br opacity-90",
            getEffectColor()
          )}
          style={{
            clipPath: 'polygon(0 0, 100% 0, 70% 100%, 0% 100%)',
          }}
        />

        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: '0%' }}
          exit={{ x: '-100%' }}
          transition={{ duration: 0.3, ease: 'circOut' }}
          className={cn(
            "absolute inset-0 bg-gradient-to-tl opacity-90",
            getEffectColor()
          )}
          style={{
            clipPath: 'polygon(100% 0, 100% 100%, 0 100%, 30% 0)',
          }}
        />

        {/* Speed Lines Overlay */}
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] animate-pulse" />

        <div className="relative w-full h-full flex items-center justify-center">
          <motion.div
            initial={{ x: -100, opacity: 0, skewX: -10 }}
            animate={{ x: 0, opacity: 1, skewX: -10 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="absolute left-[15%] flex flex-col items-center gap-4"
          >
            <div className="relative">
              <div className="w-32 h-32 sm:w-48 sm:h-48 bg-white pixel-border-thick flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-white to-zinc-300">
                <div className="w-full h-full relative">
                  <PixelAnimeFace 
                    expression={getExpression(card.value)} 
                    color={
                      (chosenColor || card.color) === 'RED' ? '#ff4d4d' : 
                      (chosenColor || card.color) === 'BLUE' ? '#4d79ff' : 
                      (chosenColor || card.color) === 'GREEN' ? '#2eb82e' : 
                      (chosenColor || card.color) === 'YELLOW' ? '#ffcc00' : '#a855f7'
                    } 
                  />
                </div>
              </div>
              {/* Eye Flash Effect */}
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: ['0%', '150%', '150%'], opacity: [0, 1, 0] }}
                transition={{ delay: 0.5, duration: 0.4, times: [0, 0.5, 1] }}
                className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 h-2 bg-white blur-md z-10"
              />
            </div>
            <div className="bg-black text-white px-6 py-2 pixel-border-sm font-black italic text-xl sm:text-3xl tracking-tighter uppercase flex items-center gap-3">
              <span className="text-2xl sm:text-4xl not-italic">{player.avatar}</span>
              <span>{player.name}</span>
            </div>
          </motion.div>

          {/* Center: Slash Line */}
          <motion.div
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1.5 }}
            transition={{ duration: 0.2 }}
            className="absolute w-2 h-full bg-white rotate-[20deg] shadow-[0_0_20px_rgba(255,255,255,0.8)] z-20"
          />

          {/* Right Side: Card Face-off */}
          <motion.div
            initial={{ x: 100, opacity: 0, skewX: -10 }}
            animate={{ x: 0, opacity: 1, skewX: -10 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="absolute right-[15%] flex flex-col items-center gap-4"
          >
            <div className="relative group">
              <motion.div
                animate={{ 
                  y: [0, -10, 0],
                }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              >
                <Card card={card} className="w-32 h-48 sm:w-44 sm:h-64 pixel-shadow-lg scale-110" />
              </motion.div>
              {/* Card Aura */}
              <div className="absolute -inset-4 bg-white/30 blur-xl -z-10 animate-pulse rounded-xl" />
            </div>
            
            <div className="bg-yellow-400 text-black px-6 py-2 pixel-border-sm font-black italic text-xl sm:text-3xl tracking-tighter uppercase">
              {getActionText()}
            </div>
          </motion.div>

          {/* Big Action Text Overlay */}
          <motion.div
            initial={{ scale: 2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4, type: 'spring', damping: 12 }}
            className="absolute bottom-[10%] sm:bottom-[15%] z-30"
          >
            <h2 className="text-6xl sm:text-9xl font-black italic text-white pixel-text drop-shadow-[0_10px_0_#000] tracking-tighter uppercase">
              {card.value}!!
            </h2>
          </motion.div>
        </div>

        {/* Impact Frames */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.1, times: [0, 0.5, 1] }}
          className="absolute inset-0 bg-white z-[2000] mix-blend-difference"
        />
      </motion.div>
    </AnimatePresence>
  );
};
