import React from 'react';
import { motion } from 'framer-motion';
import { Music } from 'lucide-react';
import { playPop, playTick } from '../utils/sounds';

/**
 * Badge decorativo en el header que lleva a la Sala de Música.
 * Ya no controla audio — la reproducción ocurre en apps externas.
 */
export default function MiniPlayer({ onOpenMusic }) {
  return (
    <motion.button
      onClick={() => { playPop(); onOpenMusic?.(); }}
      onMouseEnter={playTick}
      animate={{ scale: [1, 1.05, 1] }}
      transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
      className="flex items-center gap-1.5 border-2 border-pastel-pink/40 bg-[#2d2038]/80 px-2 py-1 hover:border-pastel-pink transition-colors"
      title="Sala de Música"
    >
      <Music className="w-3 h-3 text-pastel-pink" />
      <span className="font-retro text-[5px] text-slate-300">MÚSICA</span>
    </motion.button>
  );
}
