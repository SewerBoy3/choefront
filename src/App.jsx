import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Heart, Calendar, Music, Gift, Image as ImageIcon, Settings, Book, Coins } from 'lucide-react';

import Timeline      from './components/Timeline';
import MusicRoom     from './components/MusicRoom';
import MiniPlayer    from './components/MiniPlayer';
import CouponGallery from './components/CouponGallery';
import MemoryGallery from './components/MemoryGallery';
import AdminPanel    from './components/AdminPanel';
import SecretGame    from './components/SecretGame';
import TetrisGame    from './components/TetrisGame';
import OurHistory    from './components/OurHistory';
import CustomCursor  from './components/CustomCursor';
import Login         from './components/Login';
import MagneticButton from './components/MagneticButton';
import useSecretCode from './hooks/useSecretCode';
import { playSwoosh, playTick, playSuccess, playPop } from './utils/sounds';
import useStore      from './store/useStore';

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
function MainApp({ user, onLogout, anniversaryDate, driveFiles, driveLoading, driveError, onUpdateData, publicSettings }) {
  const [activeTab, setActiveTab] = useState('timeline');
  const points = useStore((state) => state.points);

  // Filtrar pestañas: la pestaña Admin solo se muestra si el rol es 'admin' (fer)
  const allTabs = [
    { id: 'timeline', name: 'Historia',  icon: Calendar   },
    { id: 'music',    name: 'Música',    icon: Music      },
    { id: 'coupons',  name: 'Vales',     icon: Gift       },
    { id: 'gallery',  name: 'Galería',   icon: ImageIcon  },
    { id: 'history',  name: 'Nosotros',  icon: Book       },
    { id: 'admin',    name: 'Admin',     icon: Settings,   adminOnly: true },
  ];

  const tabs = allTabs.filter(tab => !tab.adminOnly || user?.role === 'admin');

  const handleTab = (id) => {
    playSwoosh();
    setActiveTab(id);
  };

  return (
    <div className="min-h-screen bg-[#1a1525] text-white flex flex-col custom-cursor-active">

      {/* HEADER — Estilo menú pausa RPG */}
      <header className="border-b-4 border-white bg-[#1a1525]/90 backdrop-blur-sm z-40 sticky top-0">
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-col items-center gap-3">

          <div className="w-full flex justify-between items-center px-2 gap-3">
            <span className="font-retro text-[6px] text-slate-500">
              JUGADOR: <span className="text-pastel-pink uppercase">{user?.username}</span>
            </span>
            <div className="flex items-center gap-2">
              <MiniPlayer onOpenMusic={() => handleTab('music')} />
              <div className="flex items-center gap-1.5 border-2 border-yellow-500/40 bg-yellow-500/10 px-2 py-1">
                <Coins className="w-3 h-3 text-yellow-400" />
                <span className="font-retro text-[7px] text-yellow-300">{points}</span>
                <span className="font-retro text-[6px] text-pastel-pink">♡</span>
              </div>
            </div>
            <MagneticButton
              onClick={(e) => {
                e.stopPropagation();
                playPop();
                onLogout();
              }}
              className="relative z-50 retro-btn text-[7px] py-1.5 px-3 border border-red-500 bg-red-950/40 text-red-400 hover:bg-red-900/60 shrink-0"
            >
              SALIR
            </MagneticButton>
          </div>

          <motion.div className="flex items-center gap-3"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}>
            <Heart className="w-5 h-5 text-pastel-pink fill-pastel-pink animate-pulse" />
            <h1 className="font-retro text-[10px] sm:text-xs text-white tracking-wide">
              PARA CHOE ♡ SAVE FILE 01
            </h1>
            <Heart className="w-5 h-5 text-pastel-pink fill-pastel-pink animate-pulse" />
          </motion.div>

          <nav className="flex flex-wrap gap-2 justify-center">
            {tabs.map(({ id, name, icon: Icon }) => {
              const active = activeTab === id;
              return (
                <MagneticButton key={id}
                  onClick={() => handleTab(id)}
                  onMouseEnter={playTick}
                  className={`font-retro text-[8px] px-3 py-2 border-2 flex items-center gap-1.5 transition-colors duration-100
                    ${active
                      ? 'bg-white text-black border-black shadow-[3px_3px_0_#000]'
                      : 'bg-transparent text-slate-300 border-slate-600 hover:border-white hover:text-white'}`}>
                  <Icon className="w-3 h-3" />{name}
                </MagneticButton>
              );
            })}
          </nav>
        </div>
      </header>

      {/* CONTENIDO */}
      <main className="flex-grow py-6 px-2 overflow-x-hidden">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab}
            variants={pageVariants} initial="initial" animate="animate" exit="exit"
            transition={pageTransition}>
            {activeTab === 'timeline' && <Timeline anniversaryDate={anniversaryDate} />}
            {activeTab === 'music'    && <MusicRoom />}
            {activeTab === 'coupons'  && <CouponGallery />}
            {activeTab === 'gallery'  && <MemoryGallery files={driveFiles} loading={driveLoading} error={driveError} />}
            {activeTab === 'history'  && <OurHistory />}
            {activeTab === 'admin' && user?.role === 'admin' && (
              <AdminPanel onUpdateData={onUpdateData} adminUser={user?.username} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="border-t-4 border-white/20 py-4 text-center font-retro text-[6px] text-slate-500">
        HECHO CON ♡ PARA CHOE • {new Date().getFullYear()} •{' '}
        ESCRIBE <span className="text-pastel-pink">SIGMA</span> O{' '}
        <span className="text-pastel-blue">TRETIS</span> PARA SORPRESAS 👀
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

  const [isGlitching,     setIsGlitching]     = useState(false);
  const [glitchText,      setGlitchText]       = useState('');
  const [anniversaryDate, setAnniversaryDate]  = useState('2023-09-15');
  const [driveFiles,      setDriveFiles]       = useState([]);
  const [driveLoading,    setDriveLoading]     = useState(true);
  const [driveError,      setDriveError]       = useState(null);
  const [publicSettings,  setPublicSettings]   = useState({});
  const setMusicSettings = useStore((s) => s.setMusicSettings);

  const loadDynamicData = useCallback(async () => {
    setDriveLoading(true);
    try {
      const [driveRes, annivRes, settingsRes] = await Promise.all([
        fetch(`${API_BASE}/drive/files`),
        fetch(`${API_BASE}/anniversary`),
        fetch(`${API_BASE}/public-settings`),
      ]);
      if (driveRes.ok)  setDriveFiles(await driveRes.json());
      if (annivRes.ok)  setAnniversaryDate((await annivRes.json()).anniversary_date);
      if (settingsRes.ok) {
        const settings = await settingsRes.json();
        setPublicSettings(settings);
        setMusicSettings(settings);
      }
      setDriveError(null);
    } catch (e) { setDriveError(e.message); }
    finally { setDriveLoading(false); }
  }, [setMusicSettings]);

  useEffect(() => {
    if (user) {
      loadDynamicData();
      refreshUserData();
    }
  }, [user, loadDynamicData, refreshUserData]);



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
              driveFiles={driveFiles}
              driveLoading={driveLoading}
              driveError={driveError}
              onUpdateData={loadDynamicData}
              publicSettings={publicSettings}
            />
          )} />
          <Route path="/secret-game" element={wrap(<SecretGame />)} />
          <Route path="/tetris"      element={wrap(<TetrisGame />)} />
        </Routes>
      </AnimatePresence>
    </>
  );
}
