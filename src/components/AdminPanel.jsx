import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Gift, Save, Plus, Trash2, RotateCcw, ShieldCheck, Database, Sliders, Bell, MessageSquare, Gamepad2, Send, Info, Lock, Music, Coins, Sparkles } from 'lucide-react';
import { playPop, playSuccess, playError, playTick } from '../utils/sounds';
import useStore from '../store/useStore';
import MusicAdmin from './admin/MusicAdmin';

const API_ADMIN_URL = `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/admin`;
const API_COUPONS_URL = `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/coupons`;

export default function AdminPanel({ onUpdateData, adminUser }) {
  const jwtToken = useStore((state) => state.token);

  const adminHeaders = (extra = {}) => ({
    'Content-Type': 'application/json',
    ...(jwtToken
      ? { Authorization: `Bearer ${jwtToken}` }
      : { 'x-admin-password': 'Causa2022' }),
    ...extra
  });
  const [submitting, setSubmitting] = useState(false);
  const [adminTab, setAdminTab] = useState('settings');
  const [testResult, setTestResult] = useState(null);

  // Estados de Configuración
  const [settings, setSettings] = useState({
    anniversary_date: '',
    discord_webhook: '',
    telegram_token: '',
    telegram_chat_id: '',
    drive_folder_id: '',
    music_drive_folder_id: '',
    timeline_greeting: '¡Bienvenido a nuestro álbum especial de recuerdos! ♡',
    anniversary_message: '¡Feliz Aniversario mi amor!',
    default_song_url: '',
    music_playlist: '',
    music_autoplay: 'false',
    dino_speed_multiplier: '1.0',
    tetris_start_level: '1',
    discord_user_id_fer: '',
    discord_user_id_zoe: ''
  });

  // Estados de Cupones
  const [coupons, setCoupons] = useState([]);
  const [newCoupon, setNewCoupon] = useState({ title: '', description: '', price: 50 });

  // Estados de Cheats (Usuarios y Acciones Masivas)
  const [users, setUsers] = useState([]);
  const [pointsAmount, setPointsAmount] = useState('');

  // Cargar datos al montar
  useEffect(() => {
    cargarConfiguracion();
    cargarCupones();
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    try {
      const response = await fetch(`${API_ADMIN_URL}/users`, {
        headers: adminHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (e) {
      console.error('Error al cargar usuarios:', e);
    }
  };

  // Modificar puntos de usuario (Cheat)
  const handleModifyPoints = async (userId, action, amount) => {
    if (!amount || isNaN(amount) || parseInt(amount) < 0) {
      alert('Por favor ingresa una cantidad válida de monedas.');
      return;
    }
    playPop();
    try {
      const response = await fetch(`${API_ADMIN_URL}/users/${userId}/points`, {
        method: 'POST',
        headers: adminHeaders(),
        body: JSON.stringify({ action, amount: parseInt(amount) })
      });
      if (response.ok) {
        const data = await response.json();
        playSuccess();
        alert(`Monedas de ${data.user.username} actualizadas a ${data.user.points}.`);
        cargarUsuarios();
        // Si el admin modifica sus propios puntos o el del usuario actual en Zustand, actualizar
        if (onUpdateData) onUpdateData();
      } else {
        playError();
      }
    } catch (err) {
      console.error(err);
      playError();
    }
  };

  // Desbloquear todos los cupones
  const handleUnlockAllCoupons = async () => {
    if (!confirm('¿Seguro que deseas desbloquear (comprar) todos los vales disponibles para el usuario?')) return;
    playPop();
    try {
      const response = await fetch(`${API_ADMIN_URL}/coupons/unlock-all`, {
        method: 'POST',
        headers: adminHeaders()
      });
      if (response.ok) {
        playSuccess();
        alert('🔓 Todos los vales han sido comprados y están listos en el Inventario.');
        cargarCupones();
        if (onUpdateData) onUpdateData();
      } else {
        playError();
      }
    } catch (err) {
      console.error(err);
      playError();
    }
  };

  // Reiniciar todos los cupones
  const handleResetAllCoupons = async () => {
    if (!confirm('¿Seguro que deseas reiniciar todos los vales? (Se marcarán como bloqueados y sin canjear)')) return;
    playPop();
    try {
      const response = await fetch(`${API_ADMIN_URL}/coupons/reset-all`, {
        method: 'POST',
        headers: adminHeaders()
      });
      if (response.ok) {
        playSuccess();
        alert('🔄 Todos los vales han sido restablecidos con éxito.');
        cargarCupones();
        if (onUpdateData) onUpdateData();
      } else {
        playError();
      }
    } catch (err) {
      console.error(err);
      playError();
    }
  };

  const cargarConfiguracion = async () => {
    try {
      const response = await fetch(`${API_ADMIN_URL}/settings`, {
        headers: adminHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setSettings(prev => ({
          ...prev,
          anniversary_date: data.anniversary_date || '',
          discord_webhook: data.discord_webhook || '',
          telegram_token: data.telegram_token || '',
          telegram_chat_id: data.telegram_chat_id || '',
          drive_folder_id: data.drive_folder_id || '',
          music_drive_folder_id: data.music_drive_folder_id || '',
          timeline_greeting: data.timeline_greeting || '¡Bienvenido a nuestro álbum especial de recuerdos! ♡',
          anniversary_message: data.anniversary_message || '¡Feliz Aniversario mi amor!',
          default_song_url: data.default_song_url || '',
          music_playlist: data.music_playlist || '',
          music_autoplay: data.music_autoplay || 'false',
          dino_speed_multiplier: data.dino_speed_multiplier || '1.0',
          tetris_start_level: data.tetris_start_level || '1',
          discord_user_id_fer: data.discord_user_id_fer || '',
          discord_user_id_zoe: data.discord_user_id_zoe || ''
        }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const cargarCupones = async () => {
    try {
      const response = await fetch(API_COUPONS_URL);
      if (response.ok) {
        const data = await response.json();
        setCoupons(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Guardar configuración general
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    playPop();

    try {
      const response = await fetch(`${API_ADMIN_URL}/settings`, {
        method: 'POST',
        headers: adminHeaders(),
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        playSuccess();
        alert('⚙️ Configuraciones guardadas y aplicadas de inmediato.');
        if (onUpdateData) onUpdateData();
      } else {
        playError();
        alert('Error al guardar.');
      }
    } catch (err) {
      playError();
      alert('Error de red.');
    } finally {
      setSubmitting(false);
    }
  };

  // Enviar notificación de prueba
  const handleTestNotification = async () => {
    playPop();
    setTestResult('Probando conexión...');
    try {
      const response = await fetch(`${API_ADMIN_URL}/test-webhook`, {
        method: 'POST',
        headers: adminHeaders()
      });
      const data = await response.json();
      if (response.ok && data.success) {
        playSuccess();
        setTestResult('¡ÉXITO! Notificación enviada correctamente.');
      } else {
        playError();
        setTestResult(`FALLÓ: ${data.errors ? data.errors.join(', ') : 'Error desconocido'}`);
      }
    } catch (err) {
      playError();
      setTestResult('FALLÓ: Error de conexión.');
    }
  };

  // Crear nuevo cupón
  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    if (!newCoupon.title || !newCoupon.description) return;
    setSubmitting(true);
    playPop();

    try {
      const response = await fetch(`${API_ADMIN_URL}/coupons`, {
        method: 'POST',
        headers: adminHeaders(),
        body: JSON.stringify(newCoupon)
      });

      if (response.ok) {
        const result = await response.json();
        setCoupons(prev => [...prev, result.coupon]);
        setNewCoupon({ title: '', description: '', price: 50 });
        playSuccess();
      } else {
        playError();
      }
    } catch (err) {
      playError();
    } finally {
      setSubmitting(false);
    }
  };

  // Cambiar estado de canje del cupón
  const handleToggleRedeem = async (id, isRedeemed) => {
    playPop();
    try {
      const response = await fetch(`${API_ADMIN_URL}/coupons/${id}`, {
        method: 'PUT',
        headers: adminHeaders(),
        body: JSON.stringify({ is_redeemed: !isRedeemed })
      });

      if (response.ok) {
        const result = await response.json();
        setCoupons(prev =>
          prev.map(c => c.id === id ? { ...c, is_redeemed: result.coupon.is_redeemed, redeemed_at: result.coupon.redeemed_at } : c)
        );
        playSuccess();
      } else {
        playError();
      }
    } catch (err) {
      playError();
    }
  };

  // Cambiar estado de compra del cupón (desbloqueado/bloqueado)
  const handleTogglePurchase = async (id, isPurchased) => {
    playPop();
    try {
      const response = await fetch(`${API_ADMIN_URL}/coupons/${id}`, {
        method: 'PUT',
        headers: adminHeaders(),
        body: JSON.stringify({ is_purchased: !isPurchased })
      });

      if (response.ok) {
        const result = await response.json();
        setCoupons(prev =>
          prev.map(c => c.id === id ? { ...c, is_purchased: result.coupon.is_purchased, purchased_at: result.coupon.purchased_at } : c)
        );
        playSuccess();
      } else {
        playError();
      }
    } catch (err) {
      playError();
    }
  };

  // Eliminar cupón
  const handleDeleteCoupon = async (id) => {
    if (!confirm('¿Seguro que deseas eliminar este vale?')) return;
    playPop();
    try {
      const response = await fetch(`${API_ADMIN_URL}/coupons/${id}`, {
        method: 'DELETE',
        headers: adminHeaders()
      });

      if (response.ok) {
        setCoupons(prev => prev.filter(c => c.id !== id));
        playSuccess();
      } else {
        playError();
      }
    } catch (err) {
      playError();
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      {/* Cabecera del Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-center retro-container p-5 gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-pastel-blue text-black border-2 border-black flex items-center justify-center">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-retro text-xs text-white">PANEL DE CONTROL</h2>
            <p className="font-retro text-[7px] text-slate-400 mt-1">
              ADMINISTRADOR ACTUAL: <span className="text-pastel-pink uppercase">{adminUser}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[7px] font-retro text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          ACCESO AUTORIZADO
        </div>
      </div>

      {/* Menú de Sub-pestañas */}
      <div className="flex flex-wrap gap-2 border-b border-slate-700 pb-2 mb-6">
        <button
          onClick={() => { playTick(); setAdminTab('settings'); }}
          className={`font-retro text-[8px] px-3 py-2 border-2 transition-all ${
            adminTab === 'settings'
              ? 'bg-white text-black border-black shadow-[2px_2px_0_#000]'
              : 'bg-transparent text-slate-400 border-slate-700 hover:border-white hover:text-white'
          }`}
        >
          <Settings className="w-3 h-3 inline mr-1" />
          APIS Y CONEXIÓN
        </button>

        <button
          onClick={() => { playTick(); setAdminTab('coupons'); }}
          className={`font-retro text-[8px] px-3 py-2 border-2 transition-all ${
            adminTab === 'coupons'
              ? 'bg-white text-black border-black shadow-[2px_2px_0_#000]'
              : 'bg-transparent text-slate-400 border-slate-700 hover:border-white hover:text-white'
          }`}
        >
          <Gift className="w-3 h-3 inline mr-1" />
          VALES / REGALOS
        </button>

        <button
          onClick={() => { playTick(); setAdminTab('custom'); }}
          className={`font-retro text-[8px] px-3 py-2 border-2 transition-all ${
            adminTab === 'custom'
              ? 'bg-white text-black border-black shadow-[2px_2px_0_#000]'
              : 'bg-transparent text-slate-400 border-slate-700 hover:border-white hover:text-white'
          }`}
        >
          <MessageSquare className="w-3 h-3 inline mr-1" />
          PERSONALIZACIÓN
        </button>

        <button
          onClick={() => { playTick(); setAdminTab('music'); }}
          className={`font-retro text-[8px] px-3 py-2 border-2 transition-all ${
            adminTab === 'music'
              ? 'bg-white text-black border-black shadow-[2px_2px_0_#000]'
              : 'bg-transparent text-slate-400 border-slate-700 hover:border-white hover:text-white'
          }`}
        >
          <Music className="w-3 h-3 inline mr-1" />
          MÚSICA
        </button>

        <button
          onClick={() => { playTick(); setAdminTab('games'); }}
          className={`font-retro text-[8px] px-3 py-2 border-2 transition-all ${
            adminTab === 'games'
              ? 'bg-white text-black border-black shadow-[2px_2px_0_#000]'
              : 'bg-transparent text-slate-400 border-slate-700 hover:border-white hover:text-white'
          }`}
        >
          <Gamepad2 className="w-3 h-3 inline mr-1" />
          JUEGOS Y CHEATS
        </button>
      </div>

      {/* CONTENIDO DE TAB 1: APIS Y CONEXIÓN */}
      {adminTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="retro-container p-6 space-y-6">
          <h3 className="font-retro text-[9px] text-pastel-blue-light border-b border-slate-800 pb-2 flex items-center gap-1.5">
            <Database className="w-4 h-4" />
            <span>AJUSTES BASE</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-retro text-[7px] text-slate-400 mb-2">
                📅 FECHA DE ANIVERSARIO
              </label>
              <input
                type="date"
                value={settings.anniversary_date}
                onChange={(e) => setSettings({ ...settings, anniversary_date: e.target.value })}
                className="w-full px-3 py-2 border-2 border-slate-700 bg-transparent text-white font-sans text-xs focus:border-white focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block font-retro text-[7px] text-slate-400 mb-2">
                📁 GOOGLE DRIVE FOLDER ID (Galería)
              </label>
              <input
                type="text"
                value={settings.drive_folder_id}
                onChange={(e) => setSettings({ ...settings, drive_folder_id: e.target.value })}
                placeholder="Folder ID de fotos"
                className="w-full px-3 py-2 border-2 border-slate-700 bg-transparent text-white font-sans text-xs focus:border-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-retro text-[7px] text-slate-400 mb-2">
                🎵 CARPETA DRIVE PARA MÚSICA (subidas)
              </label>
              <input
                type="text"
                value={settings.music_drive_folder_id}
                onChange={(e) => setSettings({ ...settings, music_drive_folder_id: e.target.value })}
                placeholder="Folder ID para audios/portadas (opcional)"
                className="w-full px-3 py-2 border-2 border-slate-700 bg-transparent text-white font-sans text-xs focus:border-white focus:outline-none"
              />
            </div>
          </div>

          <h3 className="font-retro text-[9px] text-pastel-pink-light border-b border-slate-800 pb-2 flex items-center gap-1.5 pt-2">
            <Bell className="w-4 h-4" />
            <span>INTEGRACIONES Y NOTIFICACIONES</span>
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-retro text-[7px] text-slate-400 mb-2">
                  🔗 DISCORD WEBHOOK URL (Canal Público / Fallback)
                </label>
                <input
                  type="url"
                  value={settings.discord_webhook}
                  onChange={(e) => setSettings({ ...settings, discord_webhook: e.target.value })}
                  placeholder="https://discord.com/api/webhooks/..."
                  className="w-full px-3 py-2 border-2 border-slate-700 bg-transparent text-white font-sans text-xs focus:border-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-retro text-[7px] text-slate-400 mb-2">
                  🤖 DISCORD BOT TOKEN (Para DMs 100% Privados)
                </label>
                <input
                  type="text"
                  value={settings.discord_bot_token || ''}
                  onChange={(e) => setSettings({ ...settings, discord_bot_token: e.target.value })}
                  placeholder="Token del bot (ej: MTk5...)"
                  className="w-full px-3 py-2 border-2 border-slate-700 bg-transparent text-white font-sans text-xs focus:border-white focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-retro text-[7px] text-slate-400 mb-2">
                  👤 ID DE DISCORD DE FER (Ping al Admin)
                </label>
                <input
                  type="text"
                  value={settings.discord_user_id_fer}
                  onChange={(e) => setSettings({ ...settings, discord_user_id_fer: e.target.value })}
                  placeholder="Ej: 123456789012345678"
                  className="w-full px-3 py-2 border-2 border-slate-700 bg-transparent text-white font-sans text-xs focus:border-white focus:outline-none"
                />
                <p className="font-retro text-[5px] text-slate-500 mt-1">
                  ID numérico para que te haga ping cuando Zoe canjee un vale.
                </p>
              </div>

              <div>
                <label className="block font-retro text-[7px] text-slate-400 mb-2">
                  👤 ID DE DISCORD DE ZOE (Ping a la Usuaria)
                </label>
                <input
                  type="text"
                  value={settings.discord_user_id_zoe}
                  onChange={(e) => setSettings({ ...settings, discord_user_id_zoe: e.target.value })}
                  placeholder="Ej: 987654321098765432"
                  className="w-full px-3 py-2 border-2 border-slate-700 bg-transparent text-white font-sans text-xs focus:border-white focus:outline-none"
                />
                <p className="font-retro text-[5px] text-slate-500 mt-1">
                  ID numérico para que le haga ping cuando le agregues monedas o vales.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-retro text-[7px] text-slate-400 mb-2">
                  🤖 TELEGRAM BOT TOKEN
                </label>
                <input
                  type="text"
                  value={settings.telegram_token}
                  onChange={(e) => setSettings({ ...settings, telegram_token: e.target.value })}
                  placeholder="Bot Token"
                  className="w-full px-3 py-2 border-2 border-slate-700 bg-transparent text-white font-sans text-xs focus:border-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-retro text-[7px] text-slate-400 mb-2">
                  💬 TELEGRAM CHAT ID
                </label>
                <input
                  type="text"
                  value={settings.telegram_chat_id}
                  onChange={(e) => setSettings({ ...settings, telegram_chat_id: e.target.value })}
                  placeholder="Chat ID (e.g. -100123...)"
                  className="w-full px-3 py-2 border-2 border-slate-700 bg-transparent text-white font-sans text-xs focus:border-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Test de Webhook */}
          <div className="bg-[#2a223a]/30 p-4 border border-slate-800 space-y-3">
            <h4 className="font-retro text-[8px] text-white flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5 text-pastel-blue" />
              PROBAR CONEXIÓN DE NOTIFICACIÓN
            </h4>
            <p className="font-retro text-[6px] text-slate-400">
              Presiona el botón para disparar un mensaje de prueba a los servicios configurados.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <button
                type="button"
                onClick={handleTestNotification}
                className="retro-btn text-[8px] py-1.5 px-3 bg-pastel-blue text-black"
              >
                PROBAR WEBHOOKS
              </button>
              {testResult && (
                <span className="font-retro text-[7px] text-yellow-300 animate-pulse">
                  {testResult}
                </span>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="retro-btn w-full text-[9px] py-3 flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            {submitting ? 'GUARDANDO...' : 'GUARDAR Y APLICAR AJUSTES'}
          </button>
        </form>
      )}

      {/* CONTENIDO DE TAB 2: VALES / REGALOS */}
      {adminTab === 'coupons' && (
        <div className="space-y-6">
          <form onSubmit={handleCreateCoupon} className="retro-container p-5 space-y-4">
            <h4 className="font-retro text-[9px] text-pastel-pink-light flex items-center gap-1.5">
              <Plus className="w-4 h-4" />
              CREAR NUEVO VALE
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input
                type="text"
                placeholder="Título del Vale"
                value={newCoupon.title}
                onChange={(e) => setNewCoupon({ ...newCoupon, title: e.target.value })}
                className="md:col-span-1 px-3 py-2 border-2 border-slate-700 bg-transparent text-white font-sans text-xs focus:border-white focus:outline-none"
                required
              />
              <input
                type="text"
                placeholder="Descripción del regalo..."
                value={newCoupon.description}
                onChange={(e) => setNewCoupon({ ...newCoupon, description: e.target.value })}
                className="md:col-span-2 px-3 py-2 border-2 border-slate-700 bg-transparent text-white font-sans text-xs focus:border-white focus:outline-none"
                required
              />
              <input
                type="number"
                placeholder="Precio (Monedas)"
                value={newCoupon.price}
                onChange={(e) => setNewCoupon({ ...newCoupon, price: parseInt(e.target.value) || 0 })}
                className="md:col-span-1 px-3 py-2 border-2 border-slate-700 bg-transparent text-white font-sans text-xs focus:border-white focus:outline-none"
                required
                min="0"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="retro-btn w-full text-[9px] py-2 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {submitting ? 'AÑADIENDO...' : 'AÑADIR VALE AL INVENTARIO'}
            </button>
          </form>

          <div className="retro-container p-5">
            <h4 className="font-retro text-[9px] text-white mb-4">INVENTARIO DE VALES</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-sans text-xs">
                <thead>
                  <tr className="border-b-2 border-slate-800 text-slate-400 font-semibold text-[10px]">
                    <th className="py-2.5 px-2">ID</th>
                    <th className="py-2.5 px-2">Título</th>
                    <th className="py-2.5 px-2">Descripción</th>
                    <th className="py-2.5 px-2 text-center">Precio</th>
                    <th className="py-2.5 px-2">Estado Compra</th>
                    <th className="py-2.5 px-2">Estado Canje</th>
                    <th className="py-2.5 px-2 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((c) => (
                    <tr key={c.id} className="border-b border-slate-800 hover:bg-white/5 transition-colors">
                      <td className="py-3 px-2 font-mono text-slate-500 text-[10px]">{c.id}</td>
                      <td className="py-3 px-2 font-bold text-white text-[11px]">{c.title}</td>
                      <td className="py-3 px-2 text-slate-400 text-[11px] max-w-xs truncate">{c.description}</td>
                      <td className="py-3 px-2 text-center font-bold text-yellow-400 font-mono text-[11px]">{c.price} ♡</td>
                      <td className="py-3 px-2">
                        {c.is_purchased ? (
                          <span className="text-[8px] font-retro text-emerald-400 border border-emerald-500/20 bg-emerald-950/20 px-2 py-0.5">
                            COMPRADO
                          </span>
                        ) : (
                          <span className="text-[8px] font-retro text-yellow-500 border border-yellow-500/20 bg-yellow-950/20 px-2 py-0.5">
                            BLOQUEADO
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-2">
                        {c.is_redeemed ? (
                          <span className="text-[8px] font-retro text-red-400 border border-red-500/20 bg-red-950/20 px-2 py-0.5">
                            CANJEADO
                          </span>
                        ) : (
                          <span className="text-[8px] font-retro text-slate-400 border border-slate-700 bg-slate-900/20 px-2 py-0.5">
                            DISPONIBLE
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-center flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleTogglePurchase(c.id, c.is_purchased)}
                          title={c.is_purchased ? 'Bloquear vale' : 'Comprar vale'}
                          className="retro-btn text-[8px] !p-1.5 bg-yellow-950/20 border-yellow-800 text-yellow-400"
                        >
                          <Lock className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleRedeem(c.id, c.is_redeemed)}
                          title={c.is_redeemed ? 'Marcar disponible' : 'Marcar canjeado'}
                          className="retro-btn text-[8px] !p-1.5"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCoupon(c.id)}
                          title="Eliminar vale"
                          className="retro-btn text-[8px] !p-1.5 bg-red-950/30 border-red-800 text-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {coupons.length === 0 && (
                    <tr>
                      <td colSpan="7" className="text-center py-6 font-retro text-[8px] text-slate-500">
                        No hay cupones creados aún.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CONTENIDO DE TAB 3: PERSONALIZACIÓN VISUAL */}
      {adminTab === 'custom' && (
        <form onSubmit={handleSaveSettings} className="retro-container p-6 space-y-6">
          <h3 className="font-retro text-[9px] text-pastel-lavender border-b border-slate-800 pb-2 flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4" />
            <span>MENSAJES Y PERSONALIZACIÓN</span>
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block font-retro text-[7px] text-slate-400 mb-2">
                ✍️ SALUDO INICIAL EN LA HISTORIA
              </label>
              <textarea
                value={settings.timeline_greeting}
                onChange={(e) => setSettings({ ...settings, timeline_greeting: e.target.value })}
                rows="2"
                placeholder="Saludo que aparecerá en el inicio de la línea de tiempo..."
                className="w-full px-3 py-2 border-2 border-slate-700 bg-transparent text-white font-sans text-xs focus:border-white focus:outline-none resize-none"
              />
            </div>

            <div>
              <label className="block font-retro text-[7px] text-slate-400 mb-2">
                💖 MENSAJE ESPECIAL DE ANIVERSARIO
              </label>
              <input
                type="text"
                value={settings.anniversary_message}
                onChange={(e) => setSettings({ ...settings, anniversary_message: e.target.value })}
                placeholder="Ej: ¡Feliz Aniversario mi amor!"
                className="w-full px-3 py-2 border-2 border-slate-700 bg-transparent text-white font-sans text-xs focus:border-white focus:outline-none"
              />
            </div>

            <h3 className="font-retro text-[9px] text-pastel-blue border-b border-slate-800 pb-2 flex items-center gap-1.5 pt-2">
              <Info className="w-4 h-4" />
              <span>SALA DE MÚSICA</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-retro text-[7px] text-slate-400 mb-2">
                  🎵 URL DE MÚSICA PREDETERMINADA
                </label>
                <input
                  type="text"
                  value={settings.default_song_url}
                  onChange={(e) => setSettings({ ...settings, default_song_url: e.target.value })}
                  placeholder="URL del archivo MP3 o enlace"
                  className="w-full px-3 py-2 border-2 border-slate-700 bg-transparent text-white font-sans text-xs focus:border-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-retro text-[7px] text-slate-400 mb-2">
                  ▶️ REPRODUCCIÓN AUTOMÁTICA
                </label>
                <select
                  value={settings.music_autoplay}
                  onChange={(e) => setSettings({ ...settings, music_autoplay: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-slate-700 bg-[#1a1525] text-white font-sans text-xs focus:border-white focus:outline-none"
                >
                  <option value="false">Desactivado (Recomendado)</option>
                  <option value="true">Activar al primer click del usuario</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-retro text-[7px] text-slate-400 mb-2">
                📋 PLAYLIST GLOBAL (un enlace por línea)
              </label>
              <textarea
                value={settings.music_playlist}
                onChange={(e) => setSettings({ ...settings, music_playlist: e.target.value })}
                placeholder={`https://open.spotify.com/track/xxx|Nuestra canción\nhttps://youtu.be/xxx|Video especial\nhttps://ejemplo.com/cancion.mp3`}
                rows={5}
                className="w-full px-3 py-2 border-2 border-slate-700 bg-transparent text-white font-mono text-[10px] focus:border-white focus:outline-none resize-y"
              />
              <p className="font-retro text-[6px] text-slate-500 mt-1">
                Spotify, YouTube o MP3. Formato: URL o URL|Nombre
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="retro-btn w-full text-[9px] py-3 flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            {submitting ? 'GUARDANDO...' : 'GUARDAR Y APLICAR PERSONALIZACIÓN'}
          </button>
        </form>
      )}

      {/* CONTENIDO DE TAB 4: AJUSTES JUEGOS */}
      {adminTab === 'music' && (
        <MusicAdmin onUpdateData={onUpdateData} />
      )}

      {adminTab === 'games' && (
        <form onSubmit={handleSaveSettings} className="retro-container p-6 space-y-6">
          <h3 className="font-retro text-[9px] text-pastel-pink border-b border-slate-800 pb-2 flex items-center gap-1.5">
            <Gamepad2 className="w-4 h-4" />
            <span>CONFIGURACIÓN DE MINI-JUEGOS</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-retro text-[8px] text-white">★ DINO SIGMA RUNNER</h4>
              <div>
                <label className="block font-retro text-[7px] text-slate-400 mb-2">
                  MODIFICADOR DE VELOCIDAD DEL DINO
                </label>
                <select
                  value={settings.dino_speed_multiplier}
                  onChange={(e) => setSettings({ ...settings, dino_speed_multiplier: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-slate-700 bg-[#1a1525] text-white font-sans text-xs focus:border-white focus:outline-none"
                >
                  <option value="0.7">0.7x (Muy Lento - Modo Relax)</option>
                  <option value="1.0">1.0x (Normal - Equilibrado)</option>
                  <option value="1.3">1.3x (Rápido - Desafío)</option>
                  <option value="1.6">1.6x (Frenético - Retro Hardcore)</option>
                </select>
              </div>
              <p className="font-retro text-[5.5px] text-slate-500 leading-normal">
                Multiplica la velocidad de avance de los obstáculos. Afecta directamente la dificultad del juego.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="font-retro text-[8px] text-white">★ TETRIS RETRO</h4>
              <div>
                <label className="block font-retro text-[7px] text-slate-400 mb-2">
                  NIVEL DE INICIO DEL TETRIS
                </label>
                <select
                  value={settings.tetris_start_level}
                  onChange={(e) => setSettings({ ...settings, tetris_start_level: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-slate-700 bg-[#1a1525] text-white font-sans text-xs focus:border-white focus:outline-none"
                >
                  <option value="1">Nivel 1 (Velocidad Base)</option>
                  <option value="3">Nivel 3 (Velocidad Media)</option>
                  <option value="5">Nivel 5 (Velocidad Avanzada)</option>
                  <option value="7">Nivel 7 (Velocidad Alta)</option>
                  <option value="10">Nivel 10 (Master - Caída instantánea)</option>
                </select>
              </div>
              <p className="font-retro text-[5.5px] text-slate-500 leading-normal">
                Establece la velocidad y nivel inicial en el que comienza la partida de Tetris.
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="retro-btn w-full text-[9px] py-3 flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            {submitting ? 'GUARDANDO...' : 'GUARDAR Y APLICAR MULTIPLICADORES'}
          </button>
        </form>
      )}

      {/* SALA DE CHEATS Y COMANDOS DE MONEDAS */}
      {adminTab === 'games' && (
        <div className="retro-container p-6 space-y-6 mt-6">
          <h3 className="font-retro text-[9px] text-yellow-400 border-b border-slate-800 pb-2 flex items-center gap-1.5">
            <Coins className="w-4 h-4" />
            <span>SALA DE CHEATS Y COMANDOS DE MONEDAS</span>
          </h3>

          <div className="space-y-4">
            <h4 className="font-retro text-[7px] text-slate-300">💰 AJUSTAR BALANCES DE USUARIOS (MONEDAS DE AMOR)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-slate-800 p-4 bg-black/20">
                <label className="block font-retro text-[6px] text-slate-400 mb-2">CANTIDAD DE MONEDAS A APLICAR</label>
                <input
                  type="number"
                  placeholder="Ej: 50"
                  value={pointsAmount}
                  onChange={(e) => setPointsAmount(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-slate-700 bg-transparent text-white font-sans text-xs focus:border-white focus:outline-none"
                />
              </div>

              <div className="space-y-2 flex flex-col justify-end">
                <p className="font-retro text-[5px] text-slate-500 leading-normal mb-1">
                  * Selecciona una acción en la lista de usuarios para aplicar esta cantidad.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[7px] font-retro text-slate-400">
                    <th className="py-2">USUARIO</th>
                    <th className="py-2">ROL</th>
                    <th className="py-2">MONEDAS ACTUALES</th>
                    <th className="py-2 text-right">ACCIONES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-white/5">
                      <td className="py-3 font-semibold text-slate-200">{u.username}</td>
                      <td className="py-3"><span className={`px-1.5 py-0.5 text-[8px] font-semibold border ${u.role === 'admin' ? 'text-amber-400 border-amber-800 bg-amber-950/20' : 'text-slate-300 border-slate-700 bg-slate-800/20'}`}>{u.role}</span></td>
                      <td className="py-3 text-yellow-400 font-bold flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-yellow-400 inline" />
                        {u.points}
                      </td>
                      <td className="py-3 text-right space-x-1.5">
                        <button
                          onClick={() => handleModifyPoints(u.id, 'add', pointsAmount || 50)}
                          className="retro-btn text-[7px] !p-1 bg-emerald-950/30 border-emerald-800 text-emerald-400"
                        >
                          + SUMAR
                        </button>
                        <button
                          onClick={() => handleModifyPoints(u.id, 'subtract', pointsAmount || 50)}
                          className="retro-btn text-[7px] !p-1 bg-rose-950/30 border-rose-800 text-rose-400"
                        >
                          - RESTAR
                        </button>
                        <button
                          onClick={() => handleModifyPoints(u.id, 'set', pointsAmount || 0)}
                          className="retro-btn text-[7px] !p-1 bg-blue-950/30 border-blue-800 text-blue-400"
                        >
                          = FIJAR
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <h3 className="font-retro text-[9px] text-pastel-pink border-b border-slate-800 pb-2 pt-4 flex items-center gap-1.5">
            <Gift className="w-4 h-4" />
            <span>ACCIONES MASIVAS DE VALES</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-slate-800 p-4 bg-black/20 space-y-2">
              <h5 className="font-retro text-[7px] text-white">🔓 DESBLOQUEAR TODO</h5>
              <p className="font-retro text-[5px] text-slate-400 leading-normal">
                Marca todos los vales de amor como comprados para que aparezcan disponibles en el Inventario.
              </p>
              <button
                onClick={handleUnlockAllCoupons}
                className="retro-btn text-[8px] !py-2 w-full bg-yellow-950/20 border-yellow-800 text-yellow-400"
              >
                DESBLOQUEAR TODOS LOS VALES
              </button>
            </div>

            <div className="border border-slate-800 p-4 bg-black/20 space-y-2">
              <h5 className="font-retro text-[7px] text-white">🔄 RESTABLECER TODO</h5>
              <p className="font-retro text-[5px] text-slate-400 leading-normal">
                Vuelve a bloquear todos los vales y quita su estado de canjeados para empezar la tienda de nuevo.
              </p>
              <button
                onClick={handleResetAllCoupons}
                className="retro-btn text-[8px] !py-2 w-full bg-red-950/30 border-red-800 text-red-400"
              >
                RESTABLECER TODOS LOS VALES
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
