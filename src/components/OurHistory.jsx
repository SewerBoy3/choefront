import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowLeft, Calendar, Heart } from 'lucide-react';
import { playPop, playTick } from '../utils/sounds';

// Datos de ejemplo para la historia
const HISTORY_EVENTS = [
  {
    id: 1,
    date: 'El Comienzo',
    title: 'Donde Todo Empezó',
    description: 'Ese primer día en que nuestras miradas se cruzaron. Yo sabía que estaba a punto de empezar la mejor aventura de mi vida. Todo parecía estar pixelado de perfección.',
    image: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 2,
    date: 'Primer Viaje',
    title: 'Explorando Nuevos Mundos',
    description: 'Nuestra primera escapada juntos. Descubriendo lugares nuevos, riendo hasta que nos dolió la panza y coleccionando recuerdos inolvidables.',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 3,
    date: 'Hoy',
    title: 'Construyendo el Futuro',
    description: 'Cada día a tu lado es como subir de nivel. Y sé que juntos vamos a desbloquear todos los logros que esta vida tiene para darnos.',
    image: 'https://images.unsplash.com/photo-1494774157365-9e04c6720e47?auto=format&fit=crop&q=80&w=800'
  }
];

const HistoryItem = ({ event, isEven }) => {
  const containerRef = useRef(null);
  
  // Parallax Setup
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start']
  });

  // Mover la imagen un 30% más lento (Parallax effect)
  const yImage = useTransform(scrollYProgress, [0, 1], ['-15%', '15%']);

  return (
    <div ref={containerRef} className="relative w-full min-h-[60vh] flex items-center justify-center overflow-hidden my-12 retro-border-pixel p-4">
      
      {/* Fondo Parallax (Imagen) */}
      <motion.div 
        className="absolute inset-0 z-0"
        style={{ y: yImage }}
      >
        <img 
          src={event.image} 
          alt={event.title}
          className="w-full h-[130%] object-cover opacity-30 blur-[2px] grayscale-[30%] select-none"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a1525]/80 via-[#1a1525]/40 to-[#1a1525]/80"></div>
      </motion.div>

      {/* Contenido Foreground (Texto) */}
      <div className={`relative z-10 w-full max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-8 ${isEven ? 'md:flex-row-reverse' : ''}`}>
        
        {/* Fecha / Sprite Decorativo */}
        <div className="flex-1 flex justify-center">
          <div className="glass-panel-retro p-6 flex flex-col items-center text-center transform hover:scale-105 transition-transform">
            <Heart className="w-8 h-8 text-pastel-pink-dark animate-pulse mb-3" />
            <span className="font-retro text-xs text-pastel-pink-light tracking-widest">{event.date}</span>
          </div>
        </div>

        {/* Texto de la Historia */}
        <div className="flex-[2] glass-panel-retro p-8">
          <h3 className="font-retro text-sm md:text-base text-white mb-4 leading-relaxed">
            {event.title}
          </h3>
          <p className="font-sans text-sm md:text-base text-slate-300 leading-loose">
            {event.description}
          </p>
        </div>

      </div>
    </div>
  );
};

export default function OurHistory() {
  return (
    <div className="min-h-screen bg-[#1a1525] pb-24">
      {/* Header Sticky */}
      <div className="sticky top-0 z-50 glass-panel-retro border-b-4 border-white p-4 flex items-center gap-4">
        <a 
          href="/" 
          onClick={playPop}
          onMouseEnter={playTick}
          className="retro-btn inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Volver
        </a>
        <h1 className="font-retro text-[10px] sm:text-xs text-white uppercase flex items-center gap-2">
          <Calendar className="w-4 h-4 text-pastel-blue" /> Archivos de la Aventura
        </h1>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-12">
        <div className="text-center mb-16">
          <h2 className="font-retro text-xl md:text-2xl text-pastel-pink-light mb-4 drop-shadow-[4px_4px_0_#000]">
            NUESTRO VIAJE ÉPICO
          </h2>
          <p className="font-sans text-slate-400 text-sm max-w-xl mx-auto">
            Cada recuerdo es un nivel superado, cada risa es experiencia ganada. 
            Haz scroll para revivir nuestra historia.
          </p>
        </div>

        {/* Contenedor de la Línea de Tiempo */}
        <div className="relative">
          {/* Línea central (decorativa) */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-1 bg-white shadow-[2px_0_0_#000] -translate-x-1/2 opacity-20"></div>

          {HISTORY_EVENTS.map((event, index) => (
            <HistoryItem key={event.id} event={event} isEven={index % 2 === 0} />
          ))}
        </div>
        
        {/* Footer del Timeline */}
        <div className="mt-16 text-center">
          <p className="font-retro text-[10px] text-pastel-blue animate-pulse">
            To Be Continued...
          </p>
        </div>
      </div>
    </div>
  );
}
