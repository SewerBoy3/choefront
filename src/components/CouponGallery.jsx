import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, CheckCircle, Clock, AlertCircle, RefreshCw, Lock, Coins, Sparkles } from 'lucide-react';
import { playPop, playSuccess, playError, playTick } from '../utils/sounds';
import useStore from '../store/useStore';

const API_BASE = `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/coupons`;

export default function CouponGallery() {
  const token = useStore((state) => state.token);
  const points = useStore((state) => state.points);
  const setPoints = useStore((state) => state.setPoints);
  const coupons = useStore((state) => state.coupons);
  const setCoupons = useStore((state) => state.setCoupons);
  const updateCoupon = useStore((state) => state.updateCoupon);
  const refreshUserData = useStore((state) => state.refreshUserData);

  const [activeTab, setActiveTab] = useState('shop'); // 'inventory' | 'shop' — empieza en tienda
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [economyInfo, setEconomyInfo] = useState(null);

  // Cargar cupones
  const fetchCoupons = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(API_BASE);
      if (!response.ok) {
        throw new Error('No se pudo establecer conexión con el servidor.');
      }
      const data = await response.json();
      setCoupons(data);
    } catch (err) {
      console.error('Error al cargar cupones:', err);
      setError('No pudimos cargar tus cupones. Verifica que el servidor backend esté en línea.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
    refreshUserData();
    fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/games/economy`)
      .then((res) => res.ok ? res.json() : null)
      .then((data) => data && setEconomyInfo(data))
      .catch(() => {});
  }, [refreshUserData]);

  // Comprar un cupón
  const handlePurchase = async (id, price, title) => {
    if (points < price) {
      playError();
      alert(`Monedas insuficientes. Necesitas ${price} Monedas de Amor.`);
      return;
    }

    playPop();
    setProcessingId(id);

    try {
      const response = await fetch(`${API_BASE}/${id}/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'No se pudo comprar el vale.');
      }

      // Éxito: Confeti + Sonido + Actualizar Zustand
      dispararConfeti(true);
      playSuccess();
      setPoints(data.userPoints);
      updateCoupon(id, { is_purchased: true, purchased_at: data.coupon.purchased_at });
    } catch (err) {
      console.error('Error al comprar vale:', err);
      playError();
      alert(err.message || 'Error al procesar la compra.');
    } finally {
      setProcessingId(null);
    }
  };

  // Canjear un cupón
  const handleRedeem = async (id) => {
    playPop();
    setProcessingId(id);

    try {
      const response = await fetch(`${API_BASE}/${id}/redeem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'No se pudo canjear el vale.');
      }

      // Éxito: Confeti bilateral + Sonido + Actualizar Zustand
      dispararConfeti(false);
      playSuccess();
      updateCoupon(id, { is_redeemed: true, redeemed_at: data.coupon.redeemed_at });
    } catch (err) {
      console.error('Error al canjear vale:', err);
      playError();
      alert(err.message || 'Error al procesar el canje.');
    } finally {
      setProcessingId(null);
    }
  };

  const dispararConfeti = (singleSide = false) => {
    if (singleSide) {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#ca8a04', '#fde047', '#ff99aa']
      });
    } else {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { x: 0.1, y: 0.6 },
        colors: ['#ff99aa', '#aec6cf', '#d8bfd8', '#ffdab9', '#b2f7ef']
      });
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { x: 0.9, y: 0.6 },
        colors: ['#ff99aa', '#aec6cf', '#d8bfd8', '#ffdab9', '#b2f7ef']
      });
    }
  };

  // Filtrar cupones por pestaña
  const inventoryCoupons = coupons.filter(c => c.is_purchased);
  const shopCoupons = coupons.filter(c => !c.is_purchased);

  // Animación del contenedor
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 10 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 140, damping: 14 } }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 gap-3">
        <span className="font-retro text-xs text-white animate-pulse">BUSCANDO VALES ESPECIALES...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto retro-container p-6 flex flex-col items-center text-center gap-4">
        <AlertCircle className="w-10 h-10 text-pastel-peach-dark animate-bounce" />
        <h3 className="font-retro text-xs text-white">¡Ups! Algo falló</h3>
        <p className="text-slate-400 text-xs leading-relaxed">{error}</p>
        <button
          onClick={() => { playPop(); fetchCoupons(); }}
          onMouseEnter={playTick}
          className="retro-btn flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Reintentar</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-6 px-4">
      {/* Marcador de Monedas / Economía */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div className="text-left">
          <div className="inline-block retro-container px-4 py-1.5 mb-2">
            <span className="font-retro text-[8px] text-pastel-pink flex items-center gap-1.5 justify-center">
              <Gift className="w-3.5 h-3.5" />
              SISTEMA DE VALES CANJEABLES
            </span>
          </div>
          <p className="font-retro text-[6px] text-slate-500 max-w-md leading-relaxed">
            Gana monedas en Sigma Runner y Tetris (escribe SIGMA o TRETIS en el menú).
            Cada partida da monedas por participación y rendimiento, más bonus por récord y primera partida del día.
          </p>
          {economyInfo && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="font-retro text-[5px] text-yellow-400/80 border border-yellow-500/30 px-1.5 py-0.5">
                +{economyInfo.dailyBonus} bonus diario
              </span>
              <span className="font-retro text-[5px] text-pastel-blue/80 border border-pastel-blue/30 px-1.5 py-0.5">
                récord +{economyInfo.games?.dino?.recordBonus}
              </span>
            </div>
          )}
        </div>

        {/* Monedas de Amor Display */}
        <div className="retro-container px-5 py-3 flex items-center gap-3 bg-[#1e192c] border-2 border-yellow-500/80 shadow-[4px_4px_0_rgba(234,179,8,0.2)]">
          <div className="w-9 h-9 rounded-full bg-yellow-500/20 border-2 border-yellow-500 flex items-center justify-center animate-bounce">
            <Coins className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <p className="font-retro text-[6px] text-yellow-400">TUS MONEDAS DE AMOR</p>
            <p className="font-retro text-[13px] text-white tracking-widest font-bold">
              {points} <span className="text-pastel-pink">♡</span>
            </p>
          </div>
        </div>
      </div>

      {/* Tabs de Selección */}
      <div className="flex gap-2 mb-8 border-b-2 border-slate-700 pb-3">
        <button
          onClick={() => { playPop(); setActiveTab('inventory'); }}
          className={`px-4 py-2 font-retro text-[8px] border-2 transition-all flex items-center gap-2 ${
            activeTab === 'inventory'
              ? 'border-pastel-pink bg-pastel-pink/15 text-pastel-pink'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Gift className="w-3.5 h-3.5" />
          MIS VALES ({inventoryCoupons.length})
        </button>
        <button
          onClick={() => { playPop(); setActiveTab('shop'); }}
          className={`px-4 py-2 font-retro text-[8px] border-2 transition-all flex items-center gap-2 ${
            activeTab === 'shop'
              ? 'border-yellow-500 bg-yellow-500/10 text-yellow-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Coins className="w-3.5 h-3.5" />
          TIENDA DE VALES ({shopCoupons.length})
        </button>
      </div>

      {/* Listado de Cupones */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {activeTab === 'inventory' ? (
            // Pestaña: Mis Vales (Activos o canjeados)
            inventoryCoupons.length === 0 ? (
              <div className="col-span-full py-16 text-center retro-container border-dashed p-8">
                <AlertCircle className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                <p className="font-retro text-[8px] text-slate-400">Aún no tienes ningún vale desbloqueado.</p>
                <p className="font-retro text-[6px] text-slate-500 mt-2">Visita la Tienda de Vales y canjea tus monedas.</p>
              </div>
            ) : (
              inventoryCoupons.map((coupon, index) => {
                const colors = [
                  { border: 'border-pastel-pink-dark', accent: 'bg-pastel-pink text-black', textColor: 'text-pastel-pink-light' },
                  { border: 'border-pastel-blue-dark', accent: 'bg-pastel-blue text-black', textColor: 'text-pastel-blue-light' },
                  { border: 'border-pastel-lavender-dark', accent: 'bg-pastel-lavender text-black', textColor: 'text-pastel-lavender-light' }
                ];
                const style = colors[index % colors.length];
                const isRedeemed = coupon.is_redeemed;

                return (
                  <motion.div
                    key={coupon.id}
                    variants={cardVariants}
                    whileHover={!isRedeemed ? { y: -4 } : {}}
                    className={`relative retro-container p-6 flex flex-col justify-between min-h-[260px] transition-all duration-200 ${
                      isRedeemed ? 'opacity-40 grayscale-[40%]' : ''
                    }`}
                  >
                    {isRedeemed && (
                      <div className="absolute top-4 right-4 z-10 transform rotate-12">
                        <span className="flex items-center gap-1 text-[8px] font-retro border-2 border-red-500 text-red-500 bg-[#1a1525] px-2 py-1 uppercase shadow-[2px_2px_0_#000]">
                          CANJEADO
                        </span>
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <div className={`w-8 h-8 ${style.accent} flex items-center justify-center border-2 border-black`}>
                          <Gift className="w-4 h-4" />
                        </div>
                        <span className={`font-retro text-[8px] ${style.textColor}`}>VALE ACTIVO</span>
                      </div>
                      <h3 className="font-retro text-[10px] text-white leading-normal mb-3">{coupon.title}</h3>
                      <p className="font-sans text-xs text-slate-300 leading-relaxed font-normal">{coupon.description}</p>
                    </div>

                    <div className="mt-6 pt-4 border-t-2 border-dashed border-slate-700 flex flex-col gap-3">
                      {isRedeemed ? (
                        <div className="flex items-center gap-1.5 font-retro text-[7px] text-slate-400">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {new Date(coupon.redeemed_at).toLocaleDateString('es-AR')} -{' '}
                            {new Date(coupon.redeemed_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleRedeem(coupon.id)}
                          onMouseEnter={playTick}
                          disabled={processingId !== null}
                          className={`retro-btn w-full text-[9px] flex items-center justify-center gap-2 py-2 ${style.accent}`}
                        >
                          {processingId === coupon.id ? (
                            <span>ENVIANDO...</span>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>CANJEAR VALE</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )
          ) : (
            // Pestaña: Tienda de Vales (Bloqueados)
            shopCoupons.length === 0 ? (
              <div className="col-span-full py-16 text-center retro-container border-dashed p-8">
                <CheckCircle className="w-8 h-8 text-yellow-500 mx-auto mb-3" />
                <p className="font-retro text-[8px] text-yellow-400">¡Has comprado todos los vales disponibles!</p>
                <p className="font-retro text-[6px] text-slate-500 mt-2">Próximamente el administrador subirá más opciones.</p>
              </div>
            ) : (
              shopCoupons.map((coupon, index) => {
                const canAfford = points >= coupon.price;
                return (
                  <motion.div
                    key={coupon.id}
                    variants={cardVariants}
                    whileHover={canAfford ? { y: -4 } : {}}
                    className={`relative retro-container p-6 flex flex-col justify-between min-h-[260px] transition-all duration-200 ${
                      !canAfford ? 'border-slate-800 bg-slate-900/10' : 'border-yellow-600/60 bg-yellow-950/5'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-slate-800 text-slate-400 flex items-center justify-center border-2 border-black">
                            <Lock className="w-4 h-4" />
                          </div>
                          <span className="font-retro text-[8px] text-slate-400">VALE BLOQUEADO</span>
                        </div>
                        
                        {/* Precio en Monedas */}
                        <div className="flex items-center gap-1 bg-yellow-500/15 border border-yellow-500/30 px-2 py-0.5 rounded">
                          <Coins className="w-3 h-3 text-yellow-400" />
                          <span className="font-retro text-[8px] text-yellow-400 font-bold">{coupon.price}</span>
                        </div>
                      </div>
                      <h3 className="font-retro text-[10px] text-white leading-normal mb-3">{coupon.title}</h3>
                      <p className="font-sans text-xs text-slate-400 leading-relaxed font-normal">{coupon.description}</p>
                    </div>

                    <div className="mt-6 pt-4 border-t-2 border-dashed border-slate-700 flex flex-col gap-3">
                      <button
                        onClick={() => handlePurchase(coupon.id, coupon.price, coupon.title)}
                        onMouseEnter={playTick}
                        disabled={processingId !== null || !canAfford}
                        className={`retro-btn w-full text-[9px] flex items-center justify-center gap-2 py-2 ${
                          canAfford
                            ? 'bg-yellow-500 text-black border-yellow-600'
                            : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                        }`}
                      >
                        {processingId === coupon.id ? (
                          <span>PROCESANDO...</span>
                        ) : !canAfford ? (
                          <span>NECESITAS MONEDAS</span>
                        ) : (
                          <>
                            <Coins className="w-3.5 h-3.5" />
                            <span>COMPRAR VALE</span>
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                );
              })
            )
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
