import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image, Heart, X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { playPop, playTick } from '../utils/sounds';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function MemoryGallery() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/gallery`);
      if (res.ok) {
        const data = await res.json();
        setPhotos(data);
        setError(null);
      } else {
        setError('No se pudo cargar la galería.');
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const openPhoto = (index) => {
    playPop();
    setSelectedIndex(index);
  };

  const closeModal = () => {
    setSelectedIndex(null);
  };

  const goNext = useCallback((e) => {
    e?.stopPropagation();
    playTick();
    setSelectedIndex((prev) => (prev + 1) % photos.length);
  }, [photos.length]);

  const goPrev = useCallback((e) => {
    e?.stopPropagation();
    playTick();
    setSelectedIndex((prev) => (prev - 1 + photos.length) % photos.length);
  }, [photos.length]);

  // Keyboard navigation
  useEffect(() => {
    if (selectedIndex === null) return;
    const handler = (e) => {
      if (e.key === 'Escape') closeModal();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedIndex, goNext, goPrev]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-48 gap-3">
        <Loader2 className="w-6 h-6 text-pastel-pink animate-spin" />
        <span className="font-retro text-[8px] text-white animate-pulse">CARGANDO RECUERDOS...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-6 font-retro text-[8px] text-slate-400 italic">
        No se pudieron cargar los recuerdos. {error}
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="text-center py-8 font-retro text-[8px] text-slate-400 italic">
        Aún no hay fotos en la galería. ¡El admin puede agregar recuerdos!
      </div>
    );
  }

  const selected = selectedIndex !== null ? photos[selectedIndex] : null;

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {/* Cabecera */}
      <div className="text-center mb-10">
        <div className="inline-block retro-container px-6 py-2 mb-4">
          <span className="font-retro text-[9px] text-pastel-lavender-light flex items-center gap-1.5 justify-center">
            <Image className="w-4 h-4" />
            GALERÍA DE MOMENTOS ÉPICOS
          </span>
        </div>
        <p className="font-retro text-[7px] text-slate-400 mt-2 max-w-xl mx-auto leading-relaxed">
          Cada foto es un recuerdo guardado en nuestro save file ♡
        </p>
      </div>

      {/* Grid de fotos — Masonry-like con aspect ratios variados */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {photos.map((photo, index) => (
          <motion.div
            key={photo.id}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.25, delay: index * 0.03 }}
            onClick={() => openPhoto(index)}
            className="group relative cursor-pointer overflow-hidden border-4 border-black bg-slate-900 hover:border-pastel-pink transition-colors duration-200"
            style={{
              aspectRatio: index % 5 === 0 ? '1/1.2' : index % 3 === 0 ? '1.2/1' : '1/1'
            }}
          >
            <img
              src={photo.image_url}
              alt={photo.caption || 'Recuerdo'}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              loading="lazy"
              onError={(e) => {
                e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%231a1525" width="100" height="100"/><text x="50" y="55" text-anchor="middle" fill="%23666" font-size="8">♡</text></svg>';
              }}
            />

            {/* Overlay hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
              <Heart className="w-4 h-4 text-pastel-pink fill-pastel-pink mb-1 animate-pulse" />
              {photo.caption && (
                <p className="font-retro text-[6px] text-white leading-relaxed line-clamp-2">
                  {photo.caption}
                </p>
              )}
            </div>

            {/* Pixel corner decoration */}
            <div className="absolute top-0 right-0 w-3 h-3 bg-pastel-pink opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.div>
        ))}
      </div>

      {/* ═══ MODAL LIGHTBOX (Instagram-like) ═══ */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
            onClick={closeModal}
          >
            {/* Close button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 z-50 w-10 h-10 flex items-center justify-center border-2 border-white bg-black/50 text-white hover:bg-pastel-pink hover:text-black transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Navigation arrows */}
            {photos.length > 1 && (
              <>
                <button
                  onClick={goPrev}
                  className="absolute left-2 sm:left-6 z-50 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center border-2 border-white bg-black/50 text-white hover:bg-pastel-pink hover:text-black transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
                <button
                  onClick={goNext}
                  className="absolute right-2 sm:right-6 z-50 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center border-2 border-white bg-black/50 text-white hover:bg-pastel-pink hover:text-black transition-colors"
                >
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </>
            )}

            {/* Photo content */}
            <motion.div
              key={selected.id}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="relative max-w-4xl w-full max-h-[85vh] flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Image */}
              <div className="relative border-4 border-white bg-black shadow-[8px_8px_0_rgba(0,0,0,0.5)] max-h-[70vh] overflow-hidden">
                <img
                  src={selected.image_url}
                  alt={selected.caption || 'Recuerdo'}
                  className="max-w-full max-h-[70vh] object-contain"
                />
              </div>

              {/* Caption */}
              {selected.caption && (
                <div className="mt-4 retro-container px-6 py-3 max-w-lg text-center">
                  <Heart className="w-3 h-3 text-pastel-pink fill-pastel-pink inline mr-2" />
                  <span className="font-retro text-[7px] text-white leading-relaxed">
                    {selected.caption}
                  </span>
                </div>
              )}

              {/* Counter */}
              <div className="mt-3 font-retro text-[6px] text-slate-500">
                {selectedIndex + 1} / {photos.length}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
