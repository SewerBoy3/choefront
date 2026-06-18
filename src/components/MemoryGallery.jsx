import React from 'react';
import { motion } from 'framer-motion';
import { Image, ExternalLink, Heart } from 'lucide-react';
import { playPop, playTick } from '../utils/sounds';

export default function MemoryGallery({ files, loading, error }) {
  // Filtrar archivos que sean imágenes
  const imageFiles = files ? files.filter(f => f.mimeType?.startsWith('image/')) : [];

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-48 gap-2">
        <span className="font-retro text-xs text-white animate-pulse">CARGANDO RECUERDOS...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-6 font-retro text-[8px] text-slate-400 italic">
        No se pudieron cargar recuerdos adicionales desde Google Drive.
      </div>
    );
  }

  if (imageFiles.length === 0) {
    return (
      <div className="text-center py-8 font-retro text-[8px] text-slate-400 italic">
        No se encontraron fotos en la carpeta seleccionada de Google Drive.
      </div>
    );
  }

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
        <p className="font-retro text-[8px] text-slate-400 mt-2 max-w-xl mx-auto leading-relaxed">
          Fotos sincronizadas directamente desde Google Drive para revivir recuerdos inolvidables.
        </p>
      </div>

      {/* Grid de imágenes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {imageFiles.map((image, index) => (
          <motion.div
            key={image.id}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="group retro-container p-3 flex flex-col justify-between"
          >
            {/* Contenedor de la Imagen */}
            <div className="aspect-[4/3] overflow-hidden relative border-2 border-black bg-slate-900" style={{ imageRendering: 'pixelated' }}>
              <img
                src={image.url}
                alt={image.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                style={{ imageRendering: 'pixelated' }}
                loading="lazy"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&q=80&w=800';
                }}
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end p-3">
                <span className="text-white font-retro text-[7px] flex items-center gap-1">
                  <Heart className="w-3 h-3 fill-pastel-pink text-pastel-pink animate-pulse" />
                  {image.name.replace(/\.[^/.]+$/, "")}
                </span>
              </div>
            </div>

            {/* Detalles del archivo */}
            <div className="mt-3 flex justify-between items-center px-1">
              <span className="font-retro text-[8px] text-white truncate max-w-[80%]">
                {image.name.replace(/\.[^/.]+$/, "")}
              </span>
              {image.webViewLink && (
                <a
                  href={image.webViewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={playPop}
                  onMouseEnter={playTick}
                  className="text-pastel-pink hover:text-white transition-colors"
                  title="Ver en Google Drive"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
