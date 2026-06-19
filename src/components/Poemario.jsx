import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Heart, X, ChevronLeft, ChevronRight, Feather, Loader2 } from 'lucide-react';
import { playPop, playTick } from '../utils/sounds';
import { sanitizeHtml } from '../utils/sanitizeHtml';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function LetterCard({ carta, index, onClick }) {
  const envelopeColors = [
    { bg: 'from-pink-900/40 to-pink-950/60', border: 'border-pastel-pink', accent: 'text-pastel-pink', stamp: 'bg-pastel-pink/20' },
    { bg: 'from-blue-900/40 to-blue-950/60', border: 'border-pastel-blue', accent: 'text-pastel-blue', stamp: 'bg-pastel-blue/20' },
    { bg: 'from-purple-900/40 to-purple-950/60', border: 'border-pastel-lavender', accent: 'text-pastel-lavender', stamp: 'bg-pastel-lavender/20' },
    { bg: 'from-orange-900/40 to-orange-950/60', border: 'border-pastel-peach', accent: 'text-pastel-peach', stamp: 'bg-pastel-peach/20' },
    { bg: 'from-emerald-900/40 to-emerald-950/60', border: 'border-pastel-mint', accent: 'text-pastel-mint', stamp: 'bg-pastel-mint/20' },
  ];
  const theme = envelopeColors[index % envelopeColors.length];
  const plainText = carta.content.replace(/<[^>]*>/g, '');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, rotateZ: -2 }}
      whileInView={{ opacity: 1, y: 0, rotateZ: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      whileHover={{ scale: 1.03, rotateZ: 1 }}
      onClick={() => { playPop(); onClick(); }}
      className="cursor-pointer relative group"
    >
      <div className={`relative bg-gradient-to-br ${theme.bg} border-4 ${theme.border} p-5 sm:p-6 
        shadow-[4px_4px_0_rgba(0,0,0,0.5)] hover:shadow-[6px_6px_0_rgba(0,0,0,0.6)] transition-shadow duration-200`}
      >
        <div className={`absolute top-3 right-3 w-8 h-10 ${theme.stamp} border-2 border-dashed ${theme.border} flex items-center justify-center`}>
          <Heart className={`w-3 h-3 ${theme.accent} fill-current`} />
        </div>

        <div className={`absolute -top-[2px] left-1/2 -translate-x-1/2 w-0 h-0 
          border-l-[40px] border-r-[40px] border-t-[25px] 
          border-l-transparent border-r-transparent ${theme.border.replace('border-', 'border-t-')}
          opacity-30`} 
        />

        <h3 className={`font-retro text-[9px] sm:text-[10px] ${theme.accent} mb-3 pr-10 leading-relaxed`}>
          {carta.title}
        </h3>

        <p className="font-sans text-[11px] sm:text-xs text-slate-400 leading-relaxed line-clamp-3 mb-4">
          {plainText.substring(0, 120)}
          {plainText.length > 120 ? '...' : ''}
        </p>

        {carta.polaroid_image && (
          <div className="w-16 h-16 border-2 border-white bg-black overflow-hidden mb-3 shadow-[2px_2px_0_#000] rotate-[-3deg]">
            <img src={carta.polaroid_image} alt="" className="w-full h-full object-cover" loading="lazy" />
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="font-retro text-[5px] text-slate-500">
            {new Date(carta.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
          <span className={`font-retro text-[6px] ${theme.accent} opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1`}>
            <Feather className="w-3 h-3" /> ABRIR CARTA
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function LetterReader({ carta, onClose, onNext, onPrev, hasNext, hasPrev }) {
  const safeContent = useMemo(() => sanitizeHtml(carta.content), [carta.content]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && hasNext) { playTick(); onNext(); }
      if (e.key === 'ArrowLeft' && hasPrev) { playTick(); onPrev(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, onNext, onPrev, hasNext, hasPrev]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 w-10 h-10 flex items-center justify-center border-2 border-white bg-black/50 text-white hover:bg-pastel-pink hover:text-black transition-colors"
      >
        <X className="w-5 h-5" />
      </button>

      {hasPrev && (
        <button
          onClick={(e) => { e.stopPropagation(); playTick(); onPrev(); }}
          className="absolute left-2 sm:left-6 z-50 w-10 h-10 flex items-center justify-center border-2 border-white bg-black/50 text-white hover:bg-pastel-pink hover:text-black transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}
      {hasNext && (
        <button
          onClick={(e) => { e.stopPropagation(); playTick(); onNext(); }}
          className="absolute right-2 sm:right-6 z-50 w-10 h-10 flex items-center justify-center border-2 border-white bg-black/50 text-white hover:bg-pastel-pink hover:text-black transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}

      <motion.div
        key={carta.id}
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="relative max-w-2xl w-full my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-[#1a1525] border-4 border-white shadow-[8px_8px_0_rgba(0,0,0,0.5)] overflow-hidden">
          <div className="bg-gradient-to-r from-pastel-pink/20 via-pastel-lavender/20 to-pastel-blue/20 px-6 py-4 border-b-4 border-white/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-6 h-6 border-2 border-pastel-pink bg-pastel-pink/10 flex items-center justify-center">
                <Feather className="w-3 h-3 text-pastel-pink" />
              </div>
              <h2 className="font-retro text-[10px] sm:text-xs text-white leading-relaxed">
                {carta.title}
              </h2>
            </div>
            <span className="font-retro text-[5px] text-slate-500">
              {new Date(carta.created_at).toLocaleDateString('es-AR', { 
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
              })}
            </span>
          </div>

          {carta.polaroid_image && (
            <div className="px-6 pt-5 flex justify-center">
              <div className="bg-white p-2 shadow-[4px_4px_0_rgba(0,0,0,0.3)] rotate-[-2deg] max-w-[280px]">
                <img 
                  src={carta.polaroid_image} 
                  alt="" 
                  className="w-full aspect-[4/3] object-cover"
                />
                <div className="h-6" />
              </div>
            </div>
          )}

          <div 
            className="px-6 sm:px-8 py-6 prose-letter max-h-[60vh] overflow-y-auto scroll-smooth"
            dangerouslySetInnerHTML={{ __html: safeContent }}
          />

          <div className="px-6 pb-6 flex items-center justify-center gap-2">
            <div className="h-[2px] flex-1 bg-white/10" />
            <Heart className="w-3 h-3 text-pastel-pink fill-pastel-pink animate-pulse" />
            <div className="h-[2px] flex-1 bg-white/10" />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Poemario() {
  const [cartas, setCartas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(null);

  useEffect(() => {
    fetchCartas();
  }, []);

  const fetchCartas = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/gallery/cartas`);
      if (res.ok) {
        setCartas(await res.json());
      }
    } catch (e) {
      console.error('Error al cargar cartas:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-48 gap-3">
        <Loader2 className="w-6 h-6 text-pastel-lavender animate-spin" />
        <span className="font-retro text-[8px] text-white animate-pulse">ABRIENDO POEMARIO...</span>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="text-center mb-12">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="inline-block retro-container px-8 py-3 mb-4"
        >
          <span className="font-retro text-[10px] text-pastel-lavender-light flex items-center gap-2 justify-center">
            <BookOpen className="w-5 h-5" />
            POEMARIO
          </span>
        </motion.div>
        <p className="font-retro text-[7px] text-slate-400 mt-3 max-w-md mx-auto leading-relaxed">
          Cartas y pensamientos escritos con el corazón. Clickeá un sobre para leerlo ♡
        </p>
      </div>

      {cartas.length === 0 ? (
        <div className="text-center py-12">
          <Feather className="w-8 h-8 text-slate-600 mx-auto mb-4" />
          <p className="font-retro text-[8px] text-slate-500">
            El poemario está vacío por ahora...
          </p>
          <p className="font-retro text-[6px] text-slate-600 mt-2">
            Las cartas aparecerán aquí cuando el admin las publique.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cartas.map((carta, index) => (
            <LetterCard
              key={carta.id}
              carta={carta}
              index={index}
              onClick={() => setSelectedIndex(index)}
            />
          ))}
        </div>
      )}

      <AnimatePresence>
        {selectedIndex !== null && cartas[selectedIndex] && (
          <LetterReader
            carta={cartas[selectedIndex]}
            onClose={() => setSelectedIndex(null)}
            onNext={() => setSelectedIndex((prev) => Math.min(prev + 1, cartas.length - 1))}
            onPrev={() => setSelectedIndex((prev) => Math.max(prev - 1, 0))}
            hasNext={selectedIndex < cartas.length - 1}
            hasPrev={selectedIndex > 0}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
