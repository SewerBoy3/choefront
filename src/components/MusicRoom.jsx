import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, ExternalLink, Heart, Disc3 } from 'lucide-react';
import { playPop, playTick } from '../utils/sounds';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Detectar de qué plataforma es el link para mostrar el icono/label correcto
function detectPlatform(url) {
  if (!url) return { label: 'Escuchar', color: '#aec6cf' };
  if (url.includes('spotify.com')) return { label: 'Abrir en Spotify', color: '#1DB954' };
  if (url.includes('youtube.com') || url.includes('youtu.be')) return { label: 'Ver en YouTube', color: '#FF0000' };
  if (url.includes('soundcloud.com')) return { label: 'Abrir en SoundCloud', color: '#FF5500' };
  if (url.includes('apple')) return { label: 'Abrir en Apple Music', color: '#FC3C44' };
  return { label: 'Escuchar 🎵', color: '#ff99aa' };
}

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: (i) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: i * 0.07, duration: 0.3, ease: 'easeOut' },
  }),
};

export default function MusicRoom() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API}/songs`);
        if (!res.ok) throw new Error('No se pudo cargar la biblioteca.');
        const data = await res.json();
        if (!cancelled) setSongs(data);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const [likedSongs, setLikedSongs] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('regalo_liked_songs') || '[]');
    } catch {
      return [];
    }
  });

  const toggleLike = (songId, e) => {
    e.stopPropagation();
    e.preventDefault();
    playPop();
    const isLiked = likedSongs.includes(songId);
    let nextLikes;
    if (isLiked) {
      nextLikes = likedSongs.filter(id => id !== songId);
    } else {
      nextLikes = [...likedSongs, songId];
    }
    setLikedSongs(nextLikes);
    localStorage.setItem('regalo_liked_songs', JSON.stringify(nextLikes));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Disc3 className="w-10 h-10 text-pastel-pink animate-spin" />
        <p className="font-retro text-[8px] text-slate-400 animate-pulse">CARGANDO SALA DE MÚSICA...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Music className="w-10 h-10 text-slate-600" />
        <p className="font-retro text-[8px] text-slate-500 text-center">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="text-center mb-10">
        <h2 className="font-retro text-base md:text-xl text-pastel-pink-light drop-shadow-[3px_3px_0_#000] mb-2">
          ♪ SALA DE MÚSICA ♪
        </h2>
        <p className="font-sans text-xs text-slate-400">
          Nuestra colección de canciones especiales
        </p>
      </div>

      {songs.length === 0 ? (
        <div className="retro-container p-16 text-center">
          <Music className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="font-retro text-[8px] text-slate-500">
            Todavía no hay canciones en la biblioteca.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence>
            {songs.map((song, i) => {
              const platform = detectPlatform(song.url);
              const isLiked = likedSongs.includes(song.id);
              return (
                <motion.div
                  key={song.id}
                  custom={i}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  className="retro-container p-0 overflow-hidden flex flex-col group"
                >
                  {/* Portada */}
                  <div className="relative overflow-hidden aspect-square bg-[#2d2038]">
                    {song.coverUrl ? (
                      <img
                        src={song.coverUrl}
                        alt={song.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        style={{ imageRendering: 'auto' }}
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Disc3 className="w-16 h-16 text-slate-600" />
                      </div>
                    )}
                    {/* Botón de Like sobre la portada */}
                    <button
                      onClick={(e) => toggleLike(song.id, e)}
                      onMouseEnter={playTick}
                      className="absolute top-3 right-3 z-10 retro-btn !p-1.5 !min-w-0 bg-white/95 border-2 border-black active:scale-90 shadow-[2px_2px_0_#000] hover:!bg-pink-100"
                      title={isLiked ? "Quitar me gusta" : "Me gusta"}
                    >
                      <Heart
                        className={`w-3.5 h-3.5 transition-colors duration-200 ${
                          isLiked ? 'text-pastel-pink fill-pastel-pink animate-bounce' : 'text-slate-400'
                        }`}
                      />
                    </button>
                    {/* Overlay al hacer hover */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 pointer-events-none flex items-center justify-center">
                      <Heart className={`w-8 h-8 text-pastel-pink opacity-0 group-hover:opacity-40 transition-opacity duration-300 drop-shadow-[2px_2px_0_#000] ${isLiked ? 'fill-pastel-pink' : ''}`} />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4 flex flex-col gap-3 flex-1">
                    <div>
                      <h3 className="font-retro text-[9px] text-white leading-snug mb-1">
                        {song.title}
                      </h3>
                      {song.artist && (
                        <p className="font-retro text-[6px] text-pastel-pink">
                          {song.artist}
                        </p>
                      )}
                    </div>

                    {song.description && (
                      <p className="font-sans text-[11px] text-slate-400 leading-relaxed italic border-l-2 border-pastel-pink/40 pl-2">
                        "{song.description}"
                      </p>
                    )}

                    {/* Botón de link externo */}
                    <div className="mt-auto pt-1">
                      {song.url ? (
                        <a
                          href={song.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => { playPop(); }}
                          onMouseEnter={playTick}
                          className="retro-btn w-full text-[7px] flex items-center justify-center gap-2 !py-2"
                          style={{ color: '#000' }}
                        >
                          <ExternalLink className="w-3 h-3" />
                          {platform.label}
                        </a>
                      ) : (
                        <div className="font-retro text-[6px] text-slate-600 text-center py-2">
                          Sin enlace disponible
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
