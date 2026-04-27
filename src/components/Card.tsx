import React from 'react'
import { Card as CardType } from '../logic/types'
import { motion } from 'framer-motion'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface CardProps {
  card?: CardType
  onClick?: () => void
  disabled?: boolean
  isBack?: boolean
  className?: string
}

export const Card: React.FC<CardProps> = ({ card, onClick, disabled, isBack, className }) => {
  const getColorClass = (color: string) => {
    switch (color) {
      case 'RED': return 'bg-gradient-to-br from-[#ff5f5f] via-[#e53d3d] to-[#b32d2d]'
      case 'BLUE': return 'bg-gradient-to-br from-[#4d8eff] via-[#2b65e2] to-[#1a44a1]'
      case 'GREEN': return 'bg-gradient-to-br from-[#5fd35f] via-[#38a538] to-[#247a24]'
      case 'YELLOW': return 'bg-gradient-to-br from-[#ffea5f] via-[#f4c824] to-[#c29c1a]'
      default: return 'bg-[#1a1a1a]'
    }
  }

  const getTextColorClass = (color: string) => {
    switch (color) {
      case 'RED': return 'text-[#ff5f5f]'
      case 'BLUE': return 'text-[#4d8eff]'
      case 'GREEN': return 'text-[#5fd35f]'
      case 'YELLOW': return 'text-[#ffea5f]'
      default: return 'text-white'
    }
  }

  const baseClasses = "w-16 h-24 sm:w-20 sm:h-32 bg-white rounded-sm pixel-border-32 flex flex-col items-center justify-center p-1 sm:p-1.5 cursor-pointer select-none transition-opacity relative overflow-hidden"

  if (isBack) {
    return (
      <motion.div 
        whileHover={!disabled ? { scale: 1.05 } : {}}
        whileTap={!disabled ? { scale: 0.95 } : {}}
        onClick={!disabled ? onClick : undefined}
        className={cn(
          "w-16 h-24 sm:w-20 sm:h-32 bg-white pixel-border-32 rounded-sm flex items-center justify-center p-1 sm:p-1.5 cursor-pointer transition-opacity group", 
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
      >
        <div className="w-full h-full bg-[#2b65e2] pixel-border-sm flex items-center justify-center relative overflow-hidden">
          {/* 32-bit Highlight */}
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/20 to-transparent pointer-events-none z-10" />
          
          {/* Slanted design background */}
          <div className="absolute inset-0 bg-[#e53d3d] transform -skew-x-[25deg] translate-x-8 sm:translate-x-10" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-[85%] h-[45%] bg-white rounded-[50%] flex items-center justify-center transform rotate-[-20deg] pixel-border-sm shadow-[inset_0_4px_0_rgba(0,0,0,0.1)]">
              <span className="text-[#e53d3d] text-[12px] sm:text-[16px] font-black italic transform rotate-[20deg] pixel-text tracking-tighter drop-shadow-[0_2px_0_rgba(0,0,0,0.2)]">UNO</span>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  if (!card) return null

  const isWild = card.color === 'WILD' || card.value === 'WILD_DRAW4'

  return (
    <motion.div
      whileHover={!disabled ? { y: -10, scale: 1.05, rotate: 0 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      onClick={!disabled ? onClick : undefined}
      className={cn(
        baseClasses,
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      {/* Colored Inner Area */}
      <div className={cn(
        "w-full h-full pixel-border-sm relative flex items-center justify-center overflow-hidden",
        getColorClass(card.color)
      )}>
        {/* 32-bit Highlight Overlay */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/30 to-transparent pointer-events-none z-10" />
        
        {/* Corner Values */}
        <div className="absolute top-1 left-1 text-[10px] sm:text-[12px] font-black text-white pixel-text leading-none z-20">
          {card.value === 'WILD' ? '' : card.value === 'WILD_DRAW4' ? '+4' : card.value === 'SKIP' ? '⊘' : card.value === 'REVERSE' ? '⇄' : card.value === 'DRAW2' ? '+2' : card.value}
        </div>
        <div className="absolute bottom-1 right-1 text-[10px] sm:text-[12px] font-black text-white pixel-text leading-none z-20 transform rotate-180">
          {card.value === 'WILD' ? '' : card.value === 'WILD_DRAW4' ? '+4' : card.value === 'SKIP' ? '⊘' : card.value === 'REVERSE' ? '⇄' : card.value === 'DRAW2' ? '+2' : card.value}
        </div>

        {/* Center Oval */}
        <div className={cn(
          "w-[85%] h-[70%] rounded-[50%] flex items-center justify-center transform -rotate-[25deg] pixel-border-sm z-10",
          isWild ? "bg-gradient-to-br from-red-500 via-blue-500 to-green-500 shadow-[inset_0_4px_0_rgba(255,255,255,0.3)]" : "bg-white shadow-[inset_0_4px_0_rgba(0,0,0,0.1)]"
        )}>
          <div className="transform rotate-[25deg] flex items-center justify-center">
            {card.value === 'REVERSE' ? (
              <span className={cn("text-sm sm:text-2xl font-black italic drop-shadow-[0_2px_0_rgba(0,0,0,0.2)]", isWild ? "text-white" : getTextColorClass(card.color))}>⇄</span>
            ) : (
              <span className={cn(
                "text-xl sm:text-4xl font-black pixel-text italic tracking-tighter drop-shadow-[0_2px_0_rgba(0,0,0,0.2)]",
                isWild ? "text-white" : getTextColorClass(card.color)
              )}>
                {card.value === 'WILD' ? 'W' : card.value === 'WILD_DRAW4' ? '+4' : card.value === 'SKIP' ? '⊘' : card.value === 'DRAW2' ? '+2' : card.value}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
