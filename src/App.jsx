import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Heart, Calendar, Music, Gift, Image as ImageIcon, Settings, Book, Coins, Menu, X } from 'lucide-react';

import Timeline      from './components/Timeline';
import MusicRoom     from './components/MusicRoom';
import MiniPlayer    from './components/MiniPlayer';
import CouponGallery from './components/CouponGallery';
import MemoryGallery from './components/MemoryGallery';
import AdminPanel    from './components/AdminPanel';
import SecretGame    from './components/SecretGame';
import TetrisGame    from './components/TetrisGame';
import Poemario      from './components/Poemario';
import CustomCursor  from './components/CustomCursor';
import Login         from './components/Login';
import MagneticButton from './components/MagneticButton';
import useSecretCode from './hooks/useSecretCode';
import { playSwoosh, playTick, playSuccess, playPop } from './utils/sounds';
import useStore      from './store/useStore';
import confetti      from 'canvas-confetti';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y:  0 },
  exit:    { opacity: 0, y: -10 },
};
const pageTransition = { duration: 0.18, ease: 'easeInOut' };

// ─────────────────────────────────────────────────────────────────
// MENÚ PRINCIPAL
// ─────────────────────────────────────────────────────────────────
function MainApp({ user, onLogout, anniversaryDate, onUpdateData, publicSettings, onSigma, onTretis }) {
  const [activeTab, setActiveTab] = useState(() => {
    return sessionStorage.getItem('choe_active_tab') || 'timeline';
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const points = useStore((state) => state.points);

  const allTabs = [
    { id: 'timeline', name: 'Historia',  icon: Calendar   },
    { id: 'music',    name: 'Música',    icon: Music      },
    { id: 'coupons',  name: 'Vales',     icon: Gift       },
    { id: 'gallery',  name: 'Galería',   icon: ImageIcon  },
    { id: 'history',  name: 'Poemario',  icon: Book       },
    { id: 'admin',    name: 'Admin',     icon: Settings,   adminOnly: true },
  ];

  const tabs = allTabs.filter(tab => !tab.adminOnly || user?.role === 'admin');

  const handleTab = (id) => {
    playSwoosh();
    sessionStorage.setItem('choe_active_tab', id);
    setActiveTab(id);
  };

  return (
    <div className="min-h-screen bg-[#1a1525] text-white flex flex-col custom-cursor-active">

      {/* HEADER */}
      <header className="border-b-4 border-white bg-[#1a1525]/90 backdrop-blur-sm z-40 sticky top-0">
        <div className="max-w-5xl mx-auto px-3 py-2 flex flex-col gap-2">
          
          {/* Top bar: user info + mini player + coins + mobile menu toggle */}
          <div className="w-full flex justify-between items-center gap-2">
            <span className="font-retro text-[6px] text-slate-500 hidden sm:block">
              JUGADOR: <span className="text-pastel-pink uppercase">{user?.username}</span>
            </span>
            <div className="flex items-center gap-1.5 sm:hidden">
              <button 
                onClick={() => { playPop(); setMobileMenuOpen(!mobileMenuOpen); }}
                className="retro-btn !p-1.5 bg-slate-800 text-white border-2 border-slate-600 active:scale-95"
              >
                {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>
            
            {/* Title (Mobile only) */}
            <motion.div className="flex items-center gap-1.5 sm:hidden"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}>
              <Heart className="w-3 h-3 text-pastel-pink fill-pastel-pink animate-pulse" />
              <h1 className="font-retro text-[8px] text-white tracking-wide">
                CHOE ♡ SAVE
              </h1>
            </motion.div>

            <div className="flex items-center gap-1.5">
              <MiniPlayer onOpenMusic={() => handleTab('music')} />
              <div className="flex items-center gap-1 border-2 border-yellow-500/40 bg-yellow-500/10 px-1.5 py-1">
                <Coins className="w-3 h-3 text-yellow-400" />
                <span className="font-retro text-[7px] text-yellow-300">{points}</span>
                <span className="font-retro text-[6px] text-pastel-pink hidden sm:inline">♡</span>
              </div>
              <MagneticButton
                onClick={(e) => {
                  e.stopPropagation();
                  playPop();
                  onLogout();
                }}
                className="hidden sm:flex relative z-50 retro-btn text-[6px] py-1 px-2 border border-red-500 bg-red-950/40 text-red-400 hover:bg-red-900/60 shrink-0"
              >
                SALIR
              </MagneticButton>
            </div>
          </div>

          {/* Title Desktop */}
          <motion.div className="hidden sm:flex items-center gap-2 justify-center"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}>
            <Heart className="w-4 h-4 text-pastel-pink fill-pastel-pink animate-pulse" />
            <h1 className="font-retro text-[10px] text-white tracking-wide">
              PARA CHOE ♡ SAVE FILE 01
            </h1>
            <Heart className="w-4 h-4 text-pastel-pink fill-pastel-pink animate-pulse" />
          </motion.div>

          {/* Navigation tabs — Desktop */}
          <nav className="hidden sm:flex gap-1.5 justify-center w-full pb-1">
            {tabs.map(({ id, name, icon: Icon }) => {
              const active = activeTab === id;
              return (
                <MagneticButton key={id}
                  onClick={() => handleTab(id)}
                  onMouseEnter={playTick}
                  className={`font-retro text-[7px] px-2.5 py-1.5 border-2 flex items-center gap-1 transition-colors duration-100
                    ${active
                      ? 'bg-white text-black border-black shadow-[2px_2px_0_#000]'
                      : 'bg-transparent text-slate-300 border-slate-600 hover:border-white hover:text-white'}`}>
                  <Icon className="w-3 h-3" />
                  <span>{name}</span>
                </MagneticButton>
              );
            })}
          </nav>

        </div>
        
        {/* Mobile menu overlay */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="sm:hidden border-t-2 border-slate-700 bg-[#1a1525] overflow-hidden"
            >
              <nav className="flex flex-col p-2 space-y-1">
                {tabs.map(({ id, name, icon: Icon }) => {
                  const active = activeTab === id;
                  return (
                    <button key={id}
                      onClick={() => { handleTab(id); setMobileMenuOpen(false); }}
                      className={`font-retro text-[8px] p-3 border-2 text-left flex items-center gap-2 transition-colors duration-100
                        ${active
                          ? 'bg-white text-black border-black shadow-[2px_2px_0_#000]'
                          : 'bg-[#2a223a] text-slate-300 border-slate-700 hover:border-pastel-pink'}`}>
                      <Icon className="w-4 h-4" />
                      <span>{name}</span>
                    </button>
                  );
                })}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    playPop();
                    onLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="font-retro text-[8px] p-3 border-2 border-red-500 bg-red-950/40 text-red-400 text-left flex items-center gap-2 mt-2"
                >
                  <X className="w-4 h-4" />
                  <span>CERRAR SESIÓN</span>
                </button>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* CONTENIDO */}
      <main className="flex-grow py-4 sm:py-6 px-2 overflow-x-hidden">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab}
            variants={pageVariants} initial="initial" animate="animate" exit="exit"
            transition={pageTransition}>
            {activeTab === 'timeline' && <Timeline anniversaryDate={anniversaryDate} />}
            {activeTab === 'music'    && <MusicRoom />}
            {activeTab === 'coupons'  && <CouponGallery />}
            {activeTab === 'gallery'  && <MemoryGallery />}
            {activeTab === 'history'  && <Poemario />}
            {activeTab === 'admin' && user?.role === 'admin' && (
              <AdminPanel onUpdateData={onUpdateData} adminUser={user?.username} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="border-t-4 border-white/20 py-3 text-center font-retro text-[5px] sm:text-[6px] text-slate-500 px-4">
        HECHO CON ♡ PARA CHOE • {new Date().getFullYear()} •{' '}
        <span className="hidden sm:inline">ESCRIBE </span>
        <span className="sm:hidden">TOCA </span>
        <button
          onClick={onSigma}
          className="text-pastel-pink hover:text-white active:scale-95 transition-transform cursor-none underline underline-offset-2 decoration-dotted"
        >
          SIGMA
        </button>
        {' '}O{' '}
        <button
          onClick={onTretis}
          className="text-pastel-blue hover:text-white active:scale-95 transition-transform cursor-none underline underline-offset-2 decoration-dotted"
        >
          TRETIS
        </button>
        {' '}👀
      </footer>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// APP WRAPPER — routing + secret codes + glitch + login check
// ─────────────────────────────────────────────────────────────────
export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // Sistema de Inicio de Sesión desde Zustand
  const user = useStore((state) => state.user);
  const logout = useStore((state) => state.logout);
  const refreshUserData = useStore((state) => state.refreshUserData);
  const fetchLikes = useStore((state) => state.fetchLikes);

  const [isGlitching,     setIsGlitching]     = useState(false);
  const [glitchText,      setGlitchText]       = useState('');
  const [anniversaryDate, setAnniversaryDate]  = useState('2023-09-15');
  const [publicSettings,  setPublicSettings]   = useState({});
  const setMusicSettings = useStore((s) => s.setMusicSettings);
  const [showAnnivCard,   setShowAnnivCard]   = useState(false);

  const loadDynamicData = useCallback(async () => {
    try {
      const [annivRes, settingsRes] = await Promise.all([
        fetch(`${API_BASE}/anniversary`),
        fetch(`${API_BASE}/public-settings`),
      ]);
      if (annivRes.ok)  setAnniversaryDate((await annivRes.json()).anniversary_date);
      if (settingsRes.ok) {
        const settings = await settingsRes.json();
        setPublicSettings(settings);
        setMusicSettings(settings);
      }
    } catch (e) {
      console.error('Error al cargar datos dinámicos:', e);
    }
  }, [setMusicSettings]);

  useEffect(() => {
    if (user) {
      loadDynamicData();
      refreshUserData();
      fetchLikes();
    }
  }, [user, loadDynamicData, refreshUserData, fetchLikes]);

  // Verificar fecha de aniversario en primer inicio de sesión de choe
  useEffect(() => {
    if (user && user.username.toLowerCase() === 'choe' && anniversaryDate) {
      const now = new Date();
      const currentMonth = now.getMonth() + 1; // 1-indexed
      const currentDay = now.getDate();

      const parts = anniversaryDate.split('-');
      if (parts.length === 3) {
        const annivMonth = parseInt(parts[1], 10);
        const annivDay = parseInt(parts[2], 10);

        if (currentMonth === annivMonth && currentDay === annivDay) {
          const todayStr = `${now.getFullYear()}-${currentMonth}-${currentDay}`;
          const hasSeen = localStorage.getItem(`hasSeenAnniversaryCard_${todayStr}`);
          if (!hasSeen) {
            setShowAnnivCard(true);
          }
        }
      }
    }
  }, [user, anniversaryDate]);

  // Disparar confeti cuando se abre la tarjeta de aniversario
  useEffect(() => {
    if (showAnnivCard) {
      const duration = 5 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100000 };

      function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
      }

      const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [showAnnivCard]);

  const handleLoginSuccess = () => {
    // Al iniciar sesión, el hook user en Zustand se actualiza reactivamente
  };

  const handleLogout = useCallback(() => {
    logout();
    navigate('/', { replace: true });
  }, [logout, navigate]);

  // Easter Egg → Dino (ahora con código "sigma")
  const handleSigma = useCallback(() => {
    if (!user) return;
    playSuccess();
    setGlitchText('!! SIGMA MODE !!');
    setIsGlitching(true);
    setTimeout(() => { setIsGlitching(false); navigate('/secret-game'); }, 900);
  }, [navigate, user]);

  // Easter Egg → Tetris
  const handleTretis = useCallback(() => {
    if (!user) return;
    playSuccess();
    setGlitchText('★★ TRETIS MODE ★★');
    setIsGlitching(true);
    setTimeout(() => { setIsGlitching(false); navigate('/tetris'); }, 900);
  }, [navigate, user]);

  useSecretCode('sigma',  handleSigma);
  useSecretCode('tretis', handleTretis);

  const wrap = (children) => (
    <motion.div key={location.pathname}
      variants={pageVariants} initial="initial" animate="animate" exit="exit"
      transition={pageTransition} className="min-h-screen bg-[#1a1525] custom-cursor-active">
      {children}
    </motion.div>
  );

  // Si no está autenticado, forzar pantalla de inicio de sesión
  if (!user) {
    return (
      <>
        <CustomCursor />
        <Login onLoginSuccess={handleLoginSuccess} />
      </>
    );
  }

  return (
    <>
      <CustomCursor />

      {/* Glitch Overlay */}
      <AnimatePresence>
        {isGlitching && (
          <motion.div
            className="fixed inset-0 z-[99999] pointer-events-none flex items-center justify-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/70 glitch-effect" />
            <p className="relative font-retro text-2xl text-white drop-shadow-[4px_4px_0_#000] glitch-effect z-10">
              {glitchText}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={wrap(
            <MainApp
              user={user}
              onLogout={handleLogout}
              anniversaryDate={anniversaryDate}
              onUpdateData={loadDynamicData}
              publicSettings={publicSettings}
              onSigma={handleSigma}
              onTretis={handleTretis}
            />
          )} />
          <Route path="/secret-game" element={wrap(<SecretGame />)} />
          <Route path="/tetris"      element={wrap(<TetrisGame />)} />
        </Routes>
      </AnimatePresence>

      {/* Tarjeta de Aniversario Modal */}
      <AnimatePresence>
        {showAnnivCard && (
          <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-[#0f0a1c]/85 backdrop-blur-md p-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="retro-container p-8 max-w-md w-full text-center space-y-6 bg-[#1a1525] relative border-4 border-white shadow-[0_12px_0_rgba(0,0,0,0.6)]"
            >
              {/* Hearts flotando */}
              <div className="flex justify-center gap-2">
                <Heart className="w-8 h-8 text-pastel-pink fill-pastel-pink animate-bounce" />
                <Heart className="w-8 h-8 text-pastel-pink fill-pastel-pink animate-pulse" />
                <Heart className="w-8 h-8 text-pastel-pink fill-pastel-pink animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>

              <h2 className="font-retro text-sm sm:text-base text-yellow-400 tracking-wider">
                🌟 DÍA ESPECIAL DETECTADO 🌟
              </h2>

              <p className="font-sans text-[14px] text-slate-100 leading-relaxed whitespace-pre-line py-2">
                {publicSettings?.anniversary_message || '¡Feliz Aniversario mi amor!'}
              </p>

              <p className="font-sans italic text-[11px] text-slate-400">
                "El tiempo es relativo, pero cada segundo contigo vale una eternidad." 💕
              </p>

              <div>
                <MagneticButton
                  onClick={() => {
                    const now = new Date();
                    const currentMonth = now.getMonth() + 1;
                    const currentDay = now.getDate();
                    const todayStr = `${now.getFullYear()}-${currentMonth}-${currentDay}`;
                    localStorage.setItem(`hasSeenAnniversaryCard_${todayStr}`, 'true');
                    setShowAnnivCard(false);
                    playPop();
                  }}
                  className="retro-btn w-full text-[8px] py-3 bg-[#ffd1dc] hover:bg-white text-black border-black font-retro"
                >
                  ¡GRACIAS! CERRAR ♡
                </MagneticButton>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
