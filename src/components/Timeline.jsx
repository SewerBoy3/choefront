import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import { motion } from 'framer-motion';
import { Heart, Calendar, Clock, Smile } from 'lucide-react';

dayjs.extend(duration);

export default function Timeline({ anniversaryDate }) {
  const FECHA = anniversaryDate || '2023-09-15';

  const [t, setT] = useState({ years:0, months:0, days:0, hours:0, minutes:0, seconds:0 });
  const [ready, setReady] = useState(false);
  const [greeting, setGreeting] = useState('¡Bienvenido a nuestro álbum especial de recuerdos! ♡');
  const [annivMsg, setAnnivMsg] = useState('¡Feliz Aniversario mi amor!');

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/public-settings`)
      .then(res => res.json())
      .then(data => {
        if (data.timeline_greeting) setGreeting(data.timeline_greeting);
        if (data.anniversary_message) setAnnivMsg(data.anniversary_message);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const calc = () => {
      const now   = dayjs();
      const start = dayjs(FECHA);
      if (now.isBefore(start)) { setReady(true); return; }
      const y  = now.diff(start, 'year');
      const m  = now.diff(start.add(y, 'year'), 'month');
      const d  = now.diff(start.add(y, 'year').add(m, 'month'), 'day');
      const h  = now.diff(start.add(y, 'year').add(m, 'month').add(d, 'day'), 'hour');
      const mi = now.diff(start.add(y, 'year').add(m, 'month').add(d, 'day').add(h, 'hour'), 'minute');
      const s  = now.diff(start.add(y, 'year').add(m, 'month').add(d, 'day').add(h, 'hour').add(mi, 'minute'), 'second');
      setT({ years:y, months:m, days:d, hours:h, minutes:mi, seconds:s });
      setReady(true);
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [FECHA]);

  const containerVars = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1 } },
  };
  const itemVars = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 120, damping: 15 } },
  };

  if (!ready) return (
    <div className="flex justify-center items-center h-48">
      <span className="font-retro text-xs text-white animate-pulse">CARGANDO...</span>
    </div>
  );

  const counters = [
    { label: 'AÑOS',  value: t.years,   color: '#ff99aa' },
    { label: 'MESES', value: t.months,  color: '#aec6cf' },
    { label: 'DÍAS',  value: t.days,    color: '#d8bfd8' },
  ];

  return (
    <motion.div variants={containerVars} initial="hidden" animate="visible"
      className="max-w-3xl mx-auto py-8 px-4">

      {/* Cabecera estilo RPG */}
      <motion.div variants={itemVars} className="text-center mb-10">
        <div className="inline-block retro-container px-6 py-3 mb-5">
          <p className="font-retro text-[10px] text-pastel-pink flex items-center gap-2 justify-center">
            <Heart className="w-4 h-4 fill-pastel-pink animate-pulse" />
            CRONÓMETRO DEL AMOR
            <Heart className="w-4 h-4 fill-pastel-pink animate-pulse" />
          </p>
        </div>
        <h2 className="font-retro text-sm md:text-xl text-white mb-4 drop-shadow-[3px_3px_0_#000]">
          NUESTRA AVENTURA
        </h2>
        
        {/* Saludo dinámico */}
        <div className="retro-container p-4 max-w-lg mx-auto mb-6 bg-[#2a223a]/40 border-pastel-pink/50">
          <p className="font-sans text-[12px] text-slate-200 leading-relaxed">
            {greeting}
          </p>
        </div>

        <p className="font-sans text-slate-400 text-sm">
          Desde el{' '}
          <span className="font-retro text-[9px] text-pastel-pink">{dayjs(FECHA).format('DD/MM/YYYY')}</span>
        </p>
      </motion.div>

      {/* Contadores grandes */}
      <motion.div variants={itemVars} className="grid grid-cols-3 gap-2 sm:gap-4 mb-8">
        {counters.map(({ label, value, color }) => (
          <div key={label} className="retro-container p-2 sm:p-5 flex flex-col items-center gap-1 sm:gap-2">
            <span className="font-retro text-2xl sm:text-4xl md:text-5xl" style={{ color, textShadow: `2px 2px 0 #000` }}>
              {value}
            </span>
            <span className="font-retro text-[6px] sm:text-[8px] text-slate-400 tracking-widest">{label}</span>
          </div>
        ))}
      </motion.div>

      {/* Reloj en tiempo real */}
      <motion.div variants={itemVars}
        className="retro-container p-3 sm:p-4 flex flex-wrap justify-around items-center gap-3 max-w-md mx-auto">
        <div className="flex items-center gap-2 font-retro text-[8px] sm:text-[9px] text-slate-400">
          <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin text-pastel-blue" style={{ animationDuration: '6s' }} />
          TIEMPO REAL
        </div>
        <div className="flex gap-2 sm:gap-3 font-mono text-base sm:text-lg text-white">
          {[t.hours, t.minutes, t.seconds].map((val, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span className="text-pastel-pink animate-pulse">:</span>}
              <div className="flex flex-col items-center">
                <span className="font-retro text-[10px] sm:text-xs" style={{ color: i === 2 ? '#ff99aa' : '#fff' }}>
                  {String(val).padStart(2, '0')}
                </span>
                <span className="font-retro text-[5px] sm:text-[7px] text-slate-500">{['HS','MIN','SEG'][i]}</span>
              </div>
            </React.Fragment>
          ))}
        </div>
      </motion.div>

      {/* Mensaje de aniversario dinámico y pie */}
      <motion.div variants={itemVars} className="text-center mt-10 space-y-4">
        <p className="font-sans italic text-xs text-slate-500">
          "El tiempo es relativo, pero cada segundo contigo vale una eternidad." 💕
        </p>
      </motion.div>
    </motion.div>
  );
}
