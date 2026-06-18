import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { ShieldAlert, Heart, Lock, User } from 'lucide-react';
import { playPop, playSuccess, playError, playTick } from '../utils/sounds';
import useStore from '../store/useStore';

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const loginStore = useStore((state) => state.login);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'ERROR: ACCESO DENEGADO');
      }

      // Guardar sesión en Zustand store
      loginStore(data.user, data.token);

      const userClean = username.trim().toLowerCase();
      if (userClean === 'choe') {
        // ¡¡FIESTA DE CONFETI PARA CHOE!! 🎉
        // Primera ráfaga central
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#ff99aa', '#aec6cf', '#d8bfd8', '#ffdab9', '#b2f7ef']
        });
        // Segunda ráfaga izquierda
        setTimeout(() => confetti({
          particleCount: 60,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.65 },
          colors: ['#ff99aa', '#fde047', '#d8b4fe']
        }), 200);
        // Tercera ráfaga derecha
        setTimeout(() => confetti({
          particleCount: 60,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.65 },
          colors: ['#86efac', '#7dd3fc', '#fca5a5']
        }), 400);

        playSuccess();
        setTimeout(() => playPop(), 350);
      } else {
        // Fer no tiene confeti según instrucción, solo sonido
        playSuccess();
      }

      onLoginSuccess(data.user);
    } catch (err) {
      setErrorMsg(err.message || 'ERROR: ACCESO DENEGADO');
      playError();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#130f1a] flex items-center justify-center p-4">
      <div className="retro-container max-w-sm w-full p-6 relative">
        {/* Decoraciones de esquina pixel-art */}
        <div className="absolute top-2 left-2 text-pastel-pink text-[8px] font-retro">CHOE-OS</div>
        <div className="absolute top-2 right-2 text-pastel-blue text-[8px] font-retro">V1.0</div>

        <div className="flex flex-col items-center mb-6 mt-2">
          <Heart className="w-10 h-10 text-pastel-pink fill-pastel-pink animate-pulse mb-3" />
          <h2 className="font-retro text-[10px] text-white tracking-widest text-center">
            INICIAR SESIÓN
          </h2>
          <p className="font-retro text-[6px] text-slate-500 mt-1">SISTEMA DE SEGURIDAD RETRO</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-retro text-[7px] text-slate-400 mb-1.5 flex items-center gap-1">
              <User className="w-3 h-3 text-pastel-blue" />
              USUARIO
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onFocus={playTick}
              placeholder="Ingresa tu usuario"
              className="w-full px-3 py-2 border-2 border-slate-700 bg-transparent text-white font-sans text-xs focus:border-white focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block font-retro text-[7px] text-slate-400 mb-1.5 flex items-center gap-1">
              <Lock className="w-3 h-3 text-pastel-pink" />
              CONTRASEÑA
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={playTick}
              placeholder="••••••••••••"
              className="w-full px-3 py-2 border-2 border-slate-700 bg-transparent text-white font-sans text-xs focus:border-white focus:outline-none"
              required
            />
          </div>

          {errorMsg && (
            <div className="border-2 border-red-700 bg-red-950/20 p-2 text-center flex items-center justify-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-red-500" />
              <span className="font-retro text-[6px] text-red-400">{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            onMouseEnter={playTick}
            className="retro-btn w-full text-[9px] py-2 flex items-center justify-center gap-2 mt-4"
          >
            {loading ? 'CONECTANDO...' : 'INGRESAR AL SISTEMA'}
          </button>
        </form>

        <p className="text-center font-retro text-[5px] text-slate-600 mt-6 leading-relaxed">
          SOLO USUARIOS AUTORIZADOS PUEDEN ENTRAR.<br />
          SISTEMA DE ENCRIPTACIÓN DE 16 BITS.
        </p>
      </div>
    </div>
  );
}
